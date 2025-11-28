import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const RechargeRequestScreen = () => {
  const router = useRouter();
  const { center_id } = useLocalSearchParams();
  const centerId = center_id || '266'; // Default fallback

  const [formData, setFormData] = useState({
    amount: '',
    utr_no: '',
    txn_date: new Date().toISOString().split('T')[0], // Today's date
    txn_image: '',
  });

  const [selectedImages, setSelectedImages] = useState({
    txn_image: null,
  });

  const [uploadingImages, setUploadingImages] = useState({
    txn_image: false,
  });
const [selectedDate, setSelectedDate] = useState(new Date());
const [showDatePicker, setShowDatePicker] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false); 
  // Handle back navigation
  const handleGoBack = () => {
    router.back();
  };

  // Handle date selection
  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, txn_date: formattedDate }));
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  // Upload image to server
  const uploadImage = async (asset, imageType) => {
    if (!asset) {
      Alert.alert('Error', 'No image selected');
      return;
    }

    setUploadingImages(prev => ({ ...prev, [imageType]: true }));

    try {
      let localUri = asset.uri;
      let filename = localUri.split('/').pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      let formData = new FormData();
      formData.append('file', {
        uri: localUri,
        name: filename,
        type,
      });

      const response = await fetch('https://omcti.in/apprise/upload_api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update form data with uploaded file name
        setFormData(prev => ({
          ...prev,
          [imageType]: result.file_name
        }));
        
        Alert.alert('Success', `Transaction image uploaded successfully!`);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', `Failed to upload transaction image. Please try again.`);
      
      // Remove the selected image on upload failure
      setSelectedImages(prev => ({
        ...prev,
        [imageType]: null
      }));
    } finally {
      setUploadingImages(prev => ({ ...prev, [imageType]: false }));
    }
  };

  // Pick image from gallery or camera
  const pickImage = async (imageType) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permissions are required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImages(prev => ({
          ...prev,
          [imageType]: asset
        }));
        
        // Upload image immediately after selection
        await uploadImage(asset, imageType);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Take photo with camera
  const takePhoto = async (imageType) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permissions are required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImages(prev => ({
          ...prev,
          [imageType]: asset
        }));
        
        // Upload image immediately after selection
        await uploadImage(asset, imageType);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Show image picker options
  const showImagePickerOptions = (imageType) => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add the transaction image',
      [
        { text: 'Camera', onPress: () => takePhoto(imageType) },
        { text: 'Gallery', onPress: () => pickImage(imageType) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Validate form
  const validateForm = () => {
    if (!formData.amount.trim()) {
      Alert.alert('Validation Error', 'Please enter the recharge amount');
      return false;
    }

    if (parseFloat(formData.amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0');
      return false;
    }

    if (!formData.utr_no.trim()) {
      Alert.alert('Validation Error', 'Please enter the UTR number');
      return false;
    }

    if (formData.utr_no.trim().length < 8) {
      Alert.alert('Validation Error', 'UTR number should be at least 8 characters long');
      return false;
    }

    if (!formData.txn_image) {
      Alert.alert('Validation Error', 'Please upload the transaction image');
      return false;
    }

    return true;
  };

  // Submit recharge request
  const submitRechargeRequest = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        center_id: centerId,
        txn_date: formData.txn_date,
        amount: parseFloat(formData.amount).toFixed(2),
        utr_no: formData.utr_no.trim(),
        txn_remarks: formData.txn_remarks.trim(),
        txn_image: formData.txn_image,
      };

      const response = await fetch('https://omcti.in/apprise/api.php?task=add_recharge_req', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === 'success') {
        Alert.alert(
          'Success!',
          'Recharge request submitted successfully. Your request is being processed.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } else {
        throw new Error(result.msg || 'Failed to submit recharge request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'Failed to submit recharge request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#234785', '#3d6aa5']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#ffeb44" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          {/* <Ionicons name="wallet" size={32} color="#ffeb44" /> */}
          <Text style={styles.headerTitle}>Recharge Request</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recharge Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Recharge Amount *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="currency-rupee" size={20} color="#234785" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount (e.g., 500.00)"
                  value={formData.amount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>UTR Number *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="receipt" size={20} color="#234785" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter UTR/Transaction ID"
                  value={formData.utr_no}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, utr_no: text }))}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Transaction Date</Text>
              <TouchableOpacity 
                style={styles.datePickerContainer}
                onPress={showDatePickerModal}
              >
                <MaterialIcons name="date-range" size={20} color="#234785" style={styles.inputIcon} />
                <Text style={styles.dateText}>{formData.txn_date}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Remarks</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="comment" size={20} color="#234785" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  multiline={true}
                  numberOfLines={4}
                  placeholder="Enter Transaction Remarks"
                  value={formData.txn_remarks}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, txn_remarks: text }))}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Transaction Image *</Text>
            <Text style={styles.helperText}>
              Upload a screenshot or photo of your transaction receipt
            </Text>

            <TouchableOpacity
              style={styles.imageUploadContainer}
              onPress={() => showImagePickerOptions('txn_image')}
              disabled={uploadingImages.txn_image}
            >
              {selectedImages.txn_image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: selectedImages.txn_image.uri }} style={styles.imagePreview} />
                  <View style={styles.imageOverlay}>
                    <MaterialIcons name="edit" size={24} color="white" />
                    <Text style={styles.imageOverlayText}>Change Image</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  {uploadingImages.txn_image ? (
                    <ActivityIndicator size="large" color="#234785" />
                  ) : (
                    <>
                      <MaterialIcons name="cloud-upload" size={48} color="#234785" />
                      <Text style={styles.uploadText}>Tap to upload transaction image</Text>
                      <Text style={styles.uploadSubtext}>JPG, PNG supported</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>

            {formData.txn_image && (
              <View style={styles.uploadSuccess}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.uploadSuccessText}>Image uploaded successfully</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={submitRechargeRequest}
            disabled={isSubmitting}
          >
            <View style={styles.submitButtonGradient}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#234785" />
              ) : (
                <MaterialIcons name="send" size={24} color="#234785" />
              )}
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
          style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(false)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity 
                  onPress={() => {
                    const formattedDate = selectedDate.toISOString().split('T')[0];
                    setFormData(prev => ({ ...prev, txn_date: formattedDate }));
                    setShowDatePicker(false);
                  }}
                  style={styles.modalButton}
                >
                  <Text style={[styles.modalButtonText, { color: '#234785', fontWeight: 'bold' }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                maximumDate={new Date()}
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top:  35,
    left: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(255, 235, 68, 0.15)',
    borderRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffeb44',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
    textAlign: 'center',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderTopWidth: 3,
    borderTopColor: '#ffeb44',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#234785',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff9e6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffeb44',
  },
  infoText: {
    fontSize: 16,
    color: '#234785',
    marginLeft: 10,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#234785',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 15,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  imageUploadContainer: {
    borderWidth: 2,
    borderColor: '#ffeb44',
    borderStyle: 'dashed',
    borderRadius: 15,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  uploadText: {
    fontSize: 16,
    color: '#234785',
    marginTop: 15,
    fontWeight: '600',
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(35, 71, 133, 0.8)',
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageOverlayText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  uploadSuccessText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20,
    backgroundColor: '#ffeb44',
    shadowColor: '#234785',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  submitButtonText: {
    color: '#234785',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#e9ecef',
    justifyContent: 'space-between',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 15,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#234785',
  },
  modalButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#666',
  },
  iosDatePicker: {
    height: 200,
  },
});

export default RechargeRequestScreen;