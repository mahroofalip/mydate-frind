import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";

const SafetyTipsScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [rotation] = useState(new Animated.Value(0));
  const windowWidth = Dimensions.get('window').width;

  // Safety categories
  const safetyCategories = [
    {
      id: "online",
      title: "Online Safety",
      icon: "shield-check",
      color: "#4CAF50",
      tips: [
        "Never share personal information like your home address, workplace, or financial details",
        "Use the app's messaging system until you feel comfortable",
        "Be cautious of anyone who asks for money or financial assistance",
        "Trust your instincts - if something feels off, it probably is"
      ]
    },
    {
      id: "meeting",
      title: "Meeting in Person",
      icon: "handshake",
      color: "#2196F3",
      tips: [
        "Always meet in a public place for the first few meetings",
        "Tell a friend or family member where you're going and who you're meeting",
        "Arrange your own transportation - don't rely on your date for rides",
        "Stay sober and aware of your surroundings",
        "Keep your phone charged and with you at all times"
      ]
    },
    {
      id: "personal",
      title: "Protecting Personal Info",
      icon: "lock",
      color: "#9C27B0",
      tips: [
        "Use a unique password for your dating app account",
        "Avoid connecting with suspicious profiles with few photos or details",
        "Be careful what photos you share - they may contain location metadata",
        "Consider using a Google Voice number instead of your personal number"
      ]
    },
    {
      id: "scams",
      title: "Recognizing Scams",
      icon: "exclamation-triangle",
      color: "#FF9800",
      tips: [
        "Watch for profiles that seem too good to be true",
        "Be wary of anyone professing strong feelings quickly",
        "Never send money or share financial information",
        "Report suspicious profiles immediately"
      ]
    },
    {
      id: "reporting",
      title: "Reporting Concerns",
      icon: "flag",
      color: "#F44336",
      tips: [
        "Use the 'Report' feature for any inappropriate behavior",
        "Block users who make you feel uncomfortable",
        "Contact support if you need help with a safety issue",
        "Trust your instincts and don't hesitate to leave a situation"
      ]
    }
  ];

  // Toggle section expansion
  const toggleSection = (id) => {
    if (expandedSection === id) {
      setExpandedSection(null);
    } else {
      setExpandedSection(id);
      animateIcon();
    }
  };

  // Animate the expand icon
  const animateIcon = () => {
    Animated.timing(rotation, {
      toValue: 1,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true
    }).start(() => {
      rotation.setValue(0);
    });
  };

  // Render each safety category
  const renderSafetyCategory = (category) => (
    <TouchableOpacity 
      key={category.id}
      style={[styles.categoryCard, { borderLeftColor: category.color }]}
      onPress={() => toggleSection(category.id)}
      activeOpacity={0.9}
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
          <FontAwesome5 name={category.icon} size={20} color={category.color} />
        </View>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <Animated.View style={{
          transform: [{
            rotate: expandedSection === category.id ? "180deg" : "0deg"
          }]
        }}>
          <MaterialIcons 
            name={expandedSection === category.id ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={28} 
            color="#888" 
          />
        </Animated.View>
      </View>
      
      {expandedSection === category.id && (
        <View style={styles.tipsContainer}>
          {category.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={styles.bulletPoint}>
                <Ionicons name="shield" size={14} color={category.color} />
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
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
        <Text style={styles.headerTitle}>Safety Tips</Text>
        <TouchableOpacity>
          <Ionicons name="help-circle" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>
      
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Your Safety is Our Priority</Text>
          <Text style={styles.heroText}>
            We want you to have a safe and positive experience. Follow these guidelines to protect yourself while meeting new people.
          </Text>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons name="shield" size={60} color="#FF5A5F" />
        </View>
      </View>
      
      {/* Emergency Contact Card */}
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyIcon}>
          <Ionicons name="alert-circle" size={28} color="#fff" />
        </View>
        <View style={styles.emergencyText}>
          <Text style={styles.emergencyTitle}>Need Immediate Help?</Text>
          <Text style={styles.emergencyNumber}>Call Emergency Services: 911</Text>
        </View>
      </View>
      
      {/* Safety Categories */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Safety Guidelines</Text>
        
        {safetyCategories.map(category => renderSafetyCategory(category))}
        
        {/* Additional Resources */}
        <View style={styles.resourcesCard}>
          <Text style={styles.resourcesTitle}>Additional Resources</Text>
          <View style={styles.resourceItem}>
            <Ionicons name="globe" size={20} color="#2196F3" style={styles.resourceIcon} />
            <Text style={styles.resourceText}>RAINN - National Sexual Assault Hotline</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="globe" size={20} color="#2196F3" style={styles.resourceIcon} />
            <Text style={styles.resourceText}>National Domestic Violence Hotline</Text>
          </View>
          <View style={styles.resourceItem}>
            <Ionicons name="globe" size={20} color="#2196F3" style={styles.resourceIcon} />
            <Text style={styles.resourceText}>FTC - Online Dating Scams Information</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  heroContainer: {
    flexDirection: "row",
    backgroundColor: "#FF5A5F",
    padding: 20,
    alignItems: "center",
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  heroText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
  },
  heroIcon: {
    marginLeft: 15,
  },
  emergencyCard: {
    backgroundColor: "#F44336",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emergencyIcon: {
    backgroundColor: "#ffffff30",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  emergencyText: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  emergencyNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  tipsContainer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  tipItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  bulletPoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  resourcesCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  resourceIcon: {
    marginRight: 12,
  },
  resourceText: {
    flex: 1,
    fontSize: 15,
    color: "#555",
  },
});

export default SafetyTipsScreen;