import React, { useState, useEffect, useRef } from 'react';
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

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [premiumVisible, setPremiumVisible] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      return user;
    };

    fetchUser();
  }, []);

  // Add this to useEffect that handles subscriptions
useEffect(() => {
  if (!currentUser) return;

  // ... existing subscriptions ...

  // New subscription for message read status updates
  const readStatusSubscription = supabase
    .channel('public:message_read_status')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `status=eq.read`
    }, payload => {
      // Update conversation unread count
      setConversations(prev => 
        prev.map(conv => {
          if (conv.chatId === payload.new.chat_id) {
            return {
              ...conv,
              unread: Math.max(0, conv.unread - 1)
            };
          }
          return conv;
        })
      );
    })
    .subscribe();

  return () => {
    // ... existing unsubscribes ...
    readStatusSubscription.unsubscribe();
  };
}, [currentUser]);





  useEffect(() => {
  if (!currentUser) return;

  // Check online status helper
  const checkOnlineStatus = (user) => {
    if (!user?.last_login_at) return false;
    const now = new Date();
    const lastLogin = new Date(user.last_login_at);
    const lastLogout = user.last_logout_at ? new Date(user.last_logout_at) : null;
    const expiresAt = user.session_expires_at ? new Date(user.session_expires_at) : null;
    
    return (
      (!lastLogout || lastLogin > lastLogout) &&
      (!expiresAt || expiresAt > now)
    );
  };

  // Format time helper
  const formatTime = (dateString) => {
    const now = moment();
    const msgTime = moment(dateString);
    const diffDays = now.diff(msgTime, 'days');
    
    if (diffDays === 0) return msgTime.format('h:mm A');
    if (diffDays < 7) return msgTime.format('ddd');
    return msgTime.format('MMM D');
  };

  // Fetch conversations
  const fetchConversations = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          created_at,
          user1:profiles!user1(id, full_name, selfie_url, last_login_at, last_logout_at, session_expires_at),
          user2:profiles!user2(id, full_name, selfie_url, last_login_at, last_logout_at, session_expires_at),
          messages: messages!chat_id(id, content, created_at, sender, status)
        `)
        .or(`user1.eq.${currentUser.id},user2.eq.${currentUser.id}`)
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

        // Find last message
        const lastMessage = conversation.messages?.length > 0
          ? conversation.messages.reduce((latest, msg) => 
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
          premium: false
        };
      }));

      setConversations(formatted);
      setFilteredConversations(formatted);
    } catch (error) {
      console.error('Fetch conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchConversations();

  // Real-time subscriptions
  const messagesChannel = supabase
    .channel('public:messages')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `sender=neq.${currentUser.id}`
    }, async (payload) => {
      // For new messages or updates
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newMessage = payload.new;
        
        // Update the conversation
        setConversations(prev => prev.map(conv => {
          if (conv.chatId === newMessage.chat_id) {
            // Update last message
            const newTime = formatTime(newMessage.created_at);
            const isNewer = moment(newMessage.created_at).isAfter(
              moment(conv.lastUpdated || 0)
            );
            
            return {
              ...conv,
              lastMessage: newMessage.content,
              time: isNewer ? newTime : conv.time,
              unread: newMessage.status === 'sent' 
                ? conv.unread + 1 
                : conv.unread,
              lastUpdated: new Date()
            };
          }
          return conv;
        }));
      }
    })
    .subscribe();

  return () => {
    messagesChannel.unsubscribe();
  };
}, [currentUser]);

  

  // In MessagesScreen.js


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

  const handleConversationPress = async (conversation) => {
  // Mark all messages as read before navigating
  const { data: unreadMessages } = await supabase
    .from('messages')
    .select('id')
    .eq('chat_id', conversation.chatId)
    .eq('status', 'sent')
    .neq('sender', currentUser.id);

  if (unreadMessages && unreadMessages.length > 0) {
    const messageIds = unreadMessages.map(m => m.id);
    
    await supabase
      .from('messages')
      .update({ status: 'read' })
      .in('id', messageIds);
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
          keyExtractor={item => item.id}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    margin: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FF5A5F20',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#FF5A5F',
  },
  tabBadge: {
    backgroundColor: '#FF5A5F',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  conversationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  premiumBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 3,
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
    marginBottom: 4,
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
    fontWeight: '600',
  },
  conversationRight: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
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
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  findButton: {
    backgroundColor: '#FF5A5F',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  findButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 15,
    color: '#FF5A5F',
    fontSize: 16,
  },
});