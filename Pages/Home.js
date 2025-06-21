import  { useState, useRef } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const richProfiles = [
  {
    id: '1',
    name: 'Sophia',
    age: 24,
    bio: 'Art curator who believes in love at first sight. Looking for someone to explore museums and coffee shops with.',
    place: 'Paris, France',
    distance: '1.5 miles away',
    lastOnline: '2 mins ago',
    interests: ['Art', 'Wine Tasting', 'Travel', 'Poetry', 'Dancing'],
    match: '95%',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&q=80',
    extraImages: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80'
    ],
    occupation: 'Art Curator',
    education: "Master's in Art History",
    lookingFor: 'Long-term relationship',
  },

];

export default function HomeScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const listRef = useRef(null);

  const sendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please enter a message.');
      return;
    }
    Alert.alert('Message Sent', `To ${selected.name}: ${message}`);
    setModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardContainer}>
      <ImageBackground 
        source={{ uri: item.image }} 
        style={styles.image}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.01)', 'rgba(0,0,0,0.8)']}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => alert('Liked!')}>
            <AntDesign name="hearto" size={28} color="white" />
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
          <Text style={styles.lastOnline}>Last online: {item.lastOnline}</Text>
          <Text style={styles.bio}>{item.bio}</Text>
          <View style={styles.tagsRow}>
            {item.interests.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ProfileDetail', { profile: item })} 
          style={styles.viewProfileBtn}
        >
          <MaterialIcons name="visibility" size={24} color="white" />
          <Text style={styles.buttonText}>View Profile</Text>
        </TouchableOpacity>
      </View>
        </View>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={richProfiles}
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
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
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
  viewProfileBtn: {
      flexDirection: 'row',
      backgroundColor: '#8B5CF6',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 30,
      alignItems: 'center',
    },
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  cardContainer: { 
    width, 
    height,
  },
  image: { 
    width: '100%', 
    height: '100%',
  },
  gradient: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    height: '70%',
  },
  headerIcons: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    right: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: { 
    position: 'absolute', 
    bottom: 40, 
    left: 20, 
    right: 20,
    paddingBottom: 10,
  },
  nameRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4,
  },
  name: { 
    fontSize: 36, 
    fontWeight: '800', 
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
  },
  matchBadge: { 
    backgroundColor: '#FF5A5F', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16,
    marginLeft: 12,
  },
  matchText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 16,
  },
  place: { 
    fontSize: 18, 
    color: '#fff', 
    fontWeight: '600',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
  lastOnline: { 
    fontSize: 14, 
    color: '#f0f0f0', 
    marginBottom: 10,
    fontWeight: '500',
  },
  bio: { 
    fontSize: 16, 
    color: '#fff', 
    marginBottom: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  tagsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 20,
  },
  tag: { 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 8, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  tagText: { 
    color: '#fff', 
    fontSize: 14,
    fontWeight: '500',
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    marginTop: 5,
  },
  messageBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#FF5A5F', 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '70%',
  },
  buttonText: { 
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
    padding: 20 
  },
  modalBox: { 
    width: '100%', 
    backgroundColor: '#1a1a1a', 
    borderRadius: 25, 
    padding: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    marginBottom: 15, 
    color: '#fff',
    textAlign: 'center',
  },
  input: { 
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 15, 
    padding: 18, 
    fontSize: 16, 
    minHeight: 120, 
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelBtn: { 
    backgroundColor: '#444', 
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
    alignItems: 'center' 
  },
});