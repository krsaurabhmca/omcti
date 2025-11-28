import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  Paragraph,
  Searchbar,
  Surface,
  Text,
  Title,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const StudentSearchScreen = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const insets = useSafeAreaInsets();

  // Minimum search character requirement
  const MIN_SEARCH_CHARS = 3;

  // Get userId from AsyncStorage on component mount
  useEffect(() => {
    getUserId();
  }, []);

  const getUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      setUserId(storedUserId);
    } catch (error) {
      console.error("Error getting userId:", error);
    }
  };

  // Search students function
  const searchStudents = async (query = searchQuery) => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      setStudents([]);
      return;
    }

    // Check minimum character requirement
    if (trimmedQuery.length < MIN_SEARCH_CHARS) {
      alert(`Please enter at least ${MIN_SEARCH_CHARS} characters to search`);
      return;
    }

    if (!userId) {
      console.warn("User ID not available");
      alert("User session not found. Please try again.");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=search_student",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: trimmedQuery,
            userId: userId,
          }),
        }
      );

      const result = await response.json();
      
      if (result.status === "success" && result.data) {
        setStudents(Array.isArray(result.data) ? result.data : []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setStudents([]);
      alert("Search failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change - only updates the query, no automatic search
  const onChangeSearch = (query) => {
    setSearchQuery(query);
  };

  // Handle search button press
  const handleSearchSubmit = () => {
    if (searchQuery.trim().length >= MIN_SEARCH_CHARS) {
      searchStudents();
    } else {
      alert(`Please enter at least ${MIN_SEARCH_CHARS} characters to search`);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    if (searchQuery.trim().length >= MIN_SEARCH_CHARS) {
      setRefreshing(true);
      await searchStudents();
      setRefreshing(false);
    }
  };

  // Clear search results
  const clearSearch = () => {
    setSearchQuery("");
    setStudents([]);
    setHasSearched(false);
  };

  // Helper function to check if student is accessible
  const isStudentAccessible = (student) => {
    const status = student.status?.toString().toUpperCase().trim();
    return status !== "PENDING" && student.student_id;
  };

  // Enhanced navigateToProfile function with additional checks
  const navigateToProfile = (student) => {
    // Normalize status to uppercase and trim whitespace for more reliable checking
    const status = student.status?.toString().toUpperCase().trim();
    
    // Check if student status is PENDING (case-insensitive)
    if (status === "PENDING") {
      alert("Student profile is not accessible. Status is pending.");
      return;
    }
    
    // Additional safety checks
    if (!student.student_id) {
      alert("Invalid student data. Cannot access profile.");
      return;
    }
    
    // Log for debugging (optional)
    console.log(`Navigating to profile for student: ${student.student_name} (Status: ${status})`);
    
    router.push({
      pathname: "StudentDashboard2",
      params: {
        studentId: student.student_id,
        student_name: student.student_name,
        student_roll: student.student_roll,
        course_code: student.course_code,
      },
    });
  };

  // Get grade color
  const getGradeColor = (grade) => {
    switch (grade) {
      case "A":
        return "#4CAF50";
      case "B":
        return "#234785";
      case "C":
        return "#ffeb44";
      case "FAIL":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "DISPATCHED":
        return "#234785";
      case "PENDING":
        return "#FF9800";
      case "COMPLETED":
        return "#4CAF50";
      default:
        return "#9E9E9E";
    }
  };

  // Check if search button should be enabled
  const isSearchEnabled = searchQuery.trim().length >= MIN_SEARCH_CHARS && !loading;

  // Enhanced renderStudentCard with better status checking
  const renderStudentCard = (student) => {
    const isAccessible = isStudentAccessible(student);
    const status = student.status?.toString().toUpperCase().trim();
    
    return (
      <Card
        key={student.student_id}
        style={[
          styles.studentCard,
          !isAccessible && styles.disabledCard
        ]}
        onPress={isAccessible ? () => navigateToProfile(student) : () => {
          // Show different messages based on the reason for inaccessibility
          if (status === "PENDING") {
            alert("Student profile is not accessible. Status is pending.");
          } else {
            alert("Student profile is not available.");
          }
        }}
        elevation={3}
        disabled={!isAccessible}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Avatar.Text
              size={50}
              label={student.student_name.charAt(0).toUpperCase()}
              style={[
                styles.avatar,
                !isAccessible && styles.disabledAvatar
              ]}
            />
            <View style={styles.studentInfo}>
              <Title style={[
                styles.studentName,
                !isAccessible && styles.disabledText
              ]}>
                {student.student_name}
              </Title>
              <Paragraph style={[
                styles.rollNumber,
                !isAccessible && styles.disabledText
              ]}>
                Roll: {student.student_roll}
              </Paragraph>
            </View>
            <Badge
              size={24}
              style={[
                styles.gradeBadge,
                { backgroundColor: getGradeColor(student.grade) },
                student.grade === "C" && styles.yellowBadge,
                !isAccessible && styles.disabledBadge
              ]}
            >
              <Text style={[
                styles.badgeText,
                student.grade === "C" && styles.yellowBadgeText
              ]}>
                {student.grade}
              </Text>
            </Badge>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.courseInfo}>
            <View style={styles.courseRow}>
              <Ionicons 
                name="school-outline" 
                size={16} 
                color={!isAccessible ? "#ccc" : "#234785"} 
              />
              <Text style={[
                styles.courseText,
                !isAccessible && styles.disabledText
              ]}>
                {student.course_name}
              </Text>
            </View>
            <View style={styles.courseRow}>
              <Ionicons 
                name="business-outline" 
                size={16} 
                color={!isAccessible ? "#ccc" : "#234785"} 
              />
              <Text style={[
                styles.centerText,
                !isAccessible && styles.disabledText
              ]}>
                {student.center_name}
              </Text>
            </View>
            <View style={styles.courseRow}>
              <Ionicons 
                name="call-outline" 
                size={16} 
                color={!isAccessible ? "#ccc" : "#234785"} 
              />
              <Text style={[
                styles.mobileText,
                !isAccessible && styles.disabledText
              ]}>
                {student.student_mobile}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Chip
              mode="outlined"
              style={[
                styles.statusChip,
                { borderColor: getStatusColor(student.status) },
                !isAccessible && styles.disabledChip
              ]}
              textStyle={[
                styles.statusText,
                { color: getStatusColor(student.status) },
              ]}
            >
              {student.status}
            </Chip>
            <View style={styles.percentageContainer}>
              <Text style={[
                styles.percentageLabel,
                !isAccessible && styles.disabledText
              ]}>
                Score: 
              </Text>
              <Text style={[
                styles.percentageValue,
                !isAccessible && styles.disabledText
              ]}>
                {student.percentage}%
              </Text>
            </View>
          </View>

          {/* Enhanced pending indicator */}
          {status === "PENDING" && (
            <View style={styles.pendingOverlay}>
              <Ionicons name="time-outline" size={20} color="#FF9800" />
              <Text style={styles.pendingText}>Profile Access Pending</Text>
            </View>
          )}
          
          {/* Additional indicator for other non-accessible states */}
          {!isAccessible && status !== "PENDING" && (
            <View style={[styles.pendingOverlay, styles.unavailableOverlay]}>
              <Ionicons name="lock-closed-outline" size={20} color="#F44336" />
              <Text style={[styles.pendingText, { color: "#F44336" }]}>Profile Not Available</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />

      <View style={styles.container}>
        {/* Header */}
        <Surface style={styles.header} elevation={2}>
          <Appbar.Header style={styles.appbar}>
            <Appbar.BackAction
              onPress={() => router.back()}
              iconColor="#ffeb44"
            />
            <Appbar.Content
              title="Search Students"
              titleStyle={styles.headerTitle}
            />
            <Appbar.Action
              icon="refresh"
              onPress={onRefresh}
              iconColor="#ffeb44"
              disabled={loading || searchQuery.trim().length < MIN_SEARCH_CHARS}
            />
          </Appbar.Header>
        </Surface>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Surface style={styles.searchContainer} elevation={1}>
            <Searchbar
              placeholder={`Enter name, reg. or mobile`}
              onChangeText={onChangeSearch}
              value={searchQuery}
              style={styles.searchbar}
              inputStyle={styles.searchInput}
              iconColor="#234785"
              onSubmitEditing={handleSearchSubmit}
              placeholderTextColor="#999"
            />
            
            {/* Search Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSearchSubmit}
                disabled={!isSearchEnabled}
                loading={loading}
                style={[styles.searchButton, !isSearchEnabled && styles.disabledButton]}
                labelStyle={styles.buttonLabel}
                icon="magnify"
                buttonColor="#ffeb44"
                textColor="#234785"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
              
              {(searchQuery || students.length > 0) && (
                <Button
                  mode="outlined"
                  onPress={clearSearch}
                  disabled={loading}
                  style={styles.clearButton}
                  labelStyle={styles.clearButtonLabel}
                  textColor="#234785"
                  icon="close"
                >
                  Clear
                </Button>
              )}
            </View>

            {/* Search info text */}
            <View style={styles.searchInfoContainer}>
              {searchQuery.length > 0 && searchQuery.length < MIN_SEARCH_CHARS ? (
                <Text style={styles.charCountText}>
                  {searchQuery.length}/{MIN_SEARCH_CHARS} characters (minimum required)
                </Text>
              ) : searchQuery.length >= MIN_SEARCH_CHARS ? (
                <Text style={styles.readyText}>
                  Ready to search - Click the search button
                </Text>
              ) : (
                <Text style={styles.searchHintText}>
                  Enter student name, roll number, or mobile number
                </Text>
              )}
            </View>
          </Surface>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            students.length === 0 && !loading && styles.scrollContentCentered,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#234785", "#ffeb44"]}
              tintColor="#234785"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#234785" />
              <Text style={styles.loadingText}>Searching students...</Text>
            </View>
          ) : students.length > 0 ? (
            <>
              <View style={styles.resultCountContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.resultCount}>
                  {students.length} student{students.length > 1 ? "s" : ""} found
                  {searchQuery.trim() && (
                    <Text style={styles.searchTermText}> for "{searchQuery.trim()}"</Text>
                  )}
                </Text>
              </View>
              {students.map(renderStudentCard)}
            </>
          ) : hasSearched && searchQuery.trim().length >= MIN_SEARCH_CHARS ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="search-outline" size={64} color="#234785" />
              </View>
              <Text style={styles.emptyText}>No students found</Text>
              <Text style={styles.emptySubtext}>
                No matches found for "{searchQuery.trim()}" in student names, roll numbers, or mobile numbers
              </Text>
            </View>
          ) : (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconContainer}>
                <Ionicons name="school" size={80} color="#234785" />
              </View>
              <Text style={styles.welcomeText}>Student Search</Text>
              <Text style={styles.welcomeSubtext}>
                Enter at least {MIN_SEARCH_CHARS} characters and click search
              </Text>
              <View style={styles.searchOptionsContainer}>
                <Text style={styles.searchOptionsTitle}>Search across:</Text>
                <View style={styles.searchOptionRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.searchOptionItem}>Student Name</Text>
                </View>
                <View style={styles.searchOptionRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.searchOptionItem}>Roll Number</Text>
                </View>
                <View style={styles.searchOptionRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.searchOptionItem}>Mobile Number</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  container: {
    flex: 1,
  },
  searchSection: {
    paddingBottom: 8,
  },
  header: {
    backgroundColor: "#234785",
    elevation: 4,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  appbar: {
    backgroundColor: "#234785",
    elevation: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffeb44",
  },
  searchSection: {
    paddingBottom: 8,
  },
  searchContainer: {
    margin: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "white",
    padding: 15,
    borderWidth: 2,
    borderColor: "#ffeb44",
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#234785",
  },
  searchInput: {
    fontSize: 16,
    color: "#234785",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingTop: 12,
    gap: 12,
  },
  searchButton: {
    flex: 1,
    borderRadius: 8,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  clearButton: {
    borderColor: "#234785",
    borderWidth: 2,
    borderRadius: 8,
    minWidth: 80,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  clearButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  searchInfoContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  charCountText: {
    fontSize: 12,
    color: "#ff6b6b",
    textAlign: "center",
    fontWeight: "500",
  },
  readyText: {
    fontSize: 12,
    color: "#4CAF50",
    textAlign: "center",
    fontWeight: "500",
  },
  searchHintText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    minHeight: height * 0.6,
  },
  scrollContentCentered: {
    justifyContent: "center",
  },
  resultCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderTopWidth: 3,
    borderTopColor: "#ffeb44",
  },
  resultCount: {
    fontSize: 14,
    color: "#234785",
    marginLeft: 8,
    fontWeight: "600",
  },
  searchTermText: {
    fontStyle: "italic",
    color: "#666",
  },
  studentCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "white",
    width: "100%",
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: "#234785",
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: width < 350 ? 16 : 18,
    fontWeight: "bold",
    color: "#234785",
    marginBottom: 2,
  },
  rollNumber: {
    fontSize: width < 350 ? 12 : 14,
    color: "#666",
    marginBottom: 0,
  },
  gradeBadge: {
    color: "white",
    fontWeight: "bold",
  },
  yellowBadge: {
    borderWidth: 1,
    borderColor: "#ffb300",
  },
  badgeText: {
    color: "white",
    fontWeight: "bold",
  },
  yellowBadgeText: {
    color: "#234785",
  },
  divider: {
    marginBottom: 12,
    backgroundColor: "#ffeb44",
    height: 2,
  },
  courseInfo: {
    marginBottom: 12,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  courseText: {
    marginLeft: 8,
    fontSize: width < 350 ? 12 : 14,
    color: "#234785",
    flex: 1,
    fontWeight: "600",
  },
  centerText: {
    marginLeft: 8,
    fontSize: width < 350 ? 12 : 14,
    color: "#666",
    flex: 1,
  },
  mobileText: {
    marginLeft: 8,
    fontSize: width < 350 ? 12 : 14,
    color: "#666",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    backgroundColor: "transparent",
  },
  statusText: {
    fontSize: width < 350 ? 10 : 12,
    fontWeight: "600",
  },
  percentageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  percentageLabel: {
    fontSize: width < 350 ? 12 : 14,
    color: "#666",
  },
  percentageValue: {
    fontSize: width < 350 ? 14 : 16,
    fontWeight: "bold",
    color: "#234785",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#234785",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    flex: 1,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff9e6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#ffeb44",
  },
  emptyText: {
    fontSize: 18,
    color: "#234785",
    marginTop: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    flex: 1,
  },
  welcomeIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
    borderColor: "#ffeb44",
  },
  welcomeText: {
    fontSize: width < 350 ? 20 : 24,
    color: "#234785",
    marginTop: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  welcomeSubtext: {
    fontSize: width < 350 ? 14 : 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  searchOptionsContainer: {
    marginTop: 24,
    alignItems: "flex-start",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  searchOptionsTitle: {
    fontSize: 16,
    color: "#234785",
    fontWeight: "bold",
    marginBottom: 12,
  },
  searchOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  searchOptionItem: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  
  // Enhanced disabled styles
  disabledCard: {
    opacity: 0.7,
    backgroundColor: "#f5f5f5",
  },
  disabledText: {
    color: "#999",
  },
  disabledAvatar: {
    backgroundColor: "#ccc",
  },
  disabledBadge: {
    opacity: 0.6,
  },
  disabledChip: {
    opacity: 0.6,
  },
  pendingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff3e0",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ffcc80",
  },
  unavailableOverlay: {
    backgroundColor: "#ffebee",
    borderColor: "#ffcdd2",
  },
  pendingText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "500",
  },
});

export default StudentSearchScreen;