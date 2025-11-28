import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
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
  DataTable,
  Dialog,
  FAB,
  HelperText,
  Provider as PaperProvider,
  Portal,
  Snackbar,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";

export default function ResultEditScreen() {
  const { studentId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState(null);
  const [marks, setMarks] = useState(null);
  const [ccode, setCcode] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    fetchMarks();
    
    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [studentId]);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=get_marks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: studentId }),
        }
      );

      const data = await response.json();
      setStudent(data.student);
      setMarks(data.marks);
      setCcode(data.ccode);
    } catch (error) {
      showSnackbar("Failed to load marksheet");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!marks.serial_no?.trim()) {
      newErrors.serial_no = "Serial number is required";
    }

    if (!marks.issue_date) {
      newErrors.issue_date = "Issue date is required";
    }

    marks.papers.forEach((paper, index) => {
      if (isSpeed) {
        if (!paper.speed || isNaN(paper.speed)) {
          newErrors[`speed_${index}`] = "Valid speed required";
        }
      } else {
        if (!paper.marks_obtained || isNaN(paper.marks_obtained)) {
          newErrors[`marks_${index}`] = "Valid marks required";
        }
        
        // Additional validation: obtained marks shouldn't exceed full marks
        const obtained = parseInt(paper.marks_obtained || 0);
        const full = parseInt(paper.full_marks || 0);
        
        if (obtained > full) {
          newErrors[`marks_${index}`] = "Obtained marks cannot exceed full marks";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updatePaperField = (index, field, value) => {
    const newPapers = [...marks.papers];
    newPapers[index][field] = value;
    setMarks({ ...marks, papers: newPapers });

    // Clear error for this field
    const errorKey = field === "speed" ? `speed_${index}` : `marks_${index}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const calculateTotals = () => {
    if (isSpeed) return { totalSpeed: 0 };

    const totalFull = marks.papers.reduce(
      (sum, p) => sum + parseInt(p.full_marks || 0),
      0
    );
    const totalPass = marks.papers.reduce(
      (sum, p) => sum + parseInt(p.pass_marks || 0),
      0
    );
    const totalObt = marks.papers.reduce(
      (sum, p) => sum + parseInt(p.marks_obtained || 0),
      0
    );

    const percentage =
      totalFull > 0 ? ((totalObt / totalFull) * 100).toFixed(2) : "0";

    return { totalFull, totalPass, totalObt, percentage };
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showSnackbar("Please fix the errors before saving");
      return;
    }
    setConfirmDialogVisible(true);
  };

  const handleBack = () => {
    router.back();
  };

  const confirmSave = async () => {
    setConfirmDialogVisible(false);
    setSaving(true);

    try {
      const totals = calculateTotals();
      
      const requestData = {
        result_id: marks.result_id, 
        student_id: studentId,
        ms_no: marks.serial_no, 
        ms_date: marks.issue_date 
      };

      marks.papers.forEach((paper, index) => {
        const paperKey = `paper${index + 1}`;
        if (isSpeed) {
          requestData[paperKey] = paper.speed;
        } else {
          requestData[paperKey] = paper.marks_obtained;
        }
      });

      if (!isSpeed) {
        requestData.total = totals.totalObt.toFixed(2);
        requestData.percentage = (marks.percentage || totals.percentage).toString();
        requestData.grade = marks.grade || "";
      }

      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=result_edit",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Check if the API returned a success indicator
      if (responseData.success === false) {
        throw new Error(responseData.message || "Failed to save result");
      }

      // Show success dialog instead of snackbar
      setSuccessDialogVisible(true);
      
    } catch (error) {
      console.error("Error saving result:", error);
      showSnackbar(error.message || "Failed to save result");
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessOk = () => {
    setSuccessDialogVisible(false);
    router.push("/PendingResultScreen");
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split("T")[0];
      setMarks({ ...marks, issue_date: formatted });

      if (errors.issue_date) {
        const newErrors = { ...errors };
        delete newErrors.issue_date;
        setErrors(newErrors);
      }
    }
  };

  if (loading) {
    return (
      <PaperProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} size="large" color="#234785" />
            <Text variant="bodyLarge" style={styles.loadingText}>
              Loading marksheet...
            </Text>
          </View>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  if (!student || !marks) {
    return (
      <PaperProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Avatar.Icon
              size={80}
              icon="alert-circle"
              style={styles.errorIcon}
            />
            <Text variant="headlineSmall" style={styles.errorTitle}>
              No Data Found
            </Text>
            <Text variant="bodyMedium" style={styles.errorSubtitle}>
              Unable to load marksheet data
            </Text>
            <Button
              mode="contained"
              onPress={fetchMarks}
              style={styles.retryButton}
              buttonColor="#ffeb44"
              textColor="#234785"
            >
              Retry
            </Button>
          </View>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  const isSpeed =
    marks.papers.length > 0 && marks.papers[0].speed !== undefined;
  const totals = calculateTotals();

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <Appbar.Header elevated style={styles.appbarHeader}>
          <Appbar.BackAction onPress={handleBack} iconColor="#ffeb44" />
          <Appbar.Content 
            title="Edit Result" 
            subtitle={student.student_name}
            titleStyle={styles.appbarTitle}
            subtitleStyle={styles.appbarSubtitle}
          />
          <Appbar.Action
            icon="content-save"
            onPress={handleSave}
            disabled={saving}
            iconColor="#ffeb44"
          />
        </Appbar.Header>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollViewContent}
          >
            {/* Student Information Card */}
            <Card style={styles.studentCard} mode="elevated">
              <Card.Content>
                <View style={styles.studentHeader}>
                  <Avatar.Image
                    size={64}
                    source={{
                      uri: `https://omcti.in/apprise/temp/upload/${student.student_photo}`,
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.studentInfo}>
                    <Text variant="titleLarge" style={styles.studentName}>
                      {student.student_name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.rollNumber}>
                      Roll: {student.student_roll}
                    </Text>
                    <Chip mode="outlined" style={styles.courseChip} textStyle={styles.courseChipText} compact>
                      {ccode}
                    </Chip>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Papers/Marks Section */}
            <Surface style={styles.marksSection} elevation={1}>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {isSpeed ? "Speed Assessment" : "Marks Assessment"}
                </Text>
                <Chip
                  mode="flat"
                  style={styles.typeChip}
                  textStyle={styles.typeChipText}
                  icon={isSpeed ? "speedometer" : "calculator"}
                >
                  {isSpeed ? "Speed Based" : "Marks Based"}
                </Chip>
              </View>

              <DataTable style={styles.dataTable}>
                <DataTable.Header>
                  <DataTable.Title style={{ flex: 2 }}>Paper</DataTable.Title>
                  {isSpeed ? (
                    <DataTable.Title numeric>Speed</DataTable.Title>
                  ) : (
                    <>
                      <DataTable.Title numeric>Full</DataTable.Title>
                      <DataTable.Title numeric>Pass</DataTable.Title>
                      <DataTable.Title numeric>Obtained</DataTable.Title>
                    </>
                  )}
                </DataTable.Header>

                {marks.papers.map((paper, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell style={{ flex: 2 }}>
                      <Text variant="bodyMedium" style={styles.paperName}>
                        {paper.paper_name}
                      </Text>
                    </DataTable.Cell>
                    {isSpeed ? (
                      <DataTable.Cell numeric>
                        <TextInput
                          mode="outlined"
                          value={String(paper.speed || "")}
                          onChangeText={(text) =>
                            updatePaperField(index, "speed", text)
                          }
                          keyboardType="numeric"
                          style={styles.scoreInput}
                          dense
                          error={!!errors[`speed_${index}`]}
                          outlineColor="#234785"
                          activeOutlineColor="#234785"
                        />
                      </DataTable.Cell>
                    ) : (
                      <>
                        <DataTable.Cell numeric>
                          <Text variant="bodyMedium" style={styles.marksText}>
                            {paper.full_marks}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell numeric>
                          <Text variant="bodyMedium" style={styles.marksText}>
                            {paper.pass_marks}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell numeric>
                          <TextInput
                            mode="outlined"
                            value={String(paper.marks_obtained || "")}
                            onChangeText={(text) =>
                              updatePaperField(index, "marks_obtained", text)
                            }
                            keyboardType="numeric"
                            style={styles.scoreInput}
                            dense
                            error={!!errors[`marks_${index}`]}
                            outlineColor="#234785"
                            activeOutlineColor="#234785"
                          />
                        </DataTable.Cell>
                      </>
                    )}
                  </DataTable.Row>
                ))}

                {!isSpeed && (
                  <DataTable.Row style={styles.totalRow}>
                    <DataTable.Cell style={{ flex: 2 }}>
                      <Text variant="titleMedium" style={styles.totalText}>
                        Total
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Text variant="titleMedium" style={styles.totalText}>
                        {totals.totalFull}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Text variant="titleMedium" style={styles.totalText}>
                        {totals.totalPass}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Text variant="titleMedium" style={styles.totalText}>
                        {totals.totalObt}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                )}
              </DataTable>
            </Surface>

            {/* Additional Information */}
            <Surface style={styles.additionalSection} elevation={1}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Additional Information
              </Text>

              {!isSpeed && (
                <View style={styles.row}>
                  <TextInput
                    mode="outlined"
                    label="Percentage"
                    value={marks.percentage || totals.percentage}
                    onChangeText={(text) =>
                      setMarks({ ...marks, percentage: text })
                    }
                    style={styles.halfInput}
                    keyboardType="numeric"
                    right={<TextInput.Affix text="%" />}
                    outlineColor="#234785"
                    activeOutlineColor="#234785"
                  />
                  <TextInput
                    mode="outlined"
                    label="Grade"
                    value={marks.grade || ""}
                    onChangeText={(text) => setMarks({ ...marks, grade: text })}
                    style={styles.halfInput}
                    outlineColor="#234785"
                    activeOutlineColor="#234785"
                  />
                </View>
              )}

              <View style={styles.row}>
                <TextInput
                  mode="outlined"
                  label="Serial Number"
                  value={marks.serial_no || ""}
                  onChangeText={(text) => {
                    setMarks({ ...marks, serial_no: text });
                    if (errors.serial_no) {
                      const newErrors = { ...errors };
                      delete newErrors.serial_no;
                      setErrors(newErrors);
                    }
                  }}
                  style={styles.halfInput}
                  error={!!errors.serial_no}
                  outlineColor="#234785"
                  activeOutlineColor="#234785"
                />
                <Surface style={styles.dateContainer} elevation={1}>
                  <Text variant="labelMedium" style={styles.dateLabel}>
                    Issue Date
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setShowDatePicker(true)}
                    style={styles.dateButton}
                    textColor="#234785"
                    icon="calendar"
                    contentStyle={styles.dateButtonContent}
                  >
                    {marks.issue_date || "Select Date"}
                  </Button>
                  {errors.issue_date && (
                    <HelperText type="error">{errors.issue_date}</HelperText>
                  )}
                </Surface>
              </View>

              {Object.keys(errors).length > 0 && (
                <View style={styles.errorSummary}>
                  <Text variant="bodySmall" style={styles.errorText}>
                    Please fix the errors above before saving
                  </Text>
                </View>
              )}
            </Surface>

            {/* Add bottom padding when keyboard is visible */}
            <View style={{ height: keyboardVisible ? 100 : 80 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Floating Action Button */}
        <FAB
          icon="content-save"
          label="Save Result"
          onPress={handleSave}
          style={[styles.fab, keyboardVisible && styles.fabKeyboardVisible]}
          color="#234785"
          mode="elevated"
          loading={saving}
          disabled={saving}
        />

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={marks.issue_date ? new Date(marks.issue_date) : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            onChange={onDateChange}
          />
        )}

        {/* Portal for Dialogs */}
        <Portal>
          {/* Confirmation Dialog */}
          <Dialog
            visible={confirmDialogVisible}
            onDismiss={() => setConfirmDialogVisible(false)}
          >
            <Dialog.Title style={styles.dialogTitle}>Save Result</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                Are you sure you want to save the result for{" "}
                {student.student_name}?
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmDialogVisible(false)}>
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={confirmSave}
                buttonColor="#ffeb44"
                textColor="#234785"
              >
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Success Dialog */}
          <Dialog
            visible={successDialogVisible}
            onDismiss={handleSuccessOk}
          >
            <Dialog.Icon icon="check-circle" size={60} color="#4CAF50" />
            <Dialog.Title style={styles.successTitle}>Success!</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={styles.successMessage}>
                Result has been saved successfully for {student?.student_name}.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button 
                mode="contained" 
                onPress={handleSuccessOk}
                buttonColor="#ffeb44"
                textColor="#234785"
              >
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Snackbar */}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorIcon: {
    backgroundColor: "#ffebee",
    marginBottom: 16,
  },
  errorTitle: {
    marginBottom: 8,
    textAlign: "center",
    color: "#234785",
  },
  errorSubtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  retryButton: {
    marginTop: 8,
  },
  studentCard: {
    margin: 16,
    backgroundColor: "#ffffff",
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#e0e0e0",
    marginRight: 16,
    borderWidth: 3,
    borderColor: "#ffeb44",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#234785",
  },
  rollNumber: {
    color: "#666",
    marginBottom: 8,
  },
  courseChip: {
    alignSelf: "flex-start",
    backgroundColor: "#fff9e6",
    borderColor: "#ffeb44",
    borderWidth: 2,
  },
  courseChipText: {
    color: "#234785",
    fontWeight: "600",
  },
  marksSection: {
    margin: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderTopWidth: 3,
    borderTopColor: "#ffeb44",
  },
  additionalSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderTopWidth: 3,
    borderTopColor: "#ffeb44",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "600",
    color: "#234785",
  },
  typeChip: {
    backgroundColor: "#fff9e6",
    borderWidth: 1,
    borderColor: "#ffeb44",
  },
  typeChipText: {
    color: "#234785",
    fontWeight: "600",
  },
  dataTable: {
    backgroundColor: "transparent",
  },
  paperName: {
    fontWeight: "500",
    color: "#234785",
  },
  marksText: {
    color: "#555",
    textAlign: "center",
  },
  scoreInput: {
    width: 80,
    height: 40,
  },
  totalRow: {
    backgroundColor: "#fff9e6",
    borderTopWidth: 2,
    borderTopColor: "#ffeb44",
  },
  totalText: {
    fontWeight: "600",
    color: "#234785",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  dateContainer: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateLabel: {
    marginBottom: 8,
    color: "#666",
  },
  dateButton: {
    borderColor: "#234785",
    borderWidth: 2,
  },
  dateButtonContent: {
    justifyContent: "flex-start",
  },
  errorSummary: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: "#c62828",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffeb44",
  },
  fabKeyboardVisible: {
    bottom: 20,
  },
  dialogTitle: {
    color: "#234785",
    fontWeight: "bold",
  },
  successTitle: {
    textAlign: "center",
    color: "#4CAF50",
  },
  successMessage: {
    textAlign: "center",
    color: "#666",
  },
  snackbar: {
    backgroundColor: "#234785",
  },
  snackbarAction: {
    color: "#ffeb44",
    fontWeight: "bold",
  },
});