// App.js (fully modified)
import "react-native-gesture-handler";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import {
  Linking,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { supabase } from "./lib/supabase";
import WelcomeScreen from "./Pages/WelcomeScreen";
import SignUpScreen from "./Pages/SignUpScreen";
import LoginScreen from "./Pages/LoginScreen";
import ProfileSetupScreen from "./Pages/ProfileSetupScreen";
import HomeScreen from "./Pages/Home";
import ProfileDetailScreen from "./Pages/ProfileDetailScreen";
import MatchesScreen from "./Pages/MatchesScreen";
import MessagesScreen from "./Pages/MessagesScreen";
import ProfileScreen from "./Pages/ProfileScreen";
import LikesScreen from "./Pages/LikesScreen";
import SearchScreen from "./Pages/SearchScreen";
import ChatScreen from "./Pages/ChatScreen";
import NewMessageScreen from "./Pages/NewMessageScreen";
import EmailVerificationScreen from "./Pages/EmailVerificationScreen";
import ProfileUpdateScreen from "./Pages/ProfileUpdateScreen";
import ConnectScreen from "./Pages/ConnectScreen";
import PremiumScreen from "./Pages/PremiumScreen";
import PaymentScreen from "./Pages/PaymentScreen";
import PaymentResultScreen from "./Pages/PaymentResultScreen";
import SearchResultsScreen from "./Pages/SearchResultsScreen";
import PrivacySettings from "./Pages/PrivacySettings";
import AppSettings from "./Pages/AppSettings";
import HelpCenterScreen from "./Pages/HelpCenterScreen";
import ContactSupportScreen from "./Pages/ContactSupportScreen";
import SafetyTipsScreen from "./Pages/SafetyTipsScreen";

export const navigationRef = createNavigationContainerRef();

const { width, height } = Dimensions.get("window");

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs({
  newLikeCount,
  setNewLikeCount,
  unreadMessageCount,
  setUnreadMessageCount,
}) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FF5A5F",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          paddingBottom: 5,
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: "#fff",
        },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === "Discover") {
            return (
              <Ionicons
                name={focused ? "compass" : "compass-outline"}
                size={size}
                color={color}
              />
            );
          } else if (route.name === "Matches") {
            return (
              <MaterialCommunityIcons
                name={focused ? "star" : "star-outline"}
                size={size}
                color={color}
              />
            );
          } else if (route.name === "Messages") {
            return (
              <View>
                <Ionicons
                  name={focused ? "chatbubble" : "chatbubble-outline"}
                  size={size}
                  color={color}
                />
                {/* {unreadMessageCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadMessageCount}</Text>
                  </View>
                )} */}
              </View>
            );
          } else if (route.name === "Likes") {
            return (
              <View>
                <MaterialCommunityIcons
                  name={focused ? "heart" : "heart-outline"}
                  size={size}
                  color={color}
                />
                {newLikeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{newLikeCount}</Text>
                  </View>
                )}
              </View>
            );
          } else if (route.name === "Profile") {
            return (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size}
                color={color}
              />
            );
          } else if (route.name === "Search") {
            return (
              <Ionicons
                name={focused ? "search" : "search-outline"}
                size={size}
                color={color}
              />
            );
          }
        },
      })}
    >
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      {/* <Tab.Screen name="Search" component={SearchScreen} /> */}
      <Tab.Screen name="Messages">
        {() => (
          <MessagesScreen
            unreadMessageCount={unreadMessageCount}
            setUnreadMessageCount={setUnreadMessageCount}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Likes"
        children={() => <LikesScreen resetBadge={() => setNewLikeCount(0)} />}
        options={{
          tabBarBadge: newLikeCount > 0 ? newLikeCount : undefined,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Confetti Celebration Component
const ConfettiCelebration = ({ visible, senderName, onClose }) => {
  const particles = useRef([]);
  const particleCount = 100;

  if (!particles.current.length) {
    particles.current = Array.from({ length: particleCount }, () => ({
      position: new Animated.ValueXY(),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      size: Math.random() * 15 + 5,
      shape: Math.random() > 0.5 ? "circle" : "square",
    }));
  }

  useEffect(() => {
    if (visible) {
      particles.current.forEach((particle, index) => {
        const startX = Math.random() * width;
        particle.position.setValue({ x: startX, y: -10 });
        particle.opacity.setValue(1);
        particle.scale.setValue(0.3 + Math.random() * 0.7);
        particle.rotation.setValue(Math.random() * 360);

        const animations = [
          Animated.timing(particle.position.y, {
            toValue: height + 100,
            duration: 2000 + Math.random() * 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(particle.position.x, {
            toValue: startX + (Math.random() * 200 - 100),
            duration: 2000 + Math.random() * 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotation, {
            toValue: particle.rotation._value + Math.random() * 360,
            duration: 1000 + Math.random() * 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1000,
            delay: 1000 + Math.random() * 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ];

        Animated.parallel(animations).start();
      });

      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    } else {
      particles.current.forEach((particle) => {
        particle.position.setValue({ x: 0, y: 0 });
        particle.opacity.setValue(0);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={confettiStyles.container}>
      <Text style={confettiStyles.title}>Congratulations!</Text>
      <Text style={confettiStyles.message}>
        {senderName} liked your profile
      </Text>

      <View style={confettiStyles.heartContainer}>
        <Animated.View
          style={[
            confettiStyles.heartPulse,
            {
              transform: [
                {
                  scale: new Animated.Value(1).interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5],
                  }),
                },
                {
                  rotate: new Animated.Value(0).interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "10deg"],
                  }),
                },
              ],
            },
          ]}
        />
        <MaterialCommunityIcons
          name="heart"
          size={60}
          color="#FF5A5F"
          style={confettiStyles.heart}
        />
      </View>

      <Text style={confettiStyles.congratsText}>You're amazing!</Text>

      {particles.current.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            confettiStyles.particle,
            particle.shape === "circle"
              ? confettiStyles.circle
              : confettiStyles.square,
            {
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size,
              transform: [
                { translateX: particle.position.x },
                { translateY: particle.position.y },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const confettiStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF5A5F",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 24,
    textAlign: "center",
    color: "#333",
    marginBottom: 10,
    paddingHorizontal: 20,
    fontWeight: "600",
  },
  congratsText: {
    fontSize: 20,
    color: "#FF5A5F",
    fontWeight: "600",
    marginTop: 10,
  },
  heartContainer: {
    position: "relative",
    marginVertical: 30,
  },
  heart: {
    transform: [{ scale: 1.3 }],
    zIndex: 2,
  },
  heartPulse: {
    position: "absolute",
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 50,
    backgroundColor: "rgba(255, 90, 95, 0.2)",
    zIndex: 1,
  },
  particle: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  circle: {
    borderRadius: 100,
  },
  square: {
    borderRadius: 4,
  },
});

export default function App() {
  const [newLikeCount, setNewLikeCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationSender, setCelebrationSender] = useState("");
  const likesScreenFocusedRef = useRef(false);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUserId) return;

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact" })
        .eq("status", "sent")
        .neq("sender", currentUserId);

      setUnreadMessageCount(count || 0);
    };

    fetchUnreadCount();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const unreadSubscription = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `status=eq.sent`,
        },
        async (payload) => {
          if (payload.new.sender === currentUserId) return;

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact" })
            .eq("status", "sent")
            .neq("sender", currentUserId);

          setUnreadMessageCount(count || 0);
        }
      )
      .subscribe();

    const readStatusSubscription = supabase
      .channel("public:message_read_status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `status=eq.read`,
        },
        async (payload) => {
          if (payload.old.status === "sent") {
            setUnreadMessageCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      unreadSubscription.unsubscribe();
      readStatusSubscription.unsubscribe();
    };
  }, [currentUserId]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("realtime-likes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "likes",
          filter: `receiver=eq.${currentUserId}`,
        },
        async (payload) => {
          if (!likesScreenFocusedRef.current) {
            const { data: sender, error } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.sender)
              .single();

            setCelebrationSender(error ? "Someone" : sender.full_name);
            setShowCelebration(true);
            setNewLikeCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "likes",
          filter: `receiver=eq.${currentUserId}`,
        },
        (payload) => {
          if (!likesScreenFocusedRef.current && newLikeCount > 0) {
            setNewLikeCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [currentUserId, newLikeCount]);

  useEffect(() => {
    const handleDeepLink = (event) => {
      if (event.url.includes("exp+zingo://payment-result")) {
        navigationRef.navigate("PaymentResult");
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "TOKEN_REFRESHED" && session?.user) {
          supabase
            .from("profiles")
            .update({
              session_expires_at: new Date(
                session.expires_at * 1000
              ).toISOString(),
            })
            .eq("id", session.user.id);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLikesFocus = useCallback(() => {
    likesScreenFocusedRef.current = true;
    setNewLikeCount(0);
  }, []);

  const handleLikesBlur = useCallback(() => {
    likesScreenFocusedRef.current = false;
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <ConfettiCelebration
        visible={showCelebration}
        senderName={celebrationSender}
        onClose={() => setShowCelebration(false)}
      />

      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="ProfileSetupScreen"
          component={ProfileSetupScreen}
        />
        <Stack.Screen
          name="ProfileUpdateScreen"
          component={ProfileUpdateScreen}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
        <Stack.Screen name="MainTabs">
          {() => (
            <MainTabs
              newLikeCount={newLikeCount}
              setNewLikeCount={setNewLikeCount}
              unreadMessageCount={unreadMessageCount}
              setUnreadMessageCount={setUnreadMessageCount}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen
          name="EmailVerification"
          component={EmailVerificationScreen}
        />
        <Stack.Screen name="MatchesScreen" component={MatchesScreen} />
        <Stack.Screen name="MessagesScreen" component={MessagesScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="NewMessage" component={NewMessageScreen} />
        <Stack.Screen name="Connect" component={ConnectScreen} />
        <Stack.Screen name="Premium" component={PremiumScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettings} />
        <Stack.Screen name="AppSettings" component={AppSettings} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
        <Stack.Screen name="SafetyTips" component={SafetyTipsScreen} />
        <Stack.Screen name="payment-result" component={PaymentResultScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF5A5F",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
