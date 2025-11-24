import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const StudentsScreen = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const {center_id} = useLocalSearchParams(); 
  const centerId = center_id; 

  // Fetch students from API
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

      const response = await fetch('https://omcti.in/apprise/api.php?task=verified_student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setStudents(result.data || []);
        setHasSearched(true);
      } else {
        Alert.alert('No Results', result.message || 'No students found for your search');
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

  // Handle refresh
  const onRefresh = () => {
    if (searchQuery.trim()) {
      setRefreshing(true);
      fetchStudents(searchQuery);
    } else {
      Alert.alert('Search Required', 'Please enter a search term first');
    }
  };

  // Handle back button press
  const handleBackPress = () => {
    router.back();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setStudents([]);
    setHasSearched(false);
  };

  // Handle edit button press
  const handleEditPress = (student) => {
    router.push({
      pathname: 'AddMarksScreen',
      params: { 
        student_id: student.student_id || student.id,
        student: JSON.stringify(student) 
      }
    });
  };

  // Render welcome screen
  const renderWelcomeScreen = () => (
    <View style={styles.welcomeContainer}>
      <Ionicons name="search" size={80} color="#234785" />
      <Text style={styles.welcomeTitle}>Search Students</Text>
      <Text style={styles.welcomeSubtitle}>
        Enter a student's name, reg. number, or mobile to find their information for marks entry
      </Text>
      <View style={styles.searchTips}>
        <Text style={styles.tipsTitle}>Search Tips:</Text>
        <Text style={styles.tipItem}>• Use student name (e.g., "John Doe")</Text>
        <Text style={styles.tipItem}>• Use reg. number (e.g., "2024001")</Text>
        <Text style={styles.tipItem}>• Use mobile number</Text>
      </View>
    </View>
  );

  // Render individual student item
  const renderStudentItem = ({ item }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <View style={styles.photoContainer}>
          {item.student_photo ? (
            <Image
              source={{ uri: `https://omcti.in/apprise/temp/upload/${item.student_photo}` }}
              style={styles.studentPhoto}
              />
          ) : (
            <View style={styles.defaultPhoto}>
              <Ionicons name="person" size={30} color="#234785" />
            </View>
          )}
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.studentName}>{item.student_name || 'N/A'}</Text>
          <Text style={styles.studentDetail}>
            <Text style={styles.label}>Roll: </Text>
            {item.student_roll || 'N/A'}
          </Text>
          <Text style={styles.studentDetail}>
            <Text style={styles.label}>Course: </Text>
            {item.course_name || 'N/A'}
          </Text>
          <Text style={styles.studentDetail}>
            <Text style={styles.label}>Code: </Text>
            {item.course_code || 'N/A'}
          </Text>
          <Text style={styles.studentDetail}>
            <Text style={styles.label}>Course ID: </Text>
            {item.course_id || 'N/A'}
          </Text>
          <Text style={styles.studentDetail}>
            <Text style={styles.label}>Mobile: </Text>
            {item.student_mobile || 'N/A'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditPress(item)}
      >
        <Ionicons name="create-outline" size={20} color="#234785" />
        <Text style={styles.editButtonText}>Marks Entry</Text>
      </TouchableOpacity>
    </View>
  );

  // Render search bar
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

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={50} color="#ccc" />
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
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header with LinearGradient */}
        <LinearGradient
          colors={["#234785", "#3d6aa5"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={24} color="#ffeb44" />
            </TouchableOpacity>
            
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Students Search</Text>
            </View>
            
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Searching students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with LinearGradient */}
      <LinearGradient
        colors={["#234785", "#3d6aa5"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Students Search</Text>
            {hasSearched && (
              <Text style={styles.subtitle}>
                {students.length} student{students.length !== 1 ? 's' : ''} found
              </Text>
            )}
          </View>
          
          {hasSearched && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={24} color="#ffeb44" />
            </TouchableOpacity>
          )}
          {!hasSearched && <View style={styles.headerSpacer} />}
        </View>
      </LinearGradient>

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Content */}
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
            renderItem={renderStudentItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#234785']}
                tintColor="#234785"
              />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
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
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 235, 68, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
    backgroundColor: 'rgba(255, 235, 68, 0.15)',
    borderRadius: 20,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 34, // Same width as back button to center the text
  },
  refreshButton: {
    padding: 5,
    backgroundColor: 'rgba(255, 235, 68, 0.15)',
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffeb44',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
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
    elevation: 3,
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
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#ffeb44',
  },
  studentInfo: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  photoContainer: {
    marginRight: 15,
  },
  studentPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ffeb44',
  },
  defaultPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff9e6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffeb44',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234785',
    marginBottom: 5,
  },
  studentDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  label: {
    fontWeight: '600',
    color: '#234785',
  },
  editButton: {
    backgroundColor: '#ffeb44',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#234785',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  editButtonText: {
    color: '#234785',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
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
    elevation: 3,
  },
  clearSearchText: {
    color: '#234785',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default StudentsScreen;