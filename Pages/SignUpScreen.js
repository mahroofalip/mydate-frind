// screens/SignUpScreen.js
import  { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSignUp = async () => {
    if (!name || !email || !password) return alert('Please fill all fields');
    
    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });
    
    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      navigation.navigate('EmailVerification', { email, password });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Your Love Story ❤️</Text>
        <Text style={styles.subtitle}>Begin your journey together</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          placeholderTextColor="#a88181"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Your Email"
          placeholderTextColor="#a88181"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
       
        <TextInput
          style={styles.input}
          placeholder="Your Secret Key"
          placeholderTextColor="#a88181"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue Your Journey</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Login')}
        style={styles.loginLink}
        disabled={loading}
      >
        <Text style={[styles.linkText, loading && styles.linkDisabled]}>
          Already have a love story? <Text style={styles.linkHighlight}>Log In</Text>
        </Text>
      </TouchableOpacity>

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
    color: '#c24e4e',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 18,
    color: '#b37676',
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
    color: '#6d4141',
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
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonDisabled: {
    opacity: 0.7,
  },
  loginLink: {
    marginTop: 15,
    alignSelf: 'center',
  },
  linkText: {
    textAlign: 'center',
    color: '#a88181',
    fontSize: 16,
  },
  linkDisabled: {
    opacity: 0.5,
  },
  linkHighlight: {
    color: '#c24e4e',
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
    color: '#b37676',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  author: {
    color: '#b37676',
    fontSize: 14,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});