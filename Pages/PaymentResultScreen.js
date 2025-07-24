import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export default function PaymentResultScreen({ navigation, route }) {
  const { success, transactionId, plan, error } = route.params;
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={success ? ['#4CAF50', '#8BC34A'] : ['#FF5A5F', '#FF8C94']}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          {success ? (
            <MaterialIcons name="check-circle" size={80} color="white" />
          ) : (
            <MaterialIcons name="error" size={80} color="white" />
          )}
        </View>
        
        <Text style={styles.title}>
          {success ? 'Payment Successful!' : 'Payment Failed'}
        </Text>
        
        <Text style={styles.subtitle}>
          {success 
            ? `Your ${plan.name} premium plan is now active!` 
            : error || 'There was an issue processing your payment'}
        </Text>
        
        {success && transactionId && (
          <Text style={styles.transactionId}>Transaction ID: {transactionId}</Text>
        )}
      </LinearGradient>
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.button, success ? styles.successButton : styles.failButton]}
          onPress={() => navigation.navigate(success ? 'Home' : 'Payment', { plan: plan.name.toLowerCase() })}
        >
          <Text style={styles.buttonText}>
            {success ? 'Explore Premium Features' : 'Try Again'}
          </Text>
        </TouchableOpacity>
        
        {/* <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  transactionId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
  },
  content: {
    padding: 30,
    width: '100%',
  },
  button: {
    backgroundColor: '#FF5A5F',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  failButton: {
    backgroundColor: '#FF5A5F',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF5A5F',
  },
  secondaryButtonText: {
    color: '#FF5A5F',
    fontWeight: 'bold',
    fontSize: 16,
  },
});