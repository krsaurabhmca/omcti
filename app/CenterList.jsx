import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { Appbar, Surface } from "react-native-paper";

const { width: screenWidth } = Dimensions.get("window");

export default function CenterListScreen() {
  const [centers, setCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Initial search query
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [hasSearched, setHasSearched] = useState(false); // Track if search has been performed
  
  // Refs for TextInputs
  const initialSearchRef = useRef(null);
  const filterSearchRef = useRef(null);


  const handleRecharge = (center) => {
    router.push({
      pathname: "RechargeScreen",
      params: {
        center_id: center.id,
        center_name: center.center_name,
        center_code: center.center_code,
      },
    });
  };

  // Fetch data from API with search parameter
  const fetchCenters = async (searchValue) => {
    setLoading(true);
    try {
      const response = await fetch("https://omcti.in/apprise/api.php?task=get_centers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: searchValue
        })
      });
      
      const data = await response.json();
      
      // Add mock status for demonstration - replace with actual API data
      const dataWithStatus = data.map((center, index) => ({
        ...center,
        status: center.status,
        balance: center.center_wallet,
        last_login: new Date(center.updated_at).toLocaleDateString(),
      }));
      
      setCenters(dataWithStatus);
      setFilteredCenters(dataWithStatus);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      // Handle error case
    } finally {
      setLoading(false);
    }
  };

  // Auto-focus search input when component mounts
  useEffect(() => {
    if (!hasSearched && initialSearchRef.current) {
      // Delay focus slightly to ensure component is fully mounted
      setTimeout(() => {
        initialSearchRef.current?.focus();
      }, 100);
    }
  }, [hasSearched]);

  // Handle initial search button click
  const handleInitialSearch = () => {
    if (searchQuery.trim() !== "") {
      Keyboard.dismiss();
      fetchCenters(searchQuery.trim());
    }
  };

  // Handle new search (from the list view)
  const handleNewSearch = () => {
    setHasSearched(false);
    setCenters([]);
    setFilteredCenters([]);
    setSearch("");
    setSearchQuery("");
    setSelectedStatus("all");
    // Auto-focus will be handled by useEffect
  };

  // Dismiss keyboard when scrolling
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Filter function (same as before)
  const applyFilters = (searchText = search, status = selectedStatus) => {
    let filtered = centers;

    // Apply search filter
    if (searchText.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          item.center_name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.center_code.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter((item) => item.status === status);
    }

    setFilteredCenters(filtered);
  };

  const handleSearch = (text) => {
    setSearch(text);
    applyFilters(text, selectedStatus);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    applyFilters(search, status);
  };

  const handleLoginAs = (center) => {
    console.log(center.id);
    router.push({
      pathname: "ClientDashboard",
      params: {
        centerId: center.id,
      },
    });
  };

  const getStatusColor = (status) => {
    const statusMap = {
      active: "#4CAF50",
      inactive: "#9E9E9E",
      pending: "#FF9800",
      block: "#F44336",
      ACTIVE: "#4CAF50",
      PENDING: "#FF9800",
      BLOCK: "#F44336",
    };
    return statusMap[status] || "#9E9E9E";
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      active: "checkmark-circle",
      inactive: "pause-circle",
      pending: "time",
      suspended: "ban",
      ACTIVE: "checkmark-circle",
      PENDING: "time",
      BLOCK: "ban",
    };
    return iconMap[status] || "help-circle";
  };

  // Initial Search Screen
  const renderInitialSearchScreen = () => (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.headerSurface} elevation={2}>
        <Appbar.Header style={styles.appbarHeader}>
          <Appbar.BackAction onPress={() => router.back()} iconColor="#ffeb44" />
          <Appbar.Content 
            title="Search Centers" 
            titleStyle={styles.appbarTitle}
          />
        </Appbar.Header>
      </Surface>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.initialSearchContainer}>
            <View style={styles.searchPromptContainer}>
              <Ionicons name="search" size={64} color="#234785" />
              <Text style={styles.searchPromptSubtitle}>
                Find centers by name or code
              </Text>
              
              <Surface style={styles.initialSearchSurface} elevation={2}>
                <View style={styles.initialSearchInputContainer}>
                  <Ionicons
                    name="search"
                    size={20}
                    color="#234785"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    ref={initialSearchRef}
                    style={styles.initialSearchBox}
                    placeholder="Enter center name or code..."
                    placeholderTextColor="#9E9E9E"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleInitialSearch}
                    returnKeyType="search"
                    autoFocus={true}
                    blurOnSubmit={false}
                    enablesReturnKeyAutomatically={true}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery("");
                        initialSearchRef.current?.focus();
                      }}
                      style={styles.clearButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                    </TouchableOpacity>
                  )}
                </View>
              </Surface>

              <TouchableOpacity
                style={[
                  styles.searchButton,
                  searchQuery.trim() === "" && styles.searchButtonDisabled
                ]}
                onPress={handleInitialSearch}
                disabled={searchQuery.trim() === ""}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={20} color="#234785" />
                <Text style={styles.searchButtonText}>Search Centers</Text>
              </TouchableOpacity>

              <Text style={styles.keyboardHint}>
                Press Enter or tap the button to search
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const renderHeader = () => (
    <Surface style={styles.headerSurface} elevation={2}>
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={() => router.back()} iconColor="#ffeb44" />
        <Appbar.Content 
          title="Center Details" 
          titleStyle={styles.appbarTitle}
        />
        <TouchableOpacity onPress={handleNewSearch} style={styles.newSearchButton}>
          <Ionicons name="search" size={30} color="#ffeb44" />
        </TouchableOpacity>
      </Appbar.Header>
      <View style={styles.headerSubtitleContainer}>
          <Text style={styles.headerSubtitle}>
            Showing {filteredCenters.length} of {centers.length} centers for "{searchQuery}"
          </Text>
      </View>
    </Surface>
  );

 
  const renderItem = ({ item }) => (
    <Surface style={styles.cardSurface} elevation={2}>
      <View style={styles.card}>
        {/* Header with Status */}
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <Ionicons
              name={getStatusIcon(item.status)}
              size={16}
              color={getStatusColor(item.status)}
            />
            <Text
              style={[styles.statusText, { color: getStatusColor(item.status) }]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          <Text style={styles.balance}>
            ₹{item.balance?.toLocaleString() || "0"}
          </Text>
        </View>

        {/* Center Info */}
        <View style={styles.centerInfo}>
          <Text style={styles.name}>{item.center_name || "Unknown Center"}</Text>
          <View style={styles.codeContainer}>
            <Ionicons name="business" size={14} color="#234785" />
            <Text style={styles.code}>{item.center_code || "No Code"}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.rechargeButton]}
            onPress={() => handleRecharge(item)}
          >
            <Ionicons name="card" size={16} color="#234785" />
            <Text style={styles.buttonText}>Recharge</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => handleLoginAs(item)}
          >
            <Ionicons name="log-in" size={16} color="#FFFFFF" />
            <Text style={styles.buttonTextWhite}>Login As</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Surface>
  );

  // Show loading screen
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Surface style={styles.headerSurface} elevation={2}>
          <Appbar.Header style={styles.appbarHeader}>
            <Appbar.BackAction onPress={() => router.back()} iconColor="#ffeb44" />
            <Appbar.Content 
              title="Searching..." 
              titleStyle={styles.appbarTitle}
            />
          </Appbar.Header>
        </Surface>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Searching for centers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show initial search screen if not searched yet
  if (!hasSearched) {
    return renderInitialSearchScreen();
  }

  // Show results screen
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header with Paper Components */}
        {renderHeader()}

        {/* Results */}
        {filteredCenters.length === 0 ? (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.noDataContainer}>
              <Ionicons name="search" size={64} color="#234785" />
              <Text style={styles.noDataTitle}>No centers found</Text>
              <Text style={styles.noDataSubtitle}>
                {search.trim() !== "" || selectedStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : `No centers found matching "${searchQuery}"`}
              </Text>
              <TouchableOpacity
                style={styles.newSearchButtonLarge}
                onPress={handleNewSearch}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={20} color="#234785" />
                <Text style={styles.newSearchButtonText}>Try New Search</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        ) : (
          <FlatList
            data={filteredCenters}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={dismissKeyboard}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  flex1: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerSurface: {
    backgroundColor: "#234785",
  },
  appbarHeader: {
    backgroundColor: "#234785",
    elevation: 0,
  },
  appbarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffeb44",
  },
  newSearchButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 8,
    marginTop: 10,
  },
  centerBadge: {
    backgroundColor: "#ffeb44",
    color: "#234785",
    marginRight: 16,
  },
  headerSubtitleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#234785",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffeb44",
    marginLeft: 40, // Align with title after back button
    opacity: 0.9,
  },
  // Initial Search Screen Styles
  initialSearchContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  searchPromptContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  searchPromptTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#234785",
    marginTop: 24,
    marginBottom: 12,
  },
  searchPromptSubtitle: {
    fontSize: 16,
    color: "#6C757D",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  initialSearchSurface: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#234785",
  },
  initialSearchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  initialSearchBox: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: "#234785",
    paddingVertical: 16,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffeb44",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: "100%",
    borderWidth: 2,
    borderColor: "#234785",
  },
  searchButtonDisabled: {
    backgroundColor: "#CCC",
    borderColor: "#999",
  },
  searchButtonText: {
    color: "#234785",
    fontSize: 16,
    fontWeight: "700",
  },
  keyboardHint: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 12,
    textAlign: "center",
  },
  newSearchButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffeb44",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#234785",
  },
  newSearchButtonText: {
    color: "#234785",
    fontSize: 14,
    fontWeight: "700",
  },
  // Existing Styles
  searchSurface: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#234785",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchBox: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#234785",
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    paddingLeft: 16,
    maxHeight: 60,
  },
  filterContent: {
    paddingRight: 16,
    paddingVertical: 0,
    height: 70,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  cardSurface: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  balance: {
    fontSize: 16,
    fontWeight: "700",
    color: "#28A745",
  },
  centerInfo: {
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#234785",
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  code: {
    fontSize: 14,
    color: "#6C757D",
    marginLeft: 6,
  },
  buttonContainer: {
    flexDirection: screenWidth < 400 ? "column" : "row",
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: screenWidth < 400 ? undefined : 1,
    gap: 6,
  },
  rechargeButton: {
    backgroundColor: "#ffeb44",
    borderWidth: 2,
    borderColor: "#234785",
  },
  loginButton: {
    backgroundColor: "#234785",
    borderWidth: 2,
    borderColor: "#234785",
  },
  buttonText: {
    color: "#234785",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonTextWhite: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#234785",
    fontWeight: "600",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#234785",
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
    lineHeight: 20,
  },
});