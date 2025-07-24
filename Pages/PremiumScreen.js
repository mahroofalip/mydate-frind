import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,SafeAreaView } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function PremiumScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  
  const features = [
    { icon: 'favorite', title: 'Unlimited Likes', description: 'Swipe right as much as you want' },
    { icon: 'visibility', title: 'See Who Likes You', description: 'Find out who liked you instantly' },
    { icon: 'bolt', title: 'Priority Profile', description: 'Get shown first to potential matches' },
    { icon: 'lock-open', title: 'Unlock All Features', description: 'Access advanced filters and more' },
    { icon: 'map', title: 'Global Passport', description: 'Match with people anywhere in the world' },
    { icon: 'message', title: 'Message Anyone', description: 'Chat with your matches without limits' },
  ];

  const plans = [
    {
      id: 'monthly',
      title: 'Monthly',
      price: '$19.99',
      period: 'per month',
      popular: false,
      discount: '',
      originalPrice: ''
    },
    {
      id: 'quarterly',
      title: '3 Months',
      price: '$14.99',
      period: 'per month',
      popular: true,
      discount: '25% OFF',
      originalPrice: '$19.99'
    },
    {
      id: 'yearly',
      title: 'Annual',
      price: '$9.99',
      period: 'per month',
      popular: false,
      discount: '50% OFF',
      originalPrice: '$19.99'
    }
  ];

  const handleSubscribe = () => {
    navigation.navigate('Payment', { plan: selectedPlan });
  };

  return (
     <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#FF5A5F" />
          </TouchableOpacity>
          <Text style={styles.title}>Premium Membership</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Hero Section */}
        <LinearGradient
          colors={['#FF5A5F', '#FF8C94']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.crownContainer}>
            <MaterialIcons name="star" size={42} color="#FFD700" />
          </View>
          <Text style={styles.heroTitle}>Unlock Premium Features</Text>
          <Text style={styles.heroSubtitle}>Find your perfect match faster with premium benefits</Text>
        </LinearGradient>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Benefits</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <MaterialIcons name={feature.icon} size={28} color="#FF5A5F" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlan,
                  plan.popular && styles.popularPlan
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
                {plan.discount && (
                  <Text style={styles.planDiscount}>{plan.discount}</Text>
                )}
                {plan.originalPrice && (
                  <Text style={styles.planOriginal}>{plan.originalPrice}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Success Stories</Text>
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
              <Image 
                source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} 
                style={styles.testimonialAvatar}
              />
              <View>
                <Text style={styles.testimonialName}>Sarah & Michael</Text>
                <Text style={styles.testimonialDate}>Matched on Feb 14, 2023</Text>
              </View>
            </View>
            <Text style={styles.testimonialText}>
              "We both had Premium and connected instantly! The advanced filters helped us find each other despite living in different cities."
            </Text>
          </View>
        </View>

        {/* Payment Security - Now properly placed at the bottom */}
        <View style={styles.securitySection}>
          <FontAwesome name="lock" size={24} color="#4CAF50" />
          <Text style={styles.securityText}>Secure Payment · 256-bit SSL encryption</Text>
        </View>
        
        {/* Spacer to prevent content from being hidden */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Subscribe Button - Fixed position */}
      <LinearGradient
        colors={['#FF5A5F', '#FF8C94']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.buttonContainer}
      >
        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
          <Text style={styles.buttonText}>CONTINUE WITH PREMIUM</Text>
          <Text style={styles.buttonSubtext}>7-day free trial, then {plans.find(p => p.id === selectedPlan).price}/mo</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
        flex: 1,
        backgroundColor: '#f0f2f5',
        paddingTop: 40,
        paddingBottom: 40
    },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  hero: {
    padding: 30,
    margin: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  crownContainer: {
    backgroundColor: '#fff',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5A5F20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 13,
    color: '#666',
  },
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planCard: {
    width: (width - 60) / 3,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FF5A5F10',
  },
  popularPlan: {
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF5A5F',
    marginBottom: 5,
  },
  planPeriod: {
    fontSize: 13,
    color: '#888',
    marginBottom: 5,
  },
  planDiscount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: '#4CAF5020',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 5,
  },
  planOriginal: {
    fontSize: 12,
    color: '#888',
    textDecorationLine: 'line-through',
    marginTop: 5,
  },
  testimonialCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  testimonialAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  testimonialDate: {
    fontSize: 13,
    color: '#888',
  },
  testimonialText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  securitySection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginHorizontal: 20,
    // marginBottom: 20,
  },
  securityText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 25,
    paddingTop: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  subscribeButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5A5F',
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#888',
  },
});