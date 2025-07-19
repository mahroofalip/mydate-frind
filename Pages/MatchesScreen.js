import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function MatchesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('rich');
  const [searchActive, setSearchActive] = useState(false);
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const matchesRef = useRef([]);

  // Update ref whenever matches change
  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  // Fetch mutual matches from Supabase
  useEffect(() => {
    if (!currentUser) return;

    const fetchMutualMatches = async () => {
      try {
        setLoading(true);

        // Step 1: Get all users who liked the current user
        const { data: receivedLikes, error: receivedError } = await supabase
          .from('likes')
          .select('sender')
          .eq('receiver', currentUser.id);

        if (receivedError) throw receivedError;

        // Step 2: Get all users the current user has liked
        const { data: sentLikes, error: sentError } = await supabase
          .from('likes')
          .select('receiver')
          .eq('sender', currentUser.id);

        if (sentError) throw sentError;

        // Step 3: Find mutual likes (users who both like each other)
        const receivedSenders = receivedLikes.map(like => like.sender);
        const sentReceivers = sentLikes.map(like => like.receiver);

        const mutualIds = receivedSenders.filter(id =>
          sentReceivers.includes(id)
        );

        // Step 4: Fetch profiles of mutual matches
        if (mutualIds.length > 0) {
          const { data: mutualProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', mutualIds);

          if (profilesError) throw profilesError;

          // Filter out matches that already have chats
          const matchesWithoutChats = await Promise.all(
            mutualProfiles.map(async (profile) => {
              const { data: chat, error: chatError } = await supabase
                .from('chats')
                .select('id')
                .or(`and(user1.eq.${currentUser.id},user2.eq.${profile.id}),and(user1.eq.${profile.id},user2.eq.${currentUser.id})`)
                .maybeSingle();

              return chat ? null : profile;
            })
          );

          // Filter out nulls
          const validMatches = matchesWithoutChats.filter(match => match !== null);

          // Add match data
          const matchesWithData = validMatches.map(profile => ({
            ...profile,
            matchPercentage: Math.floor(Math.random() * 41) + 60, // 60-100%
            lastMessage: "Say hello to start a conversation!",
            time: "Just now",
            unread: true
          }));

          setMatches(matchesWithData);
          setFilteredMatches(matchesWithData);
        } else {
          setMatches([]);
          setFilteredMatches([]);
        }
      } catch (error) {
        console.error('Error fetching mutual matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMutualMatches();

    // Real-time subscription for new likes
    const likesChannel = supabase
      .channel('realtime-matches')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'likes',
      }, async (payload) => {
        const newLike = payload.new;

        // Case 1: Current user sent a like to someone
        if (newLike.sender === currentUser.id) {
          // Check if the receiver has liked the current user
          const { data: reciprocalLike, error } = await supabase
            .from('likes')
            .select()
            .eq('sender', newLike.receiver)
            .eq('receiver', currentUser.id)
            .maybeSingle();

          if (reciprocalLike) {
            addNewMatch(newLike.receiver);
          }
        }
        // Case 2: Someone sent a like to the current user
        else if (newLike.receiver === currentUser.id) {
          // Check if the current user has liked the sender
          const { data: reciprocalLike, error } = await supabase
            .from('likes')
            .select()
            .eq('sender', currentUser.id)
            .eq('receiver', newLike.sender)
            .maybeSingle();

          if (reciprocalLike) {
            addNewMatch(newLike.sender);
          }
        }
      })
      .subscribe();

    // Real-time subscription for chat creation
    const chatsChannel = supabase
      .channel('realtime-chats')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chats',
      }, (payload) => {
        const newChat = payload.new;
        // If chat involves current user, remove the match
        if (newChat.user1 === currentUser.id || newChat.user2 === currentUser.id) {
          const otherUserId = newChat.user1 === currentUser.id
            ? newChat.user2
            : newChat.user1;

          setMatches(prev => prev.filter(match => match.id !== otherUserId));
          setFilteredMatches(prev => prev.filter(match => match.id !== otherUserId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(chatsChannel);
    };
  }, [currentUser]);

  // Add new match in real-time
  const addNewMatch = async (userId) => {
    try {
      // Check if match already exists
      const exists = matchesRef.current.some(match => match.id === userId);
      if (exists) return;

      // Check if chat already exists
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user1.eq.${currentUser.id},user2.eq.${userId}),and(user1.eq.${userId},user2.eq.${currentUser.id})`)
        .maybeSingle();

      if (chat) return; // Skip if chat exists

      // Fetch profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        const newMatch = {
          ...profile,
          matchPercentage: Math.floor(Math.random() * 41) + 60,
          lastMessage: "Say hello to start a conversation!",
          time: "Just now",
          unread: true
        };

        setMatches(prev => [...prev, newMatch]);
        setFilteredMatches(prev => [...prev, newMatch]);
      }
    } catch (error) {
      console.error('Error adding new match:', error);
    }
  };

  // Filter matches based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = matches.filter(match =>
        match.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.interests?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMatches(filtered);
    } else {
      setFilteredMatches(matches);
    }
  }, [searchQuery, matches]);

  // Sort matches based on active tab
  const getSortedMatches = () => {
    const matchesToSort = [...filteredMatches];
    if (activeTab === 'rich') {
      // Sort by highest match percentage
      return matchesToSort.sort((a, b) => b.matchPercentage - a.matchPercentage);
    } else {
      // Sort by most recent (newest first)
      return matchesToSort.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    }
  };

  const renderMatchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => navigation.navigate('Connect', { matchProfile: item })}
    >
      <View style={styles.matchCardContent}>
        {item.selfie_url ? (
          <Image source={{ uri: item.selfie_url }} style={styles.matchImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={40} color="#9CA3AF" />
          </View>
        )}

        {item.unread && <View style={styles.unreadBadge} />}

        <View style={styles.matchInfo}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchName}>{item.full_name}, {item.age}</Text>
            <View style={styles.matchPercentageContainer}>
              <MaterialCommunityIcons name="heart" size={16} color="#FF5A5F" />
              <Text style={styles.matchPercentage}>{item.matchPercentage}%</Text>
            </View>
          </View>

          <Text style={styles.matchLocation}>{item.location}</Text>

          <View style={styles.lastMessageContainer}>
            <Text
              style={[
                styles.lastMessage,
                item.unread && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            <Text style={styles.messageTime}>{item.time}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setSearchActive(!searchActive)}
          >
            <MaterialIcons
              name={searchActive ? "close" : "search"}
              size={24}
              color="#FF5A5F"
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="filter" size={24} color="#FF5A5F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {searchActive && (
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            placeholder="Search matches..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'rich' && styles.activeTab]}
          onPress={() => setActiveTab('rich')}
        >
          <Text style={[styles.tabText, activeTab === 'rich' && styles.activeTabText]}>
            Rich
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
            New
          </Text>
        </TouchableOpacity>
      </View>

      {/* Matches List */}
      {getSortedMatches().length > 0 ? (
        <FlatList
          data={getSortedMatches()}
          renderItem={renderMatchItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="heart-broken"
            size={80}
            color="#FF5A5F"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Matches Yet</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No matches match your search"
              : "When you and someone like each other, it's a match!"}
          </Text>
          {searchQuery ? (
            <TouchableOpacity
              style={styles.findButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.findButtonText}>Clear Search</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.findButton}
              onPress={() => navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              })}
            >
              <Text style={styles.findButtonText}>Start Swiping</Text>
            </TouchableOpacity>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6B7280',
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
    gap: 20,
  },
  searchButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 30,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  listContent: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  matchCardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  matchImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FF5A5F',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF5A5F',
  },
  unreadBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5A5F',
    borderWidth: 2,
    borderColor: '#fff',
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  matchPercentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5A5F20',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  matchPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5A5F',
    marginLeft: 4,
  },
  matchLocation: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 15,
    color: '#666',
    flex: 1,
    marginRight: 10,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 13,
    color: '#888',
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
});