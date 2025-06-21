// WelcomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://w0.peakpx.com/wallpaper/882/58/HD-wallpaper-love-wedding-silhouette-sunset-thumbnail.jpg' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <Text style={styles.title}>Find Your Forever Love ❤️</Text>
        <Text style={styles.subtitle}>
          Where hearts connect and love stories begin. Discover meaningful connections that last a lifetime.
        </Text>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.buttonText}>Create Love Story</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonTextSecondary}>Continue Your Journey</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width,
    height: height,
    position: 'absolute',
  },
  overlay: {
    backgroundColor: 'rgba(196, 78, 78, 0.2)', // Romantic red overlay
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: height * 0.1,
  },
  title: {
    fontSize: 42,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 18,
    color: '#f8e0e0',
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
    lineHeight: 24,
  },
  buttonPrimary: {
    backgroundColor: '#e8b3b3', // Soft blush pink
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 16,
    shadowColor: '#d46a6a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonSecondary: {
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonTextSecondary: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});