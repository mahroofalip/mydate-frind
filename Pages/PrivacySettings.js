import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, ScrollView,SafeAreaView} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

export default function PrivacySettings({ navigation }) {
  const [privacy, setPrivacy] = useState({
    hideProfile: false,
    blockLocation: false,
    hideOnlineStatus: false,
    blockScreenshots: false,
  });

  const toggleSwitch = (key) => {
    setPrivacy({ ...privacy, [key]: !privacy[key] });
  };

  return (
     <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={26}
          color="#fff"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>Privacy Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Visibility</Text>
        <View style={styles.item}>
          <MaterialIcons name="visibility-off" size={24} color="#FF5A5F" />
          <Text style={styles.itemText}>Hide My Profile</Text>
          <Switch
            value={privacy.hideProfile}
            onValueChange={() => toggleSwitch("hideProfile")}
          />
        </View>
        <View style={styles.item}>
          <MaterialIcons name="location-off" size={24} color="#FF5A5F" />
          <Text style={styles.itemText}>Hide My Location</Text>
          <Switch
            value={privacy.blockLocation}
            onValueChange={() => toggleSwitch("blockLocation")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Privacy</Text>
        <View style={styles.item}>
          <Ionicons name="eye-off" size={24} color="#FF5A5F" />
          <Text style={styles.itemText}>Hide Online Status</Text>
          <Switch
            value={privacy.hideOnlineStatus}
            onValueChange={() => toggleSwitch("hideOnlineStatus")}
          />
        </View>
        <View style={styles.item}>
          <MaterialIcons name="block" size={24} color="#FF5A5F" />
          <Text style={styles.itemText}>Block Screenshots</Text>
          <Switch
            value={privacy.blockScreenshots}
            onValueChange={() => toggleSwitch("blockScreenshots")}
          />
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    paddingTop: 40,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF5A5F",
    padding: 16,
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 10,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
    color: "#333",
  },
});
