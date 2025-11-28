import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Card,
  Chip,
  Provider as PaperProvider,
  Searchbar,
  Snackbar,
  Surface,
  Text,
} from "react-native-paper";

export default function PendingResultScreen() {
  // Center related states
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [centerSearch, setCenterSearch] = useState("");
  const [centerLoading, setCenterLoading] = useState(false);

  // Student related states
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  // UI states
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showSnackbar = useCallback((message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // Search for centers
  const searchCenters = useCallback(
    async (searchText) => {
      if (searchText.trim() === "") {
        setCenters([]);
        return;
      }

      setCenterLoading(true);
      try {
        const response = await fetch(
          "https://omcti.in/apprise/api.php?task=get_centers",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ value: searchText }),
          }
        );
        const data = await response.json();
        setCenters(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching centers:", error);
        showSnackbar("Failed to search centers");
        setCenters([]);
      } finally {
        setCenterLoading(false);
      }
    },
    [showSnackbar]
  );

  // Debounced center search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedCenter) {
        searchCenters(centerSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [centerSearch, selectedCenter, searchCenters]);

  // Fetch students for selected center (POST request)
  const fetchStudents = useCallback(
    async (centerId) => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://omcti.in/apprise/api.php?task=pending_result",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ center_id: centerId }),
          }
        );
        const data = await response.json();
        const studentData = Array.isArray(data) ? data : [];
        setStudents(studentData);
        setFiltered(studentData);
      } catch (error) {
        console.error("Error fetching students:", error);
        showSnackbar("Failed to load students");
        setStudents([]);
        setFiltered([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showSnackbar]
  );

  // Handle center selection
  const handleCenterSelect = useCallback(
    (center) => {
      setSelectedCenter(center);
      setCenters([]);
      setCenterSearch("");
      fetchStudents(center.id);
    },
    [fetchStudents]
  );

  // Go back to center selection
  const handleBackToCenter = useCallback(() => {
    setSelectedCenter(null);
    setStudents([]);
    setFiltered([]);
    setStudentSearch("");
    setCenterSearch("");
  }, []);

  // Filter students whenever search or students change
  useEffect(() => {
    if (studentSearch.trim() === "") {
      setFiltered(students);
    } else {
      const lower = studentSearch.toLowerCase();
      setFiltered(
        students.filter(
          (s) =>
            s.student_name?.toLowerCase().includes(lower) ||
            s.student_roll?.toLowerCase().includes(lower) ||
            s.course_code?.toLowerCase().includes(lower)
        )
      );
    }
  }, [students, studentSearch]);

  const onRefresh = useCallback(() => {
    if (selectedCenter) {
      setRefreshing(true);
      fetchStudents(selectedCenter.id);
    }
  }, [selectedCenter, fetchStudents]);

  const handleEdit = useCallback((studentId) => {
    router.push({
      pathname: "./ResultEditScreen",
      params: { studentId: studentId },
    });
  }, []);

  const handleCenterSearch = useCallback((text) => {
    setCenterSearch(text);
  }, []);

  const handleStudentSearch = useCallback((text) => {
    setStudentSearch(text);
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "#4caf50";
      case "block":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  }, []);

  // Render center item
  const renderCenter = useCallback(
    ({ item }) => (
      <TouchableOpacity
        onPress={() => handleCenterSelect(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.centerCard} mode="elevated">
          <Card.Content style={styles.centerCardContent}>
            <View style={styles.centerRow}>
              <View style={styles.centerIconContainer}>
                <Avatar.Icon
                  size={50}
                  icon="office-building"
                  style={[
                    styles.centerIcon,
                    {
                      backgroundColor:
                        item.status === "ACTIVE" ? "#e8f5e9" : "#ffebee",
                    },
                  ]}
                  color={item.status === "ACTIVE" ? "#4caf50" : "#f44336"}
                />
              </View>
              <View style={styles.centerInfo}>
                <Text variant="titleMedium" style={styles.centerName}>
                  {item.center_name}
                </Text>
                <Text variant="bodySmall" style={styles.centerCode}>
                  Code: {item.center_code}
                </Text>
                <Text variant="bodySmall" style={styles.centerDirector}>
                  👤 {item.center_director}
                </Text>
                <Text variant="bodySmall" style={styles.centerLocation}>
                  📍 {item.dist_name}, {item.state_name}
                </Text>
              </View>
              <View style={styles.centerMeta}>
                <Chip
                  mode="flat"
                  compact
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        item.status === "ACTIVE" ? "#e8f5e9" : "#ffebee",
                    },
                  ]}
                  textStyle={[
                    styles.statusChipText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.status}
                </Chip>
                <View style={styles.studentCountContainer}>
                  <Text style={styles.studentCount}>{item.student_count}</Text>
                  <Text style={styles.studentCountLabel}>Students</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    ),
    [handleCenterSelect, getStatusColor]
  );

  // Render student item
  const renderStudent = useCallback(
    ({ item }) => (
      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <View style={styles.studentRow}>
            <View style={styles.leftSection}>
              <Avatar.Image
                size={64}
                source={{
                  uri: `https://omcti.in/apprise/temp/upload/${item.student_photo}`,
                }}
                style={styles.avatar}
              />
              <View style={styles.studentInfo}>
                <Text variant="titleMedium" style={styles.studentName}>
                  {item.student_name}
                </Text>
                <Text variant="bodyMedium" style={styles.rollNumber}>
                  Roll: {item.student_roll}
                </Text>
                <View style={styles.metaInfo}>
                  <Chip
                    mode="outlined"
                    compact
                    style={styles.courseChip}
                    textStyle={styles.chipText}
                    icon="book-outline"
                  >
                    {item.course_code}
                  </Chip>
                </View>
                <Text variant="bodySmall" style={styles.studentCenterName}>
                  📍 {item.center_name}
                </Text>
              </View>
            </View>
            <View style={styles.actionSection}>
              <Button
                mode="contained"
                onPress={() => handleEdit(item.id)}
                style={styles.editButton}
                contentStyle={styles.editButtonContent}
                labelStyle={styles.editButtonLabel}
                icon="pencil"
                compact
              >
                Edit
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    ),
    [handleEdit]
  );

  // Render empty centers
  const renderEmptyCenters = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Avatar.Icon
          size={80}
          icon="office-building-outline"
          style={styles.emptyIcon}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          {centerSearch ? "No centers found" : "Search for a center"}
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          {centerSearch
            ? "Try a different search term"
            : "Enter center name, code, or director name to search"}
        </Text>
      </View>
    ),
    [centerSearch]
  );

  // Render empty students
  const renderEmptyStudents = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Avatar.Icon
          size={80}
          icon="clipboard-text-outline"
          style={styles.emptyIcon}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          No pending results
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          {studentSearch
            ? "No results match your search criteria"
            : "All results for this center have been processed"}
        </Text>
        {studentSearch && (
          <Button
            mode="outlined"
            onPress={() => setStudentSearch("")}
            style={styles.clearButton}
            labelStyle={styles.clearButtonLabel}
            icon="close"
          >
            Clear Search
          </Button>
        )}
      </View>
    ),
    [studentSearch]
  );

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    []
  );

  // ========== RENDER CENTER SELECTION VIEW ==========
  if (!selectedCenter) {
    return (
      <PaperProvider>
        <SafeAreaView style={styles.container}>
          <Appbar.Header elevated style={styles.appbarHeader}>
            <Appbar.BackAction
              onPress={() => router.back()}
              iconColor="#ffeb44"
            />
            <Appbar.Content
              title="Select Center"
              subtitle="Search and select a center"
              titleStyle={styles.appbarTitle}
              subtitleStyle={styles.appbarSubtitle}
            />
            <Appbar.Action
              icon="information-outline"
              onPress={() =>
                showSnackbar("Search for a center to view pending results")
              }
              iconColor="#ffeb44"
            />
          </Appbar.Header>

          <Surface style={styles.headerSurface} elevation={2}>
            <View style={styles.searchContainer}>
              <Searchbar
                placeholder="Search center name, code, director..."
                onChangeText={handleCenterSearch}
                value={centerSearch}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
                icon="magnify"
                clearIcon="close-circle"
                iconColor="#234785"
                placeholderTextColor="#9e9e9e"
                autoCorrect={false}
                autoCapitalize="none"
                elevation={3}
                mode="bar"
              />
            </View>
          </Surface>

          {centerLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                animating={true}
                size="large"
                color="#234785"
              />
              <Text variant="bodyLarge" style={styles.loadingText}>
                Searching centers...
              </Text>
            </View>
          ) : (
            <FlatList
              data={centers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCenter}
              ListEmptyComponent={renderEmptyCenters}
              ItemSeparatorComponent={renderSeparator}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}

          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            style={styles.snackbar}
            action={{
              label: "OK",
              labelStyle: styles.snackbarAction,
              onPress: () => setSnackbarVisible(false),
            }}
          >
            {snackbarMessage}
          </Snackbar>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  // ========== RENDER STUDENT LIST VIEW ==========
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <Appbar.Header elevated style={styles.appbarHeader}>
          <Appbar.BackAction
            onPress={handleBackToCenter}
            iconColor="#ffeb44"
          />
          <Appbar.Content
            title="Pending Results"
            subtitle={selectedCenter.center_name}
            titleStyle={styles.appbarTitle}
            subtitleStyle={styles.appbarSubtitle}
          />
          <Appbar.Action
            icon="refresh"
            onPress={onRefresh}
            disabled={loading || refreshing}
            iconColor="#ffeb44"
          />
          <Appbar.Action
            icon="swap-horizontal"
            onPress={handleBackToCenter}
            iconColor="#ffeb44"
          />
        </Appbar.Header>

        {/* Selected Center Info */}
        <Surface style={styles.selectedCenterSurface} elevation={1}>
          <View style={styles.selectedCenterRow}>
            <View style={styles.selectedCenterInfo}>
              <Avatar.Icon
                size={40}
                icon="office-building"
                style={styles.selectedCenterIcon}
                color="#234785"
              />
              <View style={styles.selectedCenterDetails}>
                <Text variant="titleSmall" style={styles.selectedCenterName}>
                  {selectedCenter.center_name}
                </Text>
                <Text variant="bodySmall" style={styles.selectedCenterCode}>
                  {selectedCenter.center_code} • {selectedCenter.dist_name}
                </Text>
              </View>
            </View>
            <Chip
              mode="outlined"
              compact
              style={styles.studentCountChip}
              textStyle={styles.studentCountChipText}
              icon="account-group"
            >
              {students.length} Pending
            </Chip>
          </View>
        </Surface>

        {/* Student Search */}
        <Surface style={styles.studentSearchSurface} elevation={2}>
          <Searchbar
            placeholder="Search by name, roll, course..."
            onChangeText={handleStudentSearch}
            value={studentSearch}
            style={styles.studentSearchbar}
            inputStyle={styles.searchInput}
            icon="magnify"
            clearIcon="close-circle"
            iconColor="#234785"
            placeholderTextColor="#9e9e9e"
            autoCorrect={false}
            autoCapitalize="none"
            elevation={3}
            mode="bar"
          />
        </Surface>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} size="large" color="#234785" />
            <Text variant="bodyLarge" style={styles.loadingText}>
              Loading pending results...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderStudent}
            ListEmptyComponent={renderEmptyStudents}
            ItemSeparatorComponent={renderSeparator}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#234785"]}
                tintColor="#234785"
              />
            }
          />
        )}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles.snackbar}
          action={{
            label: "OK",
            labelStyle: styles.snackbarAction,
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  appbarHeader: {
    backgroundColor: "#234785",
  },
  appbarTitle: {
    color: "#ffeb44",
    fontWeight: "bold",
  },
  appbarSubtitle: {
    color: "#ffffff",
    opacity: 0.9,
  },
  headerSurface: {
    padding: 20,
    marginBottom: 8,
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  searchContainer: {},
  searchbar: {
    elevation: 4,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ffeb44",
    shadowColor: "#234785",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    fontSize: 16,
    color: "#1a1a1a",
    paddingLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  // Center Card Styles
  centerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#234785",
  },
  centerCardContent: {
    padding: 16,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  centerIconContainer: {
    marginRight: 12,
  },
  centerIcon: {
    backgroundColor: "#e8f5e9",
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontWeight: "700",
    color: "#234785",
    marginBottom: 2,
  },
  centerCode: {
    color: "#666",
    fontWeight: "600",
    marginBottom: 2,
  },
  centerDirector: {
    color: "#555",
    marginBottom: 2,
  },
  centerLocation: {
    color: "#234785",
    fontWeight: "500",
  },
  centerMeta: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  statusChip: {
    marginBottom: 8,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "700",
  },
  studentCountContainer: {
    alignItems: "center",
    backgroundColor: "#fff9e6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffeb44",
  },
  studentCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#234785",
  },
  studentCountLabel: {
    fontSize: 10,
    color: "#666",
  },
  // Selected Center Surface
  selectedCenterSurface: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff9e6",
    borderBottomWidth: 1,
    borderBottomColor: "#ffeb44",
  },
  selectedCenterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedCenterInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedCenterIcon: {
    backgroundColor: "#ffeb44",
    marginRight: 12,
  },
  selectedCenterDetails: {
    flex: 1,
  },
  selectedCenterName: {
    fontWeight: "700",
    color: "#234785",
  },
  selectedCenterCode: {
    color: "#666",
    fontSize: 12,
  },
  studentCountChip: {
    backgroundColor: "#ffffff",
    borderColor: "#234785",
    borderWidth: 1,
  },
  studentCountChipText: {
    color: "#234785",
    fontWeight: "600",
    fontSize: 12,
  },
  // Student Search Surface
  studentSearchSurface: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  studentSearchbar: {
    elevation: 2,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  // Student Card Styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: "#e0e0e0",
    borderRightColor: "#e0e0e0",
    borderBottomColor: "#e0e0e0",
  },
  cardContent: {
    padding: 16,
  },
  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftSection: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-start",
  },
  avatar: {
    backgroundColor: "#e0e0e0",
    marginRight: 12,
    borderWidth: 3,
    borderColor: "#ffeb44",
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontWeight: "700",
    marginBottom: 4,
    color: "#234785",
    fontSize: 16,
  },
  rollNumber: {
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  metaInfo: {
    marginBottom: 6,
  },
  courseChip: {
    alignSelf: "flex-start",
    backgroundColor: "#fff9e6",
    borderWidth: 2,
    borderColor: "#ffeb44",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#234785",
  },
  studentCenterName: {
    color: "#234785",
    fontWeight: "600",
    fontSize: 13,
  },
  actionSection: {
    alignItems: "center",
    marginLeft: 2,
  },
  editButton: {
    borderRadius: 25,
    paddingHorizontal: 6,
    elevation: 3,
    backgroundColor: "#ffeb44",
    shadowColor: "#234785",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  editButtonContent: {
    paddingHorizontal: 0,
  },
  editButtonLabel: {
    color: "#234785",
    fontWeight: "700",
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    backgroundColor: "#234785",
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
    color: "#234785",
    fontWeight: "bold",
  },
  emptySubtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  clearButton: {
    marginTop: 8,
    borderColor: "#234785",
    borderWidth: 2,
  },
  clearButtonLabel: {
    color: "#234785",
    fontWeight: "600",
  },
  snackbar: {
    backgroundColor: "#234785",
  },
  snackbarAction: {
    color: "#ffeb44",
    fontWeight: "bold",
  },
});