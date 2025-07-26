import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export default function PaymentResultScreen({ navigation }) {
  // Premium features list
  const premiumFeatures = [
    'See who liked your profile',
    'Unlimited likes',
    'Advanced search filters',
    '5 monthly profile boosts',
    'Priority in search results',
    'Message read receipts'
  ];

  return (
     <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#8BC34A']}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="check-circle" size={80} color="white" />
        </View>
        
        <Text style={styles.title}>
          Congratulations!
        </Text>
        
        <Text style={styles.subtitle}>
          Your premium subscription is now active
        </Text>
      </LinearGradient>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.featuresTitle}>Your Premium Benefits:</Text>
        
        {premiumFeatures.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <MaterialIcons name="check" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        
        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.buttonText}>
            Explore Premium Features
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f2f5",
     paddingTop: 40,
     paddingBottom: 40
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    height: '40%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  content: {
    padding: 30,
    paddingTop: 40,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  exploreButton: {
    backgroundColor: '#FF5A5F',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});