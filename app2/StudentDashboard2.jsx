import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const StudentDashboard2 = () => {
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [userData, setUserData] = useState(null);
  const { studentId, student_name, student_roll, course_code } =
    useLocalSearchParams();

  useEffect(() => {
    loadUserData();
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserData = async () => {
    try {
      // Simulate loading delay - you can remove this or replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Set mock data or fetch from API
      const mockData = {
        data: {
          student_name: student_name || "Student Name",
          course_code: course_code || "N/A",
          student_roll: student_roll || "N/A",
          grade: "A",
          percentage: "85%",
          student_photo: null, // Replace with actual photo URL if available
        },
        attendancePercentage: "92%",
        user: {
          grade: "A"
        }
      };
      
      setUserData(mockData);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      // This is crucial - always set loading to false
      setLoading(false);
    }
  };

  const dashboardItems = [
    {
      id: 1,
      title: "Profile",
      path: "StudentProfileScreen",
      icon: "person-circle-outline",
      description: "Manage your personal information",
      color: ["#234785", "#1a5a9e"],
      // count: null,
    },
    {
      id: 2,
      title: "Attendance",
      path: "AttendanceScreen",
      icon: "calendar-outline",
      description: "Track your class attendance",
      color: ["#ffeb44", "#ffd700"],
      // count: userData?.attendancePercentage || "90%",
    },
    {
      id: 3,
      title: "Marks",
      path: "MarksheetScreen",
      icon: "trending-up-outline",
      description: "View your academic performance",
      color: ["#2d7ab8", "#4a9ad1"],
      // count: `Grade ${userData?.user?.grade || "A"}`,
    },
    {
      id: 4,
      title: "Payments",
      path: "PaymentHistoryScreen",
      icon: "card-outline",
      description: "Manage fees and payments",
      color: ["#4CAF50", "#45A049"],
      // count: "2 Pending",
    },
    {
      id: 8,
      title: "Downloads",
      path: "DownloadScreen",
      icon: "download-outline",
      description: "Download certificates",
      color: ["#ffb300", "#ffa000"],
      // count: "3 Items",
    },
    {
      id: 9,
      title: "Help & Support",
      path: "HelpSupportScreen",
      icon: "help-circle-outline",
      description: "Get assistance & FAQs",
      color: ["#1a5a9e", "#234785"],
      // count: "24/7",
    },
  ];

  const handleCardPress = (path) => {
    router.push({
      pathname: path,
      params: { 
        student_id: studentId,
        student_name: student_name,
        student_roll: student_roll,
        course_code: course_code
      },
    });
  };

  // Loading Screen
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#234785", "#1a5a9e", "#2d7ab8"]}
          style={styles.loadingContainer}
        >
          <Animated.View style={styles.loadingContent}>
            <View style={styles.loadingIconContainer}>
              <Ionicons name="school-outline" size={80} color="#ffeb44" />
            </View>
            <Text style={styles.loadingTitle}>Student Dashboard</Text>
            <ActivityIndicator
              size="large"
              color="#ffeb44"
              style={styles.loader}
            />
            <Text style={styles.loadingText}>
              Loading your academic world...
            </Text>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Main Dashboard
  const DashboardCard = ({ item, index }) => {
    const [cardScale] = useState(new Animated.Value(1));

    const handlePressIn = () => {
      Animated.spring(cardScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    // Determine if icon should be dark (for yellow backgrounds)
    const isYellowGradient = item.color[0].includes("ff");
    const iconColor = isYellowGradient ? "#234785" : "white";

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ scale: cardScale }],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleCardPress(item.path)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={item.color}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={item.icon} size={28} color={iconColor} />
          </LinearGradient>

          {item.count && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{item.count}</Text>
            </View>
          )}

          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />

      <LinearGradient
        colors={["#234785", "#1a5a9e", "#2d7ab8", "#4a9ad1"]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Enhanced Header Section */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Enhanced Student Profile Card */}
            <View style={styles.profileCard}>
              <LinearGradient
                colors={["rgba(255, 235, 68, 0.1)", "rgba(255, 215, 0, 0.1)"]}
                style={styles.profileBackground}
              >
                <View style={styles.profileHeader}>
                  <LinearGradient
                    colors={["#234785", "#1a5a9e"]}
                    style={styles.profileAvatar}
                  >
                    {userData?.data?.student_photo ? (
                      <Image
                        source={{
                          uri: `https://omcti.in/apprise/temp/upload/${userData.data.student_photo}`,
                        }}
                        style={styles.studentProfileImage}
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {(student_name || "Student Name")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "ST"}
                      </Text>
                    )}
                  </LinearGradient>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>
                      {student_name || "Student Name"}
                    </Text>
                    <View style={styles.profileDetailRow}>
                      <Ionicons name="school-outline" size={14} color="#234785" />
                      <Text style={styles.profileId}>
                        Course: {course_code || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.profileDetailRow}>
                      <Ionicons name="document-text-outline" size={14} color="#234785" />
                      <Text style={styles.profileCourse}>
                        Roll: {student_roll || "N/A"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.profileStats}>
                    <LinearGradient
                      colors={["#ffeb44", "#ffd700"]}
                      style={styles.statBox}
                    >
                      <Text style={styles.statValue}>
                        {userData?.data?.grade || "A"}
                      </Text>
                      <Text style={styles.statLabel}>
                        {userData?.data?.percentage || "85%"}
                      </Text>
                    </LinearGradient>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Dashboard Grid */}
          <View style={styles.gridContainer}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.titleLine} />
              <Text style={styles.sectionTitle}>Quick Access</Text>
              <View style={styles.titleLine} />
            </View>
            <View style={styles.cardsGrid}>
              {dashboardItems.map((item, index) => (
                <DashboardCard key={item.id} item={item} index={index} />
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 235, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#ffeb44",
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffeb44",
    marginTop: 20,
    marginBottom: 30,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },

  // Main Dashboard Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    margin: 20,
    marginBottom: 10,
  },
  institutionBanner: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  institutionLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  institutionInfo: {
    flex: 1,
  },
  institutionName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffeb44",
    marginBottom: 4,
  },
  institutionTagline: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 50,
    borderWidth: 2,
    borderColor: "#ffeb44",
  },
  profileBackground: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#ffeb44",
  },
  studentProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: "cover",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffeb44",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#234785",
    marginBottom: 6,
  },
  profileDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  profileId: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
    fontWeight: "500",
  },
  profileCourse: {
    fontSize: 14,
    color: "#234785",
    fontWeight: "500",
    marginLeft: 6,
  },
  profileStats: {
    alignItems: "center",
  },
  statBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffb300",
    shadowColor: "#ffeb44",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#234785",
  },
  statLabel: {
    fontSize: 12,
    color: "#234785",
    fontWeight: "600",
  },

  // Grid Styles
  gridContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  titleLine: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255, 235, 68, 0.5)",
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffeb44",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardContainer: {
    width: (width - 60) / 2,
    marginBottom: 15,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(35, 71, 133, 0.1)",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  countBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#F44336",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#234785",
    marginBottom: 6,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    lineHeight: 14,
  },
});

export default StudentDashboard2;