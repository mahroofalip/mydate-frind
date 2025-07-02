// screens/ProfileSetupScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ProfileSetupScreen({ navigation }) {
  // State variables
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [education, setEducation] = useState('');
  const [interests, setInterests] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [selfie, setSelfie] = useState(null);
  const [extraImages, setExtraImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const scrollViewRef = useRef();

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!selfie) newErrors.selfie = 'Selfie is required';
    if (!age) newErrors.age = 'Age is required';
    if (age && (parseInt(age) < 18 || parseInt(age) > 100)) 
      newErrors.age = 'Age must be between 18-100';
    if (!gender) newErrors.gender = 'Please select gender';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!lookingFor) newErrors.lookingFor = 'Please select what you\'re looking for';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image selection
  const handleImageSelection = async (isCamera) => {
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };

    try {
      const result = isCamera 
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        
        if (!selfie) {
          setSelfie(uri);
        } else if (extraImages.length < 4) {
          setExtraImages([...extraImages, uri]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Remove extra image
  const removeExtraImage = (index) => {
    const newImages = [...extraImages];
    newImages.splice(index, 1);
    setExtraImages(newImages);
  };

  // Handle form submission
  const handleNext = async () => {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) return alert('Not signed in');

    
    
  const payload = {
    id: user.id,
    full_name: name,
    bio,
    birthdate: age,
    gender,
    location,
    occupation,
    education,
    interests: interests.split(',').map(i => i.trim()).join(','),
    looking_for: lookingFor,
    selfie_url,
    extra_images: extraImages.join(',')
  };

  const { error } = await supabase.from('profiles').insert([payload]);
  if (error) alert(error.message);
  else navigation.replace('MainTabs');

};
  // Form sections
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#6366F1" />
      </TouchableOpacity>
      <Text style={styles.title}>Create Your Profile</Text>
      <Text style={styles.subtitle}>Complete your profile to get started</Text>
    </View>
  );

  const renderPhotoSection = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="photo-camera" size={20} color="#6366F1" />
        <Text style={styles.sectionTitle}>Profile Photos</Text>
      </View>
      
      <View style={styles.photoSection}>
        <Text style={styles.label}>Verify With Selfie</Text>
        <TouchableOpacity 
          onPress={() => handleImageSelection(true)} 
          style={styles.avatarWrapper}
        >
          {selfie ? (
            <Image source={{ uri: selfie }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, errors.selfie && styles.errorBorder]}>
              <Feather name="camera" size={32} color="#9CA3AF" />
              <Text style={styles.placeholderText}>Tap to take</Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.selfie && <Text style={styles.errorText}>{errors.selfie}</Text>}

        <Text style={styles.label}>Additional Photos (up to 4)</Text>
        <View style={styles.photosWrapper}>
          {extraImages.map((img, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: img }} style={styles.photo} />
              <TouchableOpacity 
                style={styles.removePhoto}
                onPress={() => removeExtraImage(index)}
              >
                <Feather name="x" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
          {extraImages.length < 4 && (
            <TouchableOpacity 
              onPress={() => handleImageSelection(false)} 
              style={styles.addPhoto}
            >
              <Feather name="plus" size={28} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Feather name="user" size={20} color="#6366F1" />
        <Text style={styles.sectionTitle}>Personal Information</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput 
          style={[styles.input, errors.name && styles.errorInput]} 
          placeholder="John Doe" 
          value={name} 
          onChangeText={setName}
          maxLength={50}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput 
          style={[styles.input, styles.bioInput]} 
          placeholder="Tell others about yourself..." 
          value={bio} 
          onChangeText={setBio}
          multiline
          maxLength={250}
        />
        <Text style={styles.charCount}>{bio.length}/250</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.inputLabel}>Age</Text>
          <TextInput
            style={[styles.input, errors.age && styles.errorInput]}
            placeholder="25"
            keyboardType="numeric"
            value={age}
            onChangeText={text => setAge(text.replace(/[^0-9]/g, ''))}
            maxLength={3}
          />
          {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
        </View>

        <View style={[styles.inputContainer, { flex: 2 }]}>
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={[styles.pickerWrapper, errors.gender && styles.errorBorder]}>
            <RNPickerSelect
              onValueChange={setGender}
              value={gender}
              style={pickerSelectStyles}
              placeholder={{ label: 'Select gender', value: null }}
              items={[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
                { label: 'Non-binary', value: 'Non-binary' },
                { label: 'Prefer not to say', value: 'Prefer not to say' },
              ]}
            />
          </View>
          {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Location</Text>
        <TextInput
          style={[styles.input, errors.location && styles.errorInput]}
          placeholder="City, Country"
          value={location}
          onChangeText={setLocation}
        />
        {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
      </View>
    </View>
  );

  const renderProfessionalInfo = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Feather name="briefcase" size={20} color="#6366F1" />
        <Text style={styles.sectionTitle}>Professional Information</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Occupation</Text>
        <View style={styles.pickerWrapper}>
          <RNPickerSelect
            onValueChange={setOccupation}
            value={occupation}
            style={pickerSelectStyles}
            placeholder={{ label: 'Select occupation', value: null }}
            items={[
              { label: 'Student', value: 'Student' },
              { label: 'Engineer', value: 'Engineer' },
              { label: 'Artist', value: 'Artist' },
              { label: 'Designer', value: 'Designer' },
              { label: 'Developer', value: 'Developer' },
              { label: 'Healthcare', value: 'Healthcare' },
              { label: 'Educator', value: 'Educator' },
              { label: 'Entrepreneur', value: 'Entrepreneur' },
              { label: 'Other', value: 'Other' },
            ]}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Education</Text>
        <View style={styles.pickerWrapper}>
          <RNPickerSelect
            onValueChange={setEducation}
            value={education}
            style={pickerSelectStyles}
            placeholder={{ label: 'Select education', value: null }}
            items={[
              { label: 'High School', value: 'High School' },
              { label: "Bachelor's Degree", value: "Bachelor's" },
              { label: "Master's Degree", value: "Master's" },
              { label: 'PhD', value: 'PhD' },
              { label: 'Other', value: 'Other' },
            ]}
          />
        </View>
      </View>
    </View>
  );

  const renderInterests = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Feather name="heart" size={20} color="#6366F1" />
        <Text style={styles.sectionTitle}>Interests & Preferences</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Interests</Text>
        <TextInput
          style={styles.input}
          placeholder="Travel, Music, Sports, Art..."
          value={interests}
          onChangeText={setInterests}
        />
        <Text style={styles.hintText}>Separate with commas</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Looking For</Text>
        <View style={[styles.pickerWrapper, errors.lookingFor && styles.errorBorder]}>
          <RNPickerSelect
            onValueChange={setLookingFor}
            value={lookingFor}
            style={pickerSelectStyles}
            placeholder={{ label: 'Select what you seek', value: null }}
            items={[
              { label: 'Friends', value: 'Friends' },
              { label: 'Dating', value: 'Dating' },
              { label: 'Networking', value: 'Networking' },
              { label: 'Activity Partners', value: 'Activity Partners' },
            ]}
          />
        </View>
        {errors.lookingFor && <Text style={styles.errorText}>{errors.lookingFor}</Text>}
      </View>
    </View>
  );

  const renderSubmitButton = () => (
    <TouchableOpacity 
      style={[styles.button, loading && styles.buttonDisabled]} 
      onPress={handleNext}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Text style={styles.buttonText}>Complete Profile</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderPhotoSection()}
        {renderPersonalInfo()}
        {renderProfessionalInfo()}
        {renderInterests()}
        {renderSubmitButton()}
        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    paddingTop: 10,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#374151',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  photoSection: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#E0E7FF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  photosWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: (width - 80) / 4,
    height: (width - 80) / 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhoto: {
    width: (width - 80) / 4,
    height: (width - 80) / 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorInput: {
    borderColor: '#EF4444',
  },
  errorBorder: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    justifyContent: 'center',
    height: 52,
  },
  button: {
    backgroundColor: '#6366F1',
    padding: 18,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  buttonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    marginLeft: 4,
  },
  spacer: {
    height: 20,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  inputAndroid: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  placeholder: {
    color: '#9CA3AF',
  },
});