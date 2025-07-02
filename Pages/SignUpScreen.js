// screens/SignUpScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  
const handleSignUp = async () => {
  if (!name || !email || !password) return alert('Fill all fields');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) alert(error.message);
  else 
  navigation.navigate('EmailVerification', { email , password});
  // else navigation.navigate('ProfileSetupScreen', { name });
};

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Your Love Story ❤️</Text>
        <Text style={styles.subtitle}>Begin your journey together</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          placeholderTextColor="#a88181"  // Darkened placeholder
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Your Email"
          placeholderTextColor="#a88181"  // Darkened placeholder
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Your Secret Key"
          placeholderTextColor="#a88181"  // Darkened placeholder
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Continue Your Journey</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          <Text style={styles.linkText}>
            Already have a love story? <Text style={styles.linkHighlight}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.quote}>"Love recognizes no barriers."</Text>
        <Text style={styles.author}>- Maya Angelou</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffafb',
    paddingHorizontal: 25,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#c24e4e',  // Slightly darker red
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 18,
    color: '#b37676',  // Darker pink
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  formContainer: {
    flex: 2,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    fontSize: 16,
    marginBottom: 25,
    color: '#6d4141',  // Darker text color
    borderWidth: 1,
    borderColor: '#f8e0e0',
    shadowColor: '#f5d0d9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
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
  loginLink: {
    marginTop: 15,
    alignSelf: 'center',
  },
  linkText: {
    textAlign: 'center',
    color: '#a88181',  // Darker gray-pink
    fontSize: 16,
  },
  linkHighlight: {
    color: '#c24e4e',  // Matching title color
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    flex: 0.8,
    justifyContent: 'flex-end',
    paddingBottom: 70,
    alignItems: 'center',
  },
  quote: {
    fontStyle: 'italic',
    color: '#b37676',  // Matching subtitle color
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  author: {
    color: '#b37676',  // Matching subtitle color
    fontSize: 14,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});