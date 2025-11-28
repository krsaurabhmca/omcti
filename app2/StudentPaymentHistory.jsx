import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const StudentPaymentHistory = ({ route }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  
  // Get student data from route params
  const { 
    studentId, 
    student_name = 'Unknown Student',
    student_roll = 'N/A',
    course_code = 'N/A'
  } = route?.params || {};

  useEffect(() => {
    if (studentId) {
      fetchPaymentHistory();
    } else {
      Alert.alert('Error', 'Student ID not provided');
      router.back();
    }
  }, [studentId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://omcti.in/apprise/api.php?task=fee_statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setPaymentHistory(data.data || []);
        // Set student info from route params
        setStudentInfo({
          name: student_name,
          roll: student_roll,
          course: course_code
        });
      } else {
        Alert.alert('Error', 'Failed to fetch payment history');
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentHistory();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const getMonthName = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  const calculateTotalPaid = () => {
    return paymentHistory.reduce((total, payment) => {
      return total + (parseFloat(payment.amount) || 0);
    }, 0);
  };

  const renderPaymentCard = ({ item, index }) => (
    <View style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.paymentNumber}>
          <Text style={styles.paymentNumberText}>#{paymentHistory.length - index}</Text>
        </View>
        <View style={styles.paymentDate}>
          <Text style={styles.dateText}>{formatDate(item.paid_date)}</Text>
          <Text style={styles.monthText}>{getMonthName(item.paid_date)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="receipt-outline" size={16} color="#234785" />
            <Text style={styles.detailLabel}>Receipt No:</Text>
            <Text style={styles.detailValue}>
              {item.receipt_no || 'Not Generated'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color="#234785" />
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={[styles.detailValue, styles.amountText]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>

          {item.payment_method && (
            <View style={styles.detailRow}>
              <Ionicons name="card-outline" size={16} color="#234785" />
              <Text style={styles.detailLabel}>Method:</Text>
              <Text style={styles.detailValue}>{item.payment_method}</Text>
            </View>
          )}

          {item.remarks && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#234785" />
              <Text style={styles.detailLabel}>Remarks:</Text>
              <Text style={styles.detailValue}>{item.remarks}</Text>
            </View>
          )}

          {item.transaction_id && (
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#234785" />
              <Text style={styles.detailLabel}>Transaction ID:</Text>
              <Text style={styles.detailValue}>{item.transaction_id}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.receiptButton}>
          <Ionicons name="download-outline" size={16} color="#234785" />
          <Text style={styles.receiptButtonText}>Download Receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Payment History</Text>
      <Text style={styles.emptySubtitle}>
        No payment records found for this student
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Payment Summary</Text>
      </View>
      
      <View style={styles.summaryBody}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Payments</Text>
          <Text style={styles.summaryValue}>{paymentHistory.length}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount Paid</Text>
          <Text style={[styles.summaryValue, styles.totalAmountText]}>
            {formatCurrency(calculateTotalPaid())}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Last Payment</Text>
          <Text style={styles.summaryValue}>
            {paymentHistory.length > 0 ? formatDate(paymentHistory[0].paid_date) : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#234785', '#3d6aa5']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Payment History</Text>
            <Text style={styles.headerSubtitle}>
              {studentInfo?.name || 'Student Payment Records'}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#ffeb44" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Student Info Bar */}
      {studentInfo && (
        <View style={styles.studentInfoBar}>
          <View style={styles.studentInfoContent}>
            <View style={styles.studentInfoItem}>
              <Text style={styles.studentInfoLabel}>Roll No:</Text>
              <Text style={styles.studentInfoValue}>{studentInfo.roll}</Text>
            </View>
            <View style={styles.studentInfoItem}>
              <Text style={styles.studentInfoLabel}>Course:</Text>
              <Text style={styles.studentInfoValue}>{studentInfo.course}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      ) : (
        <FlatList
          data={paymentHistory}
          renderItem={renderPaymentCard}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
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
          ListHeaderComponent={paymentHistory.length > 0 ? renderHeader : null}
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
    paddingTop: 20,
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
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfoBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#ffeb44',
  },
  studentInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  studentInfoItem: {
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeb44',
    minWidth: 120,
  },
  studentInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  studentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#234785',
  },
  listContainer: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 3,
    borderTopColor: '#ffeb44',
  },
  summaryHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#234785',
  },
  summaryBody: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#234785',
  },
  totalAmountText: {
    fontSize: 16,
    color: '#10B981',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ffeb44',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  paymentNumber: {
    backgroundColor: '#fff9e6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeb44',
  },
  paymentNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#234785',
  },
  paymentDate: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#234785',
  },
  monthText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cardBody: {
    padding: 16,
  },
  paymentDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#234785',
    flex: 1,
    fontWeight: '500',
  },
  amountText: {
    fontWeight: '700',
    color: '#10B981',
    fontSize: 16,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffeb44',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#234785',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#234785',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
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

export default StudentPaymentHistory;