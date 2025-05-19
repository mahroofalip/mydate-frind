// WelcomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <Text style={styles.title}>Find Your New Friends</Text>
        <Text style={styles.subtitle}>
          Connect with amazing people nearby and make meaningful friendships.
        </Text>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonTextSecondary}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width,
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 60,
  },
  title: {
    fontSize: 34,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 40,
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6', // blue
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonSecondary: {
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  buttonTextSecondary: {
    color: '#3b82f6',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
});
