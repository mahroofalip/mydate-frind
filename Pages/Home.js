import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// Helper functions for online status
const checkOnlineStatus = (profile) => {
  if (!profile.last_login_at) return false;

  const now = new Date();
  const lastLogin = new Date(profile.last_login_at);
  const lastLogout = profile.last_logout_at ? new Date(profile.last_logout_at) : null;
  const expiresAt = profile.session_expires_at ? new Date(profile.session_expires_at) : null;

  return (
    (!lastLogout || lastLogin > lastLogout) &&
    (!expiresAt || expiresAt > now)
  );
};

const formatLastActive = (profile) => {
  const lastActive = profile.last_logout_at || profile.last_login_at;
  if (!lastActive) return 'Long time ago';

  const diffMinutes = Math.floor((new Date() - new Date(lastActive)) / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
  return `${Math.floor(diffMinutes / 1440)} days ago`;
};

const getOnlineStatusStyle = (profile) => {
  if (checkOnlineStatus(profile)) {
    return { color: '#4CAF50', text: 'Online now' };
  }

  const lastActive = formatLastActive(profile).toLowerCase();

  if (lastActive.includes('just now') || lastActive.includes('min ago')) {
    return { color: '#FFEB3B', text: 'Recently online' };
  }

  return { color: '#F44336', text: lastActive };
};

// Helper function to get or create a chat
const getOrCreateChat = async (currentUserId, recipientId) => {
  // Check if chat already exists
  const { data: existingChat, error: existingError } = await supabase
    .from('chats')
    .select('*')
    .or(`and(user1.eq.${currentUserId},user2.eq.${recipientId}),and(user1.eq.${recipientId},user2.eq.${currentUserId})`)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('Error checking chat:', existingError);
    return null;
  }

  if (existingChat) return existingChat;

  // Create new chat
  const { data: newChat, error: createError } = await supabase
    .from('chats')
    .insert([{ user1: currentUserId, user2: recipientId }])
    .select()
    .single();

  if (createError) {
    console.error('Error creating chat:', createError);
    return null;
  }

  return newChat;
};

// Helper function to send a message
const sendSupabaseMessage = async (chatId, senderId, content) => {
  const { error } = await supabase
    .from('messages')
    .insert([{
      chat_id: chatId,
      sender: senderId,
      content,
      type: 'text',
      status: 'sent'
    }]);

  if (error) {
    console.error('Error sending message:', error);
    return false;
  }

  return true;
};

export default function HomeScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState(new Set());
  const listRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      return user;
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        if (!currentUser) return;
        
        // Fetch profiles excluding current user with online status columns
        const { data, error } = await supabase
          .from('profiles')
          .select('*, last_login_at, last_logout_at, session_expires_at')
          .neq('id', currentUser.id);

        if (error) throw error;

        // Map Supabase data to our profile format
        const formattedProfiles = data.map(profile => {
          // Process all images from extra_images field
          const allImages = profile.extra_images 
            ? profile.extra_images.split(',').map(img => img.trim()).filter(img => img)
            : [];
          
          return {
            id: profile.id,
            name: profile.full_name,
            age: profile.age,
            image: profile.selfie_url || '', // First image as main
            extraImages: allImages, // Remaining as extraImages
            place: profile.location,
            distance: 'Nearby',
            bio: profile.bio,
            interests: profile.interests ? profile.interests.split(',').slice(0, 3) : [],
            match: `${Math.floor(Math.random() * 30) + 70}%`,
            lookingFor: profile.looking_for,
            occupation: profile.occupation,
            education: profile.education,
            last_login_at: profile.last_login_at,
            last_logout_at: profile.last_logout_at,
            session_expires_at: profile.session_expires_at,
          };
        });

        setProfiles(formattedProfiles);
      } catch (error) {
        Alert.alert('Error', error.message || 'Failed to load profiles');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) fetchProfiles();

    // Subscribe to real-time profile updates
    const profileSubscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        setProfiles(prev => prev.map(profile =>
          profile.id === payload.new.id ? { ...profile, ...payload.new } : profile
        ));
      })
      .subscribe();

    return () => {
      if (profileSubscription) {
        profileSubscription.unsubscribe();
      }
    };

  }, [currentUser]);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!currentUser) return;
      
      try {
        const { data: likes, error } = await supabase
          .from('likes')
          .select('receiver')
          .eq('sender', currentUser.id);
          
        if (error) throw error;
        
        // Create Set of liked profile IDs
        const likedIds = new Set(likes.map(like => like.receiver));
        setLikedProfiles(likedIds);
      } catch (error) {
        console.error('Failed to fetch likes:', error);
      }
    };
    
    fetchLikes();
  }, [currentUser]);

  const toggleLike = async (profile) => {
    if (!currentUser) return;
    
    const isLiked = likedProfiles.has(profile.id);
    const newLikedProfiles = new Set(likedProfiles);
    
    try {
      if (isLiked) {
        // Unlike: remove from database and state
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('sender', currentUser.id)
          .eq('receiver', profile.id);
          
        if (error) throw error;
        
        newLikedProfiles.delete(profile.id);
      } else {
        // Like: add to database and state
        const { error } = await supabase
          .from('likes')
          .insert([{ 
            sender: currentUser.id, 
            receiver: profile.id 
          }]);

        if (error) throw error;
        
        newLikedProfiles.add(profile.id);

        // Check for reciprocal like (match)
        const { data: reciprocalLike, error: reciprocalError } = await supabase
          .from('likes')
          .select()
          .eq('sender', profile.id)
          .eq('receiver', currentUser.id)
          .maybeSingle();

        if (reciprocalError) throw reciprocalError;

        if (reciprocalLike) {
          // Create match if reciprocal like exists
          const { error: matchError } = await supabase
            .from('matches')
            .insert([{
              user1: currentUser.id,
              user2: profile.id
            }]);

          if (matchError) throw matchError;

          // Create chat automatically
          await getOrCreateChat(currentUser.id, profile.id);
          
          Alert.alert(
            "It's a match!",
            `You and ${profile.name} liked each other`,
            [
              {
                text: "Message now",
                onPress: () => {
                  setSelected(profile);
                  setModalVisible(true);
                }
              },
              { text: "Later" }
            ]
          );
        }
      }
      
      setLikedProfiles(newLikedProfiles);
    } catch (error) {
      Alert.alert("Error", error.message || `Failed to ${isLiked ? 'unlike' : 'like'}`);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || !selected) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setSending(true);
    
    try {
      // 1. Get or create chat between users
      const chat = await getOrCreateChat(currentUser.id, selected.id);
      
      if (!chat) {
        throw new Error('Failed to create conversation');
      }

      // 2. Send message
      const success = await sendSupabaseMessage(chat.id, currentUser.id, message);
      
      if (success) {
        Alert.alert('Message Sent', `Your message has been sent to ${selected.name}`);
        setModalVisible(false);
        setMessage('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const onlineStatus = getOnlineStatusStyle(item);
    const isLiked = likedProfiles.has(item.id);
    return (
      <View style={styles.cardContainer}>
        <ImageBackground
          source={{ uri: item.image || 'https://via.placeholder.com/300' }}
          style={styles.image}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.01)', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.4, 1]}
            style={styles.gradient}
          />
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => toggleLike(item)}
            >
              <AntDesign 
                name={isLiked ? "heart" : "hearto"} 
                size={28} 
                color={isLiked ? "#FF5A5F" : "white"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => alert('Passed!')}>
              <AntDesign name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoSection}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}, {item.age}</Text>
              <View style={styles.matchBadge}>
                <Text style={styles.matchText}>{item.match}</Text>
              </View>
            </View>
            <Text style={styles.place}>{item.place} • {item.distance}</Text>

            <Text style={styles.lastOnline}>
              Status:{' '}
              <Text style={{ color: onlineStatus.color, fontWeight: 'bold' }}>
                {onlineStatus.text}
              </Text>
            </Text>

            <Text style={styles.bio}>{item.bio}</Text>
            <View style={styles.tagsRow}>
              {item.interests.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
             <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewProfileButton]}
                onPress={() => navigation.navigate('ProfileDetail', { 
                  profile: {
                    ...item,
                    // Pass both image and extraImages explicitly
                    image: item.image,
                    extraImages: item.extraImages
                  }
                })}
              >
                <Ionicons name="person" size={20} color="white" />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.messageButton]}
                onPress={() => {
                  setSelected(item);
                  setModalVisible(true);
                }}
              >
                <MaterialIcons name="send" size={20} color="white" />
                <Text style={styles.actionButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text style={styles.loadingText}>Finding people near you...</Text>
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="group-off" size={80} color="#888" />
        <Text style={styles.emptyText}>No profiles found</Text>
        <Text style={styles.emptySubtext}>Try again later or expand your search</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={profiles}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Message {selected?.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="Type your first message..."
              placeholderTextColor="#aaa"
              value={message}
              onChangeText={setMessage}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={styles.cancelBtn}
                disabled={sending}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSendMessage} 
                style={styles.sendBtn}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  cardContainer: {
    width,
    height,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  headerIcons: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  infoSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 25,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
  },
  matchBadge: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 20,
  },
  matchText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  place: {
    fontSize: 18,
    color: 'white',
    marginBottom: 5,
  },
  lastOnline: {
    fontSize: 16,
    color: 'white',
    marginBottom: 15,
  },
  bio: {
    fontSize: 16,
    color: 'white',
    marginBottom: 15,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  tagText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 30,
  },
  viewProfileButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'white',
  },
  messageButton: {
    backgroundColor: '#FF5A5F',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#555',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f4f4f4',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelBtn: {
    backgroundColor: '#888',
    padding: 16,
    borderRadius: 30,
    flex: 1,
    alignItems: 'center',
  },
  sendBtn: {
    backgroundColor: '#FF5A5F',
    padding: 16,
    borderRadius: 30,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});