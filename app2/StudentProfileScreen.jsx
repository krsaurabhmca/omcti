import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const StudentProfileScreen = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get student_id from route params or use default
  const { student_id } = useLocalSearchParams();
  const studentId = student_id;

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=student_profile",
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

      if (data && data.id) {
        setStudentData(data);
      } else {
        Alert.alert("Error", "Failed to load student profile");
      }
    } catch (error) {
      console.error("Error fetching student profile:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudentProfile();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not Available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "#4CAF50";
      case "DISPATCHED":
        return "#FF9800";
      case "INACTIVE":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "checkmark-circle";
      case "DISPATCHED":
        return "time";
      case "INACTIVE":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const ProfileHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.profileImageContainer}>
        <Image
          source={{
            uri: studentData?.student_photo
              ? `https://omcti.in/apprise/temp/upload/${studentData.student_photo}`
              : "https://via.placeholder.com/120x120/E0E0E0/666666?text=No+Photo",
          }}
          style={styles.profileImage}
        />
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(studentData?.status) },
          ]}
        >
          <Ionicons
            name={getStatusIcon(studentData?.status)}
            size={12}
            color="#fff"
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>{studentData?.status || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.headerInfo}>
        <Text style={styles.studentName}>
          {studentData?.student_name || "N/A"}
        </Text>
        <Text style={styles.rollNumber}>
          Reg. No.: {studentData?.student_roll || "N/A"}
        </Text>
      </View>
    </View>
  );

  const InfoCard = ({ title, children, icon }) => (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={24} color="#234785" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelContainer}>
        <Ionicons name={icon} size={18} color="#234785" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value || "Not Available"}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#234785" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!studentData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#234785" barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchStudentProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#234785" barStyle="light-content" />
      {/* Header Bar */}
      <LinearGradient
        colors={["#234785", "#3d6aa5"]}
        style={styles.footerButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Student Profile</Text>

          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#ffeb44" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#234785']}
            tintColor="#234785"
          />
        }
      >
        <ProfileHeader />

        {/* Personal Information */}
        <InfoCard title="Personal Information" icon="person">
          <InfoRow
            label="Father's Name"
            value={studentData.student_father}
            icon="man"
          />
          <InfoRow
            label="Mother's Name"
            value={studentData.student_mother}
            icon="woman"
          />
          <InfoRow
            label="Date of Birth"
            value={formatDate(studentData.date_of_birth)}
            icon="calendar"
          />
          <InfoRow
            label="Gender"
            value={studentData.student_sex}
            icon="people"
          />
          <InfoRow
            label="Nationality"
            value={studentData.nationality}
            icon="flag"
          />
        </InfoCard>

        {/* Contact Information */}
        <InfoCard title="Contact Information" icon="call">
          <InfoRow
            label="Mobile"
            value={studentData.student_mobile}
            icon="phone-portrait"
          />
          <InfoRow
            label="Email"
            value={studentData.student_email || "Not Provided"}
            icon="mail"
          />
          <InfoRow
            label="Address"
            value={studentData.student_address}
            icon="location"
          />
        </InfoCard>

        {/* Academic Information */}
        <InfoCard title="Academic Information" icon="school">
          <InfoRow
            label="Course Name"
            value={studentData.course_name}
            icon="book"
          />
          <InfoRow
            label="Center Name"
            value={studentData.center_name}
            icon="business"
          />
          <InfoRow
            label="Course Fee"
            value={`₹${studentData.course_fee}`}
            icon="card"
          />
          <InfoRow
            label="Qualification"
            value={studentData.student_bloodgroup || studentData.student_qualification || "Not Specified"}
            icon="ribbon"
          />
          <InfoRow
            label="Admission Date"
            value={formatDate(studentData.admission_date)}
            icon="today"
          />
        </InfoCard>

        {/* System Information */}
        <InfoCard title="System Information" icon="information-circle">
          <InfoRow
            label="Login Status"
            value={studentData.login_status}
            icon="log-in"
          />
          <InfoRow
            label="Last Login"
            value={formatDate(studentData.last_login)}
            icon="time"
          />
          <InfoRow
            label="Created Date"
            value={formatDate(studentData.created_at)}
            icon="add-circle"
          />
          <InfoRow
            label="Updated Date"
            value={formatDate(studentData.updated_at)}
            icon="refresh-circle"
          />
        </InfoCard>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffeb44",
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: "#F44336",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#ffeb44",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  retryButtonText: {
    color: "#234785",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerContainer: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
    borderTopWidth: 3,
    borderTopColor: "#ffeb44",
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
    borderWidth: 4,
    borderColor: "#ffeb44",
  },
  statusBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  headerInfo: {
    alignItems: "center",
  },
  studentName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#234785",
    textAlign: "center",
    marginBottom: 4,
  },
  rollNumber: {
    fontSize: 16,
    color: "#666",
    marginBottom: 2,
    fontWeight: "500",
  },
  studentId: {
    fontSize: 14,
    color: "#999",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#ffeb44",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#234785",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f5f5f5",
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1.2,
    paddingRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#234785",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    flexWrap: "wrap",
  },
  bottomSpacing: {
    height: 24,
  },
});

export default StudentProfileScreen;