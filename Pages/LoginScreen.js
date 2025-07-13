// screens/LoginScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase'; // make sure this path is correct

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(`Login error: ${authError.message}`);
        return;
      }

      const user = data.user;

      // Check if email is confirmed
      if (!user?.email_confirmed_at) {
        setError('Please verify your email before logging in.');
        return;
      }

      // Set session expiration time
      const expiresAt = new Date(data.session.expires_at * 1000).toISOString();
      
      // Update user's online status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          last_login_at: new Date().toISOString(),
          session_expires_at: expiresAt,
          last_logout_at: null  // Clear logout time on login
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating online status:', updateError);
      }

      await AsyncStorage.setItem('@user', JSON.stringify(user));

      const profileExists = await checkProfileExists(user.id);

      if (profileExists) {
        navigation.navigate('MainTabs');
      } else {
        navigation.navigate('ProfileSetupScreen');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const checkProfileExists = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles') // 👈 Make sure your table is called 'profiles'
      .select('id')     // 👈 Only select needed fields
      .eq('id', userId) // 👈 user.id from Supabase auth is usually the primary key
      .single();

    if (error && error.code !== 'PGRST116') { // ignore 'no rows' error
      console.error('Error checking profile:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('Unexpected error checking profile:', err);
    return false;
  }
};


  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Continue your love story</Text>
      </View>

      <View style={styles.formContainer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Your Email"
          placeholderTextColor="#a88181"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Your Secret Key"
          placeholderTextColor="#a88181"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          onPress={handleLogin} 
          style={styles.button}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('SignUp')}
          style={styles.loginLink}
        >
          <Text style={styles.linkText}>
            New to love? <Text style={styles.linkHighlight}>Create Account</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.quote}>"The best thing to hold onto in life is each other."</Text>
        <Text style={styles.author}>- Audrey Hepburn</Text>
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
    paddingTop: 20,
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
    color: '#a88181',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
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
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
    fontSize: 15,
  }
});
