import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const PayFeeScreen = ({ route }) => {
  const { student_id } = useLocalSearchParams();
  const { dues } = useLocalSearchParams();

  // Helper function to clean currency values
  const cleanCurrencyValue = (value) => {
    if (!value) return '';
    // Remove currency symbols, commas, and other non-numeric characters except decimal point
    return value.toString().replace(/[₹\u20b9,\s]/g, '').replace(/[^\d.-]/g, '');
  };

  // Clean the dues value when initializing
  const cleanDues = cleanCurrencyValue(dues);

  const [formData, setFormData] = useState({
    receipt_no: '',
    student_id,
    paid_date: new Date().toISOString().split('T')[0],
    paid_amount: '',
    previous_dues: cleanDues,
    installment: '',
    checksms: false
  });

  const [loading, setLoading] = useState(false);

  // Refs for input navigation
  const receiptRef = useRef(null);
  const dateRef = useRef(null);
  const amountRef = useRef(null);
  const installmentRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { paid_amount, installment } = formData;

    if (!paid_amount.trim()) {
      Alert.alert('Error', 'Please enter Amount to Pay');
      amountRef.current?.focus();
      return false;
    }

    const amount = parseFloat(paid_amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      amountRef.current?.focus();
      return false;
    }

    if (!installment.trim()) {
      Alert.alert('Error', 'Please enter Installment details');
      installmentRef.current?.focus();
      return false;
    }

    return true;
  };

  const showSuccessMessage = (paidAmount, remainingDues) => {
    const successMessage = `Payment Successfully Updated!\n\n` +
      `✅ Paid Amount: ₹${paidAmount}\n` +
      `💰 Previous Dues: ₹${formData.previous_dues}\n` +
      `📊 Remaining Dues: ₹${remainingDues}\n`;

    Alert.alert(
      '🎉 Payment Success',
      successMessage,
      [
        {
          text: 'OK',
          onPress: () => {
            // Go back to previous screen with reload
            router.back();
            // Alternative: If you want to go to a specific screen with reload
            // router.push('/(tabs)/students'); // Replace with your target route
          }
        }
      ]
    );
  };

  const submitPayment = async () => {
    if (!validateForm()) return;

    // Dismiss keyboard before submitting
    Keyboard.dismiss();
    setLoading(true);

    try {
      // Clean all numeric values before sending
      const cleanPaidAmount = cleanCurrencyValue(formData.paid_amount);
      const cleanPreviousDues = cleanCurrencyValue(formData.previous_dues);
      
      const payload = {
        student_id: formData.student_id,
        paid_date: formData.paid_date,
        paid_amount: cleanPaidAmount,
        previous_dues: cleanPreviousDues,
        total: cleanPreviousDues,
        remarks: formData.installment,
        checksms: formData.checksms ? 'yes' : 'no'
      };

      // Only add receipt_no if it has a value
      if (formData.receipt_no.trim()) {
        payload.receipt_no = formData.receipt_no.trim();
      }

      console.log('Payload being sent:', payload); // For debugging

      const response = await fetch(
        'https://omcti.in/apprise/api.php?task=pay_fee',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const responseText = await response.text();
      console.log('Response:', responseText);
      
      // Check if the payment was successful
      // You might need to adjust this condition based on your API response format
      const isSuccess = response.ok && responseText && 
        !responseText.toLowerCase().includes('error') && 
        !responseText.toLowerCase().includes('failed');

      if (isSuccess) {
        // Calculate remaining dues
        const paidAmount = parseFloat(cleanPaidAmount);
        const previousDues = parseFloat(cleanPreviousDues);
        const remainingDues = Math.max(0, previousDues - paidAmount);

        // Show success message with payment details
        showSuccessMessage(cleanPaidAmount, remainingDues.toString());
      } else {
        // Show error message
        Alert.alert(
          'Payment Failed', 
          responseText || 'Payment could not be processed. Please try again.',
          [{ text: 'OK', onPress: () => console.log('Payment failed acknowledged') }]
        );
      }
    } catch (error) {
      Alert.alert('Error', `Failed to process payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const focusNextInput = (nextRef) => {
    nextRef?.current?.focus();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <LinearGradient
        colors={['#234785', '#3d6aa5']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Fee</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView 
            contentContainerStyle={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.form}>
              {/* Receipt No */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Receipt No.</Text>
                <TextInput
                  ref={receiptRef}
                  style={styles.input}
                  value={formData.receipt_no}
                  onChangeText={(value) => handleInputChange('receipt_no', value)}
                  placeholder="Enter receipt number (optional)"
                  returnKeyType="next"
                  onSubmitEditing={() => focusNextInput(dateRef)}
                  blurOnSubmit={false}
                />
              </View>

              {/* Date of Payment */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date of Payment</Text>
                <TextInput
                  ref={dateRef}
                  style={styles.input}
                  value={formData.paid_date}
                  onChangeText={(value) => handleInputChange('paid_date', value)}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => focusNextInput(amountRef)}
                  blurOnSubmit={false}
                />
              </View>

              {/* Dues Amount (Read-only) */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Dues Amount</Text>
                <View style={[styles.input, styles.readonlyInput]}>
                  <Text style={styles.readonlyText}>₹{formData.previous_dues}</Text>
                </View>
              </View>

              {/* Amount to Pay */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, styles.errorLabel]}>Enter Amount to Pay *</Text>
                <TextInput
                  ref={amountRef}
                  style={[styles.input, styles.errorInput]}
                  value={formData.paid_amount}
                  onChangeText={(value) => handleInputChange('paid_amount', value)}
                  placeholder="Enter amount to pay"
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => focusNextInput(installmentRef)}
                  blurOnSubmit={false}
                />
              </View>

              {/* Installment */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Installment *</Text>
                <TextInput
                  ref={installmentRef}
                  style={styles.input}
                  value={formData.installment}
                  onChangeText={(value) => handleInputChange('installment', value)}
                  placeholder="Enter installment details"
                  returnKeyType="done"
                  onSubmitEditing={submitPayment}
                  blurOnSubmit={true}
                />
              </View>

              {/* SMS Checkbox */}
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => handleInputChange('checksms', !formData.checksms)}
                activeOpacity={0.7}
              >
                <Checkbox
                  style={styles.checkbox}
                  value={formData.checksms}
                  onValueChange={(value) => handleInputChange('checksms', value)}
                  color={formData.checksms ? '#234785' : undefined}
                />
                <Text style={styles.checkboxLabel}>Send SMS Also (if Internet Connection)</Text>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={submitPayment}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#234785" />
                ) : (
                  <Text style={styles.submitButtonText}>Make A Payment</Text>
                )}
              </TouchableOpacity>

              {/* Keyboard shortcut hint */}
              <Text style={styles.hintText}>
                💡 Tip: Use "Next" button on keyboard to navigate between fields, or "Done" to submit
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  keyboardView: {
    flex: 1
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? Constants.statusBarHeight : StatusBar.currentHeight || 0
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15
  },
  backButton: {
    padding: 5
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffeb44',
    textAlign: 'center',
    marginRight: 34
  },
  placeholder: {
    width: 34
  },
  scrollView: {
    padding: 20,
    flexGrow: 1
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderTopWidth: 3,
    borderTopColor: '#ffeb44'
  },
  formGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#234785'
  },
  errorLabel: {
    color: '#d9534f'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48 // Better touch target
  },
  errorInput: {
    borderColor: '#d9534f'
  },
  readonlyInput: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    borderColor: '#e0e0e0'
  },
  readonlyText: {
    fontSize: 16,
    color: '#234785',
    fontWeight: '500'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 10,
    paddingHorizontal: 5
  },
  checkbox: {
    marginRight: 12,
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] // Larger touch target
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20
  },
  submitButton: {
    backgroundColor: '#ffeb44',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginBottom: 15,
    shadowColor: '#234785',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  disabledButton: {
    opacity: 0.7
  },
  submitButtonText: {
    color: '#234785',
    fontSize: 18,
    fontWeight: 'bold'
  },
  hintText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 5
  }
});

export default PayFeeScreen;