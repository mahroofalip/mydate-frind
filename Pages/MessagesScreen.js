import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  TextInput,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import moment from 'moment';
import { useIsFocused, useNavigation } from '@react-navigation/native';

export default function MessagesScreen({ setUnreadMessageCount }) {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [premiumVisible, setPremiumVisible] = useState(true);
  
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      return user;
    };

    fetchUser();
  }, []);

  // Check online status helper
  const checkOnlineStatus = useCallback((user) => {
    if (!user?.last_login_at) return false;
    const now = new Date();
    const lastLogin = new Date(user.last_login_at);
    const lastLogout = user.last_logout_at ? new Date(user.last_logout_at) : null;
    const expiresAt = user.session_expires_at ? new Date(user.session_expires_at) : null;
    
    return (
      (!lastLogout || lastLogin > lastLogout) &&
      (!expiresAt || expiresAt > now)
    );
  }, []);

  // Format time helper
  const formatTime = useCallback((dateString) => {
    const now = moment();
    const msgTime = moment(dateString);
    const diffDays = now.diff(msgTime, 'days');
    
    if (diffDays === 0) return msgTime.format('h:mm A');
    if (diffDays < 7) return msgTime.format('ddd');
    return msgTime.format('MMM D');
  }, []);

  // Fetch conversations with deleted chats filtering
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    
    try {
      // First, get all deleted chat IDs for current user
      const { data: deletedChats, error: deletedError } = await supabase
        .from('deleted_chats')
        .select('chat_id')
        .eq('user_id', currentUser.id);

      if (deletedError) {
        console.error('Error fetching deleted chats:', deletedError);
      }

      const deletedChatIds = deletedChats?.map(dc => dc.chat_id) || [];

      // Fetch conversations excluding deleted ones
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          created_at,
          user1:profiles!chats_user1_fkey(id, full_name, selfie_url, last_login_at, last_logout_at, session_expires_at, is_premium),
          user2:profiles!chats_user2_fkey(id, full_name, selfie_url, last_login_at, last_logout_at, session_expires_at, is_premium),
          messages: messages!messages_chat_id_fkey(id, content, created_at, sender, status)
        `)
        .or(`user1.eq.${currentUser.id},user2.eq.${currentUser.id}`)
        .not('id', 'in', `(${deletedChatIds.length > 0 ? deletedChatIds.join(',') : 'NULL'})`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process conversations
      const formatted = await Promise.all(data.map(async (conversation) => {
        const otherUser = conversation.user1.id === currentUser.id 
          ? conversation.user2 
          : conversation.user1;
        
        // Get unread count from database for accuracy
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .eq('chat_id', conversation.id)
          .eq('status', 'sent')
          .neq('sender', currentUser.id);

        // Find last message (filter out messages deleted for current user)
        const validMessages = conversation.messages?.filter(msg => 
          !msg.deleted_for_users?.includes(currentUser.id) && 
          !msg.deleted_for_everyone
        ) || [];

        const lastMessage = validMessages.length > 0
          ? validMessages.reduce((latest, msg) => 
              new Date(msg.created_at) > new Date(latest.created_at) ? msg : latest
            )
          : null;

        return {
          id: conversation.id,
          chatId: conversation.id,
          name: otherUser.full_name,
          lastMessage: lastMessage?.content || 'Start a conversation',
          time: lastMessage?.created_at ? formatTime(lastMessage.created_at) : 'Just now',
          unread: unreadCount || 0,
          image: otherUser.selfie_url,
          userId: otherUser.id,
          online: checkOnlineStatus(otherUser),
          premium: otherUser.is_premium || false,
          lastUpdated: lastMessage?.created_at || conversation.created_at
        };
      }));

      // Sort by last updated time
      const sortedConversations = formatted.sort((a, b) => 
        new Date(b.lastUpdated) - new Date(a.lastUpdated)
      );

      setConversations(sortedConversations);
      setFilteredConversations(sortedConversations);
    } catch (error) {
      console.error('Fetch conversations error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, checkOnlineStatus, formatTime]);

  useEffect(() => {
    if (!currentUser) return;

    let messagesChannel;
    let deletedChatsChannel;
    let timeoutId;

    // Add a small delay before fetching to ensure DB updates are processed
    if (isFocused) {
      timeoutId = setTimeout(() => {
        fetchConversations();
      }, 300);
    }

    // Real-time subscriptions for messages
    messagesChannel = supabase
      .channel('public:messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `sender=neq.${currentUser.id}`
      }, async (payload) => {
        // For new messages
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new;
          
          // Update the conversation
          setConversations(prev => prev.map(conv => {
            if (conv.chatId === newMessage.chat_id) {
              // Update last message
              const newTime = formatTime(newMessage.created_at);
              
              return {
                ...conv,
                lastMessage: newMessage.content,
                time: newTime,
                unread: newMessage.status === 'sent' 
                  ? conv.unread + 1 
                  : conv.unread,
                lastUpdated: new Date()
              };
            }
            return conv;
          }));
        }
        // For message status updates (read/sent)
        else if (payload.eventType === 'UPDATE') {
          const updatedMessage = payload.new;
          
          // Only handle read status updates
          if (updatedMessage.status === 'read' && payload.old.status === 'sent') {
            setConversations(prev => prev.map(conv => {
              if (conv.chatId === updatedMessage.chat_id) {
                return {
                  ...conv,
                  unread: Math.max(0, conv.unread - 1)
                };
              }
              return conv;
            }));
          }
        }
      })
      .subscribe();

    // Real-time subscription for deleted chats
    deletedChatsChannel = supabase
      .channel('public:deleted_chats')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'deleted_chats',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        // When a chat is deleted, remove it from the list
        const deletedChatId = payload.new.chat_id;
        setConversations(prev => prev.filter(conv => conv.chatId !== deletedChatId));
        setFilteredConversations(prev => prev.filter(conv => conv.chatId !== deletedChatId));
      })
      .subscribe();

    return () => {
      if (messagesChannel) messagesChannel.unsubscribe();
      if (deletedChatsChannel) deletedChatsChannel.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentUser, isFocused, fetchConversations, formatTime]);

  // Filter conversations based on active tab
  useEffect(() => {
    let filtered = conversations;
    
    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(conv => 
        conv.name.toLowerCase().includes(searchText.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Apply tab filter
    if (activeTab === 'unread') {
      filtered = filtered.filter(conv => conv.unread > 0);
    } else if (activeTab === 'online') {
      filtered = filtered.filter(conv => conv.online);
    }
    
    setFilteredConversations(filtered);
  }, [searchText, activeTab, conversations]);

  const handleConversationPress = (conversation) => {
    // Decrease global unread count by this conversation's unread count
    if (conversation.unread > 0) {
      setUnreadMessageCount(prev => Math.max(0, prev - conversation.unread));
    }
    
    navigation.navigate('ChatScreen', { 
      conversation: {
        id: conversation.chatId,
        name: conversation.name,
        image: conversation.image,
        userId: conversation.userId
      }
    });
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.conversationLeft}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
            style={styles.avatar} 
            onError={() => console.log("Image failed to load")}
          />
          {item.online && <View style={styles.onlineIndicator} />}
          {item.premium && (
            <MaterialCommunityIcons 
              name="crown" 
              size={16} 
              color="#FFD700" 
              style={styles.premiumBadge} 
            />
          )}
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.conversationName}>{item.name}</Text>
            {item.premium && (
              <MaterialCommunityIcons 
                name="crown" 
                size={16} 
                color="#FFD700" 
                style={styles.premiumIcon} 
              />
            )}
          </View>
          <Text 
            style={[
              styles.lastMessage,
              item.unread > 0 && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
      </View>
      
      <View style={styles.conversationRight}>
        <Text style={styles.timeText}>{item.time}</Text>
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('NewMessage')}
          >
            <MaterialIcons name="add" size={28} color="#FF5A5F" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>Unread</Text>
          {conversations.some(c => c.unread > 0) && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {conversations.filter(c => c.unread > 0).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'online' && styles.activeTab]}
          onPress={() => setActiveTab('online')}
        >
          <Text style={[styles.tabText, activeTab === 'online' && styles.activeTabText]}>Online</Text>
        </TouchableOpacity>
      </View>
      
      {/* Conversation List */}
      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={item => item.chatId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="message-text-outline" 
            size={80} 
            color="#FF5A5F" 
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptyText}>
            Start a conversation with your matches!
          </Text>
          <TouchableOpacity 
            style={styles.findButton}
            onPress={() => navigation.navigate('NewMessage')}
          >
            <Text style={styles.findButtonText}>Start a Conversation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#FF5A5F',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#FFF',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: 0,
    backgroundColor: '#FF5A5F',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  conversationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEE',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 2,
  },
  conversationInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  premiumIcon: {
    marginLeft: 5,
  },
  lastMessage: {
    fontSize: 15,
    color: '#888',
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  conversationRight: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 5,
  },
  unreadBadge: {
    backgroundColor: '#FF5A5F',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  findButton: {
    backgroundColor: '#FF5A5F',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  findButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
});