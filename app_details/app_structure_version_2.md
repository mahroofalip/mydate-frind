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