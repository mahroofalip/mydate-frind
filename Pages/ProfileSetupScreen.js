// screens/ProfileSetupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';

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
  const [selfie, setSelfie] = useState(null);
  const [extraImages, setExtraImages] = useState([]);

  const takeSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setSelfie(result.assets[0].uri);
    }
  };

  const pickExtraImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && extraImages.length < 4) {
      setExtraImages([...extraImages, result.assets[0].uri]);
    }
  };

  const handleAgeChange = (text) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setAge(numeric);
  };

  const handleNext = () => {
    // if (!selfie) {
    //   alert('Please take a selfie to continue.');
    //   return;
    // }

    const profileData = {
      name,
      bio,
      age,
      gender,
      location,
      occupation,
      education,
      interests: interests.split(',').map((i) => i.trim()),
      lookingFor,
      selfie,
      extraImages,
    };

    // TODO: Save profileData to backend or context
    navigation.navigate('MainTabs');
    
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Your Profile</Text>

      <Text style={styles.label}>Take a Selfie</Text>
      <TouchableOpacity onPress={takeSelfie} style={styles.avatarWrapper}>
        {selfie ? (
          <Image source={{ uri: selfie }} style={styles.avatar} />
        ) : (
          <Text style={styles.avatarPlaceholder}>📷</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Add Up to 4 Photos</Text>
      <View style={styles.photosWrapper}>
        {extraImages.map((img, index) => (
          <Image key={index} source={{ uri: img }} style={styles.photo} />
        ))}
        {extraImages.length < 4 && (
          <TouchableOpacity onPress={pickExtraImage} style={styles.addPhoto}>
            <Text style={styles.addPhotoText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Bio" value={bio} onChangeText={setBio} />
      <TextInput
        style={styles.input}
        placeholder="Age"
        keyboardType="numeric"
        value={age}
        onChangeText={handleAgeChange}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.input}>
        <RNPickerSelect
          onValueChange={setGender}
          value={gender}
          style={pickerSelectStyles}
          placeholder={{ label: 'Select your gender', value: null }}
          items={[
            { label: 'Male', value: 'Male' },
            { label: 'Female', value: 'Female' },
            { label: 'Non-binary', value: 'Non-binary' },
            { label: 'Other', value: 'Other' },
          ]}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Location (City, Country)"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.label}>Occupation</Text>
      <View style={styles.input}>
        <RNPickerSelect
          onValueChange={setOccupation}
          value={occupation}
          style={pickerSelectStyles}
          placeholder={{ label: 'Select your occupation', value: null }}
          items={[
            { label: 'Student', value: 'Student' },
            { label: 'Engineer', value: 'Engineer' },
            { label: 'Artist', value: 'Artist' },
            { label: 'Other', value: 'Other' },
          ]}
        />
      </View>

      <Text style={styles.label}>Education</Text>
      <View style={styles.input}>
        <RNPickerSelect
          onValueChange={setEducation}
          value={education}
          style={pickerSelectStyles}
          placeholder={{ label: 'Select your education', value: null }}
          items={[
            { label: 'High School', value: 'High School' },
            { label: "Bachelor's Degree", value: "Bachelor's" },
            { label: "Master's Degree", value: "Master's" },
            { label: 'PhD', value: 'PhD' },
          ]}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Interests (comma separated)"
        value={interests}
        onChangeText={setInterests}
      />

      <Text style={styles.label}>Looking For</Text>
      <View style={styles.input}>
        <RNPickerSelect
          onValueChange={setLookingFor}
          value={lookingFor}
          style={pickerSelectStyles}
          placeholder={{ label: 'What are you looking for?', value: null }}
          items={[
            { label: 'Friends', value: 'Friends' },
            { label: 'Dating', value: 'Dating' },
            { label: 'Networking', value: 'Networking' },
          ]}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#f1f1f1',
    borderRadius: 100,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  avatarPlaceholder: {
    color: '#666',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f4f4f4',
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  photosWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  addPhoto: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 28,
    color: '#555',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  inputAndroid: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
};
