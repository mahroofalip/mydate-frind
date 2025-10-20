import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  SafeAreaView,
  TextInput,
  Image,
  Keyboard,
  ActivityIndicator,
  Alert,
  Modal,
  ActionSheetIOS,
} from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { emojis } from '../data/emojies';
import { emojiCategories } from '../data/emojiCategories';
import { supabase } from '../lib/supabase';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';

export default function ChatScreen({ route }) {
  const navigation = useNavigation();
  const { conversation } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);

  const flatListRef = useRef(null);
  const lastSentMessageRef = useRef(null);

  // ✅ Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Check if user is blocked
      if (user && conversation) {
        checkBlockStatus(user.id, conversation.userId);
      }
    };
    fetchUser();
  }, [conversation]);

  // ✅ Check block status
  const checkBlockStatus = async (currentUserId, recipientId) => {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${currentUserId})`);

    if (!error && data && data.length > 0) {
      // Check if current user is blocked by recipient
      const blockedByRecipient = data.some(block => block.blocker_id === recipientId && block.blocked_id === currentUserId);
      // Check if current user blocked the recipient
      const blockedRecipient = data.some(block => block.blocker_id === currentUserId && block.blocked_id === recipientId);
      
      setIsBlocked(blockedByRecipient || blockedRecipient);
    }
  };

  // ✅ Helper: format time
  const formatTime = useCallback((dateString) => {
    return moment(dateString)?.format('h:mm A');
  }, []);

  // ✅ Helper: format message
  const formatMessage = useCallback(
    (msg) => ({
      id: msg.id,
      text: msg.content,
      time: formatTime(msg?.created_at),
      sender: msg.sender === currentUser?.id ? 'user' : 'recipient',
      type: msg.type,
      status: msg.status,
      created_at: msg.created_at,
    }),
    [currentUser, formatTime]
  );

  // ✅ Mark as read & notify parent via event instead of passing function
  const markAsRead = useCallback(async () => {
    if (!conversation || !currentUser) return;

    const { data: unreadMessages, error } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', conversation.id)
      .eq('status', 'sent')
      .neq('sender', currentUser.id);

    if (error) return console.error('Error fetching unread messages:', error);

    if (unreadMessages?.length > 0) {
      const messageIds = unreadMessages.map((m) => m.id);

      const { error: updateError } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .in('id', messageIds);

      if (updateError) console.error('Error updating message status:', updateError);

      navigation.emit({
        type: 'messagesRead',
        data: { count: unreadMessages.length },
      });
    }
  }, [conversation, currentUser, navigation]);

  useEffect(() => {
    if (!conversation || !currentUser) return;

    markAsRead();
    const unsubscribe = navigation.addListener('focus', markAsRead);
    return unsubscribe;
  }, [conversation, currentUser, markAsRead, navigation]);

  // ✅ Online status check
  const checkOnlineStatus = useCallback((profile) => {
    if (!profile?.last_login_at) return false;

    const now = new Date();
    const lastLogin = new Date(profile.last_login_at);
    const lastLogout = profile.last_logout_at ? new Date(profile.last_logout_at) : null;
    const expiresAt = profile.session_expires_at ? new Date(profile.session_expires_at) : null;

    return (!lastLogout || lastLogin > lastLogout) && (!expiresAt || expiresAt > now);
  }, []);

  // ✅ Fetch messages and subscribe
  useEffect(() => {
    if (!conversation || !currentUser || isBlocked) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
        return;
      }

      setMessages(data.map((msg) => formatMessage(msg)));
      setLoading(false);
    };

    fetchMessages();

    const checkRecipientStatus = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('last_login_at, last_logout_at, session_expires_at')
        .eq('id', conversation.userId)
        .single();

      if (!error && data) {
        setRecipientOnline(checkOnlineStatus(data));
      }
    };

    checkRecipientStatus();

    // ✅ Subscribe only to INSERT to prevent duplicates
    const messagesSubscription = supabase
      .channel(`chat_${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new;

          if (lastSentMessageRef.current === newMsg.id) {
            lastSentMessageRef.current = null;
            return;
          }

          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) return prev;
            return [...prev, formatMessage(newMsg)];
          });
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [conversation, currentUser, formatMessage, checkOnlineStatus, isBlocked]);

  // ✅ Delete Chat Function
  const handleDeleteChat = async () => {
    if (!currentUser || !conversation) return;

    setDeleting(true);
    try {
      // Option 1: Soft delete by updating messages (recommended)
      const { error } = await supabase
        .from('messages')
        .update({ deleted_for_users: [currentUser.id] })
        .eq('chat_id', conversation.id);

      if (error) throw error;

      // Option 2: Or you can create a deleted_chats table
      const { error: deleteError } = await supabase
        .from('deleted_chats')
        .insert([
          {
            user_id: currentUser.id,
            chat_id: conversation.id,
            deleted_at: new Date().toISOString(),
          }
        ]);

      if (deleteError && deleteError.code !== '23505') { // Ignore duplicate key errors
        console.error('Error in deleted_chats:', deleteError);
      }

      setShowMenu(false);
      Alert.alert(
        'Chat Deleted',
        'The chat has been deleted successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Error deleting chat:', error);
      Alert.alert('Error', 'Failed to delete chat. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // ✅ Clear Chat Function (Delete all messages but keep chat)
  const handleClearChat = async () => {
    if (!currentUser || !conversation) return;

    setDeleting(true);
    try {
      // Mark all messages as deleted for current user
      const { error } = await supabase
        .from('messages')
        .update({ 
          deleted_for_users: [currentUser.id],
          cleared_at: new Date().toISOString()
        })
        .eq('chat_id', conversation.id);

      if (error) throw error;

      setMessages([]);
      setShowMenu(false);
      Alert.alert(
        'Chat Cleared',
        'All messages have been cleared successfully.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error clearing chat:', error);
      Alert.alert('Error', 'Failed to clear chat. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // ✅ Delete Individual Message
  const handleDeleteMessage = async (messageId, deleteForEveryone = false) => {
    if (!currentUser) return;

    try {
      if (deleteForEveryone) {
        // Delete for everyone - only if user is the sender
        const { error } = await supabase
          .from('messages')
          .update({ 
            deleted_for_everyone: true,
            deleted_at: new Date().toISOString()
          })
          .eq('id', messageId)
          .eq('sender', currentUser.id);

        if (error) throw error;

        // Remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
      } else {
        // Delete for me only
        const { error } = await supabase
          .from('messages')
          .update({ 
            deleted_for_users: [currentUser.id]
          })
          .eq('id', messageId);

        if (error) throw error;

        // Remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }

      setShowMessageMenu(false);
      setSelectedMessage(null);
      
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message. Please try again.');
    }
  };

  // ✅ Show delete chat confirmation
  const confirmDeleteChat = () => {
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete this chat with ${conversation.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDeleteChat }
      ]
    );
  };

  // ✅ Show clear chat confirmation
  const confirmClearChat = () => {
    Alert.alert(
      'Clear Chat',
      `Are you sure you want to clear all messages in this chat with ${conversation.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: handleClearChat }
      ]
    );
  };

  // ✅ Show message options
  const showMessageOptions = (message) => {
    setSelectedMessage(message);
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete for Me', message.sender === 'user' ? 'Delete for Everyone' : null].filter(Boolean),
          destructiveButtonIndex: [1, 2].filter(i => i !== null),
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleDeleteMessage(message.id, false);
          } else if (buttonIndex === 2 && message.sender === 'user') {
            handleDeleteMessage(message.id, true);
          }
        }
      );
    } else {
      setShowMessageMenu(true);
    }
  };

  // ✅ Block User Function
  const handleBlockUser = async () => {
    if (!currentUser || !conversation) return;

    setBlocking(true);
    try {
      const { error } = await supabase
        .from('blocks')
        .insert([
          {
            blocker_id: currentUser.id,
            blocked_id: conversation.userId,
            blocked_name: conversation.name,
            blocked_image: conversation.image,
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) {
        // If block already exists, just set as blocked
        if (error.code === '23505') { // Unique violation
          setIsBlocked(true);
          setShowMenu(false);
          return;
        }
        throw error;
      }

      setIsBlocked(true);
      setShowMenu(false);
      
      // Send a system message about blocking
      const { error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: conversation.id,
            sender: currentUser.id,
            content: `You have blocked ${conversation.name}. You will no longer receive messages from them.`,
            type: 'system',
            status: 'sent',
            is_admin_message: false,
          }
        ]);

      if (messageError) console.error('Error sending system message:', messageError);

      Alert.alert(
        'User Blocked',
        `You have successfully blocked ${conversation.name}. You will no longer receive messages from them.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setBlocking(false);
    }
  };

  // ✅ Report User Function
  const handleReportUser = async () => {
    if (!currentUser || !conversation || !reportReason.trim()) return;

    try {
      const { error } = await supabase
        .from('reports')
        .insert([
          {
            reporter_id: currentUser.id,
            reported_user_id: conversation.userId,
            reported_user_name: conversation.name,
            reason: reportReason,
            chat_id: conversation.id,
            created_at: new Date().toISOString(),
            status: 'pending'
          }
        ]);

      if (error) throw error;

      setShowReportModal(false);
      setReportReason('');
      setShowMenu(false);

      Alert.alert(
        'User Reported',
        'Thank you for your report. We will review it and take appropriate action.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error reporting user:', error);
      Alert.alert('Error', 'Failed to report user. Please try again.');
    }
  };

  // ✅ Show block confirmation
  const confirmBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${conversation.name}? You will no longer be able to message each other.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: handleBlockUser }
      ]
    );
  };

  // ✅ Show report modal
  const openReportModal = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  // ✅ Emoji Picker toggle
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    if (!showEmojiPicker) Keyboard.dismiss();
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji);
  };

  // ✅ Send message (with unique temp ID)
  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser || !conversation || sending || isBlocked) return;

    setSending(true);
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const newMsg = {
      id: tempId,
      text: newMessage,
      time: 'Sending...',
      sender: 'user',
      type: 'text',
      status: 'sending',
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage('');
    setShowEmojiPicker(false);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: conversation.id,
            sender: currentUser.id,
            content: newMessage,
            type: 'text',
            status: 'sent',
          },
        ])
        .select();

      if (error) throw error;

      lastSentMessageRef.current = data[0].id;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? formatMessage(data[0]) : msg))
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, status: 'failed' } : msg))
      );
    } finally {
      setSending(false);
    }
  };

  const resendMessage = async (message) => {
    if (!currentUser || !conversation || isBlocked) return;

    setMessages((prev) =>
      prev.map((msg) => (msg.id === message.id ? { ...msg, status: 'sending' } : msg))
    );

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: conversation.id,
            sender: currentUser.id,
            content: message.text,
            type: 'text',
            status: 'sent',
          },
        ])
        .select();

      if (error) throw error;

      lastSentMessageRef.current = data[0].id;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? formatMessage(data[0]) : msg))
      );
    } catch (error) {
      console.error('Resend failed:', error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? { ...msg, status: 'failed' } : msg))
      );
    }
  };

  const renderEmojiCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.emojiCategory,
        activeEmojiCategory === item.id && styles.activeEmojiCategory,
      ]}
      onPress={() => setActiveEmojiCategory(item.id)}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={24}
        color={activeEmojiCategory === item.id ? '#FF5A5F' : '#888'}
      />
    </TouchableOpacity>
  );

  const renderEmoji = ({ item }) => (
    <TouchableOpacity style={styles.emojiItem} onPress={() => handleEmojiSelect(item)}>
      <Text style={styles.emoji}>{item}</Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isFailed = item.status === 'failed';
    const isSending = item.status === 'sending';

    return (
      <TouchableOpacity
        style={[
          styles.messageBubble,
          item.sender === 'user' ? styles.userBubble : styles.recipientBubble,
          isFailed && styles.failedMessage,
        ]}
        onLongPress={() => showMessageOptions(item)}
        delayLongPress={500}
      >
        <Text style={item.sender === 'user' ? styles.userText : styles.recipientText}>
          {item.text}
        </Text>
        <View style={styles.timeContainer}>
          {isSending ? (
            <ActivityIndicator size="small" color="#aaa" />
          ) : isFailed ? (
            <TouchableOpacity onPress={() => resendMessage(item)}>
              <MaterialIcons name="error-outline" size={16} color="#ff4d4f" />
            </TouchableOpacity>
          ) : null}
          <Text style={item.sender === 'user' ? styles.userTime : styles.recipientTime}>
            {isFailed ? 'Failed - Tap to retry' : item.time}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setShowMenu(false);
          setShowMessageMenu(false);
        }}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#FF5A5F" />
              </TouchableOpacity>

              <View style={styles.userInfo}>
                {avatarError ? (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={24} color="white" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: conversation.image || 'https://via.placeholder.com/150' }}
                    style={styles.avatar}
                    onError={() => setAvatarError(true)}
                  />
                )}

                <View style={styles.nameContainer}>
                  <Text style={styles.name}>{conversation.name}</Text>
                  <Text
                    style={[
                      styles.status,
                      { color: recipientOnline ? '#4CAF50' : '#888' },
                    ]}
                  >
                    {isBlocked ? 'Blocked' : (recipientOnline ? 'Online' : 'Offline')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.menuButton} 
                onPress={() => setShowMenu(!showMenu)}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#FF5A5F" />
              </TouchableOpacity>

              {/* Menu Options */}
              {showMenu && (
                <View style={styles.menuOptions}>
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={confirmBlock}
                    disabled={blocking}
                  >
                    <Ionicons name="ban-outline" size={20} color="#ff4444" />
                    <Text style={[styles.menuItemText, { color: '#ff4444' }]}>
                      {blocking ? 'Blocking...' : 'Block User'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={openReportModal}
                  >
                    <Ionicons name="flag-outline" size={20} color="#ff9500" />
                    <Text style={[styles.menuItemText, { color: '#ff9500' }]}>
                      Report User
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={confirmClearChat}
                    disabled={deleting}
                  >
                    <Ionicons name="brush-outline" size={20} color="#007AFF" />
                    <Text style={[styles.menuItemText, { color: '#007AFF' }]}>
                      {deleting ? 'Clearing...' : 'Clear Chat'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={confirmDeleteChat}
                    disabled={deleting}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    <Text style={[styles.menuItemText, { color: '#ff4444' }]}>
                      {deleting ? 'Deleting...' : 'Delete Chat'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Blocked Alert */}
            {isBlocked && (
              <View style={styles.blockedAlert}>
                <Ionicons name="ban-outline" size={20} color="#fff" />
                <Text style={styles.blockedText}>
                  You have blocked this user. You cannot send or receive messages.
                </Text>
              </View>
            )}

            {/* Messages */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF5A5F" />
                <Text style={styles.loadingText}>Loading messages...</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[
                  styles.messagesContainer,
                  { paddingBottom: showEmojiPicker ? 300 : 90 },
                ]}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() =>
                  messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: true })
                }
                onLayout={() =>
                  messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: true })
                }
                ListHeaderComponent={<View style={{ height: 10 }} />}
              />
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <View style={styles.emojiPicker}>
                <View style={styles.emojiCategories}>
                  <FlatList
                    data={emojiCategories}
                    renderItem={renderEmojiCategory}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.emojiCategoriesContainer}
                  />
                </View>

                <FlatList
                  data={emojis[activeEmojiCategory]}
                  renderItem={renderEmoji}
                  keyExtractor={(item, index) => index.toString()}
                  numColumns={8}
                  columnWrapperStyle={styles.emojiRow}
                  contentContainerStyle={styles.emojiScroll}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Input Container - Hidden if blocked */}
            {!isBlocked && (
              <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.emojiButton} onPress={toggleEmojiPicker}>
                  <Ionicons
                    name={showEmojiPicker ? 'close' : 'happy-outline'}
                    size={24}
                    color="#FF5A5F"
                  />
                </TouchableOpacity>

                <TextInput
                  style={styles.messageInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#999"
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                />

                {newMessage.trim() !== '' && (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSend}
                    activeOpacity={0.7}
                    disabled={sending}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <MaterialIcons name="send" size={24} color="white" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Report Modal */}
            <Modal
              visible={showReportModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowReportModal(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Report User</Text>
                  <Text style={styles.modalSubtitle}>
                    Please describe why you are reporting {conversation.name}
                  </Text>
                  
                  <TextInput
                    style={styles.reportInput}
                    placeholder="Enter reason for reporting..."
                    placeholderTextColor="#999"
                    value={reportReason}
                    onChangeText={setReportReason}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setShowReportModal(false);
                        setReportReason('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.reportButton, !reportReason.trim() && styles.disabledButton]}
                      onPress={handleReportUser}
                      disabled={!reportReason.trim()}
                    >
                      <Text style={styles.reportButtonText}>Submit Report</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Message Options Modal (Android) */}
            {Platform.OS === 'android' && showMessageMenu && selectedMessage && (
              <Modal
                visible={showMessageMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowMessageMenu(false)}
              >
                <TouchableWithoutFeedback onPress={() => setShowMessageMenu(false)}>
                  <View style={styles.messageMenuOverlay}>
                    <View style={styles.messageMenu}>
                      <TouchableOpacity 
                        style={styles.messageMenuItem}
                        onPress={() => handleDeleteMessage(selectedMessage.id, false)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ff4444" />
                        <Text style={[styles.messageMenuText, { color: '#ff4444' }]}>
                          Delete for Me
                        </Text>
                      </TouchableOpacity>
                      
                      {selectedMessage.sender === 'user' && (
                        <TouchableOpacity 
                          style={styles.messageMenuItem}
                          onPress={() => handleDeleteMessage(selectedMessage.id, true)}
                        >
                          <Ionicons name="trash" size={20} color="#ff4444" />
                          <Text style={[styles.messageMenuText, { color: '#ff4444' }]}>
                            Delete for Everyone
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        style={styles.messageMenuItem}
                        onPress={() => setShowMessageMenu(false)}
                      >
                        <Text style={[styles.messageMenuText, { color: '#007AFF' }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 40,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
    position: 'relative',
  },
  backButton: { padding: 5 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 45, height: 45, borderRadius: 25, marginRight: 15 },
  avatarPlaceholder: {
    backgroundColor: '#FF5A5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: { flex: 1 },
  name: { fontSize: 18, fontWeight: '600', color: '#333' },
  status: { fontSize: 14 },
  menuButton: { padding: 5 },
  menuOptions: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  blockedAlert: {
    backgroundColor: '#ff4444',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
  },
  blockedText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#888' },
  messagesContainer: { padding: 15, paddingTop: 10 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF5A5F',
    borderBottomRightRadius: 2,
  },
  recipientBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  failedMessage: { backgroundColor: '#FFE6E6', borderColor: '#FFCCCC' },
  userText: { color: '#FFF', fontSize: 16 },
  recipientText: { color: '#333', fontSize: 16 },
  timeContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 5 },
  userTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginLeft: 5 },
  recipientTime: { color: '#888', fontSize: 12, marginLeft: 5 },
  emojiPicker: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  emojiCategories: { height: 40, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  emojiCategoriesContainer: { paddingHorizontal: 10 },
  emojiCategory: { padding: 8, marginHorizontal: 5 },
  activeEmojiCategory: { borderBottomWidth: 2, borderBottomColor: '#FF5A5F' },
  emojiScroll: { padding: 10 },
  emojiRow: { justifyContent: 'space-between', marginBottom: 10 },
  emojiItem: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 24 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  emojiButton: { padding: 8, marginRight: 5 },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5A5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  reportButton: {
    backgroundColor: '#FF5A5F',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  reportButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  messageMenuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  messageMenu: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    width: '80%',
    maxWidth: 300,
  },
  messageMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  messageMenuText: {
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
});