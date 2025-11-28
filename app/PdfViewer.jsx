import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { preventScreenCaptureAsync } from "expo-screen-capture";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import RNFS from "react-native-fs";
import Pdf from "react-native-pdf";

const { width, height } = Dimensions.get('window');

const PdfViewer = ({ route }) => {
  const { url, title } = useLocalSearchParams();
  const router = useRouter();
  const pdfRef = useRef(null);
  const [localPath, setLocalPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(false);

  preventScreenCaptureAsync();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
      setIsLandscape(window.width > window.height);
    });
    
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const downloadPDF = async () => {
      try {
        setIsDownloading(true);
        const fileName = title.replace(/[^a-zA-Z0-9]/g, "_");
        const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;

        // Check if file already exists
        const exists = await RNFS.exists(filePath);
        if (!exists) {
          const download = RNFS.downloadFile({
            fromUrl: url,
            toFile: filePath,
            progress: (res) => {
              const progress = (res.bytesWritten / res.contentLength) * 100;
              setDownloadProgress(Math.floor(progress));
            },
          });

          const result = await download.promise;
          if (result.statusCode !== 200) {
            throw new Error("Download failed");
          }
        }
        
        setLocalPath(filePath);
        setError(null);
      } catch (err) {
        console.error("PDF Download Error:", err);
        setError("Failed to load PDF. Please check your internet connection and try again.");
      } finally {
        setLoading(false);
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    };

    if (url && title) {
      downloadPDF();
    }
  }, [url, title]);

  const handleGoBack = () => {
    router.back();
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Re-trigger the download
    const downloadPDF = async () => {
      try {
        setIsDownloading(true);
        const fileName = title.replace(/[^a-zA-Z0-9]/g, "_");
        const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;

        // Force re-download by removing existing file
        const exists = await RNFS.exists(filePath);
        if (exists) {
          await RNFS.unlink(filePath);
        }

        const download = RNFS.downloadFile({
          fromUrl: url,
          toFile: filePath,
          progress: (res) => {
            const progress = (res.bytesWritten / res.contentLength) * 100;
            setDownloadProgress(Math.floor(progress));
          },
        });

        const result = await download.promise;
        if (result.statusCode !== 200) {
          throw new Error("Download failed");
        }
        
        setLocalPath(filePath);
        setError(null);
      } catch (err) {
        console.error("PDF Download Error:", err);
        setError("Failed to load PDF. Please check your internet connection and try again.");
      } finally {
        setLoading(false);
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    };

    downloadPDF();
  };

  // Navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 1 && pdfRef.current) {
      const newPage = currentPage - 1;
      pdfRef.current.setPage(newPage);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages && pdfRef.current) {
      const newPage = currentPage + 1;
      pdfRef.current.setPage(newPage);
    }
  };

  const goToFirstPage = () => {
    if (pdfRef.current && currentPage !== 1) {
      pdfRef.current.setPage(1);
    }
  };

  const goToLastPage = () => {
    if (pdfRef.current && currentPage !== totalPages) {
      pdfRef.current.setPage(totalPages);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleGoBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || "PDF Document"}
        </Text>
        {totalPages > 0 && (
          <Text style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </Text>
        )}
      </View>
      
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            Alert.alert("Document Info", `Title: ${title}\nPages: ${totalPages}\nCurrent Page: ${currentPage}`);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color="#2575fc" style={styles.spinner} />
        
        {isDownloading ? (
          <>
            <Text style={styles.loadingTitle}>Downloading PDF...</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${downloadProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{downloadProgress}%</Text>
            </View>
          </>
        ) : (
          <Text style={styles.loadingTitle}>Loading PDF...</Text>
        )}
        
        <Text style={styles.loadingSubtitle}>
          {title || "Please wait..."}
        </Text>
      </View>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorCard}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.goBackButton} 
          onPress={handleGoBack}
          activeOpacity={0.8}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Enhanced navigation controls
  const renderNavigationControls = () => {
    if (totalPages === 0) return null;

    const isSmallScreen = screenDimensions.width < 400;
    const isVerySmallScreen = screenDimensions.width < 350;
    
    return (
      <View style={[
        styles.navigationContainer, 
        isLandscape && styles.navigationContainerLandscape
      ]}>
        {/* Page Progress Indicator */}
        <View style={styles.progressIndicatorContainer}>
          <View style={styles.progressIndicator}>
            <View 
              style={[
                styles.progressIndicatorFill, 
                { width: `${(currentPage / totalPages) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={[
          styles.navButtonsContainer,
          isVerySmallScreen && styles.navButtonsContainerSmall
        ]}>
          {/* First Page Button */}
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.firstLastButton,
              currentPage === 1 && styles.navButtonDisabled,
              isVerySmallScreen && styles.navButtonSmall
            ]}
            onPress={goToFirstPage}
            disabled={currentPage === 1}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="play-skip-back" 
              size={isVerySmallScreen ? 16 : 18} 
              color={currentPage === 1 ? "#ccc" : "#2575fc"} 
            />
          </TouchableOpacity>

          {/* Previous Page Button */}
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevNextButton,
              currentPage === 1 && styles.navButtonDisabled,
              isVerySmallScreen && styles.navButtonSmall
            ]}
            onPress={goToPreviousPage}
            disabled={currentPage === 1}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chevron-back" 
              size={isVerySmallScreen ? 20 : 24} 
              color={currentPage === 1 ? "#ccc" : "#2575fc"} 
            />
            {!isVerySmallScreen && (
              <Text style={[
                styles.navButtonText,
                currentPage === 1 && styles.navButtonTextDisabled
              ]}>
                Previous
              </Text>
            )}
          </TouchableOpacity>

          {/* Page Info */}
          <View style={[styles.pageInfoContainer, isSmallScreen && styles.pageInfoContainerSmall]}>
            <Text style={[styles.currentPageText, isVerySmallScreen && styles.currentPageTextSmall]}>
              {currentPage}
            </Text>
            <Text style={[styles.totalPagesText, isVerySmallScreen && styles.totalPagesTextSmall]}>
              of {totalPages}
            </Text>
          </View>

          {/* Next Page Button */}
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevNextButton,
              currentPage === totalPages && styles.navButtonDisabled,
              isVerySmallScreen && styles.navButtonSmall
            ]}
            onPress={goToNextPage}
            disabled={currentPage === totalPages}
            activeOpacity={0.7}
          >
            {!isVerySmallScreen && (
              <Text style={[
                styles.navButtonText,
                currentPage === totalPages && styles.navButtonTextDisabled
              ]}>
                Next
              </Text>
            )}
            <Ionicons 
              name="chevron-forward" 
              size={isVerySmallScreen ? 20 : 24} 
              color={currentPage === totalPages ? "#ccc" : "#2575fc"} 
            />
          </TouchableOpacity>

          {/* Last Page Button */}
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.firstLastButton,
              currentPage === totalPages && styles.navButtonDisabled,
              isVerySmallScreen && styles.navButtonSmall
            ]}
            onPress={goToLastPage}
            disabled={currentPage === totalPages}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="play-skip-forward" 
              size={isVerySmallScreen ? 16 : 18} 
              color={currentPage === totalPages ? "#ccc" : "#2575fc"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#711ee4ff" />
        {renderHeader()}
        {renderLoading()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#711ee4ff" />
        {renderHeader()}
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3c72" />
      {renderHeader()}
      
      <View style={styles.pdfContainer}>
        {localPath && (
          <Pdf
            ref={pdfRef}
            source={{ uri: `file://${localPath}`, cache: true }}
            style={styles.pdf}
            horizontal={true}
            enablePaging={true}
            enableRTL={false}
            enableAntialiasing={true}
            enableAnnotationRendering={false}
            spacing={10}
            onLoadComplete={(numberOfPages, filePath, { width, height }) => {
              setTotalPages(numberOfPages);
              console.log(`PDF loaded: ${numberOfPages} pages`);
            }}
            onPageChanged={(page, numberOfPages) => {
              setCurrentPage(page);
            }}
            onError={(error) => {
              console.log("PDF Error:", error);
              setError("Unable to open PDF. The file may be corrupted.");
            }}
            onLoadProgress={(progress) => {
              console.log(`Loading progress: ${progress}%`);
            }}
            onPageSingleTap={(page) => {
              // Optional: Handle single tap
              console.log(`Single tap on page ${page}`);
            }}
            onScaleChanged={(scale) => {
              console.log(`Scale changed: ${scale}`);
            }}
          />
        )}
      </View>

      {/* Enhanced Navigation Controls */}
      {renderNavigationControls()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#711ee4ff",
    backgroundImage: "linear-gradient(45deg, #711ee4ff, #2575fc)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  pageInfo: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: width * 0.8,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 16,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2575fc",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: width * 0.8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#2575fc",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#2575fc",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  goBackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  goBackButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  pdf: {
    flex: 1,
    backgroundColor: "#fff",
  },
  
  // Enhanced Navigation Styles
  navigationContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navigationContainerLandscape: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  
  // Progress Indicator
  progressIndicatorContainer: {
    marginBottom: 12,
  },
  progressIndicator: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressIndicatorFill: {
    height: "100%",
    backgroundColor: "#2575fc",
    borderRadius: 2,
  },
  
  // Navigation Buttons
  navButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButtonsContainerSmall: {
    justifyContent: "space-around",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 44,
    minHeight: 44,
  },
  navButtonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 36,
    minHeight: 36,
  },
  navButtonDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e8e8e8",
  },
  firstLastButton: {
    flex: 0,
    paddingHorizontal: 8,
  },
  prevNextButton: {
    flex: 1,
    maxWidth: 100,
    marginHorizontal: 4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2575fc",
    marginHorizontal: 4,
  },
  navButtonTextDisabled: {
    color: "#ccc",
  },
  
  // Page Info
  pageInfoContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2575fc",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 80,
    marginHorizontal: 8,
  },
  pageInfoContainerSmall: {
    paddingHorizontal: 12,
    minWidth: 70,
  },
  currentPageText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 20,
  },
  currentPageTextSmall: {
    fontSize: 16,
    lineHeight: 18,
  },
  totalPagesText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  totalPagesTextSmall: {
    fontSize: 10,
    marginTop: 1,
  },
});

export default PdfViewer;