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
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [interests, setInterests] = useState([]);
  const [extraImages, setExtraImages] = useState([]);
  const [profileUrl, setProfileUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    notifications: true,
    showDistance: true,
    darkMode: false,
    showOnlineStatus: true,
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');

  const toggleSetting = (setting) => {
    setSettings({ ...settings, [setting]: !settings[setting] });
  };

  const handleEdit = () => {
    navigation.navigate('ProfileUpdateScreen');
  };

  const saveEdit = () => {
    setEditModalVisible(false);
    alert(`${editField} updated to: ${editValue}`);
  };

  const handleUpgrade = () => {
    alert('Redirect to premium upgrade screen');
  };

  const handleLogout = async () => {
    try {
      // Get current user before signing out
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Update logout time in profiles table
        await supabase
          .from('profiles')
          .update({
            last_logout_at: new Date().toISOString(),
            session_expires_at: null  // Clear session expiration
          })
          .eq('id', user.id);
      }

      // Now sign out from auth
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout failed:', error.message);
        Alert.alert('Error', 'Failed to log out. Please try again.');
      } else {
        // Clear any stored user data
        await AsyncStorage.removeItem('@user');

        // Navigate to welcome screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Error', 'An unexpected error occurred during logout');
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

          setName(profile.full_name || '');
          setBio(profile.bio || '');
          setAge(profile.age || '');
          setGender(profile.gender || '');
          setLocation(profile.location || '');
          setOccupation(profile.occupation || '');
          setEducation(profile.education || '');
          setInterests(profile.interests ? profile.interests.split(',') : []);
          setLookingFor(profile.looking_for || '');
          setExtraImages(profile.extra_images ? profile.extra_images.split(',') : []);
          setProfileUrl(profile.extra_images ? profile.selfie_url : null);
        }
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <MaterialIcons name="arrow-back" size={24} color="#FF5A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleEdit}>
          <MaterialIcons name="edit" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: profileUrl || 'https://via.placeholder.com/150' }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{name}, {age}</Text>
              </View>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color="#FF5A5F" />
                <Text style={styles.location}>{location}</Text>
              </View>
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                <MaterialCommunityIcons name="crown" size={16} color="#FFD700" />
                <Text style={styles.upgradeText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.bio}>{bio}</Text>

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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Photos</Text>
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {extraImages.map((photo, index) => (
              <TouchableOpacity key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photo} />
                {/* {index === 0 && <Text style={styles.photoBadge}>Main</Text>} */}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={handleEdit} style={styles.addPhoto}>
              <MaterialIcons name="add" size={30} color="#FF5A5F" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Interests</Text>
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.interestsContainer}>
            {interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest.trim()}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleEdit}>
            <MaterialIcons name="person" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('PrivacySettings')}>
            <MaterialIcons name="privacy-tip" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Privacy Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
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

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
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