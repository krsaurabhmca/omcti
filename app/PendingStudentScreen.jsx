import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  Provider as PaperProvider,
  Paragraph,
  Portal,
  Searchbar,
  Snackbar,
  Surface,
  Text
} from "react-native-paper";

export default function PendingStudents() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [verifyDialogVisible, setVerifyDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showSnackbar = useCallback((message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const fetchStudents = useCallback(() => {
    setLoading(true);
    fetch("https://omcti.in/apprise/api.php?task=pending_student")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        showSnackbar("Failed to load students");
      });
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
            (s.center_code
              ? s.center_code.toLowerCase().includes(lower)
              : false) ||
            s.course_code.toLowerCase().includes(lower) ||
            s.center_name.toLowerCase().includes(lower)
        )
      );
    }
  }, [students, search]);

  const handleSearch = useCallback((text) => {
    setSearch(text);
  }, []);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((s) => s.id));
    }
  }, [selectedIds.length, filtered]);

  const handleVerify = useCallback(async () => {
    if (selectedIds.length === 0) {
      showSnackbar("Please select at least one student");
      return;
    }
    setVerifyDialogVisible(true);
  }, [selectedIds.length, showSnackbar]);

  const confirmVerify = useCallback(async () => {
    setVerifyDialogVisible(false);

    try {
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=verify_student",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds }),
        }
      );
      const result = await response.json();

      showSnackbar(`Successfully verified ${selectedIds.length} student(s)`);
      setSelectedIds([]);
      fetchStudents();
    } catch (error) {
      console.error(error);
      showSnackbar("Failed to verify students");
    }
  }, [selectedIds, showSnackbar, fetchStudents]);

  const renderStudent = useCallback(({ item }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.cardContent}>
          <Avatar.Image
            size={60}
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
            <View style={styles.chipContainer}>
              <Chip
                mode="outlined"
                compact
                style={styles.courseChip}
                textStyle={styles.chipText}
              >
                {item.course_code}
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.centerName}>
              📍 {item.center_name}
            </Text>
          </View>

          <View style={styles.checkboxContainer}>
            <Checkbox
              status={selectedIds.includes(item.id) ? "checked" : "unchecked"}
              onPress={() => toggleSelect(item.id)}
              color="#234785"
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  ), [selectedIds, toggleSelect]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="account-search" style={styles.emptyIcon} />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No students found
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        {search
          ? "Try adjusting your search terms"
          : "No pending students at the moment"}
      </Text>
      {search && (
        <Button
          mode="outlined"
          onPress={() => setSearch("")}
          style={styles.clearButton}
          labelStyle={styles.clearButtonLabel}
        >
          Clear Search
        </Button>
      )}
    </View>
  ), [search]);

  // Action row component
  const ActionRow = useMemo(() => (
    <View style={styles.actionRow}>
      <View style={styles.resultInfo}>
        <Text variant="bodyMedium" style={styles.resultText}>
          {filtered.length} student{filtered.length !== 1 ? "s" : ""} found
        </Text>
        {selectedIds.length > 0 && (
          <Chip mode="flat" style={styles.selectedChip} textStyle={styles.selectedChipText}>
            {selectedIds.length} selected
          </Chip>
        )}
      </View>

      <Button
        mode={
          selectedIds.length === filtered.length && filtered.length > 0
            ? "outlined"
            : "contained"
        }
        onPress={toggleSelectAll}
        compact
        disabled={filtered.length === 0}
        style={
          selectedIds.length === filtered.length && filtered.length > 0
            ? styles.selectButtonOutlined
            : styles.selectButton
        }
        labelStyle={
          selectedIds.length === filtered.length && filtered.length > 0
            ? styles.selectButtonOutlinedLabel
            : styles.selectButtonLabel
        }
      >
        {selectedIds.length === filtered.length && filtered.length > 0
          ? "Unselect All"
          : "Select All"}
      </Button>
    </View>
  ), [filtered.length, selectedIds.length, toggleSelectAll]);

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.appbarHeader}>
          <Appbar.BackAction onPress={() => router.back()} iconColor="#ffeb44" />
          <Appbar.Content 
            title="Pending Students" 
            titleStyle={styles.appbarTitle}
          />
          <Appbar.Action
            icon="refresh"
            onPress={fetchStudents}
            disabled={loading}
            iconColor="#ffeb44"
          />
          {selectedIds.length > 0 && (
            <Appbar.Action
              icon="check-circle"
              onPress={handleVerify}
              iconColor="#ffeb44"
            />
          )}
        </Appbar.Header>

        {/* Move search and actions outside of FlatList */}
        <Surface style={styles.headerSurface} elevation={1}>
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search by name, roll, course, center..."
              onChangeText={handleSearch}
              value={search}
              style={styles.searchbar}
              icon="account-search"
              iconColor="#234785"
              autoCorrect={false}
              autoCapitalize="none"
              blurOnSubmit={false}
            />
          </View>
          {ActionRow}
        </Surface>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} size="large" color="#234785" />
            <Text variant="bodyLarge" style={styles.loadingText}>
              Loading students...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderStudent}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
          />
        )}

        <Portal>
          <Dialog
            visible={verifyDialogVisible}
            onDismiss={() => setVerifyDialogVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>Confirm Verification</Dialog.Title>
            <Dialog.Content>
              <Paragraph>
                Are you sure you want to verify {selectedIds.length} selected
                student{selectedIds.length !== 1 ? "s" : ""}?
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button 
                onPress={() => setVerifyDialogVisible(false)}
                labelStyle={styles.dialogCancelLabel}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={confirmVerify}
                style={styles.dialogVerifyButton}
                labelStyle={styles.dialogVerifyLabel}
              >
                Verify
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

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
    backgroundColor: "#f6f6f6",
  },
  appbarHeader: {
    backgroundColor: "#234785",
  },
  appbarTitle: {
    color: "#ffeb44",
    fontWeight: "bold",
  },
  headerSurface: {
    padding: 16,
    marginBottom: 8,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchbar: {
    elevation: 2,
    borderWidth: 2,
    borderColor: "#ffeb44",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultText: {
    color: "#234785",
    fontWeight: "600",
  },
  selectedChip: {
    backgroundColor: "#fff9e6",
    borderWidth: 1,
    borderColor: "#ffeb44",
  },
  selectedChipText: {
    color: "#234785",
    fontWeight: "700",
  },
  selectButton: {
    backgroundColor: "#ffeb44",
  },
  selectButtonLabel: {
    color: "#234785",
    fontWeight: "700",
  },
  selectButtonOutlined: {
    borderColor: "#234785",
    borderWidth: 2,
  },
  selectButtonOutlinedLabel: {
    color: "#234785",
    fontWeight: "700",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#e0e0e0",
    borderWidth: 3,
    borderColor: "#ffeb44",
  },
  studentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  studentName: {
    fontWeight: "700",
    marginBottom: 4,
    color: "#234785",
  },
  rollNumber: {
    color: "#666",
    marginBottom: 6,
  },
  chipContainer: {
    marginBottom: 6,
  },
  courseChip: {
    alignSelf: "flex-start",
    backgroundColor: "#fff9e6",
    borderColor: "#ffeb44",
    borderWidth: 2,
  },
  chipText: {
    fontSize: 12,
    color: "#234785",
    fontWeight: "600",
  },
  centerName: {
    color: "#234785",
    fontWeight: "600",
  },
  checkboxContainer: {
    marginLeft: 8,
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
  },
  clearButton: {
    marginTop: 8,
    borderColor: "#234785",
    borderWidth: 2,
  },
  clearButtonLabel: {
    color: "#234785",
    fontWeight: "700",
  },
  dialog: {
    backgroundColor: "#ffffff",
  },
  dialogTitle: {
    color: "#234785",
    fontWeight: "bold",
  },
  dialogCancelLabel: {
    color: "#666",
  },
  dialogVerifyButton: {
    backgroundColor: "#ffeb44",
  },
  dialogVerifyLabel: {
    color: "#234785",
    fontWeight: "bold",
  },
  snackbar: {
    backgroundColor: "#234785",
  },
  snackbarAction: {
    color: "#ffeb44",
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffeb44",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#234785",
  },
});