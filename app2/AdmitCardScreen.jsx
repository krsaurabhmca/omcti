import { Ionicons } from "@expo/vector-icons";
import { Route } from "expo-router/build/Route";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { WebView } from "react-native-webview";

const AdmitCardScreen = ({ route }) => {
  const { studentId } = Route.params || { studentId: "20742" };

  const [admitCardData, setAdmitCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchAdmitCard();
  }, []);

  const fetchAdmitCard = async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=admit_card",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ student_id: 20742 }),
        }
      );

      const data = await response.json();
      console.log("API Response:", data);

      // Check for Success property (not Success case)
      if (data && data !== null) {
        setAdmitCardData(data);
        setError(false);
      } else {
        // Handle fail case (null) or any other error
        setError(true);
        setAdmitCardData(null);
      }
    } catch (error) {
      console.error("Error fetching admit card:", error);
      setError(true);
      setAdmitCardData(null);
    } finally {
      setLoading(false);
    }
  };

  const openInBrowser = async () => {
    if (!admitCardData?.p_link) {
      Alert.alert("Error", "PDF link not available");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(admitCardData.p_link);
      if (supported) {
        await Linking.openURL(admitCardData.p_link);
      } else {
        Alert.alert("Error", "Unable to open PDF link");
      }
    } catch (error) {
      console.error("Error opening link:", error);
      Alert.alert("Error", "Failed to open PDF in browser");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Loading admit card...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !admitCardData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color="#234785" />
          <Text style={styles.errorText}>Admit card not found</Text>
          <Text style={styles.errorSubText}>
            Please check your student ID and try again
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAdmitCard}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admit Card</Text>
      </View>

      {/* Student Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Roll Number</Text>
          <Text style={styles.infoValue}>{admitCardData.student_roll}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Exam Date</Text>
          <Text style={styles.infoValue}>
            {formatDate(admitCardData.exam_date)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>
            {formatTime(admitCardData.exam_time)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Subject Set</Text>
          <Text style={styles.infoValue}>{admitCardData.set_name}</Text>
        </View>

        <View style={[styles.infoRow, styles.lastRow]}>
          <Text style={styles.infoLabel}>Venue</Text>
          <Text style={[styles.infoValue, styles.venueText]}>
            {admitCardData.exam_venue}
          </Text>
        </View>
      </View>

      {/* PDF WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: admitCardData.p_link }}
          style={styles.webView}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error: ", nativeEvent);
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoadingContainer}>
              <ActivityIndicator size="large" color="#234785" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>

      {/* Download Button at Bottom */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.downloadButton} onPress={openInBrowser}>
          <Ionicons name="download-outline" size={24} color="#234785" />
          <Text style={styles.downloadButtonText}>Download Admit Card</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#234785",
    textAlign: "center",
  },
  errorText: {
    fontSize: 20,
    color: "#234785",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "600",
  },
  errorSubText: {
    fontSize: 16,
    color: "#6c757d",
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#ffeb44",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#234785",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#234785",
    borderBottomWidth: 1,
    borderBottomColor: "#ffeb44",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffeb44",
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#234785",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: "#234785",
    fontWeight: "600",
    flex: 1.2,
    textAlign: "right",
  },
  venueText: {
    textAlign: "right",
    lineHeight: 22,
  },
  webViewContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#234785",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  webView: {
    flex: 1,
  },
  webViewLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 3,
    borderTopColor: "#234785",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffeb44",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#234785",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  downloadButtonText: {
    color: "#234785",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },
});

export default AdmitCardScreen;