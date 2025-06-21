// screens/ProfileDetailScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ProfileDetailScreen({ route, navigation }) {
  const { profile } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Combine all profile images
  const allImages = [profile.image, ...(profile.extraImages || [])];
  
  const sendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please enter a message.');
      return;
    }
    Alert.alert('Message Sent', `To ${profile.name}: ${message}`);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={allImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.carouselImage} />
            )}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
              setActiveIndex(index);
            }}
          />
          
          {/* Image Indicators */}
          <View style={styles.indicatorContainer}>
            {allImages.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.indicator,
                  index === activeIndex && styles.activeIndicator
                ]} 
              />
            ))}
          </View>
          
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Profile Content */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{profile.match}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#FF5A5F" />
            <Text style={styles.location}>{profile.place} • {profile.distance}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="work" size={20} color="#FF5A5F" />
            <Text style={styles.infoText}>{profile.occupation}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="school" size={20} color="#FF5A5F" />
            <Text style={styles.infoText}>{profile.education}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="search" size={20} color="#FF5A5F" />
            <Text style={styles.infoText}>Looking for: {profile.lookingFor}</Text>
          </View>
          
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
          
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tagsRow}>
            {profile.interests.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="message" size={24} color="white" />
            <Text style={styles.messageButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Message Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Message {profile.name}</Text>
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
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
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
    backgroundColor: '#fff',
  },
  carouselContainer: {
    height: height * 0.6,
  },
  carouselImage: {
    width,
    height: height * 0.6,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FF5A5F',
    width: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
  },
  matchBadge: {
    backgroundColor: '#FF5A5F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#555',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    color: '#000',
  },
  bio: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#FF5A5F20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FF5A5F80',
  },
  tagText: {
    color: '#FF5A5F',
    fontSize: 14,
    fontWeight: '500',
  },
  messageButton: {
    flexDirection: 'row',
    backgroundColor: '#FF5A5F',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  messageButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 10,
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