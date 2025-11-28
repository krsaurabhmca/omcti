import { router } from "expo-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Card,
  Chip,
  IconButton,
  Provider as PaperProvider,
  Searchbar,
  Snackbar,
  Surface,
  Text
} from "react-native-paper";

export default function PendingResultScreen() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showSnackbar = useCallback((message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch("https://omcti.in/apprise/api.php?task=pending_result");
      const data = await response.json();
      setStudents(data);
      setFiltered(data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setRefreshing(false);
      showSnackbar("Failed to load students");
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filter students whenever search or students change
  useEffect(() => {
    if (search.trim() === "") {
      setFiltered(students);
    } else {
      const lower = search.toLowerCase();
      setFiltered(
        students.filter(
          (s) =>
            s.student_name.toLowerCase().includes(lower) ||
            s.student_roll.toLowerCase().includes(lower) ||
            s.course_code.toLowerCase().includes(lower) ||
            s.center_name.toLowerCase().includes(lower)
        )
      );
    }
  }, [students, search]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudents();
  }, [fetchStudents]);

  const handleEdit = useCallback((studentId) => {
    router.push({
      pathname: "./ResultEditScreen",
      params: { studentId: studentId },
    });
  }, []);

  // Simple search handler that only updates search state
  const handleSearch = useCallback((text) => {
    setSearch(text);
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#ff9800';
      case 'completed': return '#4caf50';
      case 'in_progress': return '#234785';
      default: return '#9e9e9e';
    }
  }, []);

  const renderStudent = useCallback(({ item, index }) => (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.cardContent}>
        <View style={styles.studentRow}>
          {/* Student Avatar and Info */}
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
              <Text variant="bodySmall" style={styles.centerName}>
                📍 {item.center_name}
              </Text>
            </View>
          </View>

          {/* Action Section */}
          <View style={styles.actionSection}>
            <Button
              mode="contained"
              onPress={() => handleEdit(item.id)}
              style={styles.editButton}
              contentStyle={styles.editButtonContent}
              labelStyle={styles.editButtonLabel}
              icon="pencil"
              compact
            > Edit
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  ), [handleEdit, getStatusColor]);

  const renderEmpty = useCallback(() => (
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
        {search 
          ? "No results match your search criteria" 
          : "All results have been processed"}
      </Text>
      {search && (
        <Button 
          mode="outlined" 
          onPress={() => setSearch("")} 
          style={styles.clearButton}
          labelStyle={styles.clearButtonLabel}
          icon="close"
        >
          Clear Search
        </Button>
      )}
    </View>
  ), [search]);

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <Appbar.Header elevated style={styles.appbarHeader}>
         <Appbar.BackAction
            onPress={() => router.back()}
            iconColor="#ffeb44"
          />
          <Appbar.Content 
            title="Pending Results" 
            subtitle={`${students.length} total students`}
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
            icon="information-outline" 
            onPress={() => showSnackbar("Results awaiting evaluation")}
            iconColor="#ffeb44"
          />
        </Appbar.Header>

        {/* Enhanced search section outside of FlatList */}
        <Surface style={styles.headerSurface} elevation={2}>
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Searchbar
                placeholder="Search by name, roll, course, center..."
                onChangeText={handleSearch}
                value={search}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
                icon="magnify"
                clearIcon="close-circle"
                iconColor="#234785"
                placeholderTextColor="#9e9e9e"
                autoCorrect={false}
                autoCapitalize="none"
                blurOnSubmit={false}
                elevation={3}
                mode="bar"
              />
            </View>
          </View>
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
            ListEmptyComponent={renderEmpty}
            ItemSeparatorComponent={renderSeparator}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#234785']}
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
            label: 'OK',
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
  searchContainer: {
    // marginBottom: 16, // Reduced margin since summary row is commented out
  },
  searchWrapper: {
    position: "relative",
  },
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
  searchActions: {
    position: "absolute",
    right: 60,
    top: 12,
  },
  clearChip: {
    backgroundColor: "#ffebee",
    borderColor: "#f44336",
    height: 28,
  },
  clearChipText: {
    fontSize: 11,
    color: "#f44336",
    fontWeight: "600",
  },
  quickFilters: {
    marginTop: 12,
  },
  quickFiltersLabel: {
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  quickFiltersRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  quickFilterChip: {
    backgroundColor: "#fff9e6",
    borderColor: "#234785",
    borderWidth: 1,
  },
  quickFilterText: {
    fontSize: 12,
    color: "#234785",
    fontWeight: "500",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  summaryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultCounter: {
    alignItems: "flex-start",
  },
  summaryText: {
    color: "#234785",
    fontWeight: "700",
    fontSize: 16,
  },
  summarySubtext: {
    color: "#666",
    fontSize: 12,
    marginTop: -2,
  },
  searchChip: {
    backgroundColor: "#e8f5e8",
    borderColor: "#4caf50",
    borderWidth: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e0e0e0",
    borderWidth: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
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
  centerName: {
    color: "#234785",
    fontWeight: "600",
    fontSize: 13,
  },
  actionSection: {
    alignItems: "center",
    marginLeft: 2,
  },
  statusBadge: {
    marginBottom: 8,
    color: "#ffffff",
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