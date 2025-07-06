import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Switch,
  Modal,
  TextInput
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function ProfileScreen({ navigation }) {
  const [user] = useState({
    name: 'Alex Johnson',
    age: 28,
    location: 'New York, USA',
    bio: 'Adventure seeker and coffee lover. Looking for someone to explore the world with!',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?ixlib=rb-4.0.3&auto=format&fit=crop&w=663&q=80',
      'https://images.unsplash.com/photo-1546820389-44d77e1f3b31?ixlib=rb-4.0.3&auto=format&fit=crop&w=764&q=80'
    ],
    interests: ['Travel', 'Hiking', 'Photography', 'Coffee', 'Music', 'Reading'],
    verified: true,
    premium: false
  });

  const [settings, setSettings] = useState({
    notifications: true,
    showDistance: true,
    darkMode: false,
    showOnlineStatus: true
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');

  const toggleSetting = (setting) => {
    setSettings({...settings, [setting]: !settings[setting]});
  };

  const handleEdit = (field, value) => {
    // setEditField(field);
    // setEditValue(value);
    // setEditModalVisible(true);
   navigation.navigate('ProfileUpdateScreen')
  };

  const saveEdit = () => {
    // In a real app, you would update the user profile here
    setEditModalVisible(false);
    alert(`${editField} updated to: ${editValue}`);
  };

  const handleUpgrade = () => {
    // Navigation to premium screen or payment
    alert('Redirect to premium upgrade screen');
  };

  const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout failed:', error.message);
    Alert.alert('Error', 'Failed to log out. Please try again.');
  } else {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  }
};

useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user) throw new Error('User not authenticated');

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        if (profile) {
            console.log(profile,"profile");
            
          // setName(profile.full_name || '');
          // setBio(profile.bio || '');
          // setAge(profile.age || '');
          // setGender(profile.gender || '');
          // setLocation(profile.location || '');
          // setOccupation(profile.occupation || '');
          // setEducation(profile.education || '');
          // setInterests(profile.interests || '');
          // setLookingFor(profile.looking_for || '');
          // setExtraImages(profile.extra_images ? profile.extra_images.split(',') : []);
        }
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);






  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <MaterialIcons name="arrow-back" size={24} color="#FF5A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => handleEdit('profile', '')}>
          <MaterialIcons name="edit" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image 
              source={{ uri: user.photos[0] }} 
              style={styles.profileImage} 
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{user.name}, {user.age}</Text>
                {user.verified && (
                  <MaterialIcons name="verified" size={20} color="#4A90E2" style={styles.verifiedIcon} />
                )}
              </View>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color="#FF5A5F" />
                <Text style={styles.location}>{user.location}</Text>
              </View>
              {!user.premium && (
                <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                  <MaterialCommunityIcons name="crown" size={16} color="#FFD700" />
                  <Text style={styles.upgradeText}>Upgrade to Premium</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <Text style={styles.bio}>{user.bio}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>128</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>89%</Text>
              <Text style={styles.statLabel}>Response</Text>
            </View>
          </View>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Photos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProfileUpdateScreen')}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {user.photos.map((photo, index) => (
              <TouchableOpacity key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photo} />
                {index === 0 && <Text style={styles.photoBadge}>Main</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addPhoto}>
              <MaterialIcons name="add" size={30} color="#FF5A5F" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Interests</Text>
            <TouchableOpacity onPress={() => handleEdit('ProfileUpdateScreen', user.interests.join(', '))}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.interestsContainer}>
            {user.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ProfileUpdateScreen')}>
            <MaterialIcons name="person" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('PrivacySettings')}>
            <MaterialIcons name="privacy-tip" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Privacy Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('NotificationSettings')}>
            <MaterialIcons name="notifications" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Notifications</Text>
            <View style={styles.switchContainer}>
              <Switch
                value={settings.notifications}
                onValueChange={() => toggleSetting('notifications')}
                trackColor={{ false: "#767577", true: "#FF5A5F" }}
              />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('AppSettings')}>
            <Ionicons name="settings" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>App Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('HelpCenter')}>
            <MaterialIcons name="help" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Help Center</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ContactSupport')}>
            <MaterialIcons name="contact-support" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Contact Support</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('SafetyTips')}>
            <MaterialIcons name="security" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Safety Tips</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        {/* Delete Account */}
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editField}</Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              multiline={editField === 'bio'}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                <Text style={styles.saveText}>Save Changes</Text>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF5A5F',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  verifiedIcon: {
    marginLeft: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    color: '#888',
    marginLeft: 5,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  upgradeText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  bio: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editLink: {
    color: '#FF5A5F',
    fontSize: 16,
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoItem: {
    marginRight: 10,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: '#FF5A5F',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
  addPhoto: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF5A5F',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#FF5A5F20',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#FF5A5F',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#555',
    marginLeft: 15,
  },
  switchContainer: {
    marginRight: 5,
  },
  logoutButton: {
    backgroundColor: '#fff',
    padding: 18,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FF5A5F',
  },
  logoutText: {
    color: '#FF5A5F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#fff',
    padding: 18,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  deleteText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#FF5A5F',
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 20,
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});