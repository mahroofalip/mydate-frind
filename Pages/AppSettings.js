import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, ScrollView,SafeAreaView } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function AppSettings({ navigation }) {
  const [settings, setSettings] = useState({
    notifications: true,
    showDistance: true,
    darkMode: false,
    showOnlineStatus: true,
  });

  const toggleSwitch = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
     <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={26}
          color="#fff"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>App Settings</Text>
      </View>

      {/* General Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.item}>
          <Ionicons name="notifications" size={24} color="#FF5A5F" />
          <Text style={styles.itemText}>Enable Notifications</Text>
          <Switch
            value={settings.notifications}
            onValueChange={() => toggleSwitch("notifications")}
          />
        </View>
        <View style={styles.item}>
          <MaterialIcons name="place" size={24} color="#FF5A5F" />
          <Text style={styles.itemText}>Show Distance</Text>
          <Switch
            value={settings.showDistance}
            onValueChange={() => toggleSwitch("showDistance")}
          />
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.item}>
          <Ionicons name="moon" size={24} color="#FF5A5F" />
          <Text style={styles.itemText}>Dark Mode</Text>
          <Switch
            value={settings.darkMode}
            onValueChange={() => toggleSwitch("darkMode")}
          />
        </View>
      </View>

      {/* Privacy Shortcut */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Status</Text>
        <View style={styles.item}>
          <MaterialIcons name="visibility" size={24} color="#FF5A5F" />
          <Text style={styles.itemText}>Show Online Status</Text>
          <Switch
            value={settings.showOnlineStatus}
            onValueChange={() => toggleSwitch("showOnlineStatus")}
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
