import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Animated,
  Easing,
  Dimensions
} from "react-native";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";

const HelpCenterScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSection, setExpandedSection] = useState(null);
  const [rotation] = useState(new Animated.Value(0));
  const windowWidth = Dimensions.get('window').width;

  // Help categories
  const helpTopics = [
    {
      id: "account",
      title: "Account & Profile",
      icon: "person-outline",
      questions: [
        "How do I change my profile picture?",
        "Why can't I update my location?",
        "How do I delete my account?",
        "How do I become a premium member?"
      ]
    },
    {
      id: "matching",
      title: "Matching & Connections",
      icon: "people-outline",
      questions: [
        "Why am I not getting any matches?",
        "How does the matching algorithm work?",
        "How do I report a fake profile?",
        "How do I block someone?"
      ]
    },
    {
      id: "premium",
      title: "Premium Features",
      icon: "star-outline",
      questions: [
        "What are the benefits of premium?",
        "How do I cancel my subscription?",
        "Can I get a refund?",
        "How do I restore my purchase?"
      ]
    },
    {
      id: "safety",
      title: "Safety & Privacy",
      icon: "lock-closed-outline",
      questions: [
        "How do I stay safe on this app?",
        "What information is visible to others?",
        "How do I report inappropriate content?",
        "Can I make my profile private?"
      ]
    },
    {
      id: "technical",
      title: "Technical Issues",
      icon: "settings-outline",
      questions: [
        "The app keeps crashing, what should I do?",
        "How do I reset my password?",
        "Why are my messages not sending?",
        "How do I enable notifications?"
      ]
    }
  ];

  // Filter topics based on search
  const filteredTopics = helpTopics
    .filter(topic =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.questions.some(q => q.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .map(topic => ({
      ...topic,
      questions: topic.questions.filter(q =>
        q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }));

  // Toggle section expansion
  const toggleSection = (id) => {
    if (expandedSection === id) {
      setExpandedSection(null);
    } else {
      setExpandedSection(id);
    }
  };

  // Render each help category
  const renderHelpSection = ({ item }) => (
    <TouchableOpacity 
      style={styles.sectionCard}
      onPress={() => toggleSection(item.id)}
      activeOpacity={0.9}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={24} color="#FF5A5F" />
        </View>
        <Text style={styles.sectionTitle}>{item.title}</Text>
        <Animated.View style={{
          transform: [{
            rotate: expandedSection === item.id ? "180deg" : "0deg"
          }]
        }}>
          <MaterialIcons 
            name={expandedSection === item.id ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={28} 
            color="#888" 
          />
        </Animated.View>
      </View>
      
      {expandedSection === item.id && (
        <View style={styles.questionsContainer}>
          {item.questions.map((question, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.questionItem}
              onPress={() => navigation.navigate("HelpDetail", { question })}
            >
              <Text style={styles.questionText}>{question}</Text>
              <MaterialIcons name="chevron-right" size={24} color="#888" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#FF5A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <TouchableOpacity>
          <Feather name="headphones" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search help topics..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <MaterialIcons name="clear" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Popular Questions */}
      <Text style={styles.sectionHeaderTitle}>Popular Questions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularContainer}>
        <TouchableOpacity style={styles.popularCard}>
          <View style={styles.popularIcon}>
            <Ionicons name="key" size={20} color="#FF5A5F" />
          </View>
          <Text style={styles.popularText}>How do I reset my password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.popularCard}>
          <View style={styles.popularIcon}>
            <Ionicons name="card" size={20} color="#FF5A5F" />
          </View>
          <Text style={styles.popularText}>Payment and billing issues</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.popularCard}>
          <View style={styles.popularIcon}>
            <Ionicons name="shield-checkmark" size={20} color="#FF5A5F" />
          </View>
          <Text style={styles.popularText}>Safety tips for online dating</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Help Topics */}
      <Text style={styles.sectionHeaderTitle}>Help Topics</Text>
      <FlatList
        data={filteredTopics}
        renderItem={renderHelpSection}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Contact Support */}
      <TouchableOpacity 
        style={styles.supportCard}
        onPress={() => navigation.navigate("ContactSupport")}
      >
        <View style={styles.supportContent}>
          <View style={styles.supportIcon}>
            <Ionicons name="chatbubbles" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.supportTitle}>Need more help?</Text>
            <Text style={styles.supportText}>Contact our support team</Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={28} color="#888" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingBottom: 20,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    height: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
  },
  clearButton: {
    padding: 5,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  popularContainer: {
    paddingLeft: 16,
    paddingBottom: 8,
  },
  popularCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 180,
    height: 120,
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  popularIcon: {
    backgroundColor: "#FF5A5F20",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  popularText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "#FF5A5F10",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  questionsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 16,
  },
  questionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    color: "#555",
  },
  supportCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  supportContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  supportIcon: {
    backgroundColor: "#FF5A5F",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  supportText: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
});

export default HelpCenterScreen;