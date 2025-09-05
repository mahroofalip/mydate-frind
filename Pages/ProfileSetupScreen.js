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
  Dimensions,
  Modal,
  FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function ProfileSetupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [education, setEducation] = useState('');
  const [interests, setInterests] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [extraImages, setExtraImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showOccupationModal, setShowOccupationModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showLookingForModal, setShowLookingForModal] = useState(false);
  const scrollViewRef = useRef();

  // Available options
  const interestOptions = [
    'Travel', 'Music', 'Sports', 'Art', 'Food', 'Technology',
    'Fashion', 'Reading', 'Movies', 'Gaming', 'Fitness', 'Photography',
    'Cooking', 'Dancing', 'Hiking', 'Yoga', 'Meditation', 'Painting',
    'Writing', 'Shopping', 'Animals', 'Nature', 'Cars', 'Science'
  ];

  const occupationOptions = ['Student','Engineer','Artist','Designer','Developer','Healthcare','Educator','Entrepreneur','Other'];
  const educationOptions = ['High School',"Bachelor's","Master's",'PhD','Other'];
  const lookingForOptions = ['Marriage','Friends','Dating','Networking','Activity Partners'];
  const genderOptions = ['Male','Female'];

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!profilePic) newErrors.profilePic = 'Profile Image is required';
    if (!age) newErrors.age = 'Age is required';
    if (age && (parseInt(age) < 18 || parseInt(age) > 100))
      newErrors.age = 'Age must be between 18-100';
    if (!gender) newErrors.gender = 'Please select gender';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!lookingFor) newErrors.lookingFor = 'Please select what you\'re looking for';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelection = async (forSelfie = false) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1,2],
        quality: 0.7,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        if (forSelfie) setProfilePic(uri);
        else if (extraImages.length < 4) setExtraImages([...extraImages, uri]);
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const removeExtraImage = (index) => {
    const newImages = [...extraImages];
    newImages.splice(index, 1);
    setExtraImages(newImages);
  };

  const toggleInterest = (interest) => {
    const interestArray = interests.split(',').filter(i => i.trim() !== '');
    if (interestArray.includes(interest)) {
      setInterests(interestArray.filter(i => i !== interest).join(','));
    } else {
      setInterests([...interestArray, interest].join(','));
    }
  };

  const isInterestSelected = (interest) => interests.split(',').map(i => i.trim()).includes(interest);

  const uploadImage = async (fileUri, fileName) => {
    try {
      const base64Data = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
      const buffer = Buffer.from(base64Data, 'base64');
      const uintArray = new Uint8Array(buffer);

      const { error } = await supabase.storage.from('profile-photos').upload(fileName, uintArray, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '3600',
      });

      if (error) throw error;

      const { data } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      throw new Error('Image upload failed. Please try again.');
    }
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) { Alert.alert('Error','User not authenticated'); return; }

      let selfieUrl = '';
      if (profilePic) {
        const fileExt = profilePic.split('.').pop() || 'jpg';
        selfieUrl = await uploadImage(profilePic, `${user.id}/selfie_${Date.now()}.${fileExt}`);
      }

      const uploadedExtraUrls = [];
      for (let i=0;i<extraImages.length;i++){
        const uri = extraImages[i];
        const fileExt = uri.split('.').pop() || 'jpg';
        const url = await uploadImage(uri, `${user.id}/extra_${Date.now()}_${i}.${fileExt}`);
        uploadedExtraUrls.push(url);
      }

      if (!selfieUrl) { Alert.alert('Error','Profile image upload failed'); return; }

      const payload = {
        id: user.id,
        full_name: name,
        bio,
        age,
        gender,
        location,
        occupation,
        education,
        interests: interests.split(',').map(i=>i.trim()).join(','),
        looking_for: lookingFor.split(',').map(i=>i.trim()).join(','),
        selfie_url: selfieUrl,
        extra_images: uploadedExtraUrls.join(','),
      };

      const { error } = await supabase.from('profiles').insert([payload]);
      if (error) throw error;
      navigation.replace('MainTabs');

    } catch(err) {
      Alert.alert('Upload Error', err.message || 'Failed to upload images');
    } finally { setLoading(false); }
  };

  // Reusable single-select modal
  const renderDropdownModal = (visible, setVisible, options, value, setValue, title) => (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={()=>setVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={()=>setVisible(false)} style={styles.closeButton}>
              <Feather name="x" size={24} color="#374151"/>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item)=>item}
            renderItem={({item})=>(
              <TouchableOpacity style={[styles.interestOption, value===item && styles.interestOptionSelected]} onPress={()=>{setValue(item); setVisible(false);}}>
                <Text style={[styles.interestOptionText, value===item && styles.interestOptionTextSelected]}>{item}</Text>
                {value===item && <Feather name="check" size={18} color="#6366F1"/>}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // UI rendering sections (photo, personal info, professional info, interests) remain mostly unchanged
  // Only dropdowns replaced with modal buttons + renderDropdownModal

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#6366F1"/>
      </TouchableOpacity>
      <Text style={styles.title}>Create Your Profile</Text>
      <Text style={styles.subtitle}>Complete your profile to get started</Text>
    </View>
  );

  const renderPhotoSection = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="photo-camera" size={20} color="#6366F1"/>
        <Text style={styles.sectionTitle}>Profile Photos</Text>
      </View>
      <View style={styles.photoSection}>
        <Text style={styles.label}>Upload A Profile</Text>
        <TouchableOpacity onPress={()=>handleImageSelection(true)} style={styles.avatarWrapper}>
          {profilePic ? <Image source={{uri:profilePic}} style={styles.avatar}/> :
            <View style={[styles.avatarPlaceholder, errors.profilePic && styles.errorBorder]}>
              <Feather name="camera" size={32} color="#9CA3AF"/>
              <Text style={styles.placeholderText}>Tap to take</Text>
            </View>
          }
        </TouchableOpacity>
        {errors.profilePic && <Text style={styles.errorText}>{errors.profilePic}</Text>}

        <Text style={styles.label}>Additional Photos (up to 4)</Text>
        <View style={styles.photosWrapper}>
          {extraImages.map((img,i)=>(
            <View key={i} style={styles.photoContainer}>
              <Image source={{uri:img}} style={styles.photo}/>
              <TouchableOpacity style={styles.removePhoto} onPress={()=>removeExtraImage(i)}>
                <Feather name="x" size={16} color="white"/>
              </TouchableOpacity>
            </View>
          ))}
          {extraImages.length<4 && (
            <TouchableOpacity onPress={()=>handleImageSelection(false)} style={styles.addPhoto}>
              <Feather name="plus" size={28} color="#9CA3AF"/>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Feather name="user" size={20} color="#6366F1"/>
        <Text style={styles.sectionTitle}>Personal Information</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput style={[styles.input, errors.name && styles.errorInput]} placeholder="John Doe" value={name} onChangeText={setName} maxLength={50}/>
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput style={[styles.input, styles.bioInput]} placeholder="Tell others about yourself..." value={bio} onChangeText={setBio} multiline maxLength={250}/>
        <Text style={styles.charCount}>{bio.length}/250</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer,{flex:1,marginRight:10}]}>
          <Text style={styles.inputLabel}>Age</Text>
          <TextInput style={[styles.input, errors.age && styles.errorInput]} placeholder="25" keyboardType="numeric" value={age} onChangeText={text=>setAge(text.replace(/[^0-9]/g,''))} maxLength={3}/>
          {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
        </View>

        <View style={[styles.inputContainer,{flex:1}]}>
          <Text style={styles.inputLabel}>Gender</Text>
          <TouchableOpacity style={[styles.interestsButton, errors.gender && styles.errorBorder]} onPress={()=>setShowGenderModal(true)}>
            <Text style={styles.interestsButtonText}>{gender || 'Select gender'}</Text>
            <Feather name="chevron-down" size={20} color="#9CA3AF"/>
          </TouchableOpacity>
          {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          {renderDropdownModal(showGenderModal, setShowGenderModal, genderOptions, gender, setGender, 'Select Gender')}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Location</Text>
        <TextInput style={[styles.input, errors.location && styles.errorInput]} placeholder="City, Country" value={location} onChangeText={setLocation}/>
        {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
      </View>
    </View>
  );

  const renderProfessionalInfo = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Feather name="briefcase" size={20} color="#6366F1"/>
        <Text style={styles.sectionTitle}>Professional Information</Text>
      </View>

      {/* Occupation */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Occupation</Text>
        <TouchableOpacity style={styles.interestsButton} onPress={()=>setShowOccupationModal(true)}>
          <Text style={styles.interestsButtonText}>{occupation || 'Select occupation'}</Text>
          <Feather name="chevron-down" size={20} color="#9CA3AF"/>
        </TouchableOpacity>
        {renderDropdownModal(showOccupationModal, setShowOccupationModal, occupationOptions, occupation, setOccupation, 'Select Occupation')}
      </View>

      {/* Education */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Education</Text>
        <TouchableOpacity style={styles.interestsButton} onPress={()=>setShowEducationModal(true)}>
          <Text style={styles.interestsButtonText}>{education || 'Select education'}</Text>
          <Feather name="chevron-down" size={20} color="#9CA3AF"/>
        </TouchableOpacity>
        {renderDropdownModal(showEducationModal, setShowEducationModal, educationOptions, education, setEducation, 'Select Education')}
      </View>
    </View>
  );

  const renderInterests = () => {
    const selectedInterests = interests.split(',').filter(i=>i.trim()!=='');
    return (
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="heart" size={20} color="#6366F1"/>
          <Text style={styles.sectionTitle}>Interests & Preferences</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Interests</Text>
          <TouchableOpacity style={styles.interestsButton} onPress={()=>setShowInterestsModal(true)}>
            <Text style={styles.interestsButtonText}>
              {selectedInterests.length>0?`${selectedInterests.length} interests selected`:'Select your interests'}
            </Text>
            <Feather name="chevron-down" size={20} color="#9CA3AF"/>
          </TouchableOpacity>

          {selectedInterests.length>0 && (
            <View style={styles.selectedInterestsContainer}>
              {selectedInterests.map((i,idx)=>(
                <View key={idx} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>{i}</Text>
                  <TouchableOpacity onPress={()=>toggleInterest(i)} style={styles.removeInterestButton}>
                    <Feather name="x" size={14} color="#6366F1"/>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Looking For */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Looking For</Text>
          <TouchableOpacity style={[styles.interestsButton, errors.lookingFor && styles.errorBorder]} onPress={()=>setShowLookingForModal(true)}>
            <Text style={styles.interestsButtonText}>{lookingFor || 'Select what you seek'}</Text>
            <Feather name="chevron-down" size={20} color="#9CA3AF"/>
          </TouchableOpacity>
          {errors.lookingFor && <Text style={styles.errorText}>{errors.lookingFor}</Text>}
          {renderDropdownModal(showLookingForModal, setShowLookingForModal, lookingForOptions, lookingFor, setLookingFor, 'Select What You Are Looking For')}
        </View>

        {/* Interests Modal (multi-select) */}
        <Modal visible={showInterestsModal} animationType="slide" transparent={true} onRequestClose={()=>setShowInterestsModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Your Interests</Text>
                <TouchableOpacity onPress={()=>setShowInterestsModal(false)} style={styles.closeButton}>
                  <Feather name="x" size={24} color="#374151"/>
                </TouchableOpacity>
              </View>
              <FlatList
                data={interestOptions}
                keyExtractor={(item)=>item}
                renderItem={({item})=>(
                  <TouchableOpacity style={[styles.interestOption, isInterestSelected(item)&&styles.interestOptionSelected]} onPress={()=>toggleInterest(item)}>
                    <Text style={[styles.interestOptionText, isInterestSelected(item)&&styles.interestOptionTextSelected]}>{item}</Text>
                    {isInterestSelected(item)&&<Feather name="check" size={18} color="#6366F1"/>}
                  </TouchableOpacity>
                )}
                numColumns={2}
                contentContainerStyle={styles.interestsGrid}
              />
              <TouchableOpacity style={styles.doneButton} onPress={()=>setShowInterestsModal(false)}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderSubmitButton = () => (
    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleNext} disabled={loading}>
      {loading? <ActivityIndicator size="small" color="white"/> : <Text style={styles.buttonText}>Complete Profile</Text>}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderPhotoSection()}
        {renderPersonalInfo()}
        {renderProfessionalInfo()}
        {renderInterests()}
        {renderSubmitButton()}
        <View style={styles.spacer}/>
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
  interestsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  interestsButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  selectedInterestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestTagText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  removeInterestButton: {
    padding: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  interestsGrid: {
    paddingBottom: 20,
  },
  interestOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    margin: 6,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  interestOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  interestOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  interestOptionTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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