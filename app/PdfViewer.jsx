import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { preventScreenCaptureAsync } from "expo-screen-capture";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";

const PdfViewer = () => {
  const { url, title } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prevent screenshot
  useEffect(() => {
    preventScreenCaptureAsync().catch(() => {});
  }, []);

  const pdfUrl =
    `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  const handleGoBack = () => router.back();

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2575fc" />
          <Text style={styles.loadingTitle}>Loading PDF...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorMessage}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && (
        <WebView
          source={{ uri: pdfUrl }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setError("Unable to load PDF. Try again.");
            setLoading(false);
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default PdfViewer;

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  header: {
    backgroundColor: "#1e3c72",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center"
  },

  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)"
  },

  headerContent: { flex: 1, marginLeft: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingTitle: { marginTop: 8, fontSize: 16 },

  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorMessage: { fontSize: 16, marginVertical: 12, color: "#666" },

  retryButton: {
    backgroundColor: "#2575fc",
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  },
  retryText: { color: "#fff", fontSize: 16 },

  webview: { flex: 1, backgroundColor: "#fff" }
});
