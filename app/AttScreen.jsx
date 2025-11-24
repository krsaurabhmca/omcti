import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewPage = () => {
  const {student_id} = useLocalSearchParams();
  const router = useRouter();
  console.log(student_id);
  const url = 'https://omcti.in/apprise/qr_scan.php?student_id='+student_id; 

  // Loading indicator for WebView
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#667eea" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Web Page</Text>
        <View style={{ width: 24 }} /> {/* Placeholder for alignment */}
      </LinearGradient>

      {/* WebView */}
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled={true}       // Enable JavaScript
        domStorageEnabled={true}       // Enable DOM storage
        startInLoadingState={true}     // Show loading
        renderLoading={renderLoading}  // Custom loading component
      />
    </SafeAreaView>
  );
};

export default WebViewPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 5,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
