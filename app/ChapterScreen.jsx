import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Prevent screenshot (Expo)
import { allowScreenCaptureAsync, preventScreenCaptureAsync, usePreventScreenCapture } from "expo-screen-capture";

const ChapterScreen = () => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [bookTitle, setBookTitle] = useState("");

  const route = useRoute();
  const navigation = useNavigation();
  const { book_id } = route.params;
  usePreventScreenCapture();

  const fetchChapters = async () => {
    try {
      setError(null);
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=get_book",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book_id: book_id.toString() }),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        setChapters(result.data);
        if (result.data.length > 0) {
          setBookTitle(result.data[0].ebook_title);
        }
      } else {
        setError("Failed to fetch chapters");
        Alert.alert("Error", "Failed to fetch chapters");
      }
    } catch (err) {
      setError("Network error occurred");
      Alert.alert(
        "Error",
        "Network error occurred. Please check your internet connection."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChapters();
    // Block screenshots
    preventScreenCaptureAsync();
    return () => {
      allowScreenCaptureAsync();
    };
  }, [book_id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChapters();
  };

  const handleChapterPress = (chapter) => {
    navigation.navigate("PdfViewer", {
      url: chapter.url,
      title: chapter.chapter_name,
    });
  };

  const renderChapterItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.chapterItem}
      onPress={() => handleChapterPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.chapterContent}>
        <View style={styles.chapterHeader}>
          <View style={styles.chapterNumber}>
            <Text style={styles.chapterNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.chapterInfo}>
            <Text style={styles.chapterName} numberOfLines={2}>
              {item.chapter_name}
            </Text>
            <Text style={styles.pageInfo}>
              Pages {item.from_page} - {item.to_page}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#234785" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={64} color="#234785" />
      <Text style={styles.emptyText}>No chapters available</Text>
    </View>
  );

  const renderHeader = () => (
    <LinearGradient
      colors={["#234785", "#1a3666"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.headerTopRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#ffeb44" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {bookTitle || "Chapters"}
        </Text>
      </View>
      <Text style={styles.headerSubtitle}>
        {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"}{" "}
        available
      </Text>
    </LinearGradient>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Loading chapters...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />
      <FlatList
        data={chapters}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderChapterItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#234785"]}
            tintColor="#234785"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#234785",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  headerGradient: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    paddingTop: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    padding: 6,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 235, 68, 0.2)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffeb44",
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255, 235, 68, 0.9)",
    fontWeight: "500",
  },
  chapterItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    padding: 2,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  chapterContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  chapterHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chapterNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#234785",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#ffeb44",
  },
  chapterNumberText: {
    color: "#ffeb44",
    fontSize: 15,
    fontWeight: "bold",
  },
  chapterInfo: { 
    flex: 1 
  },
  chapterName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#234785",
    marginBottom: 3,
  },
  pageInfo: { 
    fontSize: 13, 
    color: "#666",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#234785",
    fontWeight: "600",
  },
});

export default ChapterScreen;