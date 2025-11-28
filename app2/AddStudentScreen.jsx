import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const AddStudentScreen = () => {
  const router = useRouter();
  const { center_id } = useLocalSearchParams(); // Get center_id from route params
  
  const [formData, setFormData] = useState({
    student_name: '',
    student_father: '',
    student_mobile: '',
    date_of_birth: new Date(),
    student_mother: '',
    student_sex: '',
    student_address: '',
    student_email: '',
    student_photo_old: '',
    student_photo: '',
    student_edu_proof: '',
    student_id_proof: '',
    student_qualification: 'Matric',
    student_bloodgroup: 'Matric',
    center_id: center_id || '', // Use center_id from params
    course_id: '',
    student_roll: '',
    status: 'PENDING',
    course_fee: '',
  });

  const [showDatePicker, setShowDatePicker] = useState({ birth: false, admission: false });
  const [selectedImages, setSelectedImages] = useState({
    student_photo: null,
    student_edu_proof: null,
    student_id_proof: null,
  });
  const [uploadingImages, setUploadingImages] = useState({
    student_photo: false,
    student_edu_proof: false,
    student_id_proof: false,
  });
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [tempCourseSearch, setTempCourseSearch] = useState('');
  const [lastRoll, setLastRoll] = useState(''); // New state for last_roll

  const genders = ['MALE', 'FEMALE', 'OTHERS'];
  const statusOptions = ['PENDING'];

  // Fetch last roll number from API
  const fetchLastRoll = async () => {
    try {
      const response = await fetch('https://omcti.in/apprise/api.php?task=lastroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ center_id: center_id }),
      });
      const data = await response.json();
      
      if (response.ok && data.last_roll) {
        setLastRoll(data.last_roll);
      } else {
        throw new Error('Failed to fetch last roll');
      }
    } catch (error) {
      console.error('Error fetching last roll:', error);
      Alert.alert('Error', 'Failed to load last roll number. Please try again.');
    }
  };

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await fetch('https://omcti.in/apprise/api.php?task=get_courses');
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        setCourses(data);
      } else {
        throw new Error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to load courses. Please try again.');
    } finally {
      setLoadingCourses(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCourses();
    fetchLastRoll(); // Fetch last roll when component mounts
  }, []);

  // Filter courses based on search
  const filteredCourses = courses.filter(course =>
    course.course_name?.toLowerCase().includes(tempCourseSearch.toLowerCase()) ||
    course.course_code?.toLowerCase().includes(tempCourseSearch.toLowerCase())
  );

  // Handle course selection
  const handleCourseSelect = (course) => {
    setFormData(prev => ({ ...prev, course_id: course.id }));
    setCourseSearch(`${course.course_code} (${course.course_name})`);
    setShowCourseModal(false);
    setTempCourseSearch('');
  };

  // Generate 5-digit random prefix
  const generateRandomPrefix = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle date changes
  const handleDateChange = (event, selectedDate, type) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(prev => ({ ...prev, [type]: false }));
    }
    
    if (selectedDate) {
      const field = type === 'birth' ? 'date_of_birth' : 'admission_date';
      setFormData(prev => ({
        ...prev,
        [field]: selectedDate
      }));
    }
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB');
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
        setFormData(prev => ({
          ...prev,
          [imageType]: result.file_name
        }));
        
        Alert.alert('Success', `${imageType.replace('_', ' ')} uploaded successfully!`);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', `Failed to upload ${imageType.replace('_', ' ')}. Please try again.`);
      
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
        aspect: imageType === 'student_photo' ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImages(prev => ({
          ...prev,
          [imageType]: asset
        }));
        
        await uploadImage(asset, imageType);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Validate form data
  const validateForm = () => {
    const requiredFields = [
      'student_name',
      'student_father',
      'student_mobile',
      'student_mother',
      'student_address',
      'student_roll',
      'course_id'
    ];

    for (const field of requiredFields) {
      if (!formData[field].toString().trim()) {
        Alert.alert('Validation Error', `Please fill in ${field.replace('_', ' ')}`);
        return false;
      }
    }

    if (!formData.center_id) {
      Alert.alert('Validation Error', 'Center ID is required');
      return false;
    }

    if (formData.student_email && formData.student_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.student_email)) {
        Alert.alert('Validation Error', 'Please enter a valid email address');
        return false;
      }
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.student_mobile)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number');
      return false;
    }

    return true;
  };

  // Submit form data
  const submitForm = async () => {
    if (!validateForm()) return;

    const isUploading = Object.values(uploadingImages).some(uploading => uploading);
    if (isUploading) {
      Alert.alert('Please wait', 'Images are still uploading. Please wait and try again.');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        date_of_birth: formData.date_of_birth.toISOString().split('T')[0],
        admission_date: formData.admission_date.toISOString().split('T')[0],
      };

      const response = await fetch('https://omcti.in/apprise/api.php?task=add_student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Student added successfully!', [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]);
      } else {
        throw new Error(result.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Student</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.student_name}
              onChangeText={(value) => handleInputChange('student_name', value)}
              placeholder="Enter full name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Father's Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.student_father}
              onChangeText={(value) => handleInputChange('student_father', value)}
              placeholder="Enter father's name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mother's Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.student_mother}
              onChangeText={(value) => handleInputChange('student_mother', value)}
              placeholder="Enter mother's name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date of Birth *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(prev => ({ ...prev, birth: true }))}
            >
              <Text style={styles.dateText}>{formatDate(formData.date_of_birth)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
            {showDatePicker.birth && (
              <DateTimePicker
                value={formData.date_of_birth}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleDateChange(event, date, 'birth')}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.student_sex}
                onValueChange={(value) => handleInputChange('student_sex', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Gender" value="" />
                {genders.map((gender) => (
                  <Picker.Item key={gender} label={gender} value={gender} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.student_mobile}
              onChangeText={(value) => handleInputChange('student_mobile', value)}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={formData.student_email}
              onChangeText={(value) => handleInputChange('student_email', value)}
              placeholder="Enter email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.student_address}
              onChangeText={(value) => handleInputChange('student_address', value)}
              placeholder="Enter complete address"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Qualification</Text>
            <TextInput
              style={styles.input}
              value={formData.student_qualification}
              onChangeText={(value) => handleInputChange('student_qualification', value)}
              placeholder="Enter highest qualification"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Course *</Text>
            {loadingCourses ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={styles.loadingText}>Loading courses...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  setShowCourseModal(true);
                  setTempCourseSearch(courseSearch);
                }}
              >
                <Text style={[styles.selectButtonText, !courseSearch && styles.placeholderText]}>
                  {courseSearch || 'Select Course'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Course Fee</Text>
              <TextInput
                style={styles.input}
                value={formData.course_fee}
                onChangeText={(value) => handleInputChange('course_fee', value)}
                placeholder="Enter amount"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Reg. No. *</Text>
                {lastRoll ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{lastRoll}</Text>
                  </View>
                ) : null}
              </View>
              <TextInput
                style={styles.input}
                value={formData.student_roll}
                onChangeText={(value) => handleInputChange('student_roll', value)}
                placeholder="1234"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Documents</Text>

          <View style={styles.imageContainer}>
            <Text style={styles.label}>Student Photo</Text>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => pickImage('student_photo')}
              disabled={uploadingImages.student_photo}
            >
              {uploadingImages.student_photo ? (
                <View style={styles.imageButtonContent}>
                  <ActivityIndicator size="large" color="#007bff" />
                  <Text style={styles.imageButtonText}>Uploading...</Text>
                </View>
              ) : selectedImages.student_photo ? (
                <Image source={{ uri: selectedImages.student_photo.uri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imageButtonContent}>
                  <Ionicons name="camera-outline" size={32} color="#666" />
                  <Text style={styles.imageButtonText}>Upload Photo</Text>
                  <Text style={styles.imageButtonSubText}>Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.imageContainer, styles.halfWidth]}>
              <Text style={styles.label}>Educational Proof</Text>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage('student_edu_proof')}
                disabled={uploadingImages.student_edu_proof}
              >
                {uploadingImages.student_edu_proof ? (
                  <View style={styles.imageButtonContent}>
                    <ActivityIndicator size="small" color="#007bff" />
                    <Text style={styles.imageButtonTextSmall}>Uploading...</Text>
                  </View>
                ) : selectedImages.student_edu_proof ? (
                  <Image source={{ uri: selectedImages.student_edu_proof.uri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imageButtonContent}>
                    <Ionicons name="document-outline" size={24} color="#666" />
                    <Text style={styles.imageButtonTextSmall}>Educational Proof</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.imageContainer, styles.halfWidth]}>
              <Text style={styles.label}>ID Proof</Text>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage('student_id_proof')}
                disabled={uploadingImages.student_id_proof}
              >
                {uploadingImages.student_id_proof ? (
                  <View style={styles.imageButtonContent}>
                    <ActivityIndicator size="small" color="#007bff" />
                    <Text style={styles.imageButtonTextSmall}>Uploading...</Text>
                  </View>
                ) : selectedImages.student_id_proof ? (
                  <Image source={{ uri: selectedImages.student_id_proof.uri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imageButtonContent}>
                    <Ionicons name="card-outline" size={24} color="#666" />
                    <Text style={styles.imageButtonTextSmall}>ID Proof</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={submitForm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            )}
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding Student...' : 'Add Student'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal
        visible={showCourseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCourseModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCourseModal(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Course</Text>
            <View style={styles.modalSpacer} />
          </View>

          <View style={styles.modalSearchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                value={tempCourseSearch}
                onChangeText={setTempCourseSearch}
                placeholder="Search courses by name or code"
                placeholderTextColor="#999"
                autoFocus={true}
              />
              {tempCourseSearch ? (
                <TouchableOpacity onPress={() => setTempCourseSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            style={styles.modalList}
            renderItem={({ item: course }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  formData.course_id === course.id && styles.selectedModalItem
                ]}
                onPress={() => handleCourseSelect(course)}
              >
                <View style={styles.modalItemContent}>
                  <Text style={styles.modalItemTitle}>
                    {course.course_name || 'Unknown Course'}
                  </Text>
                  <Text style={styles.modalItemCode}>
                    Code: {course.course_code || 'N/A'}
                  </Text>
                </View>
                {formData.course_id === course.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#007bff" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No courses found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Try searching with different keywords
                </Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop:40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  badge: {
    backgroundColor: '#2c136eff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 0,
    marginBottom:-5,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  modalSpacer: {
    width: 40,
  },
  modalSearchContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  modalList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedModalItem: {
    backgroundColor: '#e3f2fd',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modalItemCode: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  imageContainer: {
    marginBottom: 20,
  },
  imageButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    minHeight: 120,
  },
  imageButtonContent: {
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  imageButtonTextSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  imageButtonSubText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  submitContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 50,
  },
});

export default AddStudentScreen;