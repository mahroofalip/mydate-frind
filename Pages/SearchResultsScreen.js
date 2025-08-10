// Pages/SearchResultsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const SearchResultsScreen = ({ navigation, route }) => {
  const [users, setUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const { initialUsers } = route.params || {};
  
  useEffect(() => {
    if (initialUsers) {
      setUsers(initialUsers);
    } else {
      fetchAllUsers();
    }
  }, []);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('last_login_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to load users');
    }
  };

  const applyFilter = async (filterType) => {
    setActiveFilter(filterType);
    
    try {
      let query = supabase
        .from('profiles')
        .select('*');

      switch (filterType) {
        case 'online':
          const tenMinutesAgo = new Date(Date.now() - 10 * 60000).toISOString();
          query = query.gt('last_login_at', tenMinutesAgo);
          break;
        case 'premium':
          query = query.eq('is_premium', true);
          break;
        default:
          // 'all' filter - no additional conditions
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error filtering users:', error);
      alert('Failed to apply filter');
    }
  };

  const renderUserCard = ({ item }) => {
    // Convert interests string to array
    const interests = item.interests ? item.interests.split(',').map(i => i.trim()) : [];
    
    // Calculate time since last login
    const lastLogin = item.last_login_at ? new Date(item.last_login_at) : null;
    const minutesAgo = lastLogin ? Math.floor((new Date() - lastLogin) / 60000) : null;
    const isOnline = minutesAgo !== null && minutesAgo < 10;

    return (
      <TouchableOpacity 
        style={styles.userCard}
        onPress={() => navigation.navigate('ProfileDetail', { profileId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: item.selfie_url || 'https://via.placeholder.com/100' }} 
            style={styles.userImage} 
          />
          {isOnline && <View style={styles.onlineBadge} />}
          
          <View style={styles.userInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{item.full_name}, {item.age}</Text>
              {item.is_premium && (
                <MaterialIcons name="star" size={18} color="#FFC107" style={styles.premiumIcon} />
              )}
            </View>
            
            {/* Fixed location rendering */}
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={14} color="#81C784" />
              <Text style={styles.userLocation}>
                {item.location || 'Location not set'}
              </Text>
            </View>
          </View>
        </View>
        
        {item.bio ? (
          <Text style={styles.userBio} numberOfLines={2}>
            {item.bio}
          </Text>
        ) : null}
        
        {interests?.length > 0 && (
          <View style={styles.interestsContainer}>
            {interests?.slice(0, 3).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
            {interests?.length > 3 && (
              <View style={styles.moreInterests}>
                <Text style={styles.moreText}>+{interests?.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Results</Text>
        <View style={{ width: 24 }} /> {/* Spacer for alignment */}
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'all' && styles.activeFilter]}
          onPress={() => applyFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'online' && styles.activeFilter]}
          onPress={() => applyFilter('online')}
        >
          <Text style={[styles.filterText, activeFilter === 'online' && styles.activeFilterText]}>Online</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'premium' && styles.activeFilter]}
          onPress={() => applyFilter('premium')}
        >
          <Text style={[styles.filterText, activeFilter === 'premium' && styles.activeFilterText]}>Premium</Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>{users.length} {users.length === 1 ? 'person' : 'people'} found</Text>
      </View>

      {/* User List */}
      {users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noResults}>
          <MaterialIcons name="search-off" size={60} color="#A5D6A7" />
          <Text style={styles.noResultsText}>No matches found</Text>
          <Text style={styles.noResultsSubtext}>Try adjusting your filters</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5fdf7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 50,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
  },
  activeFilter: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    color: '#66BB6A',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  resultsContainer: {
    padding: 15,
    backgroundColor: '#e8f5e9',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
  },
  resultsText: {
    color: '#2E7D32',
    fontWeight: '500',
    textAlign: 'center',
  },
  listContainer: {
    padding: 15,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  onlineBadge: {
    position: 'absolute',
    top: 2,
    left: 55,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    marginRight: 5,
  },
  premiumIcon: {
    marginRight: 5,
  },
  // New container for location
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userLocation: {
    color: '#81C784',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4, // Space between icon and text
  },
  userBio: {
    color: '#555',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#2E7D32',
    fontSize: 13,
  },
  moreInterests: {
    backgroundColor: '#C8E6C9',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  moreText: {
    color: '#2E7D32',
    fontSize: 13,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 20,
  },
  noResultsSubtext: {
    fontSize: 16,
    color: '#81C784',
    marginTop: 10,
  },
});

export default SearchResultsScreen;