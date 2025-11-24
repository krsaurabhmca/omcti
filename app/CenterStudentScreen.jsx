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

const CenterStudentScreen = ({ navigation, route }) => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Get center_id from route params or use default
  const {center_id} = useLocalSearchParams(); 
  const centerId = center_id; 

  const fetchStudents = async (searchValue) => {
    if (!searchValue || searchValue.trim() === '') {
      Alert.alert('Search Required', 'Please enter a search term to find students');
      return;
    }

    try {
      setSearchLoading(true);
      setLoading(true);

      const requestBody = {
        center_id: centerId.toString(),
        value: searchValue.trim()
      };

      const response = await fetch('https://omcti.in/apprise/api.php?task=center_student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        setStudents(data.data);
        setHasSearched(true);
      } else {
        Alert.alert('No Results', data.message || 'No students found for your search');
        setStudents([]);
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

  const clearSearch = () => {
    setSearchQuery('');
    setStudents([]);
    setHasSearched(false);
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

  // Helper function to check if student is accessible
  const isStudentAccessible = (student) => {
    const status = student.status?.toString().toUpperCase().trim();
    return status !== "AUTO" && student.id;
  };

  // Enhanced handleStudentPress with PENDING status check
  const handleStudentPress = (item) => {
    // Normalize status to uppercase and trim whitespace
    const status = item.status?.toString().toUpperCase().trim();
    
    // Check if student status is PENDING (case-insensitive)
    if (status === "PENDING") {
      Alert.alert(
        "Profile Not Accessible",
        "Student profile is not accessible. Status is pending.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Additional safety checks
    if (!item.id) {
      Alert.alert(
        "Invalid Data",
        "Invalid student data. Cannot access profile.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Log for debugging (optional)
    console.log(`Navigating to profile for student: ${item.student_name} (Status: ${status})`);
    
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

  const renderStudentCard = ({ item }) => {
    const isAccessible = isStudentAccessible(item);
    const status = item.status?.toString().toUpperCase().trim();
    
    return (
      <TouchableOpacity 
        style={[
          styles.studentCard,
          !isAccessible && styles.disabledCard
        ]}
        onPress={() => handleStudentPress(item)}
        activeOpacity={isAccessible ? 0.8 : 1}
        disabled={!isAccessible}
      >
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <View style={styles.studentDetails}>
              <Text style={[
                styles.studentName,
                !isAccessible && styles.disabledText
              ]}>
                {item.student_name || 'Unknown Name'}
              </Text>
              <Text style={[
                styles.enrollmentNo,
                !isAccessible && styles.disabledText
              ]}>
                Enrollment: {item.student_roll || 'N/A'}
              </Text>
            </View>
          </View>
          
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(item.status) },
            !isAccessible && styles.disabledBadge
          ]}>
            <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Ionicons 
              name="call" 
              size={16} 
              color={!isAccessible ? "#D1D5DB" : "#234785"} 
            />
            <Text style={[
              styles.detailText,
              !isAccessible && styles.disabledText
            ]}>
              {item.student_mobile || 'No mobile'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons 
              name="mail" 
              size={16} 
              color={!isAccessible ? "#D1D5DB" : "#234785"} 
            />
            <Text style={[
              styles.detailText,
              !isAccessible && styles.disabledText
            ]} numberOfLines={1}>
              {item.student_email || 'No email'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons 
              name="school" 
              size={16} 
              color={!isAccessible ? "#D1D5DB" : "#234785"} 
            />
            <Text style={[
              styles.detailText,
              !isAccessible && styles.disabledText
            ]}>
              {item.course_name || 'No course'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons 
              name="calendar" 
              size={16} 
              color={!isAccessible ? "#D1D5DB" : "#234785"} 
            />
            <Text style={[
              styles.detailText,
              !isAccessible && styles.disabledText
            ]}>
              DOB: {formatDate(item.date_of_birth)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderWelcomeScreen = () => (
    <View style={styles.welcomeContainer}>
      <Ionicons name="search" size={80} color="#234785" />
      <Text style={styles.welcomeTitle}>Search Students</Text>
      <Text style={styles.welcomeSubtitle}>
        Enter a student's name, mobile, reg.
      </Text>
      <View style={styles.searchTips}>
        <Text style={styles.tipsTitle}>Search Tips:</Text>
        <Text style={styles.tipItem}>• Use student name (e.g., "John Doe")</Text>
        <Text style={styles.tipItem}>• Use mobile number</Text>
        <Text style={styles.tipItem}>• Use registration number</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#234785" />
      <Text style={styles.emptyTitle}>
        No students found for "{searchQuery}"
      </Text>
      <Text style={styles.emptySubtitle}>
        Try searching with a different keyword
      </Text>
      <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
        <Text style={styles.clearSearchText}>New Search</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#234785" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter name, mobile, reg..."
          value={searchQuery}
          onChangeText={handleSearchInputChange}
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {searchLoading && (
          <ActivityIndicator size="small" color="#234785" style={styles.searchLoader} />
        )}
        {searchQuery && !searchLoading ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSearch}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
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
            <Text style={styles.headerTitle}>Students Search</Text>
            {hasSearched && (
              <Text style={styles.headerSubtitle}>
                {students.length} student{students.length !== 1 ? 's' : ''} found
              </Text>
            )}
          </View>
          
          {hasSearched && (
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
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
                Found {students.length} student{students.length !== 1 ? 's' : ''} for "{searchQuery}"
              </Text>
            </View>
          )}
          
          <FlatList
            data={students}
            renderItem={renderStudentCard}
            keyExtractor={(item) => item.student_id?.toString() || Math.random().toString()}
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
            ListEmptyComponent={renderEmptyState}
          />
        </>
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#234785',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 8,
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
  searchLoader: {
    marginHorizontal: 8,
  },
  clearButton: {
    marginLeft: 12,
  },
  searchButton: {
    backgroundColor: '#ffeb44',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#234785',
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
    borderWidth: 2,
    borderColor: '#234785',
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
    borderBottomWidth: 2,
    borderBottomColor: '#234785',
  },
  resultsText: {
    fontSize: 14,
    color: '#234785',
    textAlign: 'center',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
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
    position: 'relative',
    borderLeftWidth: 4,
    borderLeftColor: '#ffeb44',
  },
  disabledCard: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  disabledBadge: {
    opacity: 0.6,
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
  disabledText: {
    color: '#9CA3AF',
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
    marginBottom: 20,
  },
  clearSearchButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ffeb44',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#234785',
  },
  clearSearchText: {
    color: '#234785',
    fontSize: 16,
    fontWeight: '700',
  },
  pendingOverlay: {},
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#fff',
  },
  unavailableBanner: {
    backgroundColor: '#FEE2E2',
    borderTopColor: '#FECACA',
  },
  pendingText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
});

export default CenterStudentScreen;