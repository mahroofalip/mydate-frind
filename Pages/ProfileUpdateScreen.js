import "react-native-get-random-values"; // Must be first import
import React, { useState, useEffect, useRef } from "react";
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
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { MaterialIcons, Feather, Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");

export default function ProfileUpdateScreen({ navigation }) {
  // State variables
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [education, setEducation] = useState("");
  const [interests, setInterests] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [extraImages, setExtraImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState({});
  const [locationCoords, setLocationCoords] = useState(null);

  // Modal states
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showOccupationModal, setShowOccupationModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showLookingForModal, setShowLookingForModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Autocomplete states
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");

  const scrollViewRef = useRef();

  // Available options
  const interestOptions = [
    "Travel", "Music", "Sports", "Art", "Food", "Technology", "Fashion", 
    "Reading", "Movies", "Gaming", "Fitness", "Photography", "Cooking", 
    "Dancing", "Hiking", "Yoga", "Meditation", "Painting", "Writing", 
    "Shopping", "Animals", "Nature", "Cars", "Science"
  ];

  const occupationOptions = [
    "Student", "Engineer", "Artist", "Designer", "Developer", "Healthcare", 
    "Educator", "Entrepreneur", "Other"
  ];
  
  const educationOptions = [
    "High School", "Bachelor's", "Master's", "PhD", "Other"
  ];
  
  const lookingForOptions = [
    "Marriage", "Friends", "Dating", "Networking", "Activity Partners"
  ];
  
  const genderOptions = ["Male", "Female", "Other"];

  // Google API Key (replace with your actual key)
  const GOOGLE_API_KEY = "AIzaSyAgDCvBLA8cfDXKVPKtVaL_eeoqw3xFjQo";

  // Fetch autocomplete suggestions
  const fetchAutocompleteSuggestions = async (input) => {
    if (!input || input.length < 3) {
      setAutocompleteResults([]);
      return;
    }

    setAutocompleteLoading(true);
    try {
      const encodedInput = encodeURIComponent(input);
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedInput}&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "OK") {
        setAutocompleteResults(data.predictions);
      } else {
        setAutocompleteResults([]);
      }
    } catch (error) {
      // console.error("Autocomplete error:", error);
      setAutocompleteResults([]);
    } finally {
      setAutocompleteLoading(false);
    }
  };

  // Get place details from place_id
  const fetchPlaceDetails = async (placeId) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "OK" && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;
        setLocationCoords({
          latitude: lat,
          longitude: lng,
        });
        
        // Set the formatted address as location
        setLocation(data.result.formatted_address);
        
        // Clear error when location is selected
        if (errors.location) {
          setErrors({ ...errors, location: "" });
        }
      }
    } catch (error) {
      // console.error("Place details error:", error);
      Alert.alert("Error", "Failed to get location details");
    }
  };

  // Handle location search change
  const handleLocationSearchChange = (text) => {
    setLocationSearch(text);
    fetchAutocompleteSuggestions(text);
  };

  // Select a location from autocomplete
  const selectLocation = (place) => {
    setLocation(place.description);
    setShowLocationModal(false);
    fetchPlaceDetails(place.place_id);
  };

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user) throw new Error("User not authenticated");

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (profile) {
          setName(profile.full_name || "");
          setBio(profile.bio || "");
          setAge(profile.age ? String(profile.age) : "");
          setGender(profile.gender || "");
          setLocation(profile.location || "");
          setOccupation(profile.occupation || "");
          setEducation(profile.education || "");
          setInterests(profile.interests || "");
          setLookingFor(profile.looking_for || "");
          setProfilePic(profile.selfie_url || null);

          // Safely handle extra_images
          const images = profile.extra_images
            ? Array.isArray(profile.extra_images)
              ? profile.extra_images
              : (profile.extra_images || "")
                  .split(",")
                  .filter((img) => img && img.trim() !== "")
            : [];
          setExtraImages(images);

          // Set location coordinates if available
          if (profile.latitude && profile.longitude) {
            setLocationCoords({
              latitude: profile.latitude,
              longitude: profile.longitude,
            });
          }
        }
      } catch (err) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!profilePic) newErrors.profilePic = "Profile Image is required";
    if (!age) newErrors.age = "Age is required";
    if (age && (parseInt(age) < 18 || parseInt(age) > 100))
      newErrors.age = "Age must be between 18-100";
    if (!gender) newErrors.gender = "Please select gender";
    if (!location.trim()) newErrors.location = "Location is required";
    if (!locationCoords)
      newErrors.location = "Please select a valid location from suggestions";
    if (!lookingFor)
      newErrors.lookingFor = "Please select what you're looking for";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image selection
  const handleImageSelection = async (forSelfie = false) => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "We need access to your photos");
      return;
    }

    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };

    try {
      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;

        if (forSelfie) {
          setProfilePic(uri);
        } else if (extraImages.length < 4) {
          setExtraImages((prev) => [...prev, uri]);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  // Remove extra image
  const removeExtraImage = (index) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle interest selection
  const toggleInterest = (interest) => {
    const interestArray = interests
      ? interests.split(",").filter((i) => i && i.trim() !== "")
      : [];

    if (interestArray.includes(interest)) {
      setInterests(interestArray.filter((i) => i !== interest).join(","));
    } else {
      setInterests([...interestArray, interest].join(","));
    }
  };

  const isInterestSelected = (interest) => {
    if (!interests) return false;
    return interests
      .split(",")
      .map((i) => i.trim())
      .includes(interest);
  };

  // Fixed uploadImage function
  const uploadImage = async (fileUri, fileName) => {
    try {
      // Read file as base64 string
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert to Uint8Array
      const buffer = Buffer.from(base64Data, "base64");
      const uintArray = new Uint8Array(buffer);

      // Upload binary data
      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, uintArray, {
          contentType: "image/jpeg",
          upsert: true,
          cacheControl: "3600",
        });

      if (error) throw error;

      // Get public URL
      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      // console.error("Upload failed:", err);
      throw new Error("Image upload failed. Please try again.");
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setUpdating(true);

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // Handle profile picture upload
      let selfieUrl = profilePic;
      if (profilePic && !profilePic.startsWith("https://")) {
        const fileExt = profilePic.split(".").pop() || "jpg";
        const fileName = `${user.id}/selfie_${Date.now()}.${fileExt}`;
        selfieUrl = await uploadImage(profilePic, fileName);
      }

      // Handle extra images
      const uploadedExtraUrls = [];
      for (let i = 0; i < extraImages.length; i++) {
        const uri = extraImages[i];

        if (uri.startsWith("https://")) {
          // Already a URL, keep as is
          uploadedExtraUrls.push(uri);
        } else {
          // Upload new local image
          const fileExt = uri.split(".").pop() || "jpg";
          const fileName = `${user.id}/extra_${Date.now()}_${i}.${fileExt}`;
          const url = await uploadImage(uri, fileName);
          uploadedExtraUrls.push(url);
        }
      }

      if (!selfieUrl) {
        Alert.alert("Error", "Profile image upload failed");
        return;
      }

      // Update profile
      const payload = {
        full_name: name,
        bio,
        age: parseInt(age) || null,
        gender,
        location,
        latitude: locationCoords?.latitude,
        longitude: locationCoords?.longitude,
        occupation,
        education,
        interests: interests
          .split(",")
          .filter((i) => i && i.trim() !== "")
          .map((i) => i.trim())
          .join(","),
        looking_for: lookingFor,
        selfie_url: selfieUrl,
        extra_images: uploadedExtraUrls.join(","),
      };
          
          
      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (error) throw error;

      Alert.alert("Success", "Profile updated successfully!");
      navigation.navigate("MainTabs", { screen: "Home" });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  // Reusable single-select modal
  const renderDropdownModal = (
    visible,
    setVisible,
    options,
    value,
    setValue,
    title
  ) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  value === item && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setValue(item);
                  setVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    value === item && styles.modalOptionTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {value === item && (
                  <Feather name="check" size={18} color="#6366F1" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // Location modal
  const renderLocationModal = () => (
    <Modal
      visible={showLocationModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowLocationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search for your location</Text>
            <TouchableOpacity
              onPress={() => setShowLocationModal(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Start typing to search locations..."
              value={locationSearch}
              onChangeText={handleLocationSearchChange}
              autoFocus={true}
            />
            {autocompleteLoading && (
              <ActivityIndicator
                style={styles.searchLoader}
                size="small"
                color="#6366F1"
              />
            )}
          </View>
          
          <FlatList
            data={autocompleteResults}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => selectLocation(item)}
              >
                <Text style={styles.modalOptionText}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !autocompleteLoading && (
                <View style={styles.emptyState}>
                  <Feather name="map-pin" size={40} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>
                    {locationSearch.length < 3 
                      ? "Type at least 3 characters to search" 
                      : "No locations found"}
                  </Text>
                </View>
              )
            }
          />
        </View>
      </View>
    </Modal>
  );

  // Form sections
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.replace("ProfileScreen")}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#6366F1" />
      </TouchableOpacity>
      <Text style={styles.title}>Update Your Profile</Text>
      <Text style={styles.subtitle}>Keep your information up to date</Text>
    </View>
  );

  const renderPhotoSection = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="photo-library" size={20} color="#6366F1" />
        <Text style={styles.sectionTitle}>Profile Photos</Text>
      </View>

      <View style={styles.photoSection}>
        <Text style={styles.label}>Profile Picture</Text>
        <TouchableOpacity
          onPress={() => handleImageSelection(true)}
          style={styles.avatarWrapper}
        >
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                errors.profilePic && styles.errorBorder,
              ]}
            >
              <Feather name="camera" size={32} color="#9CA3AF" />
              <Text style={styles.placeholderText}>Tap to select</Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.profilePic && (
          <Text style={styles.errorText}>{errors.profilePic}</Text>
        )}

        <Text style={styles.label}>Additional Photos (up to 4)</Text>
        <View style={styles.photosWrapper}>
          {extraImages.map((img, index) => (
            <View
              key={`img-${index}-${Date.now()}`}
              style={styles.photoContainer}
            >
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
            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ""))}
            maxLength={3}
          />
          {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
        </View>

        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Gender</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              errors.gender && styles.errorBorder,
            ]}
            onPress={() => setShowGenderModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {gender || "Select gender"}
            </Text>
            <Feather name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          {errors.gender && (
            <Text style={styles.errorText}>{errors.gender}</Text>
          )}
          {renderDropdownModal(
            showGenderModal,
            setShowGenderModal,
            genderOptions,
            gender,
            setGender,
            "Select Gender"
          )}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Location</Text>
        <TouchableOpacity
          style={[
            styles.selectButton,
            errors.location && styles.errorBorder,
          ]}
          onPress={() => setShowLocationModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {location || "Search for your location"}
          </Text>
          <Feather name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        {errors.location && (
          <Text style={styles.errorText}>{errors.location}</Text>
        )}
        {renderLocationModal()}
      </View>
    </View>
  );

  const renderProfessionalInfo = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Feather name="briefcase" size={20} color="#6366F1" />
        <Text style={styles.sectionTitle}>Professional Information</Text>
      </View>

      {/* Occupation */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Occupation</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowOccupationModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {occupation || "Select occupation"}
          </Text>
          <Feather name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        {renderDropdownModal(
          showOccupationModal,
          setShowOccupationModal,
          occupationOptions,
          occupation,
          setOccupation,
          "Select Occupation"
        )}
      </View>

      {/* Education */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Education</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowEducationModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {education || "Select education"}
          </Text>
          <Feather name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        {renderDropdownModal(
          showEducationModal,
          setShowEducationModal,
          educationOptions,
          education,
          setEducation,
          "Select Education"
        )}
      </View>
    </View>
  );

  const renderInterests = () => {
    const selectedInterests = interests
      ? interests.split(",").filter((i) => i && i.trim() !== "")
      : [];

    return (
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="heart" size={20} color="#6366F1" />
          <Text style={styles.sectionTitle}>Interests & Preferences</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Interests</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowInterestsModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {selectedInterests.length > 0
                ? `${selectedInterests.length} interests selected`
                : "Select your interests"}
            </Text>
            <Feather name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {selectedInterests.length > 0 && (
            <View style={styles.selectedInterestsContainer}>
              {selectedInterests.map((i, idx) => (
                <View key={idx} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>{i}</Text>
                  <TouchableOpacity
                    onPress={() => toggleInterest(i)}
                    style={styles.removeInterestButton}
                  >
                    <Feather name="x" size={14} color="#6366F1" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Looking For */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Looking For</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              errors.lookingFor && styles.errorBorder,
            ]}
            onPress={() => setShowLookingForModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {lookingFor || "Select what you seek"}
            </Text>
            <Feather name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          {errors.lookingFor && (
            <Text style={styles.errorText}>{errors.lookingFor}</Text>
          )}
          {renderDropdownModal(
            showLookingForModal,
            setShowLookingForModal,
            lookingForOptions,
            lookingFor,
            setLookingFor,
            "Select What You Are Looking For"
          )}
        </View>

        {/* Interests Modal (multi-select) */}
        <Modal
          visible={showInterestsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInterestsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Your Interests</Text>
                <TouchableOpacity
                  onPress={() => setShowInterestsModal(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={interestOptions}
                keyExtractor={(item) => item}
                numColumns={2}
                contentContainerStyle={styles.interestsGrid}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.interestOption,
                      isInterestSelected(item) && styles.interestOptionSelected,
                    ]}
                    onPress={() => toggleInterest(item)}
                  >
                    <Text
                      style={[
                        styles.interestOptionText,
                        isInterestSelected(item) &&
                          styles.interestOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isInterestSelected(item) && (
                      <Feather name="check" size={18} color="#6366F1" />
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowInterestsModal(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderSubmitButton = () => (
    <TouchableOpacity
      style={[styles.button, updating && styles.buttonDisabled]}
      onPress={handleUpdate}
      disabled={updating}
    >
      {updating ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Text style={styles.buttonText}>Update Profile</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 20,
    color: "#6B7280",
    fontSize: 16,
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
    alignItems: "center",
    paddingTop: 10,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 10,
    padding: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#374151",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
  },
  photoSection: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  avatarWrapper: {
    alignSelf: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#E0E7FF",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  placeholderText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
  photosWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 10,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    width: (width - 80) / 4,
    height: (width - 80) / 4,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  removePhoto: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addPhoto: {
    width: (width - 80) / 4,
    height: (width - 80) / 4,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  inputContainer: {
    marginBottom: 20,
    position: "relative",
    zIndex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  errorInput: {
    borderColor: "#EF4444",
  },
  errorBorder: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  selectedInterestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  interestTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestTagText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  removeInterestButton: {
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalOptionSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  modalOptionTextSelected: {
    color: "#6366F1",
    fontWeight: "600",
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
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#6366F1",
    padding: 18,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#A5B4FC",
  },
  buttonText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  hintText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    marginLeft: 4,
  },
  spacer: {
    height: 20,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchLoader: {
    position: 'absolute',
    right: 10,
    top: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});