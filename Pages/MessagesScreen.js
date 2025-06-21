import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Dimensions,
  Animated
} from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Sample conversation data
const conversations = [
  {
    id: '1',
    name: 'Sophia',
    lastMessage: 'Looking forward to our museum date! 😊',
    time: '2 mins ago',
    unread: 3,
    online: true,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&q=80',
    premium: true
  },
  {
    id: '2',
    name: 'Luna',
    lastMessage: 'The stars were beautiful last night 🌟',
    time: '1 hour ago',
    unread: 0,
    online: true,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
    premium: false
  },
  {
    id: '3',
    name: 'Isabella',
    lastMessage: 'I found the perfect picnic spot!',
    time: '3 hours ago',
    unread: 1,
    online: false,
    image: 'https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
    premium: true
  },
  {
    id: '4',
    name: 'Amélie',
    lastMessage: 'Would you like to attend the ballet?',
    time: 'Yesterday',
    unread: 0,
    online: false,
    image: 'https://images.unsplash.com/photo-1549476464-37392f717541?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
    premium: false
  },
  {
    id: '5',
    name: 'Seraphina',
    lastMessage: 'I composed a new piece for you 🎻',
    time: '2 days ago',
    unread: 0,
    online: true,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=688&q=80',
    premium: true
  },
  {
    id: '6',
    name: 'Aurora',
    lastMessage: 'The sunrise this morning was magical!',
    time: '3 days ago',
    unread: 0,
    online: false,
    image: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
    premium: false
  },
];

export default function MessagesScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [activeTab, setActiveTab] = useState('all');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [premiumVisible, setPremiumVisible] = useState(true);
  
  useEffect(() => {
    // Filter conversations based on search text
    const filtered = conversations.filter(conv => 
      conv.name.toLowerCase().includes(searchText.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredConversations(filtered);
  }, [searchText]);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => navigation.navigate('ChatScreen', { conversation: item })}
    >
      <View style={styles.conversationLeft}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.image }} style={styles.avatar} />
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

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="search" size={28} color="#FF5A5F" />
          </TouchableOpacity>
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
            onPress={() => navigation.navigate('Discover')}
          >
            <Text style={styles.findButtonText}>Find Matches</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Premium Banner */}
      {/* {premiumVisible && (
        <View style={styles.premiumBanner}>
          <View style={styles.premiumContent}>
            <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
            <Text style={styles.premiumText}>See read receipts and typing indicators with Premium</Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => {
                // In a real app, this would navigate to premium screen
                setPremiumVisible(false);
                alert('Redirecting to Premium Upgrade');
              }}
            >
              <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setPremiumVisible(false)}
          >
            <MaterialIcons name="close" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      )} */}
      
      {/* Floating Action Button */}
      {/* <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('NewMessage')}
      >
        <MaterialIcons name="edit" size={24} color="white" />
      </TouchableOpacity> */}
    </Animated.View>
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
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5A5F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  premiumBanner: {
    position: 'absolute',
    bottom: 4,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
    marginRight: 10,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  upgradeText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    padding: 5,
  },
});