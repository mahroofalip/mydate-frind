import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking } from 'react-native';

import WelcomeScreen from './Pages/WelcomeScreen';
import SignUpScreen from './Pages/SignUpScreen';
import LoginScreen from './Pages/LoginScreen';
import ProfileSetupScreen from './Pages/ProfileSetupScreen';
import HomeScreen from './Pages/Home';
import ProfileDetailScreen from './Pages/ProfileDetailScreen';
import MatchesScreen from './Pages/MatchesScreen';
import MessagesScreen from './Pages/MessagesScreen';
import ProfileScreen from './Pages/ProfileScreen';
import LikesScreen from './Pages/LikesScreen';
import SearchScreen from './Pages/SearchScreen';
import ChatScreen from './Pages/ChatScreen';
import NewMessageScreen from './Pages/NewMessageScreen';
import EmailVerificationScreen from './Pages/EmailVerificationScreen';
import ProfileUpdateScreen from './Pages/ProfileUpdateScreen';
import ConnectScreen from './Pages/ConnectScreen';
import PremiumScreen from './Pages/PremiumScreen';
import PaymentScreen from './Pages/PaymentScreen';
import PaymentResultScreen from './Pages/PaymentResultScreen';

import { supabase } from './lib/supabase';
import { planDetails } from './data/emojies';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();



function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF5A5F',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          paddingBottom: 5,
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: '#fff',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Discover') {
            iconName = focused ? 'explore' : 'explore';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Matches') {
            iconName = focused ? 'star' : 'star-outline';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Messages') {
            iconName = focused ? 'message' : 'message';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Likes') {
            iconName = focused ? 'heart' : 'heart-outline';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Likes" component={LikesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const navigationRef = useNavigationContainerRef();

  // ✅ Deep Link Handler
  useEffect(() => {
    const handleDeepLink = (event) => {
      if (event.url.includes('exp+kizzora://payment-result')) {
        navigationRef.navigate('PaymentResult');
      }
    };
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [navigationRef]);

  // ✅ Supabase token refresh handling
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        supabase
          .from('profiles')
          .update({
            session_expires_at: new Date(session.expires_at * 1000).toISOString(),
          })
          .eq('id', session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ProfileSetupScreen" component={ProfileSetupScreen} />
        <Stack.Screen name="ProfileUpdateScreen" component={ProfileUpdateScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="MatchesScreen" component={MatchesScreen} />
        <Stack.Screen name="MessagesScreen" component={MessagesScreen} />
        <Stack.Screen name="LikesScreen" component={LikesScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="NewMessage" component={NewMessageScreen} />
        <Stack.Screen name="Connect" component={ConnectScreen} />
        <Stack.Screen name="Premium" component={PremiumScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
