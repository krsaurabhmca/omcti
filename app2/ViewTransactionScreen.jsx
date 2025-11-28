import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const { width } = Dimensions.get("window");

const ViewTransactionScreen = () => {
  const { center_id } = useLocalSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalPayment: 0,
    totalDues: 0,
    totalAmount: 0,
  });

  const centerId = center_id;
  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    fetchTransactions();
  }, []);

  
  const handleTransactionClick = async (item) => {
    console.log(item.link);
    try {
      const url = item.link;

      if (!url) {
        Alert.alert("Error", "Transaction link not available");
        return;
      } else {
        router.push({
          pathname: "PdfViewer",
          params: {
            url: url,
            title: "Invoice No."+ item.invoice_no,
          },
        });
      }

      //   const canOpen = await InAppBrowser.isAvailable();

      //   if (canOpen) {
      //     await InAppBrowser.open(url, {
      //       // Optional customization
      //       dismissButtonStyle: 'cancel',
      //       preferredBarTintColor: '#453AA4',
      //       preferredControlTintColor: 'white',
      //       readerMode: false,
      //       animated: true,
      //       modalPresentationStyle: 'fullScreen',
      //       modalTransitionStyle: 'coverVertical',
      //       enableBarCollapsing: true,
      //     });
      //   } else {
      //     // Fallback to default browser if in-app browser is not available
      //     await Linking.openURL(url);
      //   }
    } catch (error) {
      console.error("Error opening URL:", error);
      Alert.alert("Error", "Failed to open transaction details");
    }
  };

  const fetchTransactions = async () => {
    if (!center_id) {
      Alert.alert("Error", "Center ID is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=center_txn",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            center_id: center_id.toString(),
          }),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        setTransactions(result.data || []);
        setTotalCount(result.count || 0);
        calculateSummary(result.data || []);
      } else {
        Alert.alert("Error", "Failed to fetch transactions");
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateSummary = (data) => {
    const summary = data.reduce(
      (acc, txn) => ({
        totalTransactions: acc.totalTransactions + 1,
        totalPayment: acc.totalPayment + parseFloat(txn.payment || 0),
        totalDues: acc.totalDues + parseFloat(txn.dues || 0),
        totalAmount: acc.totalAmount + parseFloat(txn.total || 0),
      }),
      { totalTransactions: 0, totalPayment: 0, totalDues: 0, totalAmount: 0 }
    );
    setSummary(summary);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchTransactions();
  };

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return transactions.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(transactions.length / ITEMS_PER_PAGE);
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "CLOSE":
        return "#28a745";
      case "OPEN":
        return "#ffc107";
      case "PENDING":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => handleTransactionClick(item)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionHeader}>
        <View>
          <Text style={styles.invoiceNumber}>
            Invoice: {item.invoice_no || "N/A"}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.txn_date)}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status || "N/A"}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#ccc"
            style={styles.chevronIcon}
          />
        </View>
      </View>

      <View style={styles.amountContainer}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Previous Dues:</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(item.prev_dues)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total:</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.total)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Payment:</Text>
          <Text style={[styles.amountValue, styles.paymentAmount]}>
            {formatCurrency(item.payment)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Current Dues:</Text>
          <Text style={[styles.amountValue, styles.duesAmount]}>
            {formatCurrency(item.dues)}
          </Text>
        </View>
      </View>

      {item.txn_remarks && (
        <View style={styles.remarksContainer}>
          <Text style={styles.remarksLabel}>Remarks:</Text>
          <Text style={styles.remarksText}>{item.txn_remarks}</Text>
        </View>
      )}

      <View style={styles.tapHintContainer}>
        <Text style={styles.tapHintText}>Tap to view details</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSummaryCard = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Transaction History</Text>
      {/* <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Transactions</Text>
          <Text style={styles.summaryValue}>{summary.totalTransactions}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Payments</Text>
          <Text style={[styles.summaryValue, styles.positiveAmount]}>
            {formatCurrency(summary.totalPayment)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Dues</Text>
          <Text style={[styles.summaryValue, styles.negativeAmount]}>
            {formatCurrency(summary.totalDues)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalAmount)}</Text>
        </View>
      </View> */}
    </View>
  );

  const renderPagination = () => {
    const totalPages = getTotalPages();
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.disabledButton,
          ]}
          onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentPage === 1 ? "#ccc" : "#667eea"}
          />
          <Text
            style={[
              styles.paginationText,
              currentPage === 1 && styles.disabledText,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={styles.pageText}>
            Page {currentPage} of {totalPages}
          </Text>
          <Text style={styles.itemsText}>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, transactions.length)} of{" "}
            {transactions.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.disabledButton,
          ]}
          onPress={() =>
            currentPage < totalPages && setCurrentPage(currentPage + 1)
          }
          disabled={currentPage === totalPages}
        >
          <Text
            style={[
              styles.paginationText,
              currentPage === totalPages && styles.disabledText,
            ]}
          >
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={currentPage === totalPages ? "#ccc" : "#667eea"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transactions</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={getPaginatedData()}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderSummaryCard}
        ListFooterComponent={renderPagination}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#667eea"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    // backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginHorizontal: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  listContainer: {
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  summaryContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryItem: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  positiveAmount: {
    color: "#28a745",
  },
  negativeAmount: {
    color: "#dc3545",
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Add subtle hover effect styling
    borderWidth: 1,
    borderColor: "transparent",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevronIcon: {
    marginLeft: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  transactionDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  amountContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: "#666",
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  paymentAmount: {
    color: "#28a745",
  },
  duesAmount: {
    color: "#dc3545",
  },
  remarksContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  remarksLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
  },
  remarksText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  tapHintContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  tapHintText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  disabledButton: {
    backgroundColor: "#f5f5f5",
    elevation: 0,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
    marginHorizontal: 5,
  },
  disabledText: {
    color: "#ccc",
  },
  pageInfo: {
    alignItems: "center",
  },
  pageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemsText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
});

export default ViewTransactionScreen;
