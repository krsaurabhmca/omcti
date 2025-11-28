import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View
} from "react-native";
import {
  ActivityIndicator,
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  Searchbar,
  Snackbar,
  Text,
  useTheme
} from "react-native-paper";

const { width } = Dimensions.get('window');

export default function CompanyTransactions() {
  const router = useRouter();
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // Filter states
  const [filterType, setFilterType] = useState('ALL'); // ALL, INCOME, EXPENSE

  // Animation effect on mount
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await fetch("https://omcti.in/apprise/api.php?task=get_com_txn");
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTransactions(data);
        setFilteredTransactions(data);
        calculateTotals(data);
      } else {
        setSnackbarMessage("❌ Invalid data format received");
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage("❌ Failed to load transactions");
      setSnackbarVisible(true);
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate totals
  const calculateTotals = (data) => {
    const income = data
      .filter(txn => txn.txn_type === 'INCOME')
      .reduce((sum, txn) => sum + parseFloat(txn.txn_amount || 0), 0);
    
    const expense = data
      .filter(txn => txn.txn_type === 'EXPENSE')
      .reduce((sum, txn) => sum + parseFloat(txn.txn_amount || 0), 0);

    setTotalIncome(income);
    setTotalExpense(expense);
  };

  // Search and filter functionality
  useEffect(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== 'ALL') {
      filtered = filtered.filter(txn => txn.txn_type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(txn => 
        txn.exp_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.txn_remarks?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.txn_amount?.toString().includes(searchQuery) ||
        txn.bank?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [searchQuery, transactions, filterType]);

  // Initial data fetch
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  // Navigate to add transaction
  const navigateToAddTransaction = () => {
    router.push('CompanyTransactionScreen');
  };

  // Format currency
  const formatAmount = (amount) => {
    return `₹ ${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get payment mode icon
  const getPaymentModeIcon = (mode) => {
    switch (mode) {
      case 'CASH': return '💵';
      case 'UPI': return '📱';
      case 'BANK': return '🏦';
      case 'CARD': return '💳';
      case 'DEBIT': return '💳';
      case 'CHEQUE': return '📝';
      default: return '💰';
    }
  };

  // Render transaction card
  const renderTransactionCard = (transaction, index) => {
    const isIncome = transaction.txn_type === 'INCOME';
    
    return (
      <Animated.View
        key={transaction.id}
        style={{
          opacity: slideAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
        }}
      >
        <Card 
          style={{ 
            marginBottom: 12, 
            borderRadius: 16,
            borderLeftWidth: 4,
            borderLeftColor: isIncome ? '#4CAF50' : '#F44336'
          }} 
          elevation={2}
        >
          <Card.Content style={{ padding: 16 }}>
            {/* Header Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
                  {transaction.exp_type || 'Transaction'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Chip 
                    icon={isIncome ? "trending-up" : "trending-down"}
                    mode="flat"
                    compact
                    style={{
                      backgroundColor: isIncome ? '#E8F5E8' : '#FFEBEE',
                      borderColor: isIncome ? '#4CAF50' : '#F44336',
                      borderWidth: 1,
                      marginRight: 8
                    }}
                    textStyle={{ 
                      color: isIncome ? '#4CAF50' : '#F44336', 
                      fontWeight: 'bold',
                      fontSize: 10
                    }}
                  >
                    {transaction.txn_type}
                  </Chip>
                  <Text style={{ color: '#666', fontSize: 12 }}>
                    {formatDate(transaction.txn_date)}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text 
                  variant="titleLarge" 
                  style={{ 
                    fontWeight: 'bold', 
                    color: isIncome ? '#4CAF50' : '#F44336',
                    fontSize: 18
                  }}
                >
                  {formatAmount(transaction.txn_amount)}
                </Text>
              </View>
            </View>

            <Divider style={{ marginVertical: 8 }} />

            {/* Details Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ marginRight: 8 }}>
                    {getPaymentModeIcon(transaction.txn_mode)}
                  </Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>
                    {transaction.txn_mode}
                  </Text>
                  {transaction.bank && (
                    <>
                      <Text style={{ color: '#666', marginHorizontal: 4 }}>•</Text>
                      <Text style={{ color: '#666', fontSize: 12 }}>
                        {transaction.bank}
                      </Text>
                    </>
                  )}
                </View>
                
                {transaction.txn_remarks && (
                  <Text style={{ color: '#888', fontSize: 11, fontStyle: 'italic' }}>
                    "{transaction.txn_remarks.trim()}"
                  </Text>
                )}
              </View>
              
              <Badge 
                style={{ 
                  backgroundColor: '#E3F2FD',
                  color: '#1976D2'
                }}
              >
                #{transaction.id}
              </Badge>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={{
          paddingTop: 50,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 16 }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold', 
              color: '#ffffff',
              textAlign: 'center'
            }}>
              💰 Company Transactions
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              marginTop: 2
            }}>
              View all financial records
            </Text>
          </View>
          
          <TouchableOpacity 
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }} 
            onPress={navigateToAddTransaction}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Summary Cards */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Card style={{ flex: 1, borderRadius: 12 }} elevation={3}>
            <Card.Content style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>💰</Text>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Income</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4CAF50' }}>
                {formatAmount(totalIncome)}
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={{ flex: 1, borderRadius: 12 }} elevation={3}>
            <Card.Content style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>💸</Text>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Expense</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#F44336' }}>
                {formatAmount(totalExpense)}
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={{ flex: 1, borderRadius: 12 }} elevation={3}>
            <Card.Content style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>📊</Text>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Net Balance</Text>
              <Text style={{ 
                fontSize: 13, 
                fontWeight: 'bold', 
                color: (totalIncome - totalExpense) >= 0 ? '#4CAF50' : '#F44336' 
              }}>
                {formatAmount(totalIncome - totalExpense)}
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Searchbar
          placeholder="Search transactions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ marginBottom: 12, borderRadius: 12 }}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {['ALL', 'INCOME', 'EXPENSE'].map((type) => (
            <Chip
              key={type}
              mode={filterType === type ? 'flat' : 'outlined'}
              selected={filterType === type}
              onPress={() => setFilterType(type)}
              style={{
                backgroundColor: filterType === type ? '#6200EE' : 'transparent',
              }}
              textStyle={{
                color: filterType === type ? 'white' : '#6200EE',
                fontWeight: filterType === type ? 'bold' : 'normal'
              }}
            >
              {type === 'ALL' ? `All (${transactions.length})` : 
               type === 'INCOME' ? `Income (${transactions.filter(t => t.txn_type === 'INCOME').length})` :
               `Expense (${transactions.filter(t => t.txn_type === 'EXPENSE').length})`}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <ActivityIndicator size="large" color="#6200EE" />
            <Text style={{ marginTop: 16, color: '#666' }}>Loading transactions...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>No Transactions Found</Text>
            <Text style={{ color: '#666', textAlign: 'center', marginBottom: 24 }}>
              {searchQuery ? 'Try adjusting your search terms' : 'Start by adding your first transaction'}
            </Text>
            <Button 
              mode="contained" 
              onPress={navigateToAddTransaction}
              style={{ borderRadius: 12 }}
              icon="plus"
            >
              Add Transaction
            </Button>
          </View>
        ) : (
          <>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: 'bold', 
              marginBottom: 16, 
              color: '#333' 
            }}>
              {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </Text>
            {filteredTransactions.map((transaction, index) => 
              renderTransactionCard(transaction, index)
            )}
          </>
        )}
      </ScrollView>
      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
        style={{ marginBottom: 20 }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}