import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform, Linking, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.email_confirmed_at) {
      setLoading(false);
      return;
    }

    const userId = session.user.id;

    // 1. Check if profile exists
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, age, gender, location, looking_for')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // 'PGRST116' = no rows returned
      setLoading(false);
      return;
    }

    if (!profile) {
      // No profile found → go to setup
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfileSetupScreen' }],
      });
      setLoading(false);
      return;
    }

    // 2. Profile exists → check if complete
    const { data: files, error: listError } = await supabase.storage
      .from('profile-photos')
      .list(`${userId}/`);

    if (listError) {
      setLoading(false);
      return;
    }

    // Check for selfie and extra images
    const selfieExists = files?.some(file => file.name.startsWith('selfie.'));
    const extraImageExists = files?.some(file =>
      /^extra_[0-2]\./.test(file.name)
    );

    const requiredFields = [
      selfieExists,
      extraImageExists,
      profile?.full_name,
      profile?.age,
      profile?.gender,
      profile?.location,
      profile?.looking_for,
    ];


    const isProfileComplete = requiredFields.every(field => {
      if (typeof field === 'boolean') return field;
      return field && field.toString().trim() !== '';
    });

    navigation.reset({
      index: 0,
      routes: [{
        name: isProfileComplete ? 'MainTabs' : 'ProfileUpdateScreen',
      }],
    });

    setLoading(false);
  };

  checkSession();
}, []);





  // Handle deep links
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event?.url || '';
      if (url.includes('access_token')) {
        const params = getParamsFromURL(url);

        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });

        if (error) {
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }
      } else {
      }
    };

    // Initial deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listener for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const getParamsFromURL = (url) => {
    const params = {};
    const queryString = url.split('#')[1]; // get the part after '#'
    const pairs = queryString?.split('&') || [];

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      params[key] = decodeURIComponent(value);
    }

    return params;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e8b3b3" />
      </View>
    );
  }

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
    backgroundColor: 'rgba(196, 78, 78, 0.2)',
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
    backgroundColor: '#e8b3b3',
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
