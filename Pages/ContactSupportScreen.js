import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";

const ContactSupportScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!name || !email || !subject || !message) {
      Alert.alert("Missing Information", "Please fill all fields before submitting");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Message Sent!",
        "Thank you for contacting us. Our support team will get back to you within 24 hours.",
        [
          { text: "OK", onPress: () => navigation.goBack() }
        ]
      );
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#FF5A5F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Illustration - Replaced with icon */}
        <View style={styles.illustrationContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="headset" size={60} color="#FF5A5F" />
          </View>
          <Text style={styles.illustrationText}>We're here to help you!</Text>
          <Text style={styles.subText}>Our team is ready to assist with any questions or issues you have.</Text>
        </View>

        {/* Contact Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Send us a message</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="briefcase-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Subject"
              placeholderTextColor="#999"
              value={subject}
              onChangeText={setSubject}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="create-outline" size={20} color="#888" style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 12 }]} />
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="How can we help you?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Sending...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Send Message</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Alternative Contact Methods */}
        <View style={styles.contactMethods}>
          <Text style={styles.sectionTitle}>Other ways to reach us</Text>
          
          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons name="chatbubbles" size={24} color="#FF5A5F" />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactSubtitle}>Chat with us instantly</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons name="call" size={24} color="#FF5A5F" />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Call Us</Text>
              <Text style={styles.contactSubtitle}>+1 (800) 123-4567</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons name="help-circle" size={24} color="#FF5A5F" />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>FAQs</Text>
              <Text style={styles.contactSubtitle}>Find answers to common questions</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    paddingBottom: 40,
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
  illustrationContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  iconBackground: {
    backgroundColor: "#FF5A5F20",
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  illustrationText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  submitButton: {
    backgroundColor: "#FF5A5F",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    elevation: 2,
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  contactMethods: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactIcon: {
    backgroundColor: "#FF5A5F20",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  contactSubtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
});

export default ContactSupportScreen;