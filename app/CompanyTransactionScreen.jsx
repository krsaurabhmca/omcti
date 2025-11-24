import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import {
    ActivityIndicator,
    Appbar,
    Card,
    Chip,
    List,
    Modal,
    Portal,
    Searchbar,
    Snackbar,
    Surface,
    Text,
    TextInput,
    Title,
    useTheme
} from "react-native-paper";

const { width } = Dimensions.get('window');

export default function IncomeExpenseEntry() {
  const navigation = useNavigation();
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;

  // State variables
  const [txnType, setTxnType] = useState("");
  const [center, setCenter] = useState("");
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [expCat, setExpCat] = useState("");
  const [txnDate, setTxnDate] = useState(new Date());
  const [txnAmount, setTxnAmount] = useState("");
  const [txnMode, setTxnMode] = useState("");
  const [bank, setBank] = useState("");
  const [txnRemarks, setTxnRemarks] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Modal states for dropdowns
  const [activeModal, setActiveModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCenters, setFilteredCenters] = useState([]);

  // Validation states
  const [errors, setErrors] = useState({});

  // Dropdown data with enhanced options
  const txnTypes = [
    { label: "💰 Income", value: "INCOME", icon: "trending-up", color: "#4CAF50", description: "Money received" },
    { label: "💸 Expense", value: "EXPENSE", icon: "trending-down", color: "#F44336", description: "Money spent" },
  ];

  const expenseTypes = [
    { label: "🏢 Office Expenses", value: "1", icon: "office-building" },
    { label: "🚗 Travel & Transport", value: "2", icon: "car" },
    { label: "📢 Marketing & Advertising", value: "3", icon: "bullhorn" },
    { label: "⚡ Utilities & Bills", value: "4", icon: "flash" },
    { label: "🛠️ Equipment & Supplies", value: "5", icon: "tools" },
    { label: "👥 Staff & Training", value: "6", icon: "account-group" },
    { label: "📋 Miscellaneous", value: "7", icon: "dots-horizontal" },
  ];

  const transactionModes = [
    { label: "💵 Cash", value: "CASH", icon: "cash", color: "#4CAF50" },
    { label: "📱 UPI Payment", value: "UPI", icon: "cellphone", color: "#2196F3" },
    { label: "🏦 Bank Transfer", value: "BANK", icon: "bank", color: "#FF9800" },
    { label: "💳 Credit Card", value: "CARD", icon: "credit-card", color: "#9C27B0" },
    { label: "💳 Debit Card", value: "DEBIT", icon: "credit-card-outline", color: "#607D8B" },
    { label: "📝 Cheque", value: "CHEQUE", icon: "checkbook", color: "#795548" },
  ];

  const banks = [
    { label: "🏢 Company Account", value: "COMPANY", icon: "domain" },
    { label: "👤 Irshad Account", value: "IRSHAD", icon: "account" },
    { label: "👤 Raja Account", value: "RAJA", icon: "account" },
    { label: "👤 Prabhat Account", value: "PRABHAT", icon: "account" },
    { label: "🏦 Other Bank", value: "OTHER", icon: "bank" },
  ];

  // Animation effect on mount
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch Centers API
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const response = await fetch("https://omcti.in/apprise/api.php?task=centers");
        const data = await response.json();
        const formatted = data.map((c) => ({
          label: `${c.center_name}${c.center_code ? ` [${c.center_code}]` : ""}`,
          value: c.id,
          icon: "map-marker",
        }));
        const centersWithOther = [...formatted, { label: "🏢 Other Center", value: "0", icon: "plus-circle" }];
        setCenters(centersWithOther);
        setFilteredCenters(centersWithOther);
      } catch (error) {
        setSnackbarMessage("❌ Failed to load centers");
        setSnackbarVisible(true);
        console.error(error);
      } finally {
        setLoadingCenters(false);
      }
    };
    fetchCenters();
  }, []);

  // Search functionality for centers
  useEffect(() => {
    if (searchQuery) {
      const filtered = centers.filter(center =>
        center.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCenters(filtered);
    } else {
      setFilteredCenters(centers);
    }
  }, [searchQuery, centers]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!txnType) newErrors.txnType = "Transaction type is required";
    if (!center) newErrors.center = "Center selection is required";
    if (!expCat) newErrors.expCat = "Expense category is required";
    if (!txnAmount) newErrors.txnAmount = "Amount is required";
    else if (isNaN(txnAmount) || parseFloat(txnAmount) <= 0) newErrors.txnAmount = "Enter valid amount";
    if (!txnMode) newErrors.txnMode = "Payment mode is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbarMessage("⚠️ Please fill all required fields correctly");
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);

    const data = {
      txn_type: txnType,
      center_id: center,
      exp_cat: expCat,
      txn_date: txnDate.toISOString().split("T")[0],
      txn_amount: parseFloat(txnAmount),
      txn_mode: txnMode,
      bank: bank,
      txn_remarks: txnRemarks,
      created_by: "MOBILE_APP",
    };

    try {
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=admin_account_entry",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      setSnackbarMessage("✅ Transaction saved successfully!");
      setSnackbarVisible(true);
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      setSnackbarMessage("❌ Something went wrong. Please try again.");
      setSnackbarVisible(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return "";
    return `₹ ${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const getSelectedLabel = (value, options) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : "";
  };

  const getSelectedOption = (value, options) => {
    return options.find(opt => opt.value === value);
  };

  const openModal = (modalType) => {
    setActiveModal(modalType);
    setSearchQuery("");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSearchQuery("");
  };

  const renderDropdownModal = () => {
    let data = [];
    let title = "";
    let onSelect = () => {};

    switch (activeModal) {
      case 'txnType':
        data = txnTypes;
        title = "Select Transaction Type";
        onSelect = (item) => {
          setTxnType(item.value);
          closeModal();
        };
        break;
      case 'center':
        data = filteredCenters;
        title = "Select Center";
        onSelect = (item) => {
          setCenter(item.value);
          closeModal();
        };
        break;
      case 'expCat':
        data = expenseTypes;
        title = "Select Expense Category";
        onSelect = (item) => {
          setExpCat(item.value);
          closeModal();
        };
        break;
      case 'txnMode':
        data = transactionModes;
        title = "Select Payment Mode";
        onSelect = (item) => {
          setTxnMode(item.value);
          closeModal();
        };
        break;
      case 'bank':
        data = banks;
        title = "Select Bank/Account";
        onSelect = (item) => {
          setBank(item.value);
          closeModal();
        };
        break;
    }

    return (
      <Portal>
        <Modal
          visible={activeModal !== null}
          onDismiss={closeModal}
          contentContainerStyle={{
            backgroundColor: 'white',
            margin: 20,
            borderRadius: 16,
            maxHeight: '80%',
          }}
        >
          <Surface style={{ borderRadius: 16, overflow: 'hidden' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold', textAlign: 'center' }}>
                {title}
              </Text>
            </View>
            
            {activeModal === 'center' && (
              <View style={{ padding: 16 }}>
                <Searchbar
                  placeholder="Search centers..."
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={{ marginBottom: 8 }}
                  autoFocus={true}
                  returnKeyType="search"
                  blurOnSubmit={true}
                />
              </View>
            )}

            <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
              {data.map((item) => (
                <List.Item
                  key={item.value}
                  title={item.label}
                  description={item.description}
                  left={(props) => <List.Icon {...props} icon={item.icon} />}
                  right={(props) => item.color && (
                    <View style={{
                      width: 12,
                      height: 12,
                      backgroundColor: item.color,
                      borderRadius: 6,
                      alignSelf: 'center'
                    }} />
                  )}
                  onPress={() => onSelect(item)}
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#E0E0E0'
                  }}
                />
              ))}
            </ScrollView>
          </Surface>
        </Modal>
      </Portal>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Enhanced App Bar */}
      <Appbar.Header elevated style={{ backgroundColor: '#6200EE' }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="white" />
        <Appbar.Content title="💰 Income / Expense Entry" titleStyle={{ color: 'white', fontWeight: 'bold' }} />
        <Appbar.Action 
          icon="content-save" 
          onPress={handleSubmit}
          disabled={loading}
          color="white"
        />
      </Appbar.Header>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <Animated.View style={{
          opacity: slideAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        }}>

          {/* Summary Card */}
          {(txnType || txnAmount) && (
            <Card style={{ marginBottom: 16, borderRadius: 16 }} elevation={4}>
              <Card.Content style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text variant="labelMedium" style={{ color: '#666' }}>Transaction Summary</Text>
                    <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginTop: 4 }}>
                      {txnAmount ? formatAmount(txnAmount) : '₹ 0'}
                    </Text>
                  </View>
                  {txnType && (
                    <Chip 
                      icon={txnType === "INCOME" ? "trending-up" : "trending-down"}
                      mode="flat"
                      style={{
                        backgroundColor: txnType === "INCOME" ? '#E8F5E8' : '#FFEBEE',
                        borderColor: txnType === "INCOME" ? '#4CAF50' : '#F44336',
                        borderWidth: 1
                      }}
                      textStyle={{ color: txnType === "INCOME" ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}
                    >
                      {txnType}
                    </Chip>
                  )}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Transaction Details Card */}
          <Card style={{ marginBottom: 16, borderRadius: 16 }} elevation={3}>
            <Card.Content style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#6200EE15',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ fontSize: 20 }}>📋</Text>
                </View>
                <Title style={{ fontSize: 18, fontWeight: 'bold' }}>Transaction Details</Title>
              </View>
              
              {/* Transaction Type */}
              <TextInput
                label="Transaction Type *"
                value={getSelectedLabel(txnType, txnTypes)}
                right={<TextInput.Icon icon="chevron-down" onPress={() => openModal('txnType')} />}
                editable={false}
                style={{ marginBottom: 16 }}
                mode="outlined"
                onPressIn={() => openModal('txnType')}
                error={!!errors.txnType}
              />
              {errors.txnType && <Text style={{ color: '#F44336', fontSize: 12, marginTop: -12, marginBottom: 12 }}>{errors.txnType}</Text>}

              {/* Center Selection */}
              {loadingCenters ? (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <ActivityIndicator size="small" />
                  <Text style={{ marginTop: 8, color: '#666' }}>Loading centers...</Text>
                </View>
              ) : (
                <>
                  <TextInput
                    label="Select Center *"
                    value={getSelectedLabel(center, centers)}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => openModal('center')} />}
                    editable={false}
                    style={{ marginBottom: 16 }}
                    mode="outlined"
                    onPressIn={() => openModal('center')}
                    error={!!errors.center}
                  />
                  {errors.center && <Text style={{ color: '#F44336', fontSize: 12, marginTop: -12, marginBottom: 12 }}>{errors.center}</Text>}
                </>
              )}

              {/* Expense Category */}
              <TextInput
                label="Expense Category *"
                value={getSelectedLabel(expCat, expenseTypes)}
                right={<TextInput.Icon icon="chevron-down" onPress={() => openModal('expCat')} />}
                editable={false}
                style={{ marginBottom: 16 }}
                mode="outlined"
                onPressIn={() => openModal('expCat')}
                error={!!errors.expCat}
              />
              {errors.expCat && <Text style={{ color: '#F44336', fontSize: 12, marginTop: -12, marginBottom: 12 }}>{errors.expCat}</Text>}
            </Card.Content>
          </Card>

          {/* Amount and Date Card */}
          <Card style={{ marginBottom: 16, borderRadius: 16 }} elevation={3}>
            <Card.Content style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#4CAF5015',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ fontSize: 20 }}>💰</Text>
                </View>
                <Title style={{ fontSize: 18, fontWeight: 'bold' }}>Amount & Date</Title>
              </View>
              
              {/* Transaction Amount */}
              <TextInput
                label="Transaction Amount *"
                value={txnAmount}
                onChangeText={(text) => {
                  setTxnAmount(text);
                  if (errors.txnAmount) {
                    const newErrors = { ...errors };
                    delete newErrors.txnAmount;
                    setErrors(newErrors);
                  }
                }}
                keyboardType="numeric"
                mode="outlined"
                left={<TextInput.Icon icon="currency-inr" />}
                style={{ marginBottom: 16 }}
                error={!!errors.txnAmount}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              {errors.txnAmount && <Text style={{ color: '#F44336', fontSize: 12, marginTop: -12, marginBottom: 12 }}>{errors.txnAmount}</Text>}

              {/* Transaction Date */}
              <TextInput
                label="Transaction Date"
                value={formatDate(txnDate)}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                editable={false}
                mode="outlined"
                onPressIn={() => setShowDatePicker(true)}
              />

              {showDatePicker && (
                <DateTimePicker
                  value={txnDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setTxnDate(selectedDate);
                  }}
                />
              )}
            </Card.Content>
          </Card>

          {/* Payment Details Card */}
          <Card style={{ marginBottom: 16, borderRadius: 16 }} elevation={3}>
            <Card.Content style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#FF980015',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ fontSize: 20 }}>💳</Text>
                </View>
                <Title style={{ fontSize: 18, fontWeight: 'bold' }}>Payment Details</Title>
              </View>
              
              {/* Transaction Mode */}
              <TextInput
                label="Payment Mode *"
                value={getSelectedLabel(txnMode, transactionModes)}
                right={<TextInput.Icon icon="chevron-down" onPress={() => openModal('txnMode')} />}
                editable={false}
                style={{ marginBottom: 16 }}
                mode="outlined"
                onPressIn={() => openModal('txnMode')}
                error={!!errors.txnMode}
              />
              {errors.txnMode && <Text style={{ color: '#F44336', fontSize: 12, marginTop: -12, marginBottom: 12 }}>{errors.txnMode}</Text>}

              {/* Bank Selection */}
              <TextInput
                label="Select Bank/Account"
                value={getSelectedLabel(bank, banks)}
                right={<TextInput.Icon icon="chevron-down" onPress={() => openModal('bank')} />}
                editable={false}
                mode="outlined"
                onPressIn={() => openModal('bank')}
              />
            </Card.Content>
          </Card>

          {/* Remarks Card */}
          <Card style={{ marginBottom: 24, borderRadius: 16 }} elevation={3}>
            <Card.Content style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#9C27B015',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ fontSize: 20 }}>📝</Text>
                </View>
                <Title style={{ fontSize: 18, fontWeight: 'bold' }}>Additional Notes</Title>
              </View>
              
              <TextInput
                label="Remarks (Optional)"
                value={txnRemarks}
                onChangeText={setTxnRemarks}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Enter any additional notes or remarks..."
                returnKeyType="done"
                blurOnSubmit={true}
                textAlignVertical="top"
              />
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Enhanced Snackbar */}
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

      {/* Dropdown Modal */}
      {renderDropdownModal()}
    </KeyboardAvoidingView>
  );
}