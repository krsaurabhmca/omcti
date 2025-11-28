import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const WebViewScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [viewerUrl, setViewerUrl] = useState('');

  const route = useRoute();
  const navigation = useNavigation();
  const { url, title, bookTitle, from_page = 1, to_page = 1 } = route.params;

  let webViewRef = null;

  useEffect(() => {
    const totalPageCount = parseInt(to_page) - parseInt(from_page) + 1;
    setTotalPages(totalPageCount);
    
    // Use the original URL which should display all pages in the range
    setViewerUrl(`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`);
  }, [url, from_page, to_page]);

  // Enhanced JavaScript for better PDF viewing experience
  const injectedJavaScript = `
    (function() {
      // Prevent downloads and popups
      const originalOpen = window.open;
      window.open = function() { return null; };
      
      // Allow both vertical and horizontal scrolling for multi-page viewing
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      
      // Optimize PDF viewer for multi-page viewing
      const style = document.createElement('style');
      style.textContent = \`
        * {
          -webkit-touch-callout: none;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        html, body { 
          margin: 0 !important; 
          padding: 0 !important; 
          height: auto !important;
          min-height: 100vh !important;
          touch-action: auto !important;
        }
        iframe { 
          width: 100% !important; 
          height: 100% !important; 
          min-height: 100vh !important;
          border: none !important;
        }
        .goog-te-banner-frame { display: none !important; }
        
        /* Improve PDF viewer appearance */
        #viewer-container,
        .ndfHFb-c4YZDc-Wrql6b {
          background-color: #f5f5f5 !important;
          padding: 10px !important;
        }
        
        /* Style individual pages */
        .ndfHFb-c4YZDc-Wrql6b-i1tmlb {
          margin-bottom: 20px !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
          border-radius: 4px !important;
          background: white !important;
        }
        
        /* Hide unnecessary UI elements */
        .ndfHFb-c4YZDc-Wrql6b-Nd2pif,
        .ndfHFb-c4YZDc-LgbsSe {
          display: none !important;
        }
        
        /* Improve zoom controls */
        .ndfHFb-c4YZDc-Wrql6b-haAclf {
          background: rgba(0,0,0,0.7) !important;
          border-radius: 20px !important;
          padding: 5px !important;
        }
      \`;
      document.head.appendChild(style);
      
      // Remove any download buttons or links
      setTimeout(function() {
        const downloadElements = document.querySelectorAll('[title*="Download"], [aria-label*="Download"], a[download]');
        downloadElements.forEach(el => el.style.display = 'none');
        
        // Hide print buttons
        const printElements = document.querySelectorAll('[title*="Print"], [aria-label*="Print"]');
        printElements.forEach(el => el.style.display = 'none');
      }, 2000);
      
      // Send page info back to React Native
      setTimeout(function() {
        try {
          const pageElements = document.querySelectorAll('.ndfHFb-c4YZDc-Wrql6b-i1tmlb');
          if (pageElements.length > 0) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAGE_COUNT',
              count: pageElements.length
            }));
          }
        } catch (e) {
          console.log('Page count error:', e);
        }
      }, 3000);
      
      return true;
    })();
  `;

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error:', nativeEvent);
    setLoading(false);
    setError(true);
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'PAGE_COUNT') {
        // Update actual page count if different from calculated
        if (data.count !== totalPages) {
          setTotalPages(data.count);
        }
      }
    } catch (e) {
      console.log('Message parsing error:', e);
    }
  };

  const reload = () => {
    if (webViewRef) {
      webViewRef.reload();
      setError(false);
      setLoading(true);
    }
  };

  const renderSlimHeader = () => (
    <LinearGradient
      colors={['#234785', '#3d6aa5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.slimHeader}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.headerContent}>
        {/* Back Arrow */}
        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#ffeb44" />
        </TouchableOpacity>

        {/* Book and Chapter Info */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Ionicons name="book" size={16} color="#ffeb44" />
            <Text style={styles.bookTitle} numberOfLines={1}>
              {bookTitle || 'Book'}
            </Text>
          </View>
          <Text style={styles.chapterTitle} numberOfLines={1}>
            {title || 'Chapter'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={reload}>
            <Ionicons name="refresh" size={20} color="#ffeb44" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );


  const renderError = () => (
    <View style={styles.errorContainer}>
      <LinearGradient
        colors={['#ff6b6b', '#ee5a52']}
        style={styles.errorIcon}
      >
        <Ionicons name="document-text-outline" size={32} color="#ffffff" />
      </LinearGradient>
      <Text style={styles.errorTitle}>Document Not Available</Text>
      <Text style={styles.errorMessage}>
        The document couldn't be loaded. Please check your connection and try again.
      </Text>
      <TouchableOpacity style={styles.errorButton} onPress={reload}>
        <LinearGradient
          colors={['#ffeb44', '#ffd700']}
          style={styles.errorButtonGradient}
        >
          <Ionicons name="refresh" size={18} color="#234785" />
          <Text style={styles.errorButtonText}>Retry Loading</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContent}>
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color="#ffeb44" />
        </View>
        <Text style={styles.loadingTitle}>Loading Document</Text>
        <Text style={styles.loadingSubtitle}>
          Preparing {totalPages} page{totalPages !== 1 ? 's' : ''}...
        </Text>
        
        <View style={styles.loadingFeatures}>
          <View style={styles.featureRow}>
            <Ionicons name="eye-outline" size={16} color="#ffeb44" />
            <Text style={styles.featureText}>Continuous viewing</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="resize-outline" size={16} color="#ffeb44" />
            <Text style={styles.featureText}>Zoom & pan support</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="scroll-outline" size={16} color="#ffeb44" />
            <Text style={styles.featureText}>Smooth scrolling</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderSlimHeader()}

      <View style={styles.contentContainer}>
        {error ? (
          renderError()
        ) : (
          <WebView
            ref={(ref) => (webViewRef = ref)}
            source={{ uri: viewerUrl }}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onMessage={handleMessage}
            style={styles.webView}
            injectedJavaScript={injectedJavaScript}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            showsHorizontalScrollIndicator={true}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="compatibility"
            setSupportMultipleWindows={false}
            allowsInlineMediaPlaybook={true}
            mediaPlaybackRequiresUserAction={false}
            onShouldStartLoadWithRequest={(request) => {
              // Block downloads but allow navigation
              if (request.url.includes('download') || request.url.includes('attachment')) {
                return false;
              }
              return true;
            }}
          />
        )}
        
        {loading && !error && renderLoading()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2744',
  },
  
  // Slim Header Styles
  slimHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    elevation: 8,
    shadowColor: '#234785',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  bookTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginLeft: 6,
  },
  chapterTitle: {
    fontSize: 18,
    color: '#ffeb44',
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
  },

  // Content Container
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Bottom Info Styles
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  infoContent: {
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#ffeb44',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoHint: {
    fontSize: 11,
    color: 'rgba(255, 235, 68, 0.6)',
    marginLeft: 8,
    fontStyle: 'italic',
  },

  // Loading Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(35, 71, 133, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 18,
    color: '#ffeb44',
    fontWeight: '700',
    marginBottom: 6,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 30,
  },
  loadingFeatures: {
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a2744',
  },
  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#234785',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  errorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: '#234785',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default WebViewScreen;