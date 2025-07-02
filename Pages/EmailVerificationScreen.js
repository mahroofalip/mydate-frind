// screens/EmailVerificationScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  ImageBackground, 
  Platform
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function EmailVerificationScreen({ navigation  , route}) {
  const [message, setMessage] = useState('');
  const { email,password } = route.params;

  const handleLoginPress = async () => {
  const { data, error } = await supabase.auth.getUser({email,password});
     
  if (error) {
    setMessage(`Error: ${error.message}`);
    return;
  }

  const user = data.user;
  
  if (user?.email_confirmed_at) {
    navigation.navigate('Login');
  } else {
    setMessage('Please verify your email before logging in.');
  }
};


  return (
    
    <ImageBackground 
      source={require('../assets/deepseek_svg_20250629_a717d1.svg')} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Check Your Inbox ❤️</Text>
          <Text style={styles.subtitle}>We've sent a love letter to your email</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.message}>
            We sent a verification link to:
            <Text style={styles.email}> {email}</Text>
          </Text>
          
          <Text style={styles.instructions}>
            Please click the link in that email to verify your account and begin your love story.
          </Text>
          
          {message ? (
            <Text style={message.includes('Error') ? styles.error : styles.success}>
              {message}
            </Text>
          ) : null}

          

          <TouchableOpacity
  style={styles.loginButton}
  onPress={handleLoginPress}
>
  <Text style={styles.loginButtonText}>
    Already verified? <Text style={styles.loginHighlight}>Log In</Text>
  </Text>
</TouchableOpacity>

        </View>

        <View style={styles.footer}>
          <Text style={styles.quote}>"The best thing to hold onto in life is each other."</Text>
          <Text style={styles.author}>- Audrey Hepburn</Text>
        </View>
      </View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(255, 250, 251, 0.85)',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#c24e4e',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#b37676',
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
  },
  message: {
    fontSize: 18,
    color: '#6d4141',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  },
  email: {
    fontWeight: 'bold',
    color: '#c24e4e',
  },
  instructions: {
    fontSize: 16,
    color: '#6d4141',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#e8b3b3',
    paddingVertical: 18,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#d9a7a7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 7,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loginButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  loginButtonText: {
    textAlign: 'center',
    color: '#a88181',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  },
  loginHighlight: {
    color: '#c24e4e',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  quote: {
    fontStyle: 'italic',
    color: '#b37676',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  author: {
    color: '#b37676',
    fontSize: 14,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  success: {
    color: '#2ecc71',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    fontWeight: '500',
  },
});