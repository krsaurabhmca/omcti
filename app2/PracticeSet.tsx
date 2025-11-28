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
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const PracticeSetScreen = ({ navigation, route }) => {
  const [practiceData, setPracticeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  // Get student_id from route params or use default
  const studentId = route?.params?.studentId || 260;

  useEffect(() => {
    fetchPracticeData();
    startAnimation();
  }, []);

  const startAnimation = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const fetchPracticeData = async () => {
    try {
      setLoading(true);

      // In a real app, you would make the API call here
      const response = await fetch('https://omcti.in/apprise/api.php?task=practice_set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          // set_id: 35
        })
      });
      const data = await response.json();

      // For demo purposes, using sample data with a delay
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setPracticeData(data);
    } catch (error) {
      console.error("Error fetching practice data:", error);
      Alert.alert("Error", "Failed to load practice sets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPracticeData();
    setRefreshing(false);
  };

  const navigateToExam = (item) => {
    // Navigate to ExamScreen with required parameters
    navigation.navigate("ExamScreen", {
      set_id: parseInt(item.id),
      student_id: studentId,
      set_name: item.set_name,
      question_count: parseInt(item.question),
      difficulty: item.difficulty,
    });
  };

  const handlePracticeSetPress = (item) => {
    router.push({
      pathname: "/ExamScreen",
      params: { student_id: studentId, set_id: item.id }, // 👈 sending param
    });
  };

  const getIconName = (setName) => {
    const name = setName.toLowerCase();
    if (name.includes("word")) return "document-text";
    if (name.includes("excel")) return "grid";
    if (name.includes("powerpoint")) return "easel";
    if (name.includes("access")) return "server";
    if (name.includes("windows")) return "desktop";
    if (name.includes("dos")) return "terminal";
    if (name.includes("tally")) return "calculator";
    if (name.includes("adca")) return "school";
    if (name.includes("office")) return "business";
    return "book";
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return ["#4CAF50", "#8BC34A"];
      case "Intermediate":
        return ["#FF9800", "#FFC107"];
      case "Advanced":
        return ["#FF5722", "#FF7043"];
      case "Expert":
        return ["#9C27B0", "#BA68C8"];
      default:
        return ["#234785", "#3d6aa5"]; // Use theme colors as default
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "#4CAF50";
    if (score >= 75) return "#FF9800";
    if (score >= 60) return "#FF5722";
    return "#F44336";
  };

  const completedSets = practiceData.filter((item) => item.completed).length;
  const averageScore =
    practiceData
      .filter((item) => item.completed && item.score)
      .reduce((sum, item) => sum + item.score, 0) / completedSets || 0;

  const renderPracticeItem = ({ item, index }) => {
    const translateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.practiceCard}
          onPress={() => handlePracticeSetPress(item)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={getDifficultyColor(item.difficulty)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getIconName(item.set_name)}
                  size={28}
                  color="#fff"
                />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.setName}>{item.set_name}</Text>
                <Text style={styles.difficulty}>{item.difficulty}</Text>
              </View>
              {item.completed && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#ffeb44" />
                </View>
              )}
            </View>
          </LinearGradient>

          <View style={styles.cardBody}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="help-circle-outline" size={20} color="#234785" />
                <Text style={styles.statText}>{item.question} Questions</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color="#234785" />
                <Text style={styles.statText}>
                  {Math.ceil(parseInt(item.question) * 1.5)} min
                </Text>
              </View>
            </View>

            <View style={styles.actionContainer}>
              <View style={styles.startButton}>
                <Text style={styles.startButtonText}>
                  {item.completed ? "Retake Exam" : "Start Exam"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#234785" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient
          colors={["#234785", "#3d6aa5"]}
          style={styles.loadingHeader}
        >
          <Text style={styles.loadingHeaderTitle}>Practice Sets</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Loading your practice sets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />

      <LinearGradient colors={["#234785", "#3d6aa5"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack() || router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Practice Sets</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#ffeb44" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{practiceData.length}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedSets}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{averageScore.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={practiceData}
        renderItem={renderPracticeItem}
        keyExtractor={(item) => item.id}
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
    backgroundColor: "#f5f6fa",
  },
  header: {
    paddingBottom: 20,
  },
  loadingHeader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingHeaderTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffeb44",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 235, 68, 0.2)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffeb44",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 235, 68, 0.2)",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "rgba(255, 235, 68, 0.2)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 235, 68, 0.3)",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffeb44",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
  listContainer: {
    padding: 20,
    paddingTop: 8,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  practiceCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 3,
    borderColor: "#ffeb44",
  },
  gradientHeader: {
    padding: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 235, 68, 0.3)",
  },
  headerInfo: {
    flex: 1,
  },
  setName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  difficulty: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  completedBadge: {
    marginLeft: 12,
  },
  cardBody: {
    padding: 20,
    paddingTop: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff9e6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 0.48,
    borderWidth: 1,
    borderColor: "#ffeb44",
  },
  statText: {
    fontSize: 14,
    color: "#234785",
    marginLeft: 8,
    fontWeight: "600",
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff9e6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffeb44",
  },
  scoreLabel: {
    fontSize: 16,
    color: "#234785",
    fontWeight: "600",
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  actionContainer: {
    alignItems: "center",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffeb44",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    width: "100%",
    justifyContent: "center",
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#234785",
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default PracticeSetScreen;