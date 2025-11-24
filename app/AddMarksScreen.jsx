import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const AddMarksScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse the student data from params
  const [student, setStudent] = useState(null);
  const [student_id, setStudentId] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [grade, setGrade] = useState('');

  // Parse student data from params on component mount
  useEffect(() => {
    try {
      if (params.student) {
        const parsedStudent = JSON.parse(params.student);
        setStudent(parsedStudent);
        // Assuming the student object has an id field - adjust this based on your data structure
        const studentId = parsedStudent.student_id || parsedStudent.id || parsedStudent.ID;
        setStudentId(studentId);
        
        if (!studentId) {
          Alert.alert('Error', 'No student ID found in student data', [
            { text: 'Go Back', onPress: () => router.push('/') }
          ]);
          return;
        }
      } else {
        Alert.alert('Error', 'No student data provided', [
          { text: 'Go Back', onPress: () => router.push('/') }
        ]);
        return;
      }
    } catch (error) {
      console.error('Error parsing student data:', error);
      Alert.alert('Error', 'Invalid student data format', [
        { text: 'Go Back', onPress: () => router.push('/') }
      ]);
    }
  }, [params.student]);

  // Fetch student papers data when student_id is available
  useEffect(() => {
    if (student_id) {
      fetchStudentData();
    }
  }, [student_id]);

  useEffect(() => {
    calculatePercentageAndGrade();
  }, [papers]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data for student_id:', student_id);
      
      const response = await fetch('https://omcti.in/apprise/api.php?task=get_papers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ student_id: student_id }),
      });

      const data = await response.json();
      
      if (data.student && data.marks) {
        setStudentData(data.student);
        setPapers(data.marks.papers || []);
      } else {
        Alert.alert('Error', 'Failed to fetch student data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentageAndGrade = () => {
    if (papers.length === 0) return;

    let totalMarks = 0;
    let totalFullMarks = 0;
    let hasAllMarks = true;

    papers.forEach(paper => {
      totalFullMarks += parseInt(paper.full_marks);
      if (paper.marks_obtained !== null && paper.marks_obtained !== '') {
        totalMarks += parseInt(paper.marks_obtained) || 0;
      } else {
        hasAllMarks = false;
      }
    });

    if (hasAllMarks && totalFullMarks > 0) {
      const calculatedPercentage = (totalMarks / totalFullMarks) * 100;
      setPercentage(calculatedPercentage.toFixed(2));
      
      // Calculate grade based on percentage
      let calculatedGrade = '';
      const per = calculatedPercentage;
      
      if (per < 100 && per >= 85) {
        calculatedGrade = "A";
      } else if (per < 85 && per >= 70) {
        calculatedGrade = "B";
      } else if (per < 70 && per >= 55) {
        calculatedGrade = "C";
      } else if (per < 55 && per >= 40) {
        calculatedGrade = "D";
      } else {
        calculatedGrade = "FAIL";
      }
      
      setGrade(calculatedGrade);
    } else {
      setPercentage(0);
      setGrade('');
    }
  };

  const updateMarks = (index, marks) => {
    const updatedPapers = [...papers];
    updatedPapers[index].marks_obtained = marks;
    setPapers(updatedPapers);
  };

  const validateMarks = () => {
    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      if (paper.marks_obtained === null || paper.marks_obtained === '') {
        Alert.alert('Validation Error', `Please enter marks for ${paper.paper_name}`);
        return false;
      }
      
      const marks = parseInt(paper.marks_obtained);
      const fullMarks = parseInt(paper.full_marks);
      
      if (isNaN(marks) || marks < 0 || marks > fullMarks) {
        Alert.alert('Validation Error', 
          `Marks for ${paper.paper_name} should be between 0 and ${fullMarks}`);
        return false;
      }
    }
    return true;
  };

  const submitMarks = async () => {
    if (!validateMarks()) return;

    try {
      setSubmitting(true);
      
      // Calculate total marks
      let totalMarks = 0;
      papers.forEach(paper => {
        if (paper.marks_obtained) {
          totalMarks += parseInt(paper.marks_obtained) || 0;
        }
      });

      // Determine remarks based on grade
      const remarks = (grade === 'FAIL') ? 'FAIL' : 'PASS';
      
      // Create flat JSON structure
      const submitData = {
        student_id: parseInt(student_id),
        total: totalMarks,
        percentage: parseFloat(percentage),
        grade: grade,
        remarks: remarks
      };

      // Add paper marks as individual fields
      papers.forEach((paper, index) => {
        submitData[`paper${index + 1}`] = parseInt(paper.marks_obtained) || 0;
      });

      console.log('Submitting data:', JSON.stringify(submitData, null, 2));

      const response = await fetch('https://omcti.in/apprise/api.php?task=submit_marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Get response text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Try to parse as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse error:', parseError);
        console.error('Response was not valid JSON:', responseText);
        
        // Check if response contains success indicators
        if (responseText.toLowerCase().includes('success') || 
            responseText.toLowerCase().includes('submitted')) {
          Alert.alert('Success', 'Marks submitted successfully!', [
            { text: 'OK', onPress: () => fetchStudentData() }
          ]);
          return;
        } else {
          Alert.alert('Error', 'Server returned invalid response. Please check your data and try again.');
          return;
        }
      }
      
      if (response.ok || response.status === 200) {
        // Check for success in various ways
        if (result && (result.success === true || 
                      result.status === 'success' || 
                      result.message?.toLowerCase().includes('success'))) {
          Alert.alert('Success', 'Marks submitted successfully!', [
            { text: 'OK', onPress: () => router.push('/StudentsScreen') }
          ]);
        } else {
          const errorMessage = result?.message || result?.error || 'Failed to submit marks. Please try again.';
          Alert.alert('Error', errorMessage);
        }
      } else {
        const errorMessage = result?.message || result?.error || `Server error (${response.status}). Please try again.`;
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error submitting marks:', error);
      
      if (error.message.includes('Network request failed')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a809baff" />
        <Text style={styles.loadingText}>Loading student data...</Text>
      </View>
    );
  }

  if (!student_id || !student) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No student data provided</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.push('/')}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use student data from params if studentData from API is not available yet
  const displayStudentData = studentData || student;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#a809baff", "#7809bcff"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Marks Entry</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Student Info Card */}
      <View style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{displayStudentData.student_name || displayStudentData.name}</Text>
          <Text style={styles.studentDetail}>Roll: {displayStudentData.student_roll || displayStudentData.roll}</Text>
          <Text style={styles.studentDetail}>Course ID: {displayStudentData.course_id}</Text>
        </View>
        {displayStudentData.student_photo && (
          <Image 
            source={{ uri: `https://omcti.in/apprise/temp/upload/${displayStudentData.student_photo}` }}
            style={styles.studentPhoto}
            />
        )}
      </View>

      {/* Papers Section */}
      <View style={styles.papersSection}>
        <Text style={styles.sectionTitle}>Papers</Text>
        
        {papers.length === 0 ? (
          <View style={styles.noPapersContainer}>
            <Text style={styles.noPapersText}>No papers found for this student</Text>
          </View>
        ) : (
          papers.map((paper, index) => (
            <View key={index} style={styles.paperCard}>
              <Text style={styles.paperName}>{paper.paper_name}</Text>
              <View style={styles.paperDetails}>
                <Text style={styles.paperInfo}>Full Marks: {paper.full_marks}</Text>
                <Text style={styles.paperInfo}>Pass Marks: {paper.pass_marks}</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Marks Obtained:</Text>
                <TextInput
                  style={styles.marksInput}
                  value={paper.marks_obtained ? paper.marks_obtained.toString() : ''}
                  onChangeText={(text) => updateMarks(index, text)}
                  placeholder="Enter marks"
                  keyboardType="numeric"
                  maxLength={3}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  selectTextOnFocus={true}
                />
              </View>
            </View>
          ))
        )}
      </View>

      {/* Results Section */}
      {papers.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Results</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Percentage:</Text>
            <Text style={styles.resultValue}>{percentage}%</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Grade:</Text>
            <Text style={[styles.resultValue, styles.grade]}>{grade}</Text>
          </View>
        </View>
      )}

      {/* Submit Button */}
      {papers.length > 0 && (
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={submitMarks}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Marks</Text>
          )}
        </TouchableOpacity>
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#a809baff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32, // Same width as back button for centering
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  studentCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  studentDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  studentPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  papersSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  noPapersContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noPapersText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  paperCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paperName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  paperDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paperInfo: {
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 12,
    minWidth: 100,
  },
  marksInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    minHeight: 44, // Better touch target
  },
  resultsSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 16,
    color: '#a809baff',
    fontWeight: 'bold',
  },
  grade: {
    fontSize: 18,
  },
  submitButton: {
    backgroundColor: '#28a745',
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 40, // Extra space for keyboard
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddMarksScreen;