import React, { useState, useEffect } from 'react';
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

export default function MatchesScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchActive, setSearchActive] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch profiles from Supabase
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Add mock match percentage (since we don't have this in the database)
        const profilesWithMatch = data.map(profile => ({
          ...profile,
          matchPercentage: Math.floor(Math.random() * 41) + 60, // Random between 60-100%
          lastMessage: "Say hello to start a conversation!", // Default message
          time: "Just now" // Default time
        }));

        setProfiles(profilesWithMatch);
        setFilteredProfiles(profilesWithMatch);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        Alert.alert('Error', 'Failed to load profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Filter profiles based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = profiles.filter(profile => 
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.interests?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchQuery, profiles]);

  // Filter by active tab
  const getFilteredProfiles = () => {
    if (activeTab === 'unread') {
      return filteredProfiles.filter(profile => profile.unread);
    } else if (activeTab === 'recent') {
      // Get profiles created in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return filteredProfiles.filter(profile => 
        new Date(profile.created_at) > oneWeekAgo
      );
    }
    return filteredProfiles;
  };

  const renderProfileItem = ({ item }) => (
    <TouchableOpacity style={styles.matchCard}>
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
        <Text style={styles.loadingText}>Loading profiles...</Text>
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
          style={[styles.tabButton, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Matches
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Unread
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'recent' && styles.activeTab]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
            Recent
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Profiles List */}
      {getFilteredProfiles().length > 0 ? (
        <FlatList
          data={getFilteredProfiles()}
          renderItem={renderProfileItem}
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
          <Text style={styles.emptyTitle}>No Matches Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? "No profiles match your search" 
              : "Start swiping to find your perfect match!"}
          </Text>
          {searchQuery && (
            <TouchableOpacity 
              style={styles.findButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.findButtonText}>Clear Search</Text>
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