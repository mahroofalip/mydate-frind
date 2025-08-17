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
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { emojis } from '../data/emojies';
import { emojiCategories } from '../data/emojiCategories';
import { supabase } from '../lib/supabase';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';

export default function ChatScreen({ route }) {
  const navigation = useNavigation();
  const { conversation, onMessagesRead } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const lastSentMessageRef = useRef(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      return user;
    };

    fetchUser();
  }, []);

  // Mark messages as read when screen is focused
  const markAsRead = useCallback(async () => {
    if (!conversation || !currentUser) return;

    // Mark all unread messages as read
    const { data: unreadMessages, error } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', conversation.id)
      .eq('status', 'sent')
      .neq('sender', currentUser.id);

    if (error) {
      console.error('Error fetching unread messages:', error);
      return;
    }

    if (unreadMessages?.length > 0) {
      const messageIds = unreadMessages.map(m => m.id);
      
      // Update status to 'read' in bulk
      const { error: updateError } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .in('id', messageIds);

      if (updateError) {
        console.error('Error updating message status:', updateError);
      }

      // Notify parent component to update global unread count
      if (onMessagesRead) {
        onMessagesRead(unreadMessages.length);
      }
    }
  }, [conversation, currentUser, onMessagesRead]);

  useEffect(() => {
    if (!conversation || !currentUser) return;

    // Mark as read when component mounts
    markAsRead();
    
    // Also mark as read when screen comes into focus
    const unsubscribe = navigation.addListener('focus', markAsRead);
    
    return unsubscribe;
  }, [conversation, currentUser, markAsRead, navigation]);

  // Format message consistently
  const formatMessage = useCallback((msg) => ({
    id: msg.id,
    text: msg.content,
    time: formatTime(msg.created_at),
    sender: msg.sender === currentUser?.id ? 'user' : 'recipient',
    type: msg.type,
    status: msg.status
  }), [currentUser, formatTime]);

  // Format time helper
  const formatTime = useCallback((dateString) => {
    return moment(dateString).format('h:mm A');
  }, []);

  // Check online status
  const checkOnlineStatus = useCallback((profile) => {
    if (!profile?.last_login_at) return false;
    
    const now = new Date();
    const lastLogin = new Date(profile.last_login_at);
    const lastLogout = profile.last_logout_at ? new Date(profile.last_logout_at) : null;
    const expiresAt = profile.session_expires_at ? new Date(profile.session_expires_at) : null;

    return (
      (!lastLogout || lastLogin > lastLogout) &&
      (!expiresAt || expiresAt > now)
    );
  }, []);

  // Fetch messages and setup subscriptions
  useEffect(() => {
    if (!conversation || !currentUser) return;

    // Fetch initial messages
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

      // Format messages for UI
      const formattedMessages = data.map(msg => formatMessage(msg));
      setMessages(formattedMessages);
      setLoading(false);
    };

    fetchMessages();

    // Check recipient's online status
    const checkRecipientStatus = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('last_login_at, last_logout_at, session_expires_at')
        .eq('id', conversation.userId)
        .single();

      if (!error && data) {
        const isOnline = checkOnlineStatus(data);
        setRecipientOnline(isOnline);
      }
    };

    checkRecipientStatus();

    // Real-time message subscription
    const messagesSubscription = supabase
      .channel(`chat_${conversation.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${conversation.id}`
      }, (payload) => {
        const newMsg = payload.new;
        
        // Skip if this is our own just-sent message
        if (lastSentMessageRef.current === newMsg.id) {
          lastSentMessageRef.current = null;
          return;
        }

        // Update existing message or add new one
        setMessages(prev => {
          const existingIndex = prev.findIndex(m => m.id === newMsg.id);
          
          if (existingIndex !== -1) {
            // Update existing message
            const updated = [...prev];
            updated[existingIndex] = formatMessage(newMsg);
            return updated;
          } else {
            // Add new message
            return [...prev, formatMessage(newMsg)];
          }
        });
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [conversation, currentUser, formatMessage, checkOnlineStatus]);

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    if (!showEmojiPicker) Keyboard.dismiss();
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser || !conversation || sending) return;
    
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update
    const newMsg = {
      id: tempId,
      text: newMessage,
      time: 'Sending...',
      sender: 'user',
      type: 'text',
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setShowEmojiPicker(false);
    
    try {
      // Save to database
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          chat_id: conversation.id,
          sender: currentUser.id,
          content: newMessage,
          type: 'text',
          status: 'sent'
        }])
        .select();
      
      if (error) throw error;
      
      // Store real ID to prevent duplicate in subscription
      lastSentMessageRef.current = data[0].id;
      
      // Update with real data
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? formatMessage(data[0]) : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const resendMessage = async (message) => {
    if (!currentUser || !conversation) return;
    
    setMessages(prev => prev.map(msg => 
      msg.id === message.id ? { ...msg, status: 'sending' } : msg
    ));
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          chat_id: conversation.id,
          sender: currentUser.id,
          content: message.text,
          type: 'text',
          status: 'sent'
        }])
        .select();
      
      if (error) throw error;
      
      lastSentMessageRef.current = data[0].id;
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? formatMessage(data[0]) : msg
      ));
    } catch (error) {
      console.error('Resend failed:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'failed' } : msg
      ));
    }
  };

  const renderEmojiCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.emojiCategory,
        activeEmojiCategory === item.id && styles.activeEmojiCategory
      ]}
      onPress={() => setActiveEmojiCategory(item.id)}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={24}
        color={activeEmojiCategory === item.id ? "#FF5A5F" : "#888"}
      />
    </TouchableOpacity>
  );

  const renderEmoji = ({ item }) => (
    <TouchableOpacity
      style={styles.emojiItem}
      onPress={() => handleEmojiSelect(item)}
    >
      <Text style={styles.emoji}>{item}</Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isFailed = item.status === 'failed';
    const isSending = item.status === 'sending';
    
    return (
      <View style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.recipientBubble,
        isFailed && styles.failedMessage
      ]}>
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
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
                  <Text style={[styles.status, { color: recipientOnline ? '#4CAF50' : '#888' }]}>
                    {recipientOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="ellipsis-vertical" size={24} color="#FF5A5F" />
              </TouchableOpacity>
            </View>

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
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                  styles.messagesContainer,
                  { paddingBottom: showEmojiPicker ? 300 : 90 }
                ]}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  if (messages.length > 0) {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }
                }}
                onLayout={() => {
                  if (messages.length > 0) {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }
                }}
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

            {/* Input Container */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.emojiButton}
                onPress={toggleEmojiPicker}
              >
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
                    <MaterialIcons
                      name="send"
                      size={24}
                      color="white"
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>
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
  },
  backButton: {
    padding: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF5A5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  status: {
    fontSize: 14,
  },
  menuButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#888',
  },
  messagesContainer: {
    padding: 15,
    paddingTop: 10,
  },
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
  failedMessage: {
    backgroundColor: '#FFE6E6',
    borderColor: '#FFCCCC',
  },
  userText: {
    color: '#FFF',
    fontSize: 16,
  },
  recipientText: {
    color: '#333',
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 5,
  },
  recipientTime: {
    color: '#888',
    fontSize: 12,
    marginLeft: 5,
  },
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
  emojiCategories: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  emojiCategoriesContainer: {
    paddingHorizontal: 10,
  },
  emojiCategory: {
    padding: 8,
    marginHorizontal: 5,
  },
  activeEmojiCategory: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF5A5F',
  },
  emojiScroll: {
    padding: 10,
  },
  emojiRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  emojiItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  emojiButton: {
    padding: 8,
    marginRight: 5,
  },
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
});