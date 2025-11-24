import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Quick amount presets
const QUICK_AMOUNTS = [200, 500, 1000, 2000, 5000];

export default function RechargeScreen() {
  const { center_id, center_name, center_code } = useLocalSearchParams();
  const [amount, setAmount] = useState("200");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState("");

  const validateAmount = (value) => {
    const numValue = parseInt(value);
    if (!value || isNaN(numValue)) {
      setAmountError("Please enter a valid amount");
      return false;
    }
    if (numValue < 200) {
      setAmountError("Minimum recharge amount is ₹200");
      return false;
    }
    if (numValue > 100000) {
      setAmountError("Maximum recharge amount is ₹1,00,000");
      return false;
    }
    setAmountError("");
    return true;
  };

  const handleAmountChange = (value) => {
    // Remove non-numeric characters
    const cleanValue = value.replace(/[^0-9]/g, "");
    setAmount(cleanValue);
    if (cleanValue) {
      validateAmount(cleanValue);
    } else {
      setAmountError("");
    }
  };

  const selectQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
    setAmountError("");
    Keyboard.dismiss();
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleRecharge = async () => {
    if (!validateAmount(amount)) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        center_id: center_id,
        credit_amt: amount,
        txn_date: date.toISOString().split("T")[0],
      };

      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=recharge",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      
      if (data.status === "success") {
        Alert.alert(
          "Recharge Successful! 🎉", 
          `${formatCurrency(parseInt(amount))} has been credited to ${center_name}`,
          [
            {
              text: "Continue",
              onPress: () => router.replace("/AdminDashboard"),
            },
          ]
        );
      } else {
        Alert.alert("Recharge Failed", data.message || "Unable to process recharge. Please try again.");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#234785" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recharge Center</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Center Info Card */}
        <View style={styles.centerCard}>
          <View style={styles.centerHeader}>
            <Ionicons name="business" size={24} color="#234785" />
            <Text style={styles.centerTitle}>Center Details</Text>
          </View>
          
          <View style={styles.centerInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Code</Text>
              <Text style={styles.infoValue}>{center_code}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{center_name}</Text>
            </View>
          </View>
        </View>

        {/* Recharge Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Recharge Amount</Text>
          
          {/* Quick Amount Selection */}
          <View style={styles.quickAmountContainer}>
            <Text style={styles.quickAmountLabel}>Quick Select</Text>
            <View style={styles.quickAmountGrid}>
              {QUICK_AMOUNTS.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    amount === quickAmount.toString() && styles.quickAmountButtonActive
                  ]}
                  onPress={() => selectQuickAmount(quickAmount)}
                >
                  <Text style={[
                    styles.quickAmountText,
                    amount === quickAmount.toString() && styles.quickAmountTextActive
                  ]}>
                    ₹{quickAmount.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Custom Amount</Text>
            <View style={[styles.amountInputWrapper, amountError && styles.inputError]}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                keyboardType="numeric"
                placeholder="Enter amount"
                onChangeText={handleAmountChange}
                maxLength={6}
              />
            </View>
            {amountError ? (
              <Text style={styles.errorText}>{amountError}</Text>
            ) : null}
          </View>

          {/* Date Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Transaction Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#234785" />
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)} // 30 days ago
            />
          )}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Transaction Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount to Credit</Text>
            <Text style={styles.summaryAmount}>
              {amount ? formatCurrency(parseInt(amount)) : '₹0'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transaction Date</Text>
            <Text style={styles.summaryValue}>{formatDate(date)}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.rechargeButton,
            (loading || !amount || amountError) && styles.rechargeButtonDisabled
          ]}
          disabled={loading || !amount || !!amountError}
          onPress={handleRecharge}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.rechargeButtonText}>Processing...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="card" size={20} color="#234785" />
              <Text style={styles.rechargeButtonText}>
                Recharge {amount ? formatCurrency(parseInt(amount)) : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 3,
    borderBottomColor: "#ffeb44",
    paddingTop: 30,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#234785",
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderTopWidth: 3,
    borderTopColor: "#ffeb44",
  },
  centerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  centerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#234785",
    marginLeft: 8,
  },
  centerInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff9e6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffeb44",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#234785",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderTopWidth: 3,
    borderTopColor: "#ffeb44",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#234785",
    marginBottom: 16,
  },
  quickAmountContainer: {
    marginBottom: 24,
  },
  quickAmountLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    fontWeight: "500",
  },
  quickAmountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#e9ecef",
    minWidth: 80,
    alignItems: "center",
  },
  quickAmountButtonActive: {
    backgroundColor: "#ffeb44",
    borderColor: "#ffeb44",
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  quickAmountTextActive: {
    color: "#234785",
    fontWeight: "700",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#234785",
    marginBottom: 8,
  },
  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: "#dc3545",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#234785",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#234785",
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#dc3545",
    marginTop: 4,
    marginLeft: 4,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#234785",
    marginLeft: 12,
    fontWeight: "500",
  },
  summaryCard: {
    backgroundColor: "#fff9e6",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#ffeb44",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#234785",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#234785",
  },
  rechargeButton: {
    backgroundColor: "#ffeb44",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  rechargeButtonDisabled: {
    backgroundColor: "#adb5bd",
    shadowOpacity: 0,
    elevation: 0,
  },
  rechargeButtonText: {
    color: "#234785",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});