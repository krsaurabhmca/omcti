import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MarksheetScreen = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get student_id from route params or use default
  const { student_id } = useLocalSearchParams();
  const studentId = student_id;

  useEffect(() => {
    fetchMarksheet();
  }, [studentId]);

  const fetchMarksheet = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=marksheet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: studentId,
          }),
        }
      );

      const data = await response.json();

      if (data.marks && data.marks.papers && data.marks.papers.length > 0) {
        setStudentData(data);
      } else {
        Alert.alert("No Data", "No marksheet data found for this student.");
        setStudentData(null);
      }
    } catch (error) {
      console.error("Error fetching marksheet:", error);
      Alert.alert("Error", "Failed to fetch marksheet data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getGradeColor = (grade) => {
    switch (grade?.toUpperCase()) {
      case "A":
        return "#4CAF50";
      case "B":
        return "#2196F3";
      case "C":
        return "#FF9800";
      case "D":
        return "#FF5722";
      default:
        return "#757575";
    }
  };

  const renderPaperRow = (paper, index) => (
    <View key={index} style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.paperName]}>
        {paper.paper_name}
      </Text>
      <Text style={styles.tableCell}>{paper.full_marks}</Text>
      <Text style={styles.tableCell}>{paper.pass_marks}</Text>
      <Text style={[styles.tableCell, styles.marksObtained]}>
        {paper.marks_obtained}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Loading Marksheet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <LinearGradient
        colors={["#234785", "#1a3666"]}
        style={styles.footerButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statement of Marks</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {studentData ? (
          <>
            {/* Student Information Card */}
            <View style={styles.studentCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle" size={24} color="#234785" />
                <Text style={styles.cardHeaderText}>Student Information</Text>
              </View>

              <View style={styles.studentInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>
                    {studentData.student.student_name}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Roll No:</Text>
                  <Text style={styles.infoValue}>
                    {studentData.student.student_roll}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Course Code</Text>
                  <Text style={styles.infoValue}>{studentData.ccode}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Issue Date:</Text>
                  <Text style={styles.infoValue}>
                    {studentData.marks.issue_date}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Serial No:</Text>
                  <Text style={styles.infoValue}>
                    {studentData.marks.serial_no}
                  </Text>
                </View>
              </View>
            </View>

            {/* Marks Table */}
            <View style={styles.marksCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text" size={24} color="#234785" />
                <Text style={styles.cardHeaderText}>Subject-wise Marks</Text>
              </View>

              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableHeaderCell, styles.paperName]}>
                  Subject
                </Text>
                <Text style={styles.tableHeaderCell}>Full</Text>
                <Text style={styles.tableHeaderCell}>Pass</Text>
                <Text style={styles.tableHeaderCell}>Obt</Text>
              </View>

              {/* Table Body */}
              {studentData.marks.papers.map((paper, index) =>
                renderPaperRow(paper, index)
              )}
            </View>

            {/* Result Summary */}
            <View style={styles.resultCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="trophy" size={24} color="#234785" />
                <Text style={styles.cardHeaderText}>Result Summary</Text>
              </View>

              <View style={styles.resultSummary}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Total Percentage</Text>
                  <Text style={styles.resultValue}>
                    {studentData.marks.percentage}%
                  </Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Grade</Text>
                  <View
                    style={[
                      styles.gradeBadge,
                      {
                        backgroundColor: getGradeColor(studentData.marks.grade),
                      },
                    ]}
                  >
                    <Text style={styles.gradeText}>
                      {studentData.marks.grade}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                This is a computer generated marksheet and does not require
                signature.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="document-outline" size={80} color="#234785" />
            <Text style={styles.noDataText}>No marksheet data available</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchMarksheet}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#234785",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingTop: 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffeb44",
    textAlign: "center",
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  institutionHeader: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  institutionName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#234785",
    textAlign: "center",
  },
  institutionSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 4,
  },
  studentCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  marksCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#234785",
  },
  studentInfo: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7f8c8d",
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: "#234785",
    flex: 1,
    fontWeight: "600",
  },
  tableHeader: {
    backgroundColor: "#234785",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  tableHeaderCell: {
    padding: 12,
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffeb44",
    textAlign: "center",
  },
  tableCell: {
    padding: 12,
    fontSize: 12,
    color: "#2c3e50",
    textAlign: "center",
  },
  paperName: {
    flex: 2,
    textAlign: "left",
  },
  marksObtained: {
    fontWeight: "bold",
    color: "#27ae60",
  },
  resultSummary: {
    padding: 16,
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#234785",
  },
  resultValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#27ae60",
  },
  gradeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  gradeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderWidth: 2,
    borderColor: "#234785",
  },
  footerText: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
    fontStyle: "italic",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: "#234785",
    marginTop: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#ffeb44",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 2,
    borderColor: "#234785",
  },
  retryButtonText: {
    color: "#234785",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default MarksheetScreen;
