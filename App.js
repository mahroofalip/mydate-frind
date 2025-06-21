import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './Pages/WelcomeScreen';
import SignUpScreen from './Pages/SignUpScreen';
import LoginScreen from './Pages/LoginScreen';
import ProfileSetupScreen from './Pages/ProfileSetupScreen';
import HomeScreen from './Pages/Home';
import ProfileDetailScreen from './Pages/ProfileDetailScreen';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MatchesScreen from './Pages/MatchesScreen';
import MessagesScreen from './Pages/MessagesScreen';
import ProfileScreen from './Pages/ProfileScreen';
import LikesScreen from './Pages/LikesScreen';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF5A5F',
        tabBarStyle: { paddingBottom: 5 }
      }}
    >
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Likes" component={LikesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}



const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ProfileSetupScreen" component={ProfileSetupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen}/>
        <Stack.Screen name="MainTabs" component={MainTabs} />

      </Stack.Navigator>
    </NavigationContainer>

  );
}

const styles = StyleSheet.create({
  // You can keep this for other screens if needed
});
