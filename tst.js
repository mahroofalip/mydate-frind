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
  // ... existing state declarations ...

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.subtitle}>Complete your profile to get started</Text>
      </View>

      {/* Photos Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile Photos</Text>
        
        <Text style={styles.label}>Main Selfie</Text>
        <TouchableOpacity onPress={takeSelfie} style={styles.avatarWrapper}>
          {selfie ? (
            <Image source={{ uri: selfie }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.placeholderText}>Tap to take</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Additional Photos (up to 4)</Text>
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
      </View>

      {/* Personal Info Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="John Doe" 
            value={name} 
            onChangeText={setName} 
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput 
            style={[styles.input, styles.bioInput]} 
            placeholder="Describe yourself..." 
            value={bio} 
            onChangeText={setBio}
            multiline
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="25"
              keyboardType="numeric"
              value={age}
              onChangeText={handleAgeChange}
            />
          </View>

          <View style={[styles.inputContainer, { flex: 2 }]}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.pickerWrapper}>
              <RNPickerSelect
                onValueChange={setGender}
                value={gender}
                style={pickerSelectStyles}
                placeholder={{ label: 'Select gender', value: null }}
                items={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Non-binary', value: 'Non-binary' },
                  { label: 'Other', value: 'Other' },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="City, Country"
            value={location}
            onChangeText={setLocation}
          />
        </View>
      </View>

      {/* Professional Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
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
              ]}
            />
          </View>
        </View>
      </View>

      {/* Interests Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Interests & Preferences</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Interests</Text>
          <TextInput
            style={styles.input}
            placeholder="Travel, Music, Sports..."
            value={interests}
            onChangeText={setInterests}
          />
          <Text style={styles.hintText}>Separate with commas</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Looking For</Text>
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              onValueChange={setLookingFor}
              value={lookingFor}
              style={pickerSelectStyles}
              placeholder={{ label: 'Select what you seek', value: null }}
              items={[
                { label: 'Friends', value: 'Friends' },
                { label: 'Dating', value: 'Dating' },
                { label: 'Networking', value: 'Networking' },
              ]}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Complete Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 100,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  photosWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  addPhoto: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 28,
    color: '#9CA3AF',
  },
  inputContainer: {
    marginBottom: 16,
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
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
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