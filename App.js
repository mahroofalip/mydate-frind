import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from './Pages/WelcomeScreen';
import SignUpScreen from './Pages/SignUpScreen';
//
import LoginScreen from './Pages/LoginScreen';
import ProfileSetupScreen from './Pages/ProfileSetupScreen';
import HomeScreen from './Pages/Home';
import ProfileDetailScreen from './Pages/ProfileDetailScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MatchesScreen from './Pages/MatchesScreen';
import MessagesScreen from './Pages/MessagesScreen';
import ProfileScreen from './Pages/ProfileScreen';
import LikesScreen from './Pages/LikesScreen';
import SearchScreen from './Pages/SearchScreen'; // Import your new SearchScreen
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
// import { ChatScreen } from './Pages/ChatScreen';
import ChatScreen from './Pages/ChatScreen';

import EmailVerificationScreen from './Pages/EmailVerificationScreen';
import ProfileUpdateScreen from './Pages/ProfileUpdateScreen';
import 'react-native-gesture-handler';



const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF5A5F', // Romantic pink/red
        tabBarInactiveTintColor: '#888', // Subtle gray
        tabBarStyle: { 
          paddingBottom: 5,
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: '#fff'
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Discover') {
            iconName = focused ? 'explore' : 'explore';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Matches') {
            iconName = focused ? 'heart' : 'heart-outline';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Messages') {
            iconName = focused ? 'message' : 'message';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Likes') {
            iconName = focused ? 'star' : 'star-outline';
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
      <Tab.Screen 
        name="Discover" 
        component={HomeScreen} 
        options={{ title: 'Discover' }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen} 
        options={{ title: 'Matches' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ title: 'Search' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen} 
        options={{ title: 'Messages' }}
      />
      <Tab.Screen 
        name="Likes" 
        component={LikesScreen} 
        options={{ title: 'Likes' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
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
        <Stack.Screen name="ProfileUpdateScreen" component={ProfileUpdateScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen}/>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
       <Stack.Screen 
          name="ChatScreen" 
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="MatchesScreen" component={MatchesScreen} />
        <Stack.Screen name="MessagesScreen" component={MessagesScreen} />
        <Stack.Screen name="LikesScreen" component={LikesScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      
      </Stack.Navigator>
    </NavigationContainer>
  );
}