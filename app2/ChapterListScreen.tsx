import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ChapterListScreen = () => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));
  
  const { subject_id, subject_name } = useLocalSearchParams();

  useEffect(() => {
    if (subject_id) {
      fetchChapters();
    }
  }, [subject_id]);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://omcti.in/apprise/api.php?task=chapter_list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject_id: parseInt(subject_id)
        }),
      });

      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        setChapters(data);
        // Start animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Alert.alert('No Chapters', 'No chapters found for this subject');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch chapters. Please try again.');
      console.error('Error fetching chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterPress = (chapter) => {
    // Add haptic feedback if available
   
    // Navigate to chapter content or perform action
    router.push({
      pathname: 'ChapterContentScreen',
      params: { chapter_id: chapter.id, chapter_name: chapter.chapter_name },
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderChapterItem = ({ item, index }) => {
    const chapter = item;
    
    // Get different gradient colors for variety with blue and yellow theme
    const getGradientColors = (index) => {
      const gradients = [
        ['#234785', '#1a3666'], // Dark Blue
        ['#3a5fa0', '#234785'], // Medium Blue
        ['#4d7ac7', '#3a5fa0'], // Light Blue
        ['#ffeb44', '#ffd700'], // Yellow
        ['#234785', '#ffeb44'], // Blue to Yellow
        ['#1a3666', '#234785'], // Navy to Blue
        ['#5b8dd8', '#234785'], // Sky Blue to Blue
        ['#ffd700', '#ffeb44'], // Gold to Yellow
      ];
      return gradients[index % gradients.length];
    };

    return (
      <Animated.View
        style={[
          styles.chapterItemContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.chapterItem}
          onPress={() => handleChapterPress(chapter)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={getGradientColors(index)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chapterGradient}
          >
            <View style={styles.chapterContent}>
              <View style={styles.chapterNumber}>
                <Text style={styles.chapterNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.chapterTextContainer}>
                <Text style={styles.chapterName} numberOfLines={3}>
                  {chapter.chapter_name}
                </Text>
                <Text style={styles.chapterId}>Chapter ID: {chapter.id}</Text>
              </View>
              <View style={styles.playIconContainer}>
                <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient
          colors={['#234785', '#1a3666']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#ffeb44" />
          <Text style={styles.loadingText}>Loading Chapters...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />
      
      {/* Header */}
      <LinearGradient
        colors={['#234785', '#1a3666']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#ffeb44" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{subject_name}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchChapters}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#ffeb44" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Chapter Count */}
      <View style={styles.countContainer}>
        <View style={styles.countContent}>
          <Ionicons name="library" size={20} color="#234785" />
          <Text style={styles.countText}>
            {chapters.length} Chapter{chapters.length !== 1 ? 's' : ''} Available
          </Text>
        </View>
      </View>

      {/* Empty State */}
      {chapters.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={80} color="#234785" />
          <Text style={styles.emptyTitle}>No Chapters Found</Text>
          <Text style={styles.emptySubtitle}>
            This subject doesn't have any chapters yet.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchChapters}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ffeb44', '#ffd700']}
              style={styles.retryGradient}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Chapter List */}
      {chapters.length > 0 && (
        <FlatList
          data={chapters}
          renderItem={renderChapterItem}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffeb44',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffeb44',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#ffeb44',
  },
  countContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 14,
    color: '#234785',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#234785',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: '#234785',
  },
  retryGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#234785',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  chapterItemContainer: {
    marginBottom: 15,
  },
  chapterItem: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  chapterGradient: {
    borderRadius: 15,
    padding: 18,
  },
  chapterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  chapterNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  chapterTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  chapterName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 20,
  },
  chapterId: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  playIconContainer: {
    padding: 5,
  },
  separator: {
    height: 8,
  },
});

export default ChapterListScreen;