import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const SerialsScreen = ({ navigation }) => {
  
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showDateModal, setShowDateModal] = useState(false);
  const [status, setStatus] = useState('EMPTY');
  const [loading, setLoading] = useState(false);
  const [serials, setSerials] = useState([]);
  const [filteredSerials, setFilteredSerials] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const statusOptions = ['EMPTY', 'Used'];
  
  // Generate years (current year and 10 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - i);
  
  // Months
  const months = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ];

  // Format date to YYYY-MM format
  const formatDateToYearMonth = () => {
    const month = selectedMonth.toString().padStart(2, '0');
    return `${selectedYear}-${month}`;
  };

  // Format date for display
  const formatDateForDisplay = () => {
    const monthName = months.find(m => m.value === selectedMonth)?.label || '';
    return `${monthName} ${selectedYear}`;
  };

  // Copy serial number to clipboard
  const copyToClipboard = async (serialNumber) => {
    try {
      await Clipboard.setStringAsync(serialNumber);
      Alert.alert('Copied!', `Serial number "${serialNumber}" copied to clipboard`);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  // Filter serials based on search query
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setFilteredSerials(serials);
    } else {
      const filtered = serials.filter(serial => {
        // Safely convert all fields to searchable strings
        const serialNo = (serial.serial_no || '').toString().toLowerCase();
        const id = (serial.id || '').toString().toLowerCase();
        const studentId = (serial.student_id || '').toString().toLowerCase();
        const useDate = (serial.use_date || '').toString().toLowerCase();
        const query = (searchQuery || '').toString().toLowerCase().trim();
        
        // Return true if any field contains the search query
        return serialNo.includes(query) || 
               id.includes(query) || 
               studentId.includes(query) || 
               useDate.includes(query);
      });
      setFilteredSerials(filtered);
    }
  }, [serials, searchQuery]);

  const fetchSerials = async () => {
    setLoading(true);
    try {
      const yearMonth = formatDateToYearMonth();
      
      const response = await fetch('https://omcti.in/apprise/api.php?task=get_serials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: yearMonth,
          status: status,
        }),
      });

      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        setSerials(data);
        setHasSearched(true);
      } else {
        setSerials([]);
        setHasSearched(true);
        Alert.alert('Info', 'No serials found for the selected criteria.');
      }
    } catch (error) {
      console.error('Error fetching serials:', error);
      Alert.alert('Error', 'Failed to fetch serials. Please try again.');
      setSerials([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSerials();
    setRefreshing(false);
  };

  const handleSubmit = () => {
    fetchSerials();
  };

  const openDateModal = () => {
    setShowDateModal(true);
  };

  const closeDateModal = () => {
    setShowDateModal(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Used':
        return '#e74c3c';
      case 'EMPTY':
        return '#95a5a6';
      default:
        return '#3498db';
    }
  };

  const renderSerialItem = ({ item, index }) => (
    <View style={styles.serialCard}>
      <View style={styles.serialMainInfo}>
        <TouchableOpacity 
          style={styles.serialNumberContainer}
          onPress={() => copyToClipboard(item.serial_no)}
          activeOpacity={0.7}
        >
          <Text style={styles.serialNumber}>{item.serial_no}</Text>
          <View style={styles.copyIndicator}>
            <Ionicons name="copy-outline" size={16} color="#4F46E5" />
          </View>
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.serialDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color="#7f8c8d" />
          <Text style={styles.detailLabel}>ID:</Text>
          <Text style={styles.detailValue}>{item.id}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
          <Text style={styles.detailLabel}>Year:</Text>
          <Text style={styles.detailValue}>{item.issue_year}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#7f8c8d" />
          <Text style={styles.detailLabel}>Used:</Text>
          <Text style={styles.detailValue}>{(item.use_date)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#7f8c8d" />
          <Text style={styles.detailLabel}>Student:</Text>
          <Text style={styles.detailValue}>{item.student_id}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color="#bdc3c7" />
      <Text style={styles.emptyTitle}>No Serials Found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your search criteria and submit again.
      </Text>
    </View>
  );

  const navigateToAddEntry = () => {
    console.log('=== NAVIGATING TO ADD ENTRY ===');
    router.push('AddSerialsScreen');
  };


  return (
    <View style={styles.container}>
      {/* Header */}
    <LinearGradient
      colors={['#4F46E5', '#7C3AED']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Serial Numbers</Text>
          <Text style={styles.headerSubtitle}>View serial records</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddEntry}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>        
    </LinearGradient>

      {/* Form */}
      {!hasSearched && (
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Select Month & Year</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={openDateModal}
            >
              <View style={styles.dateButtonContent}>
                <Ionicons name="calendar" size={20} color="#4F46E5" />
                <Text style={styles.dateButtonText}>
                  {formatDateForDisplay()}
                </Text>
                <Text style={styles.dateFormatText}>
                  ({formatDateToYearMonth()})
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={status}
                onValueChange={setStatus}
                style={styles.picker}
              >
                {statusOptions.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.submitButtonText}>Search Serials</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Date Selection Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month & Year</Text>
              <TouchableOpacity onPress={closeDateModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContainer}>
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>Month</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedMonth}
                    onValueChange={setSelectedMonth}
                    style={styles.picker}
                  >
                    {months.map((month) => (
                      <Picker.Item 
                        key={month.value} 
                        label={month.label} 
                        value={month.value} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>Year</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={setSelectedYear}
                    style={styles.picker}
                  >
                    {years.map((year) => (
                      <Picker.Item 
                        key={year} 
                        label={year.toString()} 
                        value={year} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Text style={styles.selectedDateText}>
                Selected: {formatDateForDisplay()} ({formatDateToYearMonth()})
              </Text>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={closeDateModal}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Search Filter - Only show after initial search */}
      {hasSearched && serials.length > 0 && (
        <View style={styles.filterContainer}>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Filter by serial number, ID, student ID, or date..."
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity 
            style={styles.newSearchButton}
            onPress={() => {
              setHasSearched(false);
              setSerials([]);
              setFilteredSerials([]);
              setSearchQuery('');
            }}
          >
            <Ionicons name="add" size={18} color="#4F46E5" />
            <Text style={styles.newSearchText}>New Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {hasSearched && (
        <View style={styles.resultsContainer}>
          {filteredSerials.length > 0 && (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {searchQuery ? 
                  `${filteredSerials.length} of ${serials.length} serials` :
                  `${serials.length} serial${serials.length !== 1 ? 's' : ''} found`
                }
              </Text>
              <Text style={styles.resultsSubtitle}>
                For {formatDateForDisplay()} • {status}
              </Text>
            </View>
          )}

          <FlatList
            data={filteredSerials}
            renderItem={renderSerialItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={!loading && filteredSerials.length === 0 ? renderEmptyState : null}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4F46E5']}
                tintColor="#4F46E5"
              />
            }
            contentContainerStyle={styles.listContainer}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ecf0f1',
    opacity: 0.9,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 8,
    fontWeight: '600',
    paddingVertical:2,
  },
  dateFormatText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical:2,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  picker: {
    height: 60,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalCloseButton: {
    padding: 4,
  },
  datePickerContainer: {
    padding: 20,
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectedDateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalConfirmButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  newSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    gap: 4,
  },
  newSearchText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsHeader: {
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  listContainer: {
    paddingBottom: 20,
  },
  serialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  serialMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serialNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    paddingRight: 8,
  },
  serialNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  copyIndicator: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0ff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  serialDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SerialsScreen;