import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const DownloadScreen = () => {
  const [downloads, setDownloads] = useState({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});

  const { student_id } = useLocalSearchParams();
  const studentId = student_id;
  console.log(studentId);

  // Download items configuration
  const downloadItems = [
    {
      id: "ms",
      title: "Mark Sheet",
      description: "Official academic marksheet with detailed grades",
      icon: "document-text",
      color: "#234785",
      bgColor: "#E8F0F8",
    },
    {
      id: "cer",
      title: "Certificate",
      description: "Official completion certificate",
      icon: "ribbon",
      color: "#3a5fa0",
      bgColor: "#FFFEF5",
    },
    {
      id: "ac",
      title: "Admit Card",
      description: "Examination admit card with details",
      icon: "card",
      color: "#234785",
      bgColor: "#E8F0F8",
    },
  ];

  // Fetch download links from API
  const fetchDownloadLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=downloads",
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
      
      if (data.ms || data.cer || data.ac) {
        setDownloads(data);
      } else {
        Alert.alert("Error", "No downloads available");
      }
    } catch (error) {
      console.error("Error fetching downloads:", error);
      Alert.alert("Error", "Failed to fetch download links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloadLinks();
  }, []);

  // Request permissions for media library
  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === "granted";
  };

  // Download file function
  const downloadFile = async (item) => {
    const url = downloads[item.id];
    if (!url) {
      Alert.alert("Error", "Download link not available");
      return;
    }

    try {
      setDownloading(prev => ({ ...prev, [item.id]: true }));
      setDownloadProgress(prev => ({ ...prev, [item.id]: 0 }));

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${item.title.replace(/\s+/g, "_")}_${timestamp}.pdf`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(prev => ({ ...prev, [item.id]: Math.round(progress * 100) }));
        }
      );

      const { uri } = await downloadResumable.downloadAsync();

      if (uri) {
        // Check if sharing is available
        if (await Sharing.isAvailableAsync()) {
          Alert.alert(
            "Download Complete",
            `${item.title} has been downloaded successfully!`,
            [
              {
                text: "Open",
                onPress: () => Sharing.shareAsync(uri),
              },
              {
                text: "Save to Gallery",
                onPress: async () => {
                  const hasPermission = await requestPermissions();
                  if (hasPermission) {
                    try {
                      await MediaLibrary.saveToLibraryAsync(uri);
                      Alert.alert("Success", "File saved to gallery!");
                    } catch (error) {
                      Alert.alert("Error", "Failed to save to gallery");
                    }
                  } else {
                    Alert.alert("Permission Required", "Please grant permission to save files");
                  }
                },
              },
              { text: "OK" },
            ]
          );
        } else {
          Alert.alert("Success", `${item.title} downloaded successfully!`);
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Download Failed", "Unable to download the file");
    } finally {
      setDownloading(prev => ({ ...prev, [item.id]: false }));
      setDownloadProgress(prev => ({ ...prev, [item.id]: 0 }));
    }
  };

  // Open in browser / PDF screen
  const openInBrowser = (item) => {
    const url = downloads[item.id];

    if (!url) {
      Alert.alert("Error", "Download link not available");
      return;
    }

    try {
      router.push({
        pathname: "PdfViewer",
        params: { url, title: "Document" },
      });
    } catch (error) {
      console.error("OpenInBrowser error:", error);
      Alert.alert("Error", "Failed to open link");
    }
  };

  // Render download item
  const renderDownloadItem = (item) => {
    const isDownloading = downloading[item.id];
    const progress = downloadProgress[item.id] || 0;
    const hasLink = downloads[item.id];

    return (
      <View key={item.id} style={styles.downloadItem}>
        <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
          <Ionicons name={item.icon} size={32} color={item.color} />
        </View>
        
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          
          {isDownloading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          {hasLink ? (
            <>
              {/* <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton]}
                onPress={() => downloadFile(item)}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#234785" />
                ) : (
                  <Ionicons name="download" size={20} color="#234785" />
                )}
              </TouchableOpacity> */}
              
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => openInBrowser(item)}
                disabled={isDownloading}
              >
                <Ionicons name="eye" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.actionButton, styles.unavailableButton]}>
              <Ionicons name="close" size={20} color="#999" />
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient colors={["#234785", "#1a3666"]} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffeb44" />
          <Text style={styles.loadingText}>Loading Downloads...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />
      
      {/* Header */}
      <LinearGradient colors={["#234785", "#1a3666"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={router.back}>
              <Ionicons name="arrow-back" size={24} color="#ffeb44" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Downloads</Text>
              <Text style={styles.headerSubtitle}>Student ID: {studentId}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchDownloadLinks}>
            <Ionicons name="refresh" size={24} color="#ffeb44" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#234785" />
            <Text style={styles.infoTitle}>Available Downloads</Text>
          </View>
          <Text style={styles.infoDescription}>
            Download your official documents. Tap the download button to save files locally, 
            or use the view button to open in browser.
          </Text>
        </View>

        {/* Download Items */}
        <View style={styles.downloadsContainer}>
          {downloadItems.map(renderDownloadItem)}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <View style={styles.helpItem}>
            <Ionicons name="download-outline" size={20} color="#234785" />
            <Text style={styles.helpText}>
              Tap download to save the file to your device
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="eye-outline" size={20} color="#234785" />
            <Text style={styles.helpText}>
              Tap view to open the document in your browser
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="refresh-outline" size={20} color="#234785" />
            <Text style={styles.helpText}>
              Use refresh button to reload download links
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documents are generated in PDF format
          </Text>
          <Text style={styles.footerSubtext}>
            © 2025 ICA Education. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: "#ffeb44",
    fontWeight: "600",
  },

  // Header
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffeb44",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 235, 68, 0.8)",
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: "rgba(255, 235, 68, 0.2)",
    borderRadius: 20,
  },

  // Content
  scrollView: {
    flex: 1,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#ffffff",
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#234785",
    marginLeft: 12,
  },
  infoDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  // Downloads Container
  downloadsContainer: {
    paddingHorizontal: 20,
  },

  // Download Item
  downloadItem: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#234785",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  // Progress
  progressContainer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#234785",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#234785",
    fontWeight: "700",
    minWidth: 35,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadButton: {
    backgroundColor: "#ffeb44",
    borderWidth: 2,
    borderColor: "#234785",
  },
  viewButton: {
    backgroundColor: "#234785",
    borderWidth: 2,
    borderColor: "#234785",
  },
  unavailableButton: {
    backgroundColor: "#f5f5f5",
  },

  // Help Section
  helpSection: {
    backgroundColor: "#ffffff",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: "#234785",
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#234785",
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },

  // Footer
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});

export default DownloadScreen;