import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  Divider,
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

  useEffect(() => {
    fetchMarks();
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

  // Check if it's speed-based assessment
  const isSpeed = useMemo(() => {
    return marks?.papers?.length > 0 && marks.papers[0].speed !== undefined;
  }, [marks]);

  // Calculate grade based on percentage
  const calculateGrade = useCallback((percentage) => {
    const percent = parseFloat(percentage);
    if (isNaN(percent)) return "";
    
    if (percent >= 85) return "A";
    if (percent >= 70) return "B";
    if (percent >= 55) return "C";
    if (percent >= 40) return "D";
    return "Fail";
  }, []);

  // Calculate totals and auto-update percentage/grade
  const totals = useMemo(() => {
    if (!marks || !marks.papers || isSpeed) {
      return { totalFull: 0, totalPass: 0, totalObt: 0, percentage: "0.00", grade: "" };
    }

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
      totalFull > 0 ? ((totalObt / totalFull) * 100).toFixed(2) : "0.00";
    
    const grade = calculateGrade(percentage);

    return { totalFull, totalPass, totalObt, percentage, grade };
  }, [marks, isSpeed, calculateGrade]);

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
          newErrors[`marks_${index}`] = "Cannot exceed full marks";
        }

        // Check if marks are negative
        if (obtained < 0) {
          newErrors[`marks_${index}`] = "Marks cannot be negative";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updatePaperField = useCallback((index, field, value) => {
    setMarks((prevMarks) => {
      const newPapers = [...prevMarks.papers];
      newPapers[index] = { ...newPapers[index], [field]: value };
      return { ...prevMarks, papers: newPapers };
    });

    // Clear error for this field
    const errorKey = field === "speed" ? `speed_${index}` : `marks_${index}`;
    setErrors((prevErrors) => {
      if (prevErrors[errorKey]) {
        const newErrors = { ...prevErrors };
        delete newErrors[errorKey];
        return newErrors;
      }
      return prevErrors;
    });
  }, []);

  const handleSave = async () => {
    Keyboard.dismiss();
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
      const requestData = {
        result_id: marks.result_id,
        student_id: studentId,
        ms_no: marks.serial_no,
        ms_date: marks.issue_date,
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
        requestData.total = totals.totalObt.toString();
        requestData.percentage = totals.percentage;
        requestData.grade = totals.grade;
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success === false) {
        throw new Error(responseData.message || "Failed to save result");
      }

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

  // Get result status based on grade
  const getResultStatus = useCallback((grade) => {
    if (!grade) return { status: "Pending", color: "#ff9800" };
    if (grade === "Fail") return { status: "Fail", color: "#f44336" };
    return { status: "Pass", color: "#4caf50" };
  }, []);

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

  const resultStatus = getResultStatus(totals.grade);

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
            icon="refresh"
            onPress={fetchMarks}
            disabled={saving}
            iconColor="#ffeb44"
          />
        </Appbar.Header>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
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
                    <View style={styles.chipRow}>
                      <Chip
                        mode="outlined"
                        style={styles.courseChip}
                        textStyle={styles.courseChipText}
                        compact
                        icon="book-outline"
                      >
                        {ccode}
                      </Chip>
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Result Summary Card - Shows auto-calculated values */}
            {!isSpeed && (
              <Card style={styles.summaryCard} mode="elevated">
                <Card.Content>
                  <View style={styles.summaryHeader}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Result Summary
                    </Text>
                    <Chip
                      mode="flat"
                      style={[
                        styles.statusChip,
                        { backgroundColor: `${resultStatus.color}20` },
                      ]}
                      textStyle={[
                        styles.statusChipText,
                        { color: resultStatus.color },
                      ]}
                    >
                      {resultStatus.status}
                    </Chip>
                  </View>
                  <Divider style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text variant="headlineMedium" style={styles.summaryValue}>
                        {totals.totalObt}
                      </Text>
                      <Text variant="bodySmall" style={styles.summaryLabel}>
                        Obtained / {totals.totalFull}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text variant="headlineMedium" style={styles.summaryValue}>
                        {totals.percentage}%
                      </Text>
                      <Text variant="bodySmall" style={styles.summaryLabel}>
                        Percentage
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text
                        variant="headlineMedium"
                        style={[
                          styles.summaryValue,
                          styles.gradeValue,
                          { color: resultStatus.color },
                        ]}
                      >
                        {totals.grade || "-"}
                      </Text>
                      <Text variant="bodySmall" style={styles.summaryLabel}>
                        Grade
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}

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
                <DataTable.Header style={styles.tableHeader}>
                  <DataTable.Title style={styles.paperColumn}>
                    <Text style={styles.headerText}>Paper</Text>
                  </DataTable.Title>
                  {isSpeed ? (
                    <DataTable.Title numeric style={styles.inputColumn}>
                      <Text style={styles.headerText}>Speed</Text>
                    </DataTable.Title>
                  ) : (
                    <>
                      <DataTable.Title numeric style={styles.smallColumn}>
                        <Text style={styles.headerText}>Full</Text>
                      </DataTable.Title>
                      <DataTable.Title numeric style={styles.smallColumn}>
                        <Text style={styles.headerText}>Pass</Text>
                      </DataTable.Title>
                      <DataTable.Title numeric style={styles.inputColumn}>
                        <Text style={styles.headerText}>Obtained</Text>
                      </DataTable.Title>
                    </>
                  )}
                </DataTable.Header>

                {marks.papers.map((paper, index) => (
                  <DataTable.Row key={index} style={styles.tableRow}>
                    <DataTable.Cell style={styles.paperColumn}>
                      <Text variant="bodyMedium" style={styles.paperName}>
                        {paper.paper_name}
                      </Text>
                    </DataTable.Cell>
                    {isSpeed ? (
                      <DataTable.Cell numeric style={styles.inputColumn}>
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
                        <DataTable.Cell numeric style={styles.smallColumn}>
                          <Text variant="bodyMedium" style={styles.marksText}>
                            {paper.full_marks}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell numeric style={styles.smallColumn}>
                          <Text variant="bodyMedium" style={styles.marksText}>
                            {paper.pass_marks}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell numeric style={styles.inputColumn}>
                          <View style={styles.inputContainer}>
                            <TextInput
                              mode="outlined"
                              value={String(paper.marks_obtained || "")}
                              onChangeText={(text) =>
                                updatePaperField(index, "marks_obtained", text)
                              }
                              keyboardType="numeric"
                              style={[
                                styles.scoreInput,
                                errors[`marks_${index}`] && styles.errorInput,
                              ]}
                              dense
                              error={!!errors[`marks_${index}`]}
                              outlineColor="#234785"
                              activeOutlineColor="#234785"
                            />
                            {errors[`marks_${index}`] && (
                              <Text style={styles.fieldError}>
                                {errors[`marks_${index}`]}
                              </Text>
                            )}
                          </View>
                        </DataTable.Cell>
                      </>
                    )}
                  </DataTable.Row>
                ))}

                {!isSpeed && (
                  <DataTable.Row style={styles.totalRow}>
                    <DataTable.Cell style={styles.paperColumn}>
                      <Text variant="titleMedium" style={styles.totalText}>
                        Total
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.smallColumn}>
                      <Text variant="titleMedium" style={styles.totalText}>
                        {totals.totalFull}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.smallColumn}>
                      <Text variant="titleMedium" style={styles.totalText}>
                        {totals.totalPass}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.inputColumn}>
                      <Text variant="titleMedium" style={styles.totalObtained}>
                        {totals.totalObt}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                )}
              </DataTable>
            </Surface>

            {/* Auto-calculated Results Section (Read-only) */}
            {!isSpeed && (
              <Surface style={styles.autoCalculatedSection} elevation={1}>
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Auto-Calculated Results
                  </Text>
                  <Chip
                    mode="flat"
                    style={styles.autoChip}
                    textStyle={styles.autoChipText}
                    icon="auto-fix"
                  >
                    Auto
                  </Chip>
                </View>
                <Text variant="bodySmall" style={styles.autoNote}>
                  These values are automatically calculated based on marks entered
                </Text>

                <View style={styles.row}>
                  <View style={styles.readOnlyContainer}>
                    <Text variant="labelMedium" style={styles.readOnlyLabel}>
                      Percentage
                    </Text>
                    <Surface style={styles.readOnlyField} elevation={0}>
                      <Text variant="titleMedium" style={styles.readOnlyValue}>
                        {totals.percentage}%
                      </Text>
                    </Surface>
                  </View>
                  <View style={styles.readOnlyContainer}>
                    <Text variant="labelMedium" style={styles.readOnlyLabel}>
                      Grade
                    </Text>
                    <Surface
                      style={[
                        styles.readOnlyField,
                        styles.gradeField,
                        { borderColor: resultStatus.color },
                      ]}
                      elevation={0}
                    >
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.readOnlyValue,
                          styles.gradeText,
                          { color: resultStatus.color },
                        ]}
                      >
                        {totals.grade || "-"}
                      </Text>
                    </Surface>
                  </View>
                </View>

                {/* Grade Scale Reference */}
                <View style={styles.gradeScaleContainer}>
                  <Text variant="labelSmall" style={styles.gradeScaleTitle}>
                    Grade Scale:
                  </Text>
                  <View style={styles.gradeScaleRow}>
                    <Chip compact style={styles.gradeScaleChip} textStyle={styles.gradeScaleText}>
                      A ≥85%
                    </Chip>
                    <Chip compact style={styles.gradeScaleChip} textStyle={styles.gradeScaleText}>
                      B ≥70%
                    </Chip>
                    <Chip compact style={styles.gradeScaleChip} textStyle={styles.gradeScaleText}>
                      C ≥55%
                    </Chip>
                    <Chip compact style={styles.gradeScaleChip} textStyle={styles.gradeScaleText}>
                      D ≥40%
                    </Chip>
                    <Chip compact style={[styles.gradeScaleChip, styles.failChip]} textStyle={styles.failText}>
                      Fail &lt;40%
                    </Chip>
                  </View>
                </View>
              </Surface>
            )}

            {/* Certificate Information Section */}
            <Surface style={styles.additionalSection} elevation={1}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Certificate Information
              </Text>

              <View style={styles.row}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    mode="outlined"
                    label="Serial Number *"
                    value={marks.serial_no || ""}
                    onChangeText={(text) => {
                      setMarks({ ...marks, serial_no: text });
                      if (errors.serial_no) {
                        const newErrors = { ...errors };
                        delete newErrors.serial_no;
                        setErrors(newErrors);
                      }
                    }}
                    style={styles.input}
                    error={!!errors.serial_no}
                    outlineColor="#234785"
                    activeOutlineColor="#234785"
                    left={<TextInput.Icon icon="identifier" />}
                  />
                  {errors.serial_no && (
                    <HelperText type="error" visible={true}>
                      {errors.serial_no}
                    </HelperText>
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputWrapper}>
                  <Text variant="labelMedium" style={styles.dateLabel}>
                    Issue Date *
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setShowDatePicker(true)}
                    style={[
                      styles.dateButton,
                      errors.issue_date && styles.dateButtonError,
                    ]}
                    textColor="#234785"
                    icon="calendar"
                    contentStyle={styles.dateButtonContent}
                  >
                    {marks.issue_date || "Select Date"}
                  </Button>
                  {errors.issue_date && (
                    <HelperText type="error" visible={true}>
                      {errors.issue_date}
                    </HelperText>
                  )}
                </View>
              </View>

              {Object.keys(errors).length > 0 && (
                <View style={styles.errorSummary}>
                  <Avatar.Icon
                    size={24}
                    icon="alert-circle"
                    style={styles.errorSummaryIcon}
                    color="#c62828"
                  />
                  <Text variant="bodySmall" style={styles.errorText}>
                    Please fix {Object.keys(errors).length} error(s) before saving
                  </Text>
                </View>
              )}
            </Surface>

            {/* Bottom spacing for fixed button */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Fixed Bottom Save Button */}
        <Surface style={styles.bottomButtonContainer} elevation={4}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            labelStyle={styles.saveButtonLabel}
            icon="content-save"
            loading={saving}
            disabled={saving}
            buttonColor="#ffeb44"
            textColor="#234785"
          >
            {saving ? "Saving..." : "Save Result"}
          </Button>
        </Surface>

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
            style={styles.dialog}
          >
            <Dialog.Icon icon="content-save-check" size={48} color="#234785" />
            <Dialog.Title style={styles.dialogTitle}>
              Confirm Save
            </Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={styles.dialogContent}>
                Are you sure you want to save the result for{" "}
                <Text style={styles.dialogHighlight}>
                  {student.student_name}
                </Text>
                ?
              </Text>
              {!isSpeed && (
                <View style={styles.dialogSummary}>
                  <View style={styles.dialogSummaryRow}>
                    <Text style={styles.dialogSummaryLabel}>Total Marks:</Text>
                    <Text style={styles.dialogSummaryValue}>
                      {totals.totalObt} / {totals.totalFull}
                    </Text>
                  </View>
                  <View style={styles.dialogSummaryRow}>
                    <Text style={styles.dialogSummaryLabel}>Percentage:</Text>
                    <Text style={styles.dialogSummaryValue}>
                      {totals.percentage}%
                    </Text>
                  </View>
                  <View style={styles.dialogSummaryRow}>
                    <Text style={styles.dialogSummaryLabel}>Grade:</Text>
                    <Text
                      style={[
                        styles.dialogSummaryValue,
                        { color: resultStatus.color },
                      ]}
                    >
                      {totals.grade} ({resultStatus.status})
                    </Text>
                  </View>
                </View>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => setConfirmDialogVisible(false)}
                textColor="#666"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={confirmSave}
                buttonColor="#ffeb44"
                textColor="#234785"
                icon="check"
              >
                Confirm Save
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Success Dialog */}
          <Dialog visible={successDialogVisible} onDismiss={handleSuccessOk}>
            <Dialog.Icon icon="check-circle" size={60} color="#4CAF50" />
            <Dialog.Title style={styles.successTitle}>Success!</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={styles.successMessage}>
                Result has been saved successfully for{" "}
                <Text style={styles.dialogHighlight}>
                  {student?.student_name}
                </Text>
                .
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                mode="contained"
                onPress={handleSuccessOk}
                buttonColor="#ffeb44"
                textColor="#234785"
                icon="arrow-left"
              >
                Back to List
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
    paddingBottom: 20,
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
    marginBottom: 12,
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  courseChip: {
    backgroundColor: "#fff9e6",
    borderColor: "#ffeb44",
    borderWidth: 2,
  },
  courseChipText: {
    color: "#234785",
    fontWeight: "600",
  },
  // Summary Card Styles
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 3,
    borderTopColor: "#234785",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusChip: {
    borderWidth: 1,
  },
  statusChipText: {
    fontWeight: "700",
    fontSize: 12,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: "#e0e0e0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontWeight: "bold",
    color: "#234785",
  },
  gradeValue: {
    fontSize: 32,
  },
  summaryLabel: {
    color: "#666",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  // Marks Section Styles
  marksSection: {
    margin: 16,
    marginBottom: 12,
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
    fontSize: 11,
  },
  dataTable: {
    backgroundColor: "transparent",
  },
  tableHeader: {
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 2,
    borderBottomColor: "#234785",
  },
  headerText: {
    fontWeight: "700",
    color: "#234785",
    fontSize: 12,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  paperColumn: {
    flex: 2,
  },
  smallColumn: {
    flex: 0.8,
    justifyContent: "center",
  },
  inputColumn: {
    flex: 1.2,
    justifyContent: "center",
  },
  paperName: {
    fontWeight: "500",
    color: "#234785",
    fontSize: 13,
  },
  marksText: {
    color: "#555",
    textAlign: "center",
    fontWeight: "500",
  },
  inputContainer: {
    alignItems: "center",
  },
  scoreInput: {
    width: 70,
    height: 40,
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "#ffffff",
  },
  errorInput: {
    backgroundColor: "#fff5f5",
  },
  fieldError: {
    fontSize: 9,
    color: "#c62828",
    marginTop: 2,
    textAlign: "center",
  },
  totalRow: {
    backgroundColor: "#fff9e6",
    borderTopWidth: 2,
    borderTopColor: "#ffeb44",
  },
  totalText: {
    fontWeight: "700",
    color: "#234785",
  },
  totalObtained: {
    fontWeight: "700",
    color: "#234785",
    fontSize: 18,
    textAlign: "center",
  },
  // Auto-calculated Section Styles
  autoCalculatedSection: {
    margin: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderTopWidth: 3,
    borderTopColor: "#4caf50",
  },
  autoChip: {
    backgroundColor: "#e8f5e9",
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  autoChipText: {
    color: "#4caf50",
    fontWeight: "600",
    fontSize: 11,
  },
  autoNote: {
    color: "#666",
    marginBottom: 16,
    fontStyle: "italic",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  readOnlyContainer: {
    flex: 1,
  },
  readOnlyLabel: {
    marginBottom: 8,
    color: "#666",
    fontWeight: "500",
  },
  readOnlyField: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  gradeField: {
    borderWidth: 3,
  },
  readOnlyValue: {
    fontWeight: "700",
    color: "#234785",
    fontSize: 18,
  },
  gradeText: {
    fontSize: 24,
  },
  gradeScaleContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  gradeScaleTitle: {
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },
  gradeScaleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
    marginBottom: 6,
  },
  gradeScaleChip: {
    backgroundColor: "#e8f5e9",
    height: 30,
  },
  gradeScaleText: {
    fontSize: 10,
    color: "#4caf50",
  },
  failChip: {
    backgroundColor: "#ffebee",
  },
  failText: {
    fontSize: 10,
    color: "#f44336",
  },
  // Additional Section Styles
  additionalSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderTopWidth: 3,
    borderTopColor: "#ffeb44",
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    backgroundColor: "#ffffff",
  },
  dateLabel: {
    marginBottom: 8,
    color: "#666",
    fontWeight: "500",
  },
  dateButton: {
    borderColor: "#234785",
    borderWidth: 2,
    justifyContent: "flex-start",
  },
  dateButtonError: {
    borderColor: "#c62828",
  },
  dateButtonContent: {
    justifyContent: "flex-start",
    height: 48,
  },
  errorSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  errorSummaryIcon: {
    backgroundColor: "transparent",
  },
  errorText: {
    color: "#c62828",
    flex: 1,
  },
  // Bottom Button Styles
  bottomSpacer: {
    height: 100,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  saveButton: {
    borderRadius: 12,
    elevation: 4,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Dialog Styles
  dialog: {
    backgroundColor: "#ffffff",
  },
  dialogTitle: {
    textAlign: "center",
    color: "#234785",
    fontWeight: "bold",
  },
  dialogContent: {
    textAlign: "center",
    color: "#666",
  },
  dialogHighlight: {
    fontWeight: "700",
    color: "#234785",
  },
  dialogSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  dialogSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dialogSummaryLabel: {
    color: "#666",
  },
  dialogSummaryValue: {
    fontWeight: "700",
    color: "#234785",
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
    marginBottom: 80,
  },
  snackbarAction: {
    color: "#ffeb44",
    fontWeight: "bold",
  },
});