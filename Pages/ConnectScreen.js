import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function ConnectScreen({ route, navigation }) {
  const { matchProfile } = route.params;
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [icebreakers, setIcebreakers] = useState([]);
  const [selectedIcebreaker, setSelectedIcebreaker] = useState(null);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  // Load icebreaker questions
  useEffect(() => {
    const loadIcebreakers = async () => {
      setIcebreakers([
        "Hi! What brings you here?",
        "What's something fun you did recently?",
        "What's your favorite way to spend a weekend?",
        "If you could travel anywhere right now, where would you go?",
        "What's the best book you've read recently?",
        "What's your favorite type of cuisine?",
        "Do you have any pets?",
        "What's your favorite hobby?"
      ]);
    };
    
    loadIcebreakers();
  }, []);

  // Create chat and send first message
  const startConversation = async (customMessage = null) => {
    if (!currentUser) return;
    
    try {
      setSending(true);
      const content = customMessage || message;
      
      // 1. Get or create chat between users
      const chat = await getOrCreateChat(currentUser.id, matchProfile.id);
      
      if (!chat) {
        throw new Error('Failed to create conversation');
      }

      // 2. Send initial message
      const success = await sendSupabaseMessage(chat.id, currentUser.id, content);
      
      if (success) {
        // 3. Navigate to chat screen
        navigation.replace('ChatScreen', {
          conversation: {
            id: chat.id,
            name: matchProfile.full_name,
            image: matchProfile.selfie_url,
            userId: matchProfile.id
          }
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setSending(false);
    }
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

  return (
    <LinearGradient 
      colors={['#FF5A5F', '#FF9A9E']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Match Profile Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>It's a Match!</Text>
              <Text style={styles.headerSubtitle}>Start a conversation with {matchProfile.full_name}</Text>
            </View>
          </View>
          
          {/* Match Profile Card */}
          <View style={styles.profileCard}>
            <Image 
              source={{ uri: matchProfile.selfie_url || 'https://via.placeholder.com/300' }} 
              style={styles.profileImage}
            />
            
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{matchProfile.full_name}, {matchProfile.age}</Text>
              <View style={styles.locationContainer}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#FF5A5F" />
                <Text style={styles.location}>{matchProfile.location}</Text>
              </View>
              
              {matchProfile.interests && (
                <View style={styles.interestsContainer}>
                  {matchProfile.interests.split(',').slice(0, 3).map((interest, index) => (
                    <View key={index} style={styles.interestTag}>
                      <Text style={styles.interestText}>{interest.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          
          {/* Icebreaker Section */}
          <View style={styles.icebreakerSection}>
            <Text style={styles.sectionTitle}>Break the Ice</Text>
            <Text style={styles.sectionSubtitle}>Start with one of these conversation starters</Text>
            
            <View style={styles.icebreakerGrid}>
              {icebreakers.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.icebreakerCard,
                    selectedIcebreaker === index && styles.selectedIcebreaker
                  ]}
                  onPress={() => {
                    setSelectedIcebreaker(index);
                    setMessage(question);
                  }}
                >
                  <Text style={styles.icebreakerText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Custom Message */}
          <View style={styles.messageSection}>
            <Text style={styles.sectionTitle}>Or write your own</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type your first message..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
              />
              
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => startConversation()}
                disabled={sending || !message.trim()}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons 
                    name="send" 
                    size={24} 
                    color="white" 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Quick Connect Button */}
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => startConversation("👋 Hi! I'd love to chat!")}
            disabled={sending}
          >
            <Text style={styles.connectButtonText}>
              {sending ? 'Connecting...' : 'Quick Connect'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 40
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    minHeight: height,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  profileImage: {
    width: '100%',
    height: height * 0.35,
    maxHeight: 350,
  },
  profileInfo: {
    padding: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  interestTag: {
    backgroundColor: '#FF5A5F20',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#FF5A5F',
    fontSize: 14,
  },
  icebreakerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
  },
  icebreakerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  icebreakerCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIcebreaker: {
    borderColor: '#FF5A5F',
    backgroundColor: 'white',
  },
  icebreakerText: {
    fontSize: 15,
    color: '#333',
  },
  messageSection: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    minHeight: 60,
    fontSize: 16,
    textAlignVertical: 'top',
    marginRight: 10,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5A5F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  connectButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  connectButtonText: {
    color: '#FF5A5F',
    fontSize: 18,
    fontWeight: 'bold',
  },
});