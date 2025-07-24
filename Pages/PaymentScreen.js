import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../lib/supabase'; // Make sure to import your supabase instance

const { width } = Dimensions.get('window');

export default function PaymentScreen({ navigation, route }) {
  const { plan } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);

  // Plan details with actual amounts in INR
  const planDetails = {
    monthly: {
      name: 'Monthly',
      price: '₹299',
      total: '₹299',
      amount: 29900, // in paise (299 * 100)
      savings: '',
      description: 'Billed monthly, cancel anytime'
    },
    quarterly: {
      name: '3 Months',
      price: '₹249',
      total: '₹747',
      amount: 74700,
      savings: 'Save ₹150',
      description: 'Billed every 3 months'
    },
    yearly: {
      name: 'Annual',
      price: '₹199',
      total: '₹2388',
      amount: 238800,
      savings: 'Save ₹1,200',
      description: 'Billed annually (best value)'
    }
  };

  const selectedPlan = planDetails[plan] || planDetails.monthly;

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [rememberCard, setRememberCard] = useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvc || !cardholderName) {
      alert('Please fill all payment details');
      return;
    }

    setIsProcessing(true);

    try {
      
      navigation.navigate('PaymentResult', {
        success: true,
        transactionId: "TXN123456789",
        plan: selectedPlan,
      });

    } catch (error) {
      console.log('Payment error:', error);
      navigation.navigate('PaymentResult', {
        success: false,
        error: error.description || 'Payment failed',
        plan: selectedPlan,
      });

    } finally {
      setIsProcessing(false);
    }
  };


  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const formatExpiry = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Format as MM/YY
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    setExpiry(formatted);
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
            <Text style={styles.title}>Payment</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Plan Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Premium {selectedPlan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{selectedPlan.price}</Text>
                <Text style={styles.perMonth}>/month</Text>
              </View>
            </View>

            <Text style={styles.planDescription}>{selectedPlan.description}</Text>

            <View style={styles.summaryDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.detailText}>Unlimited Likes</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.detailText}>See Who Likes You</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.detailText}>Priority Profile</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.detailText}>All Premium Features</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{selectedPlan.total}</Text>
              </View>

              {selectedPlan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{selectedPlan.savings}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Payment Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            {/* Card Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.inputWithIcon}>
                <FontAwesome name="credit-card" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={cardNumber}
                  onChangeText={formatCardNumber}
                  maxLength={19}
                />
              </View>
            </View>

            {/* Expiry and CVC */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialIcons name="date-range" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={expiry}
                    onChangeText={formatExpiry}
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.inputLabel}>CVC</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialIcons name="lock" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={cvc}
                    onChangeText={setCvc}
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            {/* Cardholder Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <View style={styles.inputWithIcon}>
                <MaterialIcons name="person" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Smith"
                  placeholderTextColor="#888"
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Remember Card */}
            <TouchableOpacity
              style={styles.rememberContainer}
              onPress={() => setRememberCard(!rememberCard)}
            >
              <View style={styles.checkbox}>
                {rememberCard && (
                  <MaterialIcons name="check" size={16} color="#FF5A5F" />
                )}
              </View>
              <Text style={styles.rememberText}>Save card for future payments</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Security */}
          <View style={styles.securitySection}>
            <FontAwesome name="lock" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>Your payment is secure and encrypted with 256-bit SSL</Text>
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentMethods}>
            <Image source={require('../assets/visa.png')} style={styles.paymentLogo} />
            <Image source={require('../assets/mastercard.png')} style={styles.paymentLogo} />
            <Image source={require('../assets/amex.png')} style={styles.paymentLogo} />
            <Image source={require('../assets/rupay.png')} style={styles.paymentLogo} />
            <Image source={require('../assets/upi.png')} style={styles.paymentLogo} />
          </View>

          {/* Spacer */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Pay Button */}
        <LinearGradient
          colors={['#FF5A5F', '#FF8C94']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FF5A5F" />
            ) : (
              <>
                <Text style={styles.buttonText}>PAY {selectedPlan.total}</Text>
                <Text style={styles.buttonSubtext}>7-day free trial included</Text>
              </>
            )}
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
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    margin: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  perMonth: {
    fontSize: 14,
    color: '#888',
    marginLeft: 5,
  },
  summaryDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  savingsBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF5A5F20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 5,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FF5A5F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rememberText: {
    fontSize: 15,
    color: '#555',
  },
  securitySection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  securityText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginTop: 10,
  },
  paymentLogo: {
    width: 50,
    height: 30,
    resizeMode: 'contain',
    margin: 5,
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
  payButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
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