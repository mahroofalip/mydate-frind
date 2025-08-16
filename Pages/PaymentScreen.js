import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { planDetails } from "../data/emojies";

const { width } = Dimensions.get("window");

export default function PaymentScreen({ navigation, route }) {
  const { plan } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);

  

  const selectedPlan = planDetails[plan] || planDetails.monthly;

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const deepLinkUrl = `exp+zingo://payment-result`;
      const paymentLink = await generateRazorpayPaymentLink(
        selectedPlan.amount,
        user.email,
        user.user_metadata?.full_name || user.email.split("@")[0],
        deepLinkUrl
      );
      // Open the payment link
      await Linking.openURL(paymentLink);

      // Reset processing state
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      Alert.alert(
        "Payment Error",
        error.message || "Failed to process payment"
      );
      console.error("Payment error:", error);
    }
  };

  const generateRazorpayPaymentLink = async (
    amount,
    email,
    name,
    deepLinkUrl
  ) => {
    // 1️⃣ Create a unique reference ID
    RAZORPAY_KEY_ID = "rzp_test_yAmKS8PpXJe6eJ";
    RAZORPAY_KEY_SECRET = "idjxQ3RPeLeBjvFbNiSN5A2h";

const prefix = user.id.replace(/-/g, "").slice(0, 8); 
const suffix = Date.now().toString().slice(-6);  
const referenceId = `${prefix}-${suffix}`; // ~15 chars
    // console.log("Reference ID:", referenceId);
    // console.log(referenceId.length, "Reference ID Length");
    // console.log(user.id.length, "User ID Length");
    
    
    // 2️⃣ Insert pending record into Supabase
    const { error: insertErr } = await supabase.from("payments").insert([
      {
        user_id: user.id,
        plan_id: plan,
        amount_inr: amount,
        status: "pending",
        reference_id: referenceId,
      },
    ]);

    if (insertErr) {
      throw new Error("Payment initiation failed. Please try again.");
    }

    // 3️⃣ Call Razorpay API with same referenceId
    const requestBody = {
      amount,
      currency: "INR",
      description: `Premium ${selectedPlan.name} Subscription`,
      reference_id: referenceId,
      customer: { name, email },
      notify: { sms: false, email: false },
      reminder_enable: false,
      callback_url: deepLinkUrl,
      callback_method: "get",
    };

    const response = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(
          `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
        )}`,
      },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();
    if (response.status !== 200) {
      // optionally cleanup pending record if needed
      throw new Error(
        data.error?.description || "Failed to create payment link"
      );
    }

    return data.short_url;
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
              <Text style={styles.summaryTitle}>
                Premium {selectedPlan.name}
              </Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{selectedPlan.price}</Text>
                <Text style={styles.perMonth}>/month</Text>
              </View>
            </View>

            <Text style={styles.planDescription}>
              {selectedPlan.description}
            </Text>

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

          {/* Payment Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            <View style={styles.paymentInfoCard}>
              <MaterialIcons
                name="payment"
                size={28}
                color="#FF5A5F"
                style={styles.paymentIcon}
              />
              <Text style={styles.paymentInfoText}>
                You'll be redirected to Razorpay's secure payment page to
                complete your transaction
              </Text>
            </View>
          </View>

          {/* Payment Security */}
          <View style={styles.securitySection}>
            <MaterialIcons name="security" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>
              Secure payment processing with 256-bit SSL encryption
            </Text>
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentMethods}>
            <Image
              source={require("../assets/visa.png")}
              style={styles.paymentLogo}
            />
            <Image
              source={require("../assets/mastercard.png")}
              style={styles.paymentLogo}
            />
            <Image
              source={require("../assets/amex.png")}
              style={styles.paymentLogo}
            />
            <Image
              source={require("../assets/rupay.png")}
              style={styles.paymentLogo}
            />
            <Image
              source={require("../assets/upi.png")}
              style={styles.paymentLogo}
            />
          </View>

          {/* Spacer */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Pay Button */}
        <LinearGradient
          colors={["#FF5A5F", "#FF8C94"]}
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
                <Text style={styles.buttonText}>PROCEED TO PAYMENT</Text>
                <Text style={styles.buttonSubtext}>
                  Secure payment with Razorpay
                </Text>
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
    backgroundColor: "#f0f2f5",
     paddingTop: 40,
     paddingBottom: 40
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    margin: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  planDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FF5A5F",
  },
  perMonth: {
    fontSize: 14,
    color: "#888",
    marginLeft: 5,
  },
  summaryDetails: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: "#555",
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF5A5F",
  },
  savingsBadge: {
    alignSelf: "flex-end",
    backgroundColor: "#FF5A5F20",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 5,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF5A5F",
  },
  securitySection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  securityText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  paymentMethods: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginHorizontal: 20,
    marginTop: 10,
  },
  paymentLogo: {
    width: 50,
    height: 30,
    resizeMode: "contain",
    margin: 5,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 25,
    paddingTop: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  payButton: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5A5F",
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: "#888",
  },
  paymentInfoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  paymentIcon: {
    marginRight: 15,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },
});
