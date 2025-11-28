import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WalletStatementScreen = ({ route, navigation }) => {
  const { center_id } = useLocalSearchParams();
  
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  
  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    fetchWalletStatement();
  }, []);

  const fetchWalletStatement = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://omcti.in/apprise/api.php?task=wallet_statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ center_id: center_id }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // Sort by date descending
        const sortedData = result.data.sort((a, b) => new Date(b.txn_date) - new Date(a.txn_date));
        setStatements(sortedData);
        setTotalPages(Math.ceil(sortedData.length / ITEMS_PER_PAGE));
        
        // Calculate totals
        const creditTotal = sortedData.reduce((sum, item) => 
          sum + (item.credit_amt ? parseFloat(item.credit_amt) : 0), 0
        );
        const debitTotal = sortedData.reduce((sum, item) => 
          sum + (item.debit_amt ? parseFloat(item.debit_amt) : 0), 0
        );
        
        setTotalCredit(creditTotal);
        setTotalDebit(debitTotal);
      } else {
        Alert.alert('Error', 'Failed to fetch wallet statement');
      }
    } catch (error) {
      console.error('Error fetching wallet statement:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchWalletStatement();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount) => {
    return amount ? `₹${parseFloat(amount).toFixed(2)}` : '-';
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return statements.slice(startIndex, endIndex);
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#234785" />
          <Text style={styles.dateText}>{formatDate(item.txn_date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'SUCCESS' ? '#E8F5E8' : '#FFF0F0' }]}>
          <Text style={[styles.statusText, { color: item.status === 'SUCCESS' ? '#2D7D2D' : '#D32F2F' }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <Text style={styles.remarksText} numberOfLines={2}>
        {item.txn_remarks}
      </Text>
      
      <View style={styles.amountContainer}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Debit:</Text>
          <Text style={[styles.amountValue, styles.debitAmount]}>
            {formatAmount(item.debit_amt)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Credit:</Text>
          <Text style={[styles.amountValue, styles.creditAmount]}>
            {formatAmount(item.credit_amt)}
          </Text>
        </View>
        <View style={[styles.amountRow, styles.balanceRow]}>
          <Text style={styles.balanceLabel}>Balance:</Text>
          <Text style={styles.balanceAmount}>
            {formatAmount(item.balance)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
        onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
      >
        <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#ccc' : '#234785'} />
        <Text style={[styles.paginationText, currentPage === 1 && styles.disabledText]}>Prev</Text>
      </TouchableOpacity>
      
      <View style={styles.pageInfo}>
        <Text style={styles.pageText}>
          Page {currentPage} of {totalPages}
        </Text>
        <Text style={styles.entriesText}>
          Showing {getCurrentPageData().length} of {statements.length} entries
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
        onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
      >
        <Text style={[styles.paginationText, currentPage === totalPages && styles.disabledText]}>Next</Text>
        <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#ccc' : '#234785'} />
      </TouchableOpacity>
    </View>
  );

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Ionicons name="wallet-outline" size={24} color="#234785" />
        <Text style={styles.summaryTitle}>Account Summary</Text>
      </View>
      
      <View style={styles.summaryContent}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Credit</Text>
          <Text style={[styles.summaryAmount, styles.creditAmount]}>
            ₹{totalCredit.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Debit</Text>
          <Text style={[styles.summaryAmount, styles.debitAmount]}>
            ₹{totalDebit.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net Balance</Text>
          <Text style={[styles.summaryAmount, styles.netBalance]}>
            ₹{(totalCredit - totalDebit).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <ActivityIndicator size="large" color="#234785" />
        <Text style={styles.loadingText}>Loading wallet statement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />
      
      {/* Header */}
      <LinearGradient
        colors={['#234785', '#3d6aa5']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffeb44" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Statement</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#ffeb44" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Summary Card */}
      {renderSummaryCard()}

      {/* Transaction List */}
      <FlatList
        data={getCurrentPageData()}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        }
      />

      {/* Pagination */}
      {statements.length > 0 && renderPagination()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#234785',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 235, 68, 0.15)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffeb44',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 235, 68, 0.15)',
    borderRadius: 20,
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderTopWidth: 3,
    borderTopColor: '#ffeb44',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#234785',
    marginLeft: 8,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 2,
    backgroundColor: '#ffeb44',
    marginHorizontal: 16,
  },
  listContainer: {
    padding: 16,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#ffeb44',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  remarksText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#234785',
    marginBottom: 12,
    lineHeight: 22,
  },
  amountContainer: {
    borderTopWidth: 2,
    borderTopColor: '#ffeb44',
    paddingTop: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  creditAmount: {
    color: '#2D7D2D',
  },
  debitAmount: {
    color: '#D32F2F',
  },
  balanceRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#234785',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#234785',
  },
  netBalance: {
    color: '#234785',
    fontWeight: '700',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 3,
    borderTopColor: '#ffeb44',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff9e6',
    borderWidth: 1,
    borderColor: '#ffeb44',
  },
  disabledButton: {
    backgroundColor: '#F0F0F0',
    borderColor: '#e0e0e0',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#234785',
    marginHorizontal: 4,
  },
  disabledText: {
    color: '#ccc',
  },
  pageInfo: {
    alignItems: 'center',
  },
  pageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#234785',
  },
  entriesText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default WalletStatementScreen;