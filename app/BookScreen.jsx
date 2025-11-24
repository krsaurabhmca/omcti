import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Card,
  Chip,
  IconButton,
  Paragraph,
  Surface,
  Text,
  Title,
} from 'react-native-paper';

const BookScreen = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const params = useLocalSearchParams();
  const router = useRouter();
  const studentId = params.student_id || "56998"; // Default fallback

  // Enable screenshot prevention when component mounts
  useEffect(() => {
    const enableScreenshotPrevention = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        console.log('Screenshot prevention enabled');
      } catch (error) {
        console.warn('Could not enable screenshot prevention:', error);
      }
    };

    enableScreenshotPrevention();

    // Cleanup: Allow screenshots when component unmounts
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(console.warn);
    };
  }, []);

  // Fetch study materials from API
  const fetchStudyMaterials = async () => {
    try {
      const response = await fetch('https://omcti.in/apprise/api.php?task=study_material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      if (Array.isArray(data)) {
        setBooks(data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching study materials:', error);
      Alert.alert(
        'Error',
        'Failed to fetch study materials. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStudyMaterials();
  }, [studentId]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchStudyMaterials();
  };

  // Navigate to ChapterScreen with book_id
  const navigateToChapters = (book) => {
    router.push({
      pathname: '/ChapterScreen',
      params: {
        book_id: book.id,
        subject_name: book.subject_name,
        student_id: studentId
      }
    });
  };

  // Render book item
  const renderBookItem = ({ item }) => (
    <Card style={styles.bookCard} onPress={() => navigateToChapters(item)}>
      <Card.Content>
        <View style={styles.bookContent}>
          <Surface style={styles.bookIconContainer}>
            <IconButton icon="book-open-variant" size={24} iconColor="#234785" />
          </Surface>
          
          <View style={styles.bookDetails}>
            <Title numberOfLines={2} style={styles.bookTitle}>
              {item.subject_name}
            </Title>
            <View style={styles.chipContainer}>
              <Chip 
                icon="bookmark" 
                compact 
                mode="outlined"
                textStyle={styles.chipText}
                style={styles.chip}
              >
                {item.chapter_count} Chapters
              </Chip>
            </View>
          </View>
          
          <IconButton 
            icon="chevron-right" 
            size={20} 
            iconColor="#234785" 
          />
        </View>
      </Card.Content>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" animating={true} color="#234785" />
          <Text style={styles.loadingText}>Loading study materials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main book list view
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />
      
      {/* Header */}
      <LinearGradient
        colors={['#234785', '#1a3666']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Appbar.Header style={styles.transparentHeader}>
          <Appbar.BackAction iconColor="#ffeb44" onPress={() => router.back()} />
          <Appbar.Content 
            title="Study Materials" 
            subtitle={`Student ID: ${studentId}`}
            titleStyle={styles.headerTitle}
            subtitleStyle={styles.headerSubtitle}
          />
        </Appbar.Header>
      </LinearGradient>

      {/* Books List */}
      {books.length > 0 ? (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={renderBookItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#234785']}
              tintColor="#234785"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Surface style={styles.emptySurface}>
            <IconButton icon="book-outline" size={64} iconColor="#234785" />
            <Title style={styles.emptyTitle}>No study materials found</Title>
            <Paragraph style={styles.emptyText}>Pull down to refresh</Paragraph>
          </Surface>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#234785',
    fontWeight: '600',
  },
  headerGradient: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  transparentHeader: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
  headerTitle: {
    color: '#ffeb44',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 235, 68, 0.8)',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  bookCard: {
    marginBottom: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#ffeb44',
  },
  bookContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ffeb44',
  },
  bookDetails: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    marginBottom: 8,
    color: '#234785',
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    borderColor: '#234785',
    backgroundColor: 'rgba(35, 71, 133, 0.1)',
  },
  chipText: {
    color: '#234785',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptySurface: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 2,
    borderColor: '#234785',
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
    color: '#234785',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
});

export default BookScreen;