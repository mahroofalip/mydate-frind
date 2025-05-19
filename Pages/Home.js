import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';

const { width, height } = Dimensions.get('window');

const dummyProfiles = [
  {
    id: '1',
    name: 'Alex',
    age: 25,
    bio: 'Loves hiking and coffee ☕️',
    place: 'Seattle, WA',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: '2',
    name: 'Samantha',
    age: 23,
    bio: 'Artist, dreamer, bookworm 📚',
    place: 'Austin, TX',
    image: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: '3',
    name: 'Jordan',
    age: 28,
    bio: 'Tech geek. Pizza is life 🍕',
    place: 'New York, NY',
    image: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
];

export default function HomeScreen() {
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [message, setMessage] = useState('');

  const openMessageModal = (profile) => {
    setSelectedProfile(profile);
    setMessage('');
    setMessageModalVisible(true);
  };

  const sendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please enter a message.');
      return;
    }
    Alert.alert('Message Sent', `To ${selectedProfile.name}: ${message}`);
    setMessageModalVisible(false);
  };

  const renderCard = (item) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}, {item.age}</Text>
        <Text style={styles.place}>{item.place}</Text>
        <Text style={styles.bio}>{item.bio}</Text>
        <TouchableOpacity
          style={[styles.button, styles.messageBtn]}
          onPress={() => openMessageModal(item)}
        >
          <Text style={styles.buttonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👋 Welcome Back</Text>
      <Text style={styles.subtitle}>Swipe to explore</Text>

      <Swiper
        cards={dummyProfiles}
        renderCard={renderCard}
        stackSize={3}
        backgroundColor="transparent"
        cardIndex={0}
        verticalSwipe={false}
        onSwipedLeft={(index) => console.log('Pass:', dummyProfiles[index].name)}
        onSwipedRight={(index) => console.log('Like:', dummyProfiles[index].name)}
      />

      {/* Message Modal */}
      <Modal
        visible={messageModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMessageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Message {selectedProfile?.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="Type your first message..."
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setMessageModalVisible(false)}
                style={[styles.button, styles.passBtn]}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={sendMessage} style={[styles.button, styles.likeBtn]}>
                <Text style={styles.buttonText}>Send</Text>
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
    backgroundColor: '#f1f5f9',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    height: height * 0.65,
    width: width * 0.9,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '60%',
  },
  cardContent: {
    padding: 16,
    justifyContent: 'space-between',
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  place: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  messageBtn: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  passBtn: {
    backgroundColor: '#ef4444',
    flex: 1,
  },
  likeBtn: {
    backgroundColor: '#10b981',
    flex: 1,
  },
});
