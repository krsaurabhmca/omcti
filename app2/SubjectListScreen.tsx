import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const SubjectListScreen = ({ navigation, route }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));

  const studentId = route?.params?.studentId || 1682;

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=subject_list",
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

      if (data && Array.isArray(data) && data.length > 0) {
        setSubjects(data);
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
        Alert.alert("Error", "No subjects found or invalid response");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch subjects. Please try again.");
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectPress = (subject) => {
    router.push({
      pathname: "ChapterListScreen",
      params: { subject_id: subject.id, subject_name: subject.subject_name },
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderSubjectItem = ({ item, index }) => {
    const subject = item;
    const itemDelay = index * 100;

    // Get color based on chapter count - updated with theme colors
    const getGradientColors = (chapterCount) => {
      if (chapterCount === 0) return ["#ff6b6b", "#ee5a5a"]; // Red for no chapters
      if (chapterCount <= 3) return ["#ffa726", "#ff9800"]; // Orange for few chapters
      if (chapterCount <= 8) return ["#234785", "#3d6aa5"]; // Blue (theme) for moderate chapters
      return ["#4ecdc4", "#44a08d"]; // Teal for many chapters
    };

    return (
      <Animated.View
        style={[
          styles.subjectItemContainer,
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
          style={styles.subjectItem}
          onPress={() => handleSubjectPress(subject)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={getGradientColors(subject.chapter_count)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subjectGradient}
          >
            <View style={styles.subjectContent}>
              <View style={styles.subjectIcon}>
                <Ionicons name="book-outline" size={24} color="#fff" />
              </View>
              <View style={styles.subjectTextContainer}>
                <Text style={styles.subjectName}>{subject.subject_name}</Text>
                <View style={styles.chapterInfo}>
                  <Ionicons
                    name="library-outline"
                    size={14}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.chapterCount}>
                    {subject.chapter_count} Chapter
                    {subject.chapter_count !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255,255,255,0.7)"
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const subjectArray = subjects;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient
          colors={["#234785", "#3d6aa5"]}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#ffeb44" />
          <Text style={styles.loadingText}>Loading Subjects...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />

      {/* Header */}
      <LinearGradient colors={["#234785", "#3d6aa5"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#ffeb44" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subjects</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Subject Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {subjectArray.length} Subject{subjectArray.length !== 1 ? "s" : ""}{" "}
          Available
        </Text>
      </View>

      {/* Subject List */}
      <FlatList
        data={subjectArray}
        renderItem={renderSubjectItem}
        keyExtractor={(item) => item.id}
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={fetchSubjects}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#ffeb44", "#ffd700"]}
          style={styles.refreshGradient}
        >
          <Ionicons name="refresh" size={20} color="#234785" />
        </LinearGradient>
      </TouchableOpacity>
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
    color: "#ffeb44",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 5,
    shadowColor: "#234785",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 235, 68, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffeb44",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 3,
    borderBottomColor: "#ffeb44",
  },
  countText: {
    fontSize: 14,
    color: "#234785",
    fontWeight: "600",
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  subjectItemContainer: {
    marginBottom: 15,
  },
  subjectItem: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: "#ffeb44",
  },
  subjectGradient: {
    borderRadius: 13,
    padding: 18,
  },
  subjectContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 235, 68, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "rgba(255, 235, 68, 0.5)",
  },
  subjectTextContainer: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subjectId: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  chapterInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  chapterCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 4,
  },
  separator: {
    height: 8,
  },
  refreshButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#234785",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
  refreshGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#234785",
  },
});

export default SubjectListScreen;