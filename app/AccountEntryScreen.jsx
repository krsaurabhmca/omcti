import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const AccountEntryScreen = () => {
  const route = useRoute();
  const { width } = Dimensions.get('window');
  
  // Form state
  const [formData, setFormData] = useState({
    txn_type: '',
    created_by: '',
    txn_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    txn_amount: '',
    txn_mode: '',
    txn_remarks: '',
    center_id: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const txnTypeList = [
    { label: 'Select Type', value: '' },
    { label: 'INCOME', value: 'INCOME' },
    { label: 'EXPENSE', value: 'EXPENSE' }
  ];
  
  const txnModeList = [
    { label: 'Select Mode', value: '' },
    { label: 'BANK', value: 'BANK' },
    { label: 'CASH', value: 'CASH' }
  ];

  useEffect(() => {
    // Initialize form data
    initializeForm();
    
    // Keyboard event listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    // Cleanup function
    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const initializeForm = async () => {
    try {
      // Get center_id from route params or AsyncStorage
      let centerId = route.params?.center_id;
      if (!centerId) {
        centerId = await AsyncStorage.getItem('center_id');
      }
      
      // Get created_by from AsyncStorage (user ID)
      const userId = await AsyncStorage.getItem('user_id');
      
      setFormData(prev => ({
        ...prev,
        center_id: centerId || '',
        created_by: userId || ''
      }));
    } catch (error) {
      console.error('Error initializing form:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const dateString = selectedDate.toISOString().split('T')[0];
      handleInputChange('txn_date', dateString);
    }
  };

  const showDatePickerModal = () => {
    Keyboard.dismiss(); // Dismiss keyboard before showing date picker
    setShowDatePicker(true);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validateForm = () => {
    if (!formData.txn_type) {
      Alert.alert('Error', 'Transaction type is required');
      return false;
    }
    if (!formData.txn_date) {
      Alert.alert('Error', 'Transaction date is required');
      return false;
    }
    if (!formData.txn_amount || parseFloat(formData.txn_amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid transaction amount');
      return false;
    }
    if (!formData.txn_mode) {
      Alert.alert('Error', 'Transaction mode is required');
      return false;
    }
    if (!formData.txn_remarks.trim()) {
      Alert.alert('Error', 'Remarks are required');
      return false;
    }
    if (!formData.center_id) {
      Alert.alert('Error', 'Center ID not found');
      return false;
    }
    return true;
  };

  const submitForm = async () => {
    if (!validateForm()) return;
    
    // Dismiss keyboard before submission
    Keyboard.dismiss();
    setLoading(true);
    
    try {
      const apiUrl = 'https://omcti.in/apprise/api.php?task=account_entry';
      
      // Prepare JSON data
      const jsonData = {
        txn_type: formData.txn_type,
        created_by: formData.created_by,
        txn_date: formData.txn_date,
        txn_amount: parseFloat(formData.txn_amount),
        txn_mode: formData.txn_mode,
        txn_remarks: formData.txn_remarks.trim(),
        center_id: formData.center_id
      };

      // Console log the data being submitted
      console.log('=== ACCOUNT ENTRY SUBMISSION ===');
      console.log('API URL:', apiUrl);
      console.log('Form Data:', formData);
      console.log('JSON Data to be sent:', jsonData);
      console.log('Timestamp:', new Date().toISOString());
      console.log('================================');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(jsonData)
      });

      const result = await response.json();
      
      // Log the response
      console.log('=== API RESPONSE ===');
      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);
      console.log('Result:', result);
      console.log('==================');
      
      if (response.ok && result.status === "success") {
        console.log('✅ Transaction submitted successfully!');
        console.log('Transaction ID:', result.id);
        console.log('Success message:', result.msg);
        
        Alert.alert(
          'Success', 
          result.msg || 'Transaction recorded successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form after successful submission
                setFormData(prev => ({
                  ...prev,
                  txn_amount: '',
                  txn_remarks: '',
                  txn_date: new Date().toISOString().split('T')[0]
                }));
                console.log('Form reset after successful submission');
                console.log('Navigating to AccountScreen...');
                router.push({
                    pathname: '/AccountScreen',
                    params: { center_id: formData.center_id }
                });
              }
            }
          ]
        );
      } else {
        console.log('❌ Submission failed:', result.msg || result.message || 'Unknown error');
        console.log('Response status:', result.status);
        throw new Error(result.msg || result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      console.log('Error details:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      Alert.alert('Error', error.message || 'Failed to submit transaction');
    } finally {
      setLoading(false);
      console.log('Submission process completed, loading set to false');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
          
          {/* Header */}
          <LinearGradient 
            colors={['#4F46E5', '#7C3AED']}  
            style={styles.header}
          >
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => {
                Keyboard.dismiss();
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Account Entry</Text>
            <View style={styles.headerRight} />
          </LinearGradient>

          <ScrollView 
            style={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              
              {/* Transaction Type */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Transaction Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.txn_type}
                    onValueChange={(value) => {
                      handleInputChange('txn_type', value);
                      console.log('Transaction type selected:', value);
                    }}
                    style={styles.picker}
                  >
                    {txnTypeList.map((type, index) => (
                      <Picker.Item
                        key={index}
                        label={type.label}
                        value={type.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Transaction Date */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Transaction Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={showDatePickerModal}>
                  <Ionicons name="calendar-outline" size={20} color="#666" style={styles.dateIcon} />
                  <Text style={styles.dateButtonText}>
                    {formData.txn_date ? new Date(formData.txn_date).toLocaleDateString() : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </View>

              {/* Transaction Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Transaction Amount</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.txn_amount}
                    onChangeText={(value) => {
                      handleInputChange('txn_amount', value);
                      console.log('Amount entered:', value);
                    }}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    placeholderTextColor="#999"
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* Transaction Mode */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Transaction Mode</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.txn_mode}
                    onValueChange={(value) => {
                      handleInputChange('txn_mode', value);
                      console.log('Transaction mode selected:', value);
                    }}
                    style={styles.picker}
                  >
                    {txnModeList.map((mode, index) => (
                      <Picker.Item
                        key={index}
                        label={mode.label}
                        value={mode.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Remarks */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Remarks</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.remarksInput]}
                    value={formData.txn_remarks}
                    onChangeText={(value) => {
                      handleInputChange('txn_remarks', value);
                      console.log('Remarks entered:', value);
                    }}
                    placeholder="Details of Transaction"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={[styles.submitButton, loading && styles.disabledButton]}
              >
                <TouchableOpacity
                  style={styles.submitButtonInner}
                  onPress={submitForm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={styles.submitButtonContent}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.submitIcon} />
                      <Text style={styles.submitButtonText}>Submit Entry</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
            
            {/* Extra padding when keyboard is visible */}
            {keyboardVisible && <View style={styles.keyboardPadding} />}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4c669f',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  formContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  formGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    backgroundColor: '#fafbfc',
    paddingHorizontal: 15,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 12,
    marginLeft: 10,
  },
  inputIcon: {
    marginRight: 5,
  },
  remarksInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    backgroundColor: '#fafbfc',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 52,
    color: '#2c3e50',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 15,
    backgroundColor: '#fafbfc',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateIcon: {
    marginRight: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#4c669f',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    elevation: 5,
    shadowColor: '#4c669f',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
    shadowColor: '#95a5a6',
  },
  submitButtonInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  keyboardPadding: {
    height: 100,
  },
});

export default AccountEntryScreen;