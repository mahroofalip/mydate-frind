┌───────────────────────┐
│     WelcomeScreen     │
│   (Entry Point)       │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│      AuthScreen       │
│  (Login/Signup)       │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ ProfileSetupScreen    │
│ (New users only)      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────┐
│                         MainTabNavigator                          │
│ ┌────────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ ┌────────┐ │
│ │ Discover   │ │ Matches   │ │ Messages  │ │ Likes   │ │ Profile│ │
│ │ (Home)     │ │           │ │           │ │         │ │        │ │
│ └─────┬──────┘ └─────┬─────┘ └─────┬─────┘ └────┬────┘ └────┬───┘ │
└───────┼──────────────┼────────────┼────────────┼───────────┼─────┘
        │              │            │            │           │
        ▼              ▼            ▼            ▼           ▼
┌──────────────┐ ┌────────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│ HomeScreen   │ │MatchesScreen│ │Messages  │ │Likes    │ │Profile   │
│ (Swipe)      │ │             │ │Screen    │ │Screen   │ │Screen    │
└───────┬──────┘ └───────┬─────┘ └────┬─────┘ └────┬────┘ └────┬─────┘
        │                │            │            │           │
        ▼                ▼            ▼            ▼           ▼
┌──────────────┐ ┌────────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│SearchScreen  │ │ ChatScreen │ │ChatScreen│ │Profile  │ │EditProfile│
│              │ │            │ │          │ │Detail   │ │Screen     │
└───────┬──────┘ └────────────┘ └──────────┘ └────┬────┘ └────┬──────┘
        │                                         │           │
        ▼                                         ▼           ▼
┌──────────────┐                          ┌────────────┐ ┌──────────┐
│ProfileDetail │                          │Settings    │ │Premium   │
│Screen        │                          │Screen      │ │Screen    │
└──────────────┘                          └────────────┘ └──────────┘

////


1. WelcomeScreen
Entry point of the app

2. AuthScreen
Login / Signup

3. ProfileSetupScreen
Only shown to new users after sign-up

4. MainTabNavigator
Contains the following tabs:

Discover (HomeScreen)

Swipe functionality

→ SearchScreen

→ ProfileDetailScreen

Matches (MatchesScreen)

→ ChatScreen

Messages (MessagesScreen)

→ ChatScreen

Likes (LikesScreen)

→ ProfileDetailScreen

Profile (ProfileScreen)

→ EditProfileScreen

→ SettingsScreen

→ PremiumScreen

