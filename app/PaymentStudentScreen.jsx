import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const PaymentStudentScreen = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { center_id } = useLocalSearchParams();
  const router = useRouter();

  const fetchStudents = async (searchValue) => {
    if (!searchValue || searchValue.trim() === '') {
      Alert.alert('Search Required', 'Please enter a search term to find students');
      return;
    }

    try {
      setSearchLoading(true);
      setLoading(true);

      const requestBody = {
        center_id: center_id.toString(),
        value: searchValue.trim()
      };

      const response = await fetch('https://omcti.in/apprise/api.php?task=verified_student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // Debug: Log the first student to see the structure
        if (result.data && result.data.length > 0) {
          console.log('First student data structure:', result.data[0]);
          console.log('Available keys:', Object.keys(result.data[0]));
        }
        
        setStudents(result.data || []);
        setTotalCount(result.count || result.data?.length || 0);
        setHasSearched(true);
      } else {
        Alert.alert('No Results', result.message || 'No students found for your search');
        setStudents([]);
        setTotalCount(0);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchStudents(searchQuery);
    } else {
      Alert.alert('Search Required', 'Please enter a search term to find students');
    }
  };

  const handleSearchInputChange = (text) => {
    setSearchQuery(text);
    
    // Clear results when search is empty
    if (text.trim() === '') {
      setStudents([]);
      setHasSearched(false);
    }
  };

  const onRefresh = () => {
    if (searchQuery.trim()) {
      setRefreshing(true);
      fetchStudents(searchQuery);
    } else {
      Alert.alert('Search Required', 'Please enter a search term first');
    }
  };

  const handleStudentPress = (student) => {
    // Debug: Log the student object to see what's available
    console.log('Student object:', student);
    console.log('Student keys:', Object.keys(student));
    
    // Try different possible ID fields
    let studentId = student.id;
    
    // If no ID found, show all available fields for debugging
    if (!studentId) {
      console.error('No student ID found. Available fields:', Object.keys(student));
      Alert.alert(
        'Error', 
        'Student ID not found. Please check the data structure.',
        [
          {
            text: 'Show Debug Info',
            onPress: () => {
              Alert.alert('Debug Info', `Available fields: ${Object.keys(student).join(', ')}`)
            }
          },
          { text: 'OK' }
        ]
      );
      return;
    }
    
    // Ensure studentId is a string and not empty
    const studentIdString = studentId.toString();
    if (!studentIdString || studentIdString === 'undefined' || studentIdString === 'null') {
      Alert.alert('Error', 'Invalid student ID');
      return;
    }
    
    console.log('Navigating with student ID:', studentIdString);
    
    router.push({
      pathname: '/PaymentHistoryScreen',
      params: {
        student_id: studentIdString,
      }
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setStudents([]);
    setHasSearched(false);
  };

  const getStatusColor = (status) => {
    return status === 'VERIFIED' ? '#4CAF50' : '#FF9800';
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const renderStudentCard = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.studentCard, { marginTop: index === 0 ? 10 : 0 }]}
      onPress={() => handleStudentPress(item)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: item.student_photo
                  ? `https://omcti.in/apprise/temp/upload/${item.student_photo}`
                  : `https://via.placeholder.com/60x60/234785/ffffff?text=${(item.student_name || 'S').charAt(0)}`
              }}
              style={styles.avatar}
              defaultSource={{
                uri: `https://via.placeholder.com/60x60/234785/ffffff?text=${(item.student_name || 'S').charAt(0)}`
              }}
            />
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status || 'PENDING'}</Text>
            </View>
          </View>
          
          <View style={styles.studentInfo}>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.student_name || 'Unknown Student'}
            </Text>
            <Text style={styles.rollNumber}>Roll: {item.student_roll || 'N/A'}</Text>
            <Text style={styles.courseCode}>{item.course_code || 'N/A'}</Text>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.courseInfo}>
          <Text style={styles.courseName} numberOfLines={1}>
            {item.course_name || 'Course not specified'}
          </Text>
          
          <View style={styles.feeContainer}>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Total Fee</Text>
              <Text style={styles.feeAmount}>{formatCurrency(item.total)}</Text>
            </View>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Paid</Text>
              <Text style={[styles.feeAmount, styles.paidAmount]}>{formatCurrency(item.paid || 0)}</Text>
            </View>
            {(item.dues > 0 || (item.total && item.paid && parseFloat(item.total) - parseFloat(item.paid || 0) > 0)) && (
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Dues</Text>
                <Text style={[styles.feeAmount, styles.duesAmount]}>
                  {formatCurrency(item.dues || (parseFloat(item.total || 0) - parseFloat(item.paid || 0)))}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Ionicons name="call" size={14} color="#234785" />
            <Text style={styles.contactText}>{item.student_mobile || 'N/A'}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="calendar" size={14} color="#234785" />
            <Text style={styles.contactText}>
              {item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString('en-IN') : 'N/A'}
            </Text>
          </View>
        </View>        
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#234785" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter student name, roll no, course..."
          value={searchQuery}
          onChangeText={handleSearchInputChange}
          placeholderTextColor="#999"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {searchLoading && (
          <ActivityIndicator size="small" color="#234785" style={styles.searchLoader} />
        )}
        {searchQuery && !searchLoading ? (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {searchQuery.length > 0 && (
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={handleSearch}
          disabled={searchLoading}
        >
          <Text style={styles.searchButtonText}>
            {searchLoading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderWelcomeScreen = () => (
    <View style={styles.welcomeContainer}>
      <Ionicons name="search" size={80} color="#234785" />
      <Text style={styles.welcomeTitle}>Search Students</Text>
      <Text style={styles.welcomeSubtitle}>
        Enter a student's name, roll number, or course to find their payment information
      </Text>
      <View style={styles.searchTips}>
        <Text style={styles.tipsTitle}>Search Tips:</Text>
        <Text style={styles.tipItem}>• Use student name (e.g., "John Doe")</Text>
        <Text style={styles.tipItem}>• Use roll number (e.g., "2024001")</Text>
        <Text style={styles.tipItem}>• Use mobile number</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={['#234785', '#3d6aa5']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Students Search</Text>
          {hasSearched && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={24} color="#ffeb44" />
            </TouchableOpacity>
          )}
          {!hasSearched && <View style={styles.placeholder} />}
        </View>
      </LinearGradient>

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Content */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Searching students...</Text>
        </View>
      )}

      {!loading && !hasSearched && renderWelcomeScreen()}

      {!loading && hasSearched && (
        <>
          {students.length > 0 && (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                Found {totalCount} student{totalCount !== 1 ? 's' : ''} for "{searchQuery}"
              </Text>
            </View>
          )}
          
          <FlatList
            data={students}
            renderItem={renderStudentCard}
            keyExtractor={(item, index) => {
              return (item.id || 
                      item.student_id || 
                      item.sid || 
                      item.user_id || 
                      `student_${index}`).toString();
            }}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#234785']}
                tintColor="#234785"
              />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  No students found for "{searchQuery}"
                </Text>
                <Text style={styles.emptySubtext}>
                  Try searching with a different keyword
                </Text>
                <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                  <Text style={styles.clearSearchText}>New Search</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: StatusBar.currentHeight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
    backgroundColor: 'rgba(255, 235, 68, 0.15)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffeb44',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 5,
    backgroundColor: 'rgba(255, 235, 68, 0.15)',
    borderRadius: 20,
  },
  placeholder: {
    width: 34,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  searchLoader: {
    marginHorizontal: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#ffeb44',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    shadowColor: '#234785',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  searchButtonText: {
    color: '#234785',
    fontSize: 16,
    fontWeight: '700',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#234785',
    marginTop: 24,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  searchTips: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: 3,
    borderTopColor: '#ffeb44',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#234785',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  resultsHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: 14,
    color: '#234785',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  studentCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffeb44',
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ffeb44',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#234785',
    marginBottom: 2,
  },
  rollNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#234785',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ffeb44',
  },
  moreButton: {
    padding: 4,
  },
  courseInfo: {
    marginBottom: 12,
  },
  courseName: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    marginBottom: 8,
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeb44',
  },
  feeItem: {
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#234785',
  },
  paidAmount: {
    color: '#4CAF50',
  },
  duesAmount: {
    color: '#f44336',
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffeb44',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ffeb44',
    borderRadius: 8,
    shadowColor: '#234785',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  clearSearchText: {
    color: '#234785',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PaymentStudentScreen;