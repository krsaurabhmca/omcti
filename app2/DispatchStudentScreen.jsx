import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from "expo-router";
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const DispatchStudentScreen = ({ navigation, route }) => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [responseLinks, setResponseLinks] = useState({
    ms: '',
    cer: '',
    ac: ''
  });
  
  // Get center_id from route params
  const {center_id} = useLocalSearchParams(); 
  const centerId = center_id; 

  const searchStudents = async (query = searchQuery) => {
    if (!query.trim()) {
      Alert.alert('Search Required', 'Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('https://omcti.in/apprise/api.php?task=dispatched_student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          center_id: centerId,
          value: query.trim()
        })
      });

      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        setStudents(data.data);
        setSearchPerformed(true);
        
        // Store the response links from API
        setResponseLinks({
          ms: data.ms || '',
          cer: data.cer || '',
          ac: data.ac || ''
        });
      } else {
        setStudents([]);
        setSearchPerformed(true);
        setResponseLinks({ ms: '', cer: '', ac: '' });
        Alert.alert('No Results', 'No students found for the search criteria');
      }
    } catch (error) {
      console.error('Error searching students:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
      setStudents([]);
      setResponseLinks({ ms: '', cer: '', ac: '' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (searchQuery.trim()) {
      setRefreshing(true);
      searchStudents();
    }
  };

  const handleSearch = () => {
    searchStudents();
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return '#10B981';
      case 'VERIFIED':
        return '#3B82F6';
      case 'PENDING':
        return '#F59E0B';
      case 'RESULT OUT':
        return '#8B5CF6';
      case 'DISPATCHED':
        return '#059669';
      case 'COMPLETED':
        return '#059669';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN');
    } catch {
      return dateString;
    }
  };

  const handleStudentPress = (item) => { 
    router.push({
      pathname: './StudentDashboard2',
      params: {
        studentId: item.id,
        student_name: item.student_name,
        student_roll: item.student_roll,
        course_code: item.course_code,
      },
    });
  };

  const handleLinkPress = (baseUrl, studentId, type) => {
    if (!baseUrl) {
      Alert.alert('Not Available', `${type} link is not available`);
      return;
    }

    try {
      let studentSpecificUrl = baseUrl;

      router.push({
        pathname: "PdfViewer",
        params: {
          url: studentSpecificUrl,
          title: type || "Document",
        },
      });
    } catch (error) {
      console.error("Error opening PDF:", error);
      Alert.alert("Error", "Failed to open PDF");
    }
  };

  const renderStudentCard = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.studentCard}
      onPress={() => handleStudentPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>          
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>
              {item.student_name || 'Unknown Name'}
            </Text>
            <Text style={styles.enrollmentNo}>
              Roll: {item.student_roll || 'N/A'}
            </Text>
            <Text style={styles.studentId}>
              ID: {item.id || 'N/A'}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={16} color="#234785" />
          <Text style={styles.detailText}>{item.student_mobile || 'No mobile'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="mail" size={16} color="#234785" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.student_email || 'No email'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="school" size={16} color="#234785" />
          <Text style={styles.detailText}>{item.course_name || 'No course'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="code-working" size={16} color="#234785" />
          <Text style={styles.detailText}>Code: {item.course_code || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#234785" />
          <Text style={styles.detailText}>
            DOB: {formatDate(item.date_of_birth)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.cardFooter}>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.msButton,
              !responseLinks.ms && styles.disabledButton
            ]}
            onPress={() => handleLinkPress(responseLinks.ms, item.id, 'Marksheet')}
            disabled={!responseLinks.ms}
          >
            <Ionicons name="document-text" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>MS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.cerButton,
              !responseLinks.cer && styles.disabledButton
            ]}
            onPress={() => handleLinkPress(responseLinks.cer, item.id, 'Certificate')}
            disabled={!responseLinks.cer}
          >
            <Ionicons name="ribbon" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>CER</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.acButton,
              !responseLinks.ac && styles.disabledButton
            ]}
            onPress={() => handleLinkPress(responseLinks.ac, item.id, 'AC Document')}
            disabled={!responseLinks.ac}
          >
            <Ionicons name="shield-checkmark" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>AC</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={64} color="#234785" />
      <Text style={styles.emptyTitle}>
        {searchPerformed ? 'No students found' : 'Search for students'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchPerformed 
          ? 'Try adjusting your search criteria' 
          : 'Enter student name, mobile, or roll number to search'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#234785', '#1a3666']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Search Students</Text>
            <Text style={styles.headerSubtitle}>
              {students.length} student{students.length !== 1 ? 's' : ''} found
            </Text>
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={24} color="#ffeb44" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#234785" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, mobile, or roll number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setStudents([]);
                setSearchPerformed(false);
                setResponseLinks({ ms: '', cer: '', ac: '' });
              }}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#234785" />
          ) : (
            <Ionicons name="search" size={20} color="#234785" />
          )}
        </TouchableOpacity>
      </View>

      {/* Students List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Searching students...</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          renderItem={renderStudentCard}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              enabled={searchQuery.trim().length > 0}
              colors={['#234785']}
              tintColor="#234785"
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffeb44',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255, 235, 68, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#234785',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    flex: 1,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#234785',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#234785',
  },
  clearButton: {
    marginLeft: 12,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffeb44',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#234785',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffeb44',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  studentInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#234785',
    marginBottom: 4,
  },
  enrollmentNo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  msButton: {
    backgroundColor: '#234785',
  },
  cerButton: {
    backgroundColor: '#10B981',
  },
  acButton: {
    backgroundColor: '#3a5fa0',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#234785',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#234785',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DispatchStudentScreen;