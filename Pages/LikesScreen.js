import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Animated
} from 'react-native';
import { MaterialIcons,  MaterialCommunityIcons } from '@expo/vector-icons';


// Sample like data
const likesData = [
  {
    id: '1',
    name: 'Sophia',
    age: 24,
    location: 'Paris, France',
    matchPercentage: 95,
    time: '2 mins ago',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&q=80',
    mutual: true
  },
];

export default function LikesScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Filter likes based on active tab
  const filteredLikes = likesData.filter(like => {
    if (activeTab === 'all') return true;
    if (activeTab === 'mutual') return like.mutual;
    if (activeTab === 'new') return !like.mutual;
    return true;
  });

  // Fade in animation
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderLikeItem = ({ item }) => (
    <TouchableOpacity style={styles.likeCard}>
      <Image source={{ uri: item.image }} style={styles.likeImage} />
      
      <View style={styles.likeInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{item.name}, {item.age}</Text>
          {item.mutual && (
            <View style={styles.mutualBadge}>
              <MaterialCommunityIcons name="heart" size={16} color="white" />
              <Text style={styles.mutualText}>Mutual</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.location}>{item.location}</Text>
        
        <View style={styles.matchContainer}>
          <Text style={styles.matchPercentage}>{item.matchPercentage}% Match</Text>
          <View style={styles.matchBar}>
            <View 
              style={[
                styles.matchProgress, 
                { width: `${item.matchPercentage}%` }
              ]} 
            />
          </View>
        </View>
        
        <Text style={styles.time}>{item.time}</Text>
      </View>
      
      <TouchableOpacity style={styles.likeButton}>
        {item.mutual ? (
          <MaterialCommunityIcons name="heart" size={28} color="#FF5A5F" />
        ) : (
          <MaterialCommunityIcons name="heart-outline" size={28} color="#FF5A5F" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Likes</Text>
        <TouchableOpacity style={styles.searchButton}>
          <MaterialIcons name="search" size={28} color="#FF5A5F" />
        </TouchableOpacity>
      </View>
      
      {/* Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Likes
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{likesData.length}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'mutual' && styles.activeTab]}
          onPress={() => setActiveTab('mutual')}
        >
          <Text style={[styles.tabText, activeTab === 'mutual' && styles.activeTabText]}>
            Mutual
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {likesData.filter(l => l.mutual).length}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
            New Likes
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {likesData.filter(l => !l.mutual).length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Likes List */}
      {filteredLikes.length > 0 ? (
        <FlatList
          data={filteredLikes}
          renderItem={renderLikeItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="heart-multiple-outline" 
            size={80} 
            color="#FF5A5F" 
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Likes Yet</Text>
          <Text style={styles.emptyText}>
            Complete your profile and start swiping to get more likes!
          </Text>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Premium Banner */}
      <View style={styles.premiumBanner}>
        <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
        <Text style={styles.premiumText}>See who likes you with Premium</Text>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
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
  searchButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    paddingHorizontal: 6,
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
  likeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  likeImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FF5A5F',
  },
  likeInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  mutualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5A5F',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  mutualText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  location: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  matchContainer: {
    marginBottom: 8,
  },
  matchPercentage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF5A5F',
    marginBottom: 4,
  },
  matchBar: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  matchProgress: {
    height: '100%',
    backgroundColor: '#FF5A5F',
    borderRadius: 3,
  },
  time: {
    fontSize: 13,
    color: '#aaa',
  },
  likeButton: {
    padding: 10,
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
  profileButton: {
    backgroundColor: '#FF5A5F',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  profileButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  premiumBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  premiumText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
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
});