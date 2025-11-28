import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width, height } = Dimensions.get("window");

const StudentDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [welcomeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData && showWelcome) {
      startWelcomeAnimation();
    } else if (userData && !showWelcome) {
      startDashboardAnimation();
    }
  }, [userData, showWelcome]);

  const loadUserData = async () => {
    try {
      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const storedUser = await AsyncStorage.getItem("userData");
      const student_id = await AsyncStorage.getItem("userId");

      if (storedUser) {
        setUserData(JSON.parse(storedUser));
        setStudentId(JSON.parse(student_id));
      } else {
        router.replace("./LoginScreen");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const startWelcomeAnimation = () => {
    Animated.parallel([
      Animated.timing(welcomeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss welcome screen after 3 seconds
    setTimeout(() => {
      dismissWelcomeScreen();
    }, 3000);
  };

  const startDashboardAnimation = () => {
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
  };

  const dismissWelcomeScreen = () => {
    Animated.parallel([
      Animated.timing(welcomeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowWelcome(false);
    });
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout Confirmation",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['userData', 'userId']);
              router.replace("./LoginScreen");
            } catch (error) {
              console.error("Error during logout:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  const dashboardItems = [
    {
      id: 1,
      title: "Profile",
      path: "StudentProfileScreen",
      icon: "person-circle-outline",
      description: "Manage Your Personal Information",
      color: ["#234785", "#3d6aa5"],
      count: null,
    },
    {
      id: 2,
      title: "Attendance",
      path: "AttendanceScreen",
      icon: "calendar-outline",
      description: "Track Your Class Attendance",
      color: ["#f093fb", "#f5576c"],
    },
    {
      id: 3,      
      title: "Make Att.",
      path: "AttScreen",
      icon: "qr-code-outline",
      description: "Take online examinations",
      color: ["#151114ff", "#787876ff"],
    },
    {
      id: 4,
      title: "Payments",
      path: "PaymentHistoryScreen",
      icon: "card-outline",
      description: "Manage Fees & Payments",
      color: ["#43e97b", "#38f9d7"],
    },
    {
      id: 5,
      title: "Study Material",
      path: "SubjectListScreen", 
      icon: "book-outline",
      description: "Access Learning Resources",
      color: ["#fa709a", "#fee140"],
    },
    {
      id: 6,
      title: "Practice Set",
      path: "PracticeSet",
      icon: "checkmark-done-outline",
      description: "Solve Practice Questions to Improve",
      color: ["#ffeb44", "#ffd700"],
    },
    {
      id: 7,
      title: "Marks",
      path: "MarksheetScreen",
      icon: "trending-up-outline",
      description: "View Your Academic Performance",
      color: ["#4facfe", "#00f2fe"],
    },
    {
      id: 8,
      title: "Downloads",
      path: "DownloadScreen",
      icon: "download-outline",
      description: "Download certificates ",
      color: ["#89f7fe", "#3788f8ff"],
    },
    {
      id: 9,
      title: "Help & Support",
      path: "HelpSupportScreen",
      icon: "help-circle-outline",
      description: "Get assistance & FAQs",
      color: ["#ff9a9e", "#fad0c4"],
      count: "24/7",
    },
  ];

  const handleCardPress = (path) => {
    router.push({
      pathname: path,
      params: { student_id: studentId },
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎓 Introducing the Student Dashboard App - the ultimate tool to streamline your academic life..\n\Join fellow students from ${userData?.data?.center_name} and take control of your schedule, tasks, and academic progress. 📚✨\n\nDownload now: https://bit.ly/icaedu`,
        title: "Student Dashboard",
      });
    } catch (error) {
      Alert.alert("Error", "Unable to share at this time");
    }
  };

  const handleReview = () => {
    Alert.alert(
      "Rate Our App",
      "How would you rate your experience with the Student Dashboard?",
      [
        { text: "Maybe Later", style: "cancel" },
        {
          text: "Rate Now",
          style: "default",
          onPress: () => {
            Linking.openURL("https://play.google.com/store/apps/details?id=com.offerplant.cait&hl=en").catch((err) =>
              console.error("Failed to open URL:", err)
            );
          },
        },
      ]
    );
  };

  // Loading Screen
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#234785", "#3d6aa5"]}
          style={styles.loadingContainer}
        >
          <Animated.View style={styles.loadingContent}>
            <Ionicons name="school-outline" size={80} color="#ffeb44" />
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

  // Welcome Screen
  if (showWelcome && userData) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.welcomeContainer}
          onPress={dismissWelcomeScreen}
          activeOpacity={1}
        >
          <LinearGradient
            colors={["#234785", "#3d6aa5", "#5a8cc4"]}
            style={styles.welcomeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View
              style={[
                styles.welcomeContent,
                {
                  opacity: welcomeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.welcomeIconContainer}>
                <LinearGradient
                  colors={["rgba(255, 235, 68, 0.3)", "rgba(255, 235, 68, 0.1)"]}
                  style={styles.welcomeIcon}
                >
                </LinearGradient>
              </View>

              <Text style={styles.welcomeGreeting}>
                {getCurrentGreeting() + ',\nWelcome back!'}
              </Text>
              <Text style={styles.welcomeName}>
                {userData.data.student_name}
              </Text>

              <View style={styles.welcomeDetails}>
                <Text style={styles.welcomeSubtext}>
                  {userData.data.center_name}
                </Text>
              </View>

              <View style={styles.welcomeIndicator}>
                <View style={styles.indicatorDot} />
                <View
                  style={[styles.indicatorDot, styles.indicatorDotActive]}
                />
                <View style={styles.indicatorDot} />
              </View>
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
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
            <Ionicons name={item.icon} size={28} color="white" />
          </LinearGradient>

          {item.count && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{item.count}</Text>
            </View>
          )}

          <Text style={styles.cardTitle}>{item.title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />

      <LinearGradient
        colors={["#234785", "#3d6aa5"]}
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
            {/* Institution Banner */}
            <LinearGradient
              colors={["#234785", "#3d6aa5"]}
              style={styles.institutionBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.bannerContent}>
                <LinearGradient
                  colors={["rgba(255, 235, 68, 0.3)", "rgba(255, 235, 68, 0.15)"]}
                  style={styles.institutionLogo}
                >
                  <Ionicons name="school-outline" size={32} color="#ffeb44" />
                </LinearGradient>
                <View style={styles.institutionInfo}>
                  <Text style={styles.institutionName}>
                    {userData?.data.center_name || "Immense Computer Academy"}
                  </Text>
                  <Text style={styles.institutionTagline}>
                    {userData?.data.center_code}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#f80f0fff", "#c62828"]}
                    style={styles.logoutButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="log-out-outline" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Enhanced Student Profile Card */}
            <View style={styles.profileCard}>
              <LinearGradient
                colors={["rgba(35, 71, 133, 0.1)", "rgba(61, 106, 165, 0.1)"]}
                style={styles.profileBackground}
              >
                <View style={styles.profileHeader}>
                  <LinearGradient
                    colors={["#234785", "#3d6aa5"]}
                    style={styles.profileAvatar}
                  >
                    <Image
                      source={{
                        uri: userData?.data.student_photo
                          ? `https://omcti.in/apprise/temp/upload/${userData?.data.student_photo}`
                          : "https://via.placeholder.com/120x120/E0E0E0/666666?text=No+Photo",
                      }}
                      style={styles.studentProfileImage}
                    />
                  </LinearGradient>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>
                      {userData?.data.student_name}
                    </Text>
                    <Text style={styles.profileId}>
                      Course: {userData?.data.course_code}
                    </Text>
                    <Text style={styles.profileCourse}>
                      {userData?.data.student_roll}
                    </Text>
                  </View>
                  <View style={styles.profileStats}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>
                        {userData?.data.grade}
                      </Text>
                      <Text style={styles.statLabel}>
                        {userData?.data.percentage}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Dashboard Grid */}
          <View style={styles.gridContainer}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.cardsGrid}>
              {dashboardItems.map((item, index) => (
                <DashboardCard key={item.id} item={item} index={index} />
              ))}
            </View>
          </View>

          {/* Enhanced Footer */}
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.footerTitle}>Share & Review</Text>
            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#234785", "#3d6aa5"]}
                  style={styles.footerButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="share-outline" size={20} color="#ffeb44" />
                  <Text style={styles.footerButtonText}>Share App</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleReview}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#ffeb44", "#ffd700"]}
                  style={styles.footerButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="star-outline" size={20} color="#234785" />
                  <Text style={[styles.footerButtonText, { color: '#234785' }]}>Rate Us</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.footerText}>
              Made with ❤️ for {userData?.data.center_name} students
            </Text>
          </Animated.View>
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
  loadingTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffeb44",
    marginTop: 20,
    marginBottom: 30,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },

  // Welcome Screen Styles
  welcomeContainer: {
    flex: 1,
  },
  welcomeGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  welcomeIconContainer: {
    marginBottom: 30,
    padding: 20,
  },
  welcomeIcon: {
    width: 200,
    height: undefined,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    resizeMode: "contain",
    paddingBottom: 10,
  },
  studentProfileImage: {
    width: 60,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
    borderWidth: 3,
    borderColor: "#ffeb44",
    resizeMode: "contain",
  },
  welcomeGreeting: {
    fontSize: 24,
    color: "#ffeb44",
    fontWeight: "400",
  },
  welcomeName: {
    fontSize: 36,
    fontWeight: "700",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  welcomeDetails: {
    alignItems: "center",
    marginBottom: 40,
  },
  welcomeSubtext: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeInfo: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  quickStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 235, 68, 0.2)",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 235, 68, 0.3)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffeb44",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 235, 68, 0.5)",
    marginHorizontal: 20,
  },
  tapToContinue: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 30,
  },
  welcomeIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 235, 68, 0.3)",
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: "#ffeb44",
    transform: [{ scale: 1.2 }],
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
  
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderTopWidth: 3,
    borderTopColor: "#ffeb44",
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: "#718096",
    fontWeight: "400",
  },
  userNameText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#234785",
  },
  logoutButton: {
    marginLeft: 15,
  },
  logoutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#f30c0cff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  greetingBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f5576c",
  },
  institutionBanner: {
    borderRadius: 15,
    padding: 12,
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
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "rgba(255, 235, 68, 0.3)",
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
    color: "rgba(255, 255, 255, 0.9)",
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
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
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
    fontWeight: "600",
    color: "#234785",
    marginBottom: 2,
  },
  profileId: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 2,
  },
  profileCourse: {
    fontSize: 14,
    color: "#4a5568",
    fontWeight: "500",
  },
  profileStats: {
    alignItems: "center",
  },
  statBox: {
    backgroundColor: "#234785",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffeb44",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffeb44",
  },

  // Grid Styles
  gridContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffeb44",
    marginBottom: 20,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardContainer: {
    width: (width - 60) / 3,
    marginBottom: 15,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 18,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    position: "relative",
    height: 120,
    borderTopWidth: 3,
    borderTopColor: "#ffeb44",
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
    backgroundColor: "#f5576c",
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
    fontSize: 13,
    fontWeight: "600",
    color: "#234785",
    marginBottom: 6,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 11,
    color: "#718096",
    textAlign: "center",
    lineHeight: 14,
  },

  // Footer Styles
  footer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderTopWidth: 3,
    borderTopColor: "#ffeb44",
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#234785",
    marginBottom: 20,
  },
  footerActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 10,
  },
  footerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  footerButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  footerText: {
    color: "#718096",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});

export default StudentDashboard;