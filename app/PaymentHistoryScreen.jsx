import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PaymentHistoryScreen = () => {
const { student_id } = useLocalSearchParams();
const router = useRouter();

const [payments, setPayments] = useState([]);
const [totalFee, setTotalFee] = useState('0.00');
const [loading, setLoading] = useState(true);
const [userType, setUserType] = useState('STUDENT');
const [refreshing, setRefreshing] = useState(false);

const fetchPaymentHistory = async () => {
  try {
    const user_type = await AsyncStorage.getItem("userType");
    if (user_type) setUserType(user_type);

    const response = await fetch('https://omcti.in/apprise/api.php?task=student_payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ student_id }),
    });

    const data = await response.json();

    console.log('Course Fee:', data.fee);

    if (data?.payments) {
      setPayments(data.payments);
    }

    if (data?.fee) {
      setTotalFee(data.fee.toString());
    }

  } catch (error) {
    console.error('Error fetching payment history:', error);
    Alert.alert('Error', 'Failed to load payment history. Please try again.');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    fetchPaymentHistory();
  }, [student_id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentHistory();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getTotalPaid = () => {
    return payments.reduce((sum, payment) => sum + parseFloat(payment.paid_amount || 0), 0);
  };

  const getTotalDues = () => {
    return parseFloat(totalFee) - getTotalPaid();
  };

  const PaymentCard = ({ payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.receiptInfo}>
          <Text style={styles.receiptNo}>Receipt #{payment.id}</Text>
          <Text style={styles.paymentDate}>{formatDate(payment.paid_date)}</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={styles.paidAmount}>{formatCurrency(payment.paid_amount)}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.paymentRow}>
          <Text style={styles.label}>Total Fee:</Text>
          <Text style={styles.value}>{formatCurrency(payment.total)}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.label}>Paid Amount:</Text>
          <Text style={[styles.value, styles.paidText]}>{formatCurrency(payment.paid_amount)}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.label}>Remaining Dues:</Text>
          <Text style={[styles.value, styles.duesText]}>{formatCurrency(payment.dues)}</Text>
        </View>
        {payment.remarks && (
          <View style={styles.remarksContainer}>
            <Text style={styles.label}>Remarks:</Text>
            <Text style={styles.remarks}>{payment.remarks}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const SummaryCard = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Payment Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Fee:</Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalFee)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Paid:</Text>
        <Text style={[styles.summaryValue, styles.paidText]}>{formatCurrency(getTotalPaid())}</Text>
      </View>
      <View style={[styles.summaryRow, styles.summaryBorder]}>
        <Text style={styles.summaryLabel}>Outstanding:</Text>
        <Text style={[styles.summaryValue, styles.duesText, styles.outstandingText]}>
          {formatCurrency(getTotalDues())}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#234785', '#3d6aa5']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#ffeb44" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment History</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#234785', '#3d6aa5']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
          
          {/* Pay Fee Button in Header */}
          {userType !== 'STUDENT' ? (
            <TouchableOpacity
              style={styles.headerPayButton}
              onPress={() => {
                router.push({
                  pathname: '/PayFeeScreen',
                  params: {
                    student_id: student_id.toString(),
                    dues: formatCurrency(getTotalDues()),
                  }
                });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.headerPayButtonGradient}>
                <Ionicons name="card" size={20} color="#234785" />
                <Text style={styles.headerPayButtonText}>Pay</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#234785']} />
        }
      >
        <SummaryCard />
        
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Payment History ({payments.length} payments)</Text>
          
          {payments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No payment history found</Text>
            </View>
          ) : (
            payments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            ))
          )}
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 235, 68, 0.15)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffeb44',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 70,
  },
  headerPayButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerPayButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffeb44',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  headerPayButtonText: {
    color: '#234785',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
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
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderTopWidth: 3,
    borderTopColor: '#ffeb44',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234785',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryBorder: {
    borderTopWidth: 2,
    borderTopColor: '#ffeb44',
    paddingTop: 8,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234785',
  },
  outstandingText: {
    fontSize: 18,
  },
  historySection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234785',
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#ffeb44',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9ff',
  },
  receiptInfo: {
    flex: 1,
  },
  receiptNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234785',
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  amountBadge: {
    backgroundColor: '#ffeb44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#234785',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  paidAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234785',
  },
  cardBody: {
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#234785',
  },
  paidText: {
    color: '#28a745',
  },
  duesText: {
    color: '#dc3545',
  },
  remarksContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffeb44',
  },
  remarks: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  bottomPadding: {
    height: 20,
  },
});

export default PaymentHistoryScreen;
