import React, { useEffect, useState } from "react";
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
} from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [education, setEducation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [gender, setGender] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [interests, setInterests] = useState([]);
  const [extraImages, setExtraImages] = useState([]);
  const [profileUrl, setProfileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [matchesCount, setMatchesCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [responseRate, setResponseRate] = useState(0);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [deletionTimeLeft, setDeletionTimeLeft] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState("");

  const [settings, setSettings] = useState({
    notifications: true,
    showDistance: true,
    darkMode: false,
    showOnlineStatus: true,
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState("");
  const [editValue, setEditValue] = useState("");

  const toggleSetting = (setting) => {
    setSettings({ ...settings, [setting]: !settings[setting] });
  };

  const handleEdit = () => {
    navigation.navigate("ProfileUpdateScreen");
  };

  const saveEdit = () => {
    setEditModalVisible(false);
    alert(`${editField} updated to: ${editValue}`);
  };

  const handleUpgrade = () => {
    navigation.navigate("Premium");
  };

  const handleLogout = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({
            last_logout_at: new Date().toISOString(),
            session_expires_at: null,
          })
          .eq("id", user.id);
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout failed:", error.message);
        Alert.alert("Error", "Failed to log out. Please try again.");
      } else {
        await AsyncStorage.removeItem("@user");
        navigation.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "An unexpected error occurred during logout");
    }
  };

  // Fetch user stats from database
  const fetchStats = async (userId) => {
    try {
      const { count: matches, error: matchesError } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .not("user1", "is", null) // ensure user1 is set
        .not("user2", "is", null) // ensure user2 is set
        .or(`user1.eq.${userId},user2.eq.${userId}`);

      if (matchesError) throw matchesError;


      // Get likes count
      const { count: likes } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("receiver", userId);

      // Get all chats involving the user
      const { data: userChats, error: chatsError } = await supabase
        .from("chats")
        .select("id")
        .or(`user1.eq.${userId},user2.eq.${userId}`);

      if (chatsError) throw chatsError;

      let receivedMessages = 0;
      let respondedMessages = 0;

      if (userChats && userChats.length > 0) {
        // Get all messages in these chats
        const chatIds = userChats.map((chat) => chat.id);

        const { data: messages, error: messagesError } = await supabase
          .from("messages")
          .select("sender, chat_id")
          .in("chat_id", chatIds);

        if (messagesError) throw messagesError;

        // Count received messages
        receivedMessages = messages.filter(
          (message) => message.sender !== userId
        ).length;

        // Count responded messages
        respondedMessages = messages.filter(
          (message) => message.sender === userId
        ).length;
      }

      const rate =
        receivedMessages > 0
          ? Math.round((respondedMessages / receivedMessages) * 100)
          : 0;

      setMatchesCount(matches || 0);
      setLikesCount(likes || 0);
      setResponseRate(rate);
    } catch (error) {
      console.error("Error fetching stats:", error);
      Alert.alert("Error", "Could not load profile statistics");
    }
  };

  // Check deletion status when profile loads
  useEffect(() => {
    const checkDeletionStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("deletion_requested_at")
          .eq("id", user.id)
          .single();
        
        if (error) throw error;
        
        if (profile.deletion_requested_at) {
          setDeletionRequested(true);
          calculateTimeLeft(profile.deletion_requested_at);
        }
      } catch (error) {
        console.error("Error checking deletion status:", error);
      }
    };
    
    checkDeletionStatus();
  }, []);

  // Calculate time remaining until deletion
  const calculateTimeLeft = (deletionTime) => {
    const deletionDate = new Date(deletionTime);
    const now = new Date();
    const diff = deletionDate - now;
    
    if (diff <= 0) {
      // Deletion time has passed - account should be deleted
      handleFinalDeletion();
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    setDeletionTimeLeft(`${hours}h ${minutes}m`);
  };

  // Request account deletion
  const requestAccountDeletion = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }
      
      // Set deletion time to 48 hours from now
      const deletionTime = new Date();
      deletionTime.setHours(deletionTime.getHours() + 48);
      
      const { error } = await supabase
        .from("profiles")
        .update({ 
          deletion_requested_at: deletionTime.toISOString(),
          deletion_feedback: deleteFeedback || "No reason provided"
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setDeletionRequested(true);
      setDeleteModalVisible(false);
      setDeleteFeedback("");
      calculateTimeLeft(deletionTime.toISOString());
      
      Alert.alert(
        "Deletion Requested",
        "Your account will be permanently deleted in 48 hours. You can cancel this request anytime before then."
      );
    } catch (error) {
      console.error("Deletion request failed:", error);
      Alert.alert("Error", "Failed to request account deletion");
    }
  };

  // Cancel deletion request
  const cancelDeletionRequest = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({ deletion_requested_at: null })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setDeletionRequested(false);
      setDeletionTimeLeft(null);
      setCancelModalVisible(false);
      
      Alert.alert(
        "Deletion Cancelled",
        "Your account will not be deleted. Thank you for staying with us!"
      );
    } catch (error) {
      console.error("Cancellation failed:", error);
      Alert.alert("Error", "Failed to cancel deletion request");
    }
  };

  // Actually delete the account
  const handleFinalDeletion = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // First, delete related data
      await Promise.all([
        supabase.from("matches").delete().or(`user1.eq.${user.id},user2.eq.${user.id}`),
        supabase.from("likes").delete().or(`sender.eq.${user.id},receiver.eq.${user.id}`),
        supabase.from("ignores").delete().or(`user_id.eq.${user.id},ignored_user_id.eq.${user.id}`),
        supabase.from("chats").delete().or(`user1.eq.${user.id},user2.eq.${user.id}`),
        // Add other tables as needed
      ]);
      
      // Then delete the profile
      await supabase.from("profiles").delete().eq("id", user.id);
      
      // Finally, delete the auth user
      await supabase.auth.admin.deleteUser(user.id);
      
      // Clear any stored user data
      await AsyncStorage.removeItem("@user");
      
      // Navigate to welcome screen
      navigation.reset({
        index: 0,
        routes: [{ name: "Welcome" }],
      });
    } catch (error) {
      console.error("Final deletion failed:", error);
      Alert.alert(
        "Deletion Error",
        "Your account couldn't be fully deleted. Please contact support."
      );
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr || !user) throw new Error("User not authenticated");

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (profile) {
          setIsPremium(profile.is_premium || false);
          setName(profile.full_name || "");
          setBio(profile.bio || "");
          setAge(profile.age || "");
          setGender(profile.gender || "");
          setLocation(profile.location || "");
          setOccupation(profile.occupation || "");
          setEducation(profile.education || "");
          setInterests(profile.interests ? profile.interests.split(",") : []);
          setLookingFor(profile.looking_for || "");
          setExtraImages(
            profile.extra_images ? profile.extra_images.split(",") : []
          );
          setProfileUrl(profile.selfie_url || null);

          // Fetch stats after profile is loaded
          fetchStats(user.id);
        }
      } catch (err) {
        Alert.alert("Error", err.message);
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
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
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
              source={{ uri: profileUrl || "https://via.placeholder.com/150" }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>
                  {name}, {age}
                </Text>
                {isPremium && (
                  <MaterialCommunityIcons
                    name="crown"
                    size={20}
                    color="#FFD700"
                    style={styles.premiumBadge}
                  />
                )}
              </View>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color="#FF5A5F" />
                <Text style={styles.location}>{location}</Text>
              </View>
              {!isPremium && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgrade}
                >
                  <MaterialCommunityIcons
                    name="crown"
                    size={16}
                    color="#FFD700"
                  />
                  <Text style={styles.upgradeText}>Upgrade to Premium</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.bio}>{bio}</Text>

          {/* Updated Stats Section with Real Data */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{matchesCount}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{likesCount}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{responseRate}%</Text>
              <Text style={styles.statLabel}>Response</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Photos</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photosContainer}
          >
            {extraImages.map((photo, index) => (
              <TouchableOpacity key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photo} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Interests</Text>
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

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("PrivacySettings")}
          >
            <MaterialIcons name="privacy-tip" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Privacy Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("AppSettings")}
          >
            <Ionicons name="settings" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>App Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("HelpCenter")}
          >
            <MaterialIcons name="help" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Help Center</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("ContactSupport")}
          >
            <MaterialIcons name="contact-support" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Contact Support</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("SafetyTips")}
          >
            <MaterialIcons name="security" size={24} color="#FF5A5F" />
            <Text style={styles.settingText}>Safety Tips</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Deletion Section */}
        {deletionRequested ? (
          <TouchableOpacity 
            style={styles.pendingDeletionContainer}
            onPress={() => setCancelModalVisible(true)}
          >
            <View style={styles.deletionHeader}>
              <MaterialIcons name="warning" size={24} color="#FFA000" />
              <Text style={styles.deletionTitle}>Account Deletion Pending</Text>
            </View>
            <Text style={styles.deletionText}>
              Your account will be permanently deleted in {deletionTimeLeft}.
            </Text>
            <Text style={styles.deletionNote}>
              Tap here to cancel deletion request
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons 
              name="warning" 
              size={48} 
              color="#FF5A5F" 
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Delete Your Account?</Text>
            
            <Text style={styles.modalText}>
              This will schedule your account for deletion in 48 hours. During this time:
            </Text>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="check" size={18} color="#4CAF50" />
              <Text style={styles.infoText}>You can cancel deletion anytime</Text>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="check" size={18} color="#4CAF50" />
              <Text style={styles.infoText}>Your profile will be hidden from others</Text>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="check" size={18} color="#4CAF50" />
              <Text style={styles.infoText}>After 48 hours, all data will be permanently removed</Text>
            </View>
            
            <Text style={styles.feedbackLabel}>
              Please tell us why you're leaving (optional)
            </Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Your feedback helps us improve..."
              multiline
              numberOfLines={3}
              value={deleteFeedback}
              onChangeText={setDeleteFeedback}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmDeleteButton}
                onPress={requestAccountDeletion}
              >
                <Text style={styles.confirmButtonText}>Schedule Deletion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Cancel Deletion Modal */}
      <Modal
        visible={cancelModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons 
              name="cancel" 
              size={48} 
              color="#4CAF50" 
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Cancel Account Deletion?</Text>
            
            <Text style={styles.modalText}>
              Your account deletion is scheduled but not completed yet. 
              Canceling will restore full access to your account.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Keep Deletion</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmCancelButton}
                onPress={cancelDeletionRequest}
              >
                <Text style={styles.confirmButtonText}>Cancel Deletion</Text>
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
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  premiumBadge: {
    marginLeft: 8,
    backgroundColor: "#FFD70020",
    borderRadius: 50,
    padding: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  profileSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: "row",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FF5A5F",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 20,
    justifyContent: "center",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  verifiedIcon: {
    marginLeft: 5,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    color: "#888",
    marginLeft: 5,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  upgradeText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  bio: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF5A5F",
  },
  statLabel: {
    fontSize: 14,
    color: "#888",
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  editLink: {
    color: "#FF5A5F",
    fontSize: 16,
  },
  photosContainer: {
    flexDirection: "row",
  },
  photoItem: {
    marginRight: 10,
    position: "relative",
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  photoBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "#FF5A5F",
    color: "white",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: "bold",
  },
  addPhoto: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FF5A5F",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestTag: {
    backgroundColor: "#FF5A5F20",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: "#FF5A5F",
    fontWeight: "500",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#555",
    marginLeft: 15,
  },
  switchContainer: {
    marginRight: 5,
  },
  logoutButton: {
    backgroundColor: "#fff",
    padding: 18,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FF5A5F",
  },
  logoutText: {
    color: "#FF5A5F",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#fff",
    padding: 18,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  deleteText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    width: "100%",
    borderRadius: 16,
    padding: 24,
  },
  modalIcon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
    lineHeight: 24,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: "#555",
    marginLeft: 8,
  },
  feedbackLabel: {
    fontSize: 15,
    color: "#555",
    marginTop: 16,
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: "#ff4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  pendingDeletionContainer: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FFD54F",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  deletionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  deletionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFA000",
    marginLeft: 10,
  },
  deletionText: {
    fontSize: 15,
    color: "#5D4037",
    marginBottom: 5,
  },
  deletionNote: {
    fontSize: 14,
    color: "#FFA000",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
});