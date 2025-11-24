import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const AccountScreen = () => {
  const navigation = useNavigation();
  const { width } = Dimensions.get('window');
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
  });
  const [centerId, setCenterId] = useState('');
  const {center_id}  = useLocalSearchParams();
  console.log(center_id);
  const itemsPerPage = 10;

  // Fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      initializeScreen(center_id);
    }, [center_id])
  );

  const initializeScreen = async (center_id) => {
    try {
      
      setCenterId(center_id || '');
      await fetchTransactions(1, center_id);
    } catch (error) {
      console.error('Error initializing screen:', error);
      setLoading(false);
    }
  };

  const fetchTransactions = async (page = 1 ) => {
  try {
    setLoading(true);
    console.log(`=== FETCHING TRANSACTIONS PAGE ${page} ===`);

    const response = await fetch('https://omcti.in/apprise/api.php?task=acc_txn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        center_id: center_id
      })
    });

    const data = await response.json();
// console.log(data);
    if (data.status === 'success' && Array.isArray(data.data)) {
      const transactionData = data.data;
      const totalItems = transactionData.length;

      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = transactionData.slice(startIndex, endIndex);

      setTransactions(paginatedData);
      setTotalTransactions(totalItems);
      setTotalPages(Math.ceil(totalItems / itemsPerPage));
      setCurrentPage(page);

      // Summary calculation from full data
      calculateSummary(transactionData);

      console.log('✅ Transactions loaded successfully');
      console.log('Total transactions:', totalItems);
      console.log('Current page:', page);
      console.log('Total pages:', Math.ceil(totalItems / itemsPerPage));
      console.log('Showing transactions:', paginatedData.length);
    } else {
      console.log('❌ Failed to fetch transactions data');
      Alert.alert('Error', 'Failed to fetch transactions data');
    }
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    Alert.alert('Error', 'Network error. Please check your connection.');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};


  const calculateSummary = (allTransactions) => {
    const totalIncome = allTransactions
      .filter(t => t.txn_type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.txn_amount || 0), 0);
    
    const totalExpense = allTransactions
      .filter(t => t.txn_type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.txn_amount || 0), 0);
    
    const balance = totalIncome - totalExpense;
    
    setSummary({
      totalIncome,
      totalExpense,
      balance
    });

    console.log('Summary calculated:', { 
      totalIncome: center_id
    });
  };

  const handleRefresh = () => {
    console.log('=== REFRESHING DATA ===');
    setRefreshing(true);
    fetchTransactions(currentPage);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      console.log(`=== PAGE CHANGE: ${currentPage} -> ${newPage} ===`);
      setLoading(true);
      fetchTransactions(newPage);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getTransactionIcon = (type) => {
    return type === 'INCOME' ? 'arrow-down-circle' : 'arrow-up-circle';
  };

  const getTransactionColor = (type) => {
    return type === 'INCOME' ? '#10B981' : '#EF4444';
  };

  const navigateToAddEntry = () => {
    console.log('=== NAVIGATING TO ADD ENTRY ===');
    navigation.navigate('AccountEntryScreen', { center_id: centerId });
  };

  const renderTransactionItem = ({ item, index }) => {
    const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;
    
    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionNumberContainer}>
            <Text style={styles.transactionNumber}>#{itemNumber}</Text>
            <Text style={styles.transactionId}>ID: {item.id}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[
              styles.transactionAmount,
              { color: getTransactionColor(item.txn_type) }
            ]}>
              {formatCurrency(parseFloat(item.txn_amount))}
            </Text>
            <View style={[
              styles.transactionTypeBadge, 
              { backgroundColor: getTransactionColor(item.txn_type) }
            ]}>
              <Ionicons 
                name={getTransactionIcon(item.txn_type)} 
                size={12} 
                color="#fff" 
                style={styles.badgeIcon}
              />
              <Text style={styles.transactionType}>{item.txn_type}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.transactionBody}>
          <View style={styles.transactionRow}>
            <View style={styles.transactionDetail}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.transactionLabel}>Date:</Text>
              <Text style={styles.transactionValue}>{formatDate(item.txn_date)}</Text>
            </View>
            <View style={styles.transactionDetail}>
              <Ionicons name="card-outline" size={16} color="#666" />
              <Text style={styles.transactionLabel}>Mode:</Text>
              <Text style={[styles.transactionValue, styles.modeText]}>{item.txn_mode}</Text>
            </View>
          </View>
          
          <View style={styles.remarksContainer}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.transactionLabel}>Remarks:</Text>
            <Text style={styles.remarksText}>{item.txn_remarks}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          <Ionicons name="play-skip-back" size={16} color={currentPage === 1 ? '#ccc' : '#4F46E5'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#ccc' : '#4F46E5'} />
        </TouchableOpacity>

        <View style={styles.pageNumbers}>
          {pages.map(page => (
            <TouchableOpacity
              key={page}
              style={[
                styles.pageButton,
                page === currentPage && styles.activePageButton
              ]}
              onPress={() => handlePageChange(page)}
            >
              <Text style={[
                styles.pageButtonText,
                page === currentPage && styles.activePageButtonText
              ]}>
                {page}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#ccc' : '#4F46E5'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="play-skip-forward" size={16} color={currentPage === totalPages ? '#ccc' : '#4F46E5'} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryRow}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.summaryCard}>
          <Ionicons name="arrow-down-circle" size={24} color="#fff" />
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalIncome)}</Text>
          <Text style={styles.summarySubtext}>Earned</Text>
        </LinearGradient>
        
        <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.summaryCard}>
          <Ionicons name="arrow-up-circle" size={24} color="#fff" />
          <Text style={styles.summaryLabel}>Total Expense</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalExpense)}</Text>
          <Text style={styles.summarySubtext}>Spent</Text>
        </LinearGradient>
      </View>
      
      <LinearGradient 
        colors={summary.balance >= 0 ? ['#6366F1', '#4F46E5'] : ['#F59E0B', '#D97706']} 
        style={styles.balanceCard}
      >
        <Ionicons 
          name={summary.balance >= 0 ? "trending-up" : "trending-down"} 
          size={28} 
          color="#fff" 
        />
        <Text style={styles.balanceLabel}>Net Balance</Text>
        <Text style={styles.balanceValue}>{formatCurrency(summary.balance)}</Text>
        <Text style={styles.balanceSubtext}>
          {summary.balance >= 0 ? 'Positive Balance' : 'Negative Balance'}
        </Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalTransactions}</Text>
          <Text style={styles.statLabel}>Total Transactions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentPage}/{totalPages}</Text>
          <Text style={styles.statLabel}>Current Page</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{transactions.length}</Text>
          <Text style={styles.statLabel}>Showing</Text>
        </View>
      </View>
    </View>
  );

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Ledger</Text>
          <TouchableOpacity style={styles.addButton} onPress={navigateToAddEntry}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      {/* Header */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Ledger</Text>
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddEntry}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderPaginationControls}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>Pull to refresh or add new transactions</Text>
          </View>
        }
      />

      {loading && transactions.length > 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#4F46E5" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    padding: 16,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 0.48,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    opacity: 0.9,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summarySubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    opacity: 0.9,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  balanceSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e1e8ed',
    marginHorizontal: 16,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionNumberContainer: {
    flex: 1,
  },
  transactionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  transactionId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  transactionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeIcon: {
    marginRight: 6,
  },
  transactionType: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transactionBody: {
    gap: 12,
  },
  amountContainer: {
    backgroundColor: '#f8f9fc',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  amountMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountMetaText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  amountStatus: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.48,
  },
  transactionLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    marginRight: 6,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modeText: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
  },
  remarksContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fc',
    paddingVertical: 8,
    borderRadius: 8,
  },
  remarksText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    lineHeight: 18,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  disabledButton: {
    backgroundColor: '#f3f4f6',
    elevation: 0,
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: 8,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  activePageButton: {
    backgroundColor: '#4F46E5',
    elevation: 3,
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activePageButtonText: {
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default AccountScreen;