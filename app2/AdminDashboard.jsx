import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as ScreenCapture from "expo-screen-capture";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive utilities
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;
const responsiveSize = (size) => {
  if (isTablet) return size * 1.2;
  if (isSmallPhone) return size * 0.9;
  return size;
};

// Simple Progress Bar Component
const ProgressBar = ({ percentage, color = "#4CAF50" }) => (
  <View style={styles.progressBarContainer}>
    <View
      style={[
        styles.progressBar,
        { width: `${percentage}%`, backgroundColor: color },
      ]}
    />
  </View>
);

// Chart Component for Student Distribution
const StudentDistributionChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + parseInt(item.total), 0);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Student Status Distribution</Text>
      {data.map((item, index) => {
        const percentage = (parseInt(item.total) / total) * 100;
        const colors = [
          "#4CAF50",
          "#234785",
          "#ffeb44",
          "#F44336",
          "#1a5a9e",
          "#ffd700",
        ];

        return (
          <View key={index} style={styles.chartItem}>
            <View style={styles.chartItemHeader}>
              <View style={styles.chartLegend}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: colors[index % colors.length] },
                  ]}
                />
                <Text style={styles.chartLabel}>{item.status}</Text>
              </View>
              <Text style={styles.chartValue}>
                {item.total} ({percentage.toFixed(1)}%)
              </Text>
            </View>
            <ProgressBar
              percentage={percentage}
              color={colors[index % colors.length]}
            />
          </View>
        );
      })}
    </View>
  );
};

// Performance Metrics Component
const PerformanceMetrics = ({ dashboardData }) => {
  const totalStudents =
    dashboardData?.total_student?.reduce(
      (sum, item) => sum + parseInt(item.total),
      0
    ) || 0;
  const todayWork =
    dashboardData?.today_work?.reduce(
      (sum, item) => sum + parseInt(item.total),
      0
    ) || 0;
  const todayAdmissions =
    dashboardData?.center_today_admission?.reduce(
      (sum, item) => sum + parseInt(item.total),
      0
    ) || 0;

  const verifiedStudents =
    dashboardData?.total_student?.find((item) => item.status === "VERIFIED")
      ?.total || 0;
  const pendingStudents =
    dashboardData?.total_student?.find((item) => item.status === "PENDING")
      ?.total || 0;
  const dispatchedStudents =
    dashboardData?.total_student?.find((item) => item.status === "DISPATCHED")
      ?.total || 0;

  const conversionRate =
    totalStudents > 0
      ? ((parseInt(verifiedStudents) / totalStudents) * 100).toFixed(1)
      : 0;
  const pendingRate =
    totalStudents > 0
      ? ((parseInt(pendingStudents) / totalStudents) * 100).toFixed(1)
      : 0;

  return (
    <View style={styles.metricsContainer}>
      <Text style={styles.sectionTitle}>Performance Metrics</Text>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: "#E8F5E8" }]}>
          <Ionicons
            name="checkmark-circle"
            size={responsiveSize(32)}
            color="#4CAF50"
          />
          <Text style={styles.metricValue}>{conversionRate}%</Text>
          <Text style={styles.metricLabel}>Verification Rate</Text>
          <Text style={styles.metricSubtext}>{verifiedStudents} verified</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: "#FFF8DC" }]}>
          <Ionicons
            name="hourglass"
            size={responsiveSize(32)}
            color="#ffeb44"
          />
          <Text style={styles.metricValue}>{pendingRate}%</Text>
          <Text style={styles.metricLabel}>Pending Rate</Text>
          <Text style={styles.metricSubtext}>{pendingStudents} pending</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: "#E8F0F8" }]}>
          <Ionicons name="send" size={responsiveSize(32)} color="#234785" />
          <Text style={styles.metricValue}>{dispatchedStudents}</Text>
          <Text style={styles.metricLabel}>Dispatched</Text>
          <Text style={styles.metricSubtext}>Certificates sent</Text>
        </View>
      </View>
    </View>
  );
};

// Today's Activity Timeline
const ActivityTimeline = ({ todayWork }) => {
  return (
    <View style={styles.timelineContainer}>
      <Text style={styles.sectionTitle}>Today's Activity Timeline</Text>
      {todayWork?.map((activity, index) => (
        <View key={index} style={styles.timelineItem}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>{activity.status}</Text>
            <Text style={styles.timelineCount}>
              {activity.total} items processed
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Center Performance Detailed View
const CenterPerformanceModal = ({ visible, onClose, centers }) => {
  const renderCenterItem = ({ item, index }) => (
    <View style={styles.centerModalItem}>
      <View style={styles.centerRank}>
        <Text style={styles.rankNumber}>#{index + 1}</Text>
      </View>
      <View style={styles.centerModalInfo}>
        <Text style={styles.centerModalName}>{item.center_name}</Text>
        <Text style={styles.centerModalCode}>{item.center_code}</Text>
      </View>
      <View style={styles.centerModalStats}>
        <Text style={styles.centerModalAdmissions}>{item.total}</Text>
        <Text style={styles.centerModalLabel}>Admissions</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Center Performance Today</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#234785" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={centers}
          renderItem={renderCenterItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.centerModalList}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
};

// Security Alert Component
const SecurityAlert = ({ visible, onClose }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.securityAlertOverlay}>
      <View style={styles.securityAlertContainer}>
        <Ionicons name="shield-checkmark" size={48} color="#F44336" />
        <Text style={styles.securityAlertTitle}>Security Warning</Text>
        <Text style={styles.securityAlertText}>
          Screenshot and screen recording are not allowed for security reasons.
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.securityAlertButton}>
          <Text style={styles.securityAlertButtonText}>Understood</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// Admin Dashboard Component
const AdminDashboard = ({ navigation, route }) => {
  const [userId, setUserId] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [isScreenProtected, setIsScreenProtected] = useState(false);

  // Security Functions
  const enableScreenProtection = async () => {
    try {
      // Prevent screenshots and screen recording
      await ScreenCapture.preventScreenCaptureAsync();
      setIsScreenProtected(true);
      console.log("Screen protection enabled");
    } catch (error) {
      console.log("Screen protection error:", error);
    }
  };

  const disableScreenProtection = async () => {
    try {
      // Allow screenshots and screen recording (when leaving the screen)
      await ScreenCapture.allowScreenCaptureAsync();
      setIsScreenProtected(false);
      console.log("Screen protection disabled");
    } catch (error) {
      console.log("Screen protection disable error:", error);
    }
  };

  // Screen capture event listener
  const setupScreenCaptureListener = () => {
    const subscription = ScreenCapture.addScreenshotListener(() => {
      setShowSecurityAlert(true);
      // Log security event
      console.log("Screenshot attempt detected!");
      
      // Optional: Send security alert to server
      // logSecurityEvent('screenshot_attempt');
    });

    return subscription;
  };

  // App state handler for additional security
  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background, ensure screen protection
      enableScreenProtection();
    } else if (nextAppState === 'active') {
      // App is coming to foreground, re-enable protection
      enableScreenProtection();
    }
  };

  // Focus effect for screen protection
  useFocusEffect(
    useCallback(() => {
      // Enable protection when screen is focused
      enableScreenProtection();
      
      // Setup screenshot listener
      const screenshotSubscription = setupScreenCaptureListener();
      
      // Setup app state listener
      const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        // Cleanup when screen loses focus
        disableScreenProtection();
        screenshotSubscription?.remove();
        appStateSubscription?.remove();
      };
    }, [])
  );

  // ✅ Load userData from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem("userData");
        if (jsonValue) {
          const parsedData = JSON.parse(jsonValue);
          setAdminData(parsedData?.data?.[0]);
          setUserId(parsedData?.id);
        }
      } catch (e) {
        console.log("Error fetching userData:", e);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=admin_dashboard&user_id=" +
          userId
      );
      const data = await response.json();

      if (data.status === "success") {
        setDashboardData(data.data);
      } else {
        Alert.alert("Error", "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Dashboard API Error:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Disable screen protection before logout
            await disableScreenProtection();
            await AsyncStorage.multiRemove(["userData", "userType", "userId"]);
            router.replace("LoginScreen");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const handleCardPress = (path) => {
    router.push({
      pathname: path,
    });
  };

  // Calculate totals from API data
  const getTotalStudents = () => {
    if (!dashboardData?.total_student) return 0;
    return dashboardData.total_student.reduce(
      (sum, item) => sum + parseInt(item.total),
      0
    );
  };

  const getTodayWork = () => {
    if (!dashboardData?.today_work) return 0;
    return dashboardData.today_work.reduce(
      (sum, item) => sum + parseInt(item.total),
      0
    );
  };

  const getTodayAdmissions = () => {
    if (!dashboardData?.center_today_admission) return 0;
    return dashboardData.center_today_admission.reduce(
      (sum, item) => sum + parseInt(item.total),
      0
    );
  };

  const getWalletBalance = () => {
    if (!dashboardData?.wallet_summary?.[0])
      return { balance: 0, used: 0, recharge: 0 };
    const wallet = dashboardData.wallet_summary[0];
    return {
      used: parseFloat(wallet.used),
      recharge: parseFloat(wallet.recharge),
      balance: parseFloat(wallet.recharge) - parseFloat(wallet.used),
    };
  };

  const getCompanyIncome = () => {
    if (!dashboardData?.company_account?.[0]) return 0;
    return parseFloat(dashboardData.company_account[0].total);
  };

  const adminItems = [
    {
      id: 1,
      title: "Search Student",
      icon: "search-outline",
      color: "#234785",
      path: "StudentSearchScreen",
    },
    {
      id: 2,
      title: "Center List",
      icon: "business-outline",
      color: "#ffeb44",
      path: "CenterList",
    },
    {
      id: 3,
      title: "Pending Student",
      icon: "time-outline",
      color: "#1a5a9e",
      path: "PendingStudentScreen",
    },
    {
      id: 4,
      title: "Verify Result ",
      icon: "document-text-outline",
      color: "#ffd700",
      path: "PendingResultScreen",
    },
  ];

  const getGridColumns = () => {
    if (isTablet) return 4;
    return 2;
  };

  const getCardWidth = () => {
    const columns = getGridColumns();
    const padding = 20;
    const spacing = 15;
    const totalSpacing = padding * 2 + spacing * (columns - 1);
    return (screenWidth - totalSpacing) / columns;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const walletInfo = getWalletBalance();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />

      <LinearGradient
        colors={["#234785", "#1a5a9e", "#2d7ab8"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text style={styles.welcomeText}>Admin Control Panel</Text>
            <Text
              style={styles.nameText}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {adminData?.full_name || adminData?.user_name || "Administrator"}
            </Text>
            <Text style={styles.roleText}>System Administrator</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons
              name="log-out-outline"
              size={responsiveSize(24)}
              color="#ffeb44"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#234785"]} />
        }
      >
        {/* Overview Stats */}
        <View style={styles.overviewContainer}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={[styles.overviewCard, { borderLeftColor: "#4CAF50" }]}>
              <View style={styles.overviewHeader}>
                <Ionicons
                  name="people"
                  size={responsiveSize(24)}
                  color="#4CAF50"
                />
                <Text style={styles.overviewValue}>
                  {getTotalStudents().toLocaleString()}
                </Text>
              </View>
              <Text style={styles.overviewLabel}>Total Students</Text>
              <Text style={styles.overviewSubtext}>All registrations</Text>
            </View>

            <View style={[styles.overviewCard, { borderLeftColor: "#234785" }]}>
              <View style={styles.overviewHeader}>
                <Ionicons
                  name="today"
                  size={responsiveSize(24)}
                  color="#234785"
                />
                <Text style={styles.overviewValue}>{getTodayWork()}</Text>
              </View>
              <Text style={styles.overviewLabel}>Today's Activities</Text>
              <Text style={styles.overviewSubtext}>Processed items</Text>
            </View>

            <View style={[styles.overviewCard, { borderLeftColor: "#ffeb44" }]}>
              <View style={styles.overviewHeader}>
                <Ionicons
                  name="school"
                  size={responsiveSize(24)}
                  color="#ffb300"
                />
                <Text style={styles.overviewValue}>{getTodayAdmissions()}</Text>
              </View>
              <Text style={styles.overviewLabel}>New Admissions</Text>
              <Text style={styles.overviewSubtext}>Today's enrollments</Text>
            </View>

            <View style={[styles.overviewCard, { borderLeftColor: "#1a5a9e" }]}>
              <View style={styles.overviewHeader}>
                <Ionicons
                  name="business"
                  size={responsiveSize(24)}
                  color="#1a5a9e"
                />
                <Text style={styles.overviewValue}>
                  {dashboardData?.center_today_admission?.length || 0}
                </Text>
              </View>
              <Text style={styles.overviewLabel}>Active Centers</Text>
              <Text style={styles.overviewSubtext}>With admissions today</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Dashboard */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.dashboardGrid}>
            {adminItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.actionCard, { width: getCardWidth() }]}
                onPress={() => handleCardPress(item.path)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[item.color, item.color + "CC"]}
                  style={styles.actionIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={item.icon}
                    size={responsiveSize(24)}
                    color={item.color === "#ffeb44" || item.color === "#ffd700" ? "#234785" : "#fff"}
                  />
                </LinearGradient>
                <Text style={styles.actionTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Financial Dashboard */}
        <View style={styles.financialDashboard}>
          <Text style={styles.sectionTitle}>Financial Dashboard</Text>
          <View style={styles.financialMainCard}>
            <LinearGradient
              colors={["#234785", "#1a5a9e"]}
              style={styles.balanceCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.balanceLabel}>Today Wallet Status</Text>
              <Text style={styles.balanceAmount}>
                ₹{walletInfo.balance.toLocaleString()}
              </Text>
              <Text style={styles.balanceSubtext}>Available funds</Text>
            </LinearGradient>
          </View>

          <View style={styles.financialSubCards}>
            <View style={styles.financialSubCard}>
              <Ionicons
                name="arrow-up-circle"
                size={responsiveSize(20)}
                color="#4CAF50"
              />
              <Text style={styles.subCardAmount}>
                ₹{walletInfo.recharge.toLocaleString()}
              </Text>
              <Text style={styles.subCardLabel}>Total Recharged</Text>
            </View>

            <View style={styles.financialSubCard}>
              <Ionicons
                name="arrow-down-circle"
                size={responsiveSize(20)}
                color="#F44336"
              />
              <Text style={styles.subCardAmount}>
                ₹{walletInfo.used.toLocaleString()}
              </Text>
              <Text style={styles.subCardLabel}>Amount Used</Text>
            </View>

            <View style={styles.financialSubCard}>
              <Ionicons
                name="trending-up"
                size={responsiveSize(20)}
                color="#ffeb44"
              />
              <Text style={styles.subCardAmount}>
                ₹{getCompanyIncome().toLocaleString()}
              </Text>
              <Text style={styles.subCardLabel}>Today's Revenue</Text>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <PerformanceMetrics dashboardData={dashboardData} />

        {/* Student Distribution Chart */}
        {dashboardData?.total_student && (
          <StudentDistributionChart data={dashboardData.total_student} />
        )}

        {/* Today's Activity Timeline */}
        {dashboardData?.today_work && (
          <ActivityTimeline todayWork={dashboardData.today_work} />
        )}

        {/* Top Performing Centers */}
        <View style={styles.centersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Center Performance Today</Text>
            <TouchableOpacity
              onPress={() => setShowCenterModal(true)}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color="#234785" />
            </TouchableOpacity>
          </View>

          <View style={styles.topCentersGrid}>
            {dashboardData?.center_today_admission
              ?.slice(0, 3)
              .map((center, index) => (
                <View key={index} style={styles.topCenterCard}>
                  <View style={styles.centerRankBadge}>
                    <Text style={styles.centerRankText}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.topCenterName} numberOfLines={2}>
                    {center.center_name}
                  </Text>
                  <Text style={styles.topCenterCode}>{center.center_code}</Text>
                  <View style={styles.topCenterStats}>
                    <Text style={styles.topCenterAdmissions}>
                      {center.total}
                    </Text>
                    <Text style={styles.topCenterLabel}>Admissions</Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        {/* System Information */}
        <View style={styles.systemInfo}>
          <Text style={styles.sectionTitle}>System Information</Text>

          <View style={styles.systemCard}>
            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {adminData?.status || "Active"}
                </Text>
              </View>
            </View>

            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>Last Updated</Text>
              <Text style={styles.systemValue}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>Security Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: isScreenProtected ? "#4CAF50" : "#ffeb44" }]} />
                <Text style={[styles.statusText, { color: isScreenProtected ? "#4CAF50" : "#ffb300" }]}>
                  {isScreenProtected ? "Protected" : "Unprotected"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Center Performance Modal */}
      <CenterPerformanceModal
        visible={showCenterModal}
        onClose={() => setShowCenterModal(false)}
        centers={dashboardData?.center_today_admission || []}
      />

      {/* Security Alert Modal */}
      <SecurityAlert
        visible={showSecurityAlert}
        onClose={() => setShowSecurityAlert(false)}
      />
    </SafeAreaView>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: responsiveSize(16),
    color: "#234785",
    fontWeight: "600",
  },
  
  // Security Indicator Styles
  securityIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255, 235, 68, 0.9)",
    borderRadius: 15,
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 10,
    right: 20,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  securityText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
    color: "#234785",
  },

  // Security Alert Styles
  securityAlertOverlay: {
    flex: 1,
    backgroundColor: "rgba(35, 71, 133, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  securityAlertContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#ffeb44",
  },
  securityAlertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#234785",
    marginTop: 15,
    marginBottom: 10,
  },
  securityAlertText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  securityAlertButton: {
    backgroundColor: "#234785",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  securityAlertButtonText: {
    color: "#ffeb44",
    fontSize: 16,
    fontWeight: "600",
  },

  header: {
    paddingTop: 10,
    paddingBottom: responsiveSize(20),
    paddingHorizontal: responsiveSize(20),
    minHeight: responsiveSize(100),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  headerInfo: {
    flex: 1,
    marginRight: 15,
  },
  welcomeText: {
    color: "#ffeb44",
    fontSize: responsiveSize(12),
    opacity: 0.9,
    fontWeight: "500",
  },
  nameText: {
    color: "#fff",
    fontSize: responsiveSize(isTablet ? 28 : 22),
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 2,
    textTransform: "capitalize",
  },
  roleText: {
    color: "#ffeb44",
    fontSize: responsiveSize(13),
    opacity: 0.9,
    fontWeight: "600",
  },
  logoutButton: {
    padding: responsiveSize(12),
    borderRadius: responsiveSize(12),
    backgroundColor: "rgba(255, 235, 68, 0.2)",
    minWidth: responsiveSize(48),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 235, 68, 0.3)",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsiveSize(20),
    paddingBottom: responsiveSize(30),
  },
  sectionTitle: {
    fontSize: responsiveSize(18),
    fontWeight: "bold",
    color: "#234785",
    marginBottom: responsiveSize(15),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveSize(15),
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  viewAllText: {
    fontSize: responsiveSize(14),
    color: "#234785",
    fontWeight: "600",
  },

  // Overview Section
  overviewContainer: {
    marginTop: responsiveSize(15),
    marginBottom: responsiveSize(25),
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: responsiveSize(12),
  },
  overviewCard: {
    backgroundColor: "#fff",
    borderRadius: responsiveSize(12),
    padding: responsiveSize(16),
    width: (screenWidth - responsiveSize(52)) / 2,
    borderLeftWidth: 4,
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveSize(8),
  },
  overviewValue: {
    fontSize: responsiveSize(20),
    fontWeight: "bold",
    color: "#234785",
  },
  overviewLabel: {
    fontSize: responsiveSize(14),
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 2,
  },
  overviewSubtext: {
    fontSize: responsiveSize(11),
    color: "#7f8c8d",
  },

  // Financial Dashboard
  financialDashboard: {
    marginBottom: responsiveSize(25),
  },
  financialMainCard: {
    marginBottom: responsiveSize(15),
  },
  balanceCard: {
    borderRadius: responsiveSize(16),
    padding: responsiveSize(20),
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffeb44",
  },
  balanceLabel: {
    color: "#ffeb44",
    fontSize: responsiveSize(14),
    opacity: 0.9,
    marginBottom: 5,
    fontWeight: "600",
  },
  balanceAmount: {
    color: "#fff",
    fontSize: responsiveSize(32),
    fontWeight: "bold",
    marginBottom: 5,
  },
  balanceSubtext: {
    color: "#ffeb44",
    fontSize: responsiveSize(12),
    opacity: 0.8,
  },
  financialSubCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: responsiveSize(10),
  },
  financialSubCard: {
    backgroundColor: "#fff",
    borderRadius: responsiveSize(12),
    padding: responsiveSize(15),
    flex: 1,
    alignItems: "center",
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subCardAmount: {
    fontSize: responsiveSize(16),
    fontWeight: "bold",
    color: "#234785",
    marginVertical: 5,
  },
  subCardLabel: {
    fontSize: responsiveSize(11),
    color: "#7f8c8d",
    textAlign: "center",
  },

  // Performance Metrics
  metricsContainer: {
    marginBottom: responsiveSize(25),
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: responsiveSize(10),
  },
  metricCard: {
    flex: 1,
    borderRadius: responsiveSize(12),
    padding: responsiveSize(15),
    alignItems: "center",
    minHeight: responsiveSize(110),
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  metricValue: {
    fontSize: responsiveSize(20),
    fontWeight: "bold",
    color: "#234785",
    marginTop: 8,
  },
  metricLabel: {
    fontSize: responsiveSize(12),
    color: "#34495e",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
  metricSubtext: {
    fontSize: responsiveSize(10),
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 2,
  },

  // Chart Styles
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: responsiveSize(16),
    padding: responsiveSize(20),
    marginBottom: responsiveSize(25),
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  chartTitle: {
    fontSize: responsiveSize(16),
    fontWeight: "bold",
    color: "#234785",
    marginBottom: responsiveSize(15),
    textAlign: "center",
  },
  chartItem: {
    marginBottom: responsiveSize(12),
  },
  chartItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  chartLabel: {
    fontSize: responsiveSize(13),
    color: "#34495e",
    fontWeight: "500",
  },
  chartValue: {
    fontSize: responsiveSize(13),
    color: "#234785",
    fontWeight: "bold",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#ecf0f1",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },

  // Timeline Styles
  timelineContainer: {
    backgroundColor: "#fff",
    borderRadius: responsiveSize(16),
    padding: responsiveSize(20),
    marginBottom: responsiveSize(25),
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveSize(15),
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#234785",
    marginRight: responsiveSize(15),
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: responsiveSize(14),
    fontWeight: "600",
    color: "#234785",
  },
  timelineCount: {
    fontSize: responsiveSize(12),
    color: "#7f8c8d",
    marginTop: 2,
  },

  // Centers Section
  centersSection: {
    marginBottom: responsiveSize(25),
  },
  topCentersGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: responsiveSize(10),
  },
  topCenterCard: {
    backgroundColor: "#fff",
    borderRadius: responsiveSize(12),
    padding: responsiveSize(15),
    flex: 1,
    alignItems: "center",
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: responsiveSize(120),
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  centerRankBadge: {
    backgroundColor: "#234785",
    borderRadius: responsiveSize(12),
    paddingHorizontal: responsiveSize(8),
    paddingVertical: responsiveSize(4),
    marginBottom: responsiveSize(8),
  },
  centerRankText: {
    color: "#ffeb44",
    fontSize: responsiveSize(10),
    fontWeight: "bold",
  },
  topCenterName: {
    fontSize: responsiveSize(11),
    fontWeight: "600",
    color: "#234785",
    textAlign: "center",
    marginBottom: 4,
    minHeight: responsiveSize(30),
  },
  topCenterCode: {
    fontSize: responsiveSize(9),
    color: "#7f8c8d",
    marginBottom: responsiveSize(8),
  },
  topCenterStats: {
    alignItems: "center",
  },
  topCenterAdmissions: {
    fontSize: responsiveSize(18),
    fontWeight: "bold",
    color: "#4CAF50",
  },
  topCenterLabel: {
    fontSize: responsiveSize(9),
    color: "#7f8c8d",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveSize(20),
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: responsiveSize(18),
    fontWeight: "bold",
    color: "#234785",
  },
  modalCloseButton: {
    padding: responsiveSize(8),
    borderRadius: responsiveSize(8),
    backgroundColor: "#ecf0f1",
  },
  centerModalList: {
    flex: 1,
    padding: responsiveSize(20),
  },
  centerModalItem: {
    backgroundColor: "#fff",
    borderRadius: responsiveSize(12),
    padding: responsiveSize(15),
    marginBottom: responsiveSize(10),
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#ffeb44",
  },
  centerRank: {
    width: responsiveSize(40),
    height: responsiveSize(40),
    borderRadius: responsiveSize(20),
    backgroundColor: "#234785",
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveSize(15),
  },
  rankNumber: {
    color: "#ffeb44",
    fontSize: responsiveSize(14),
    fontWeight: "bold",
  },
  centerModalInfo: {
    flex: 1,
    marginRight: responsiveSize(10),
  },
  centerModalName: {
    fontSize: responsiveSize(14),
    fontWeight: "600",
    color: "#234785",
    marginBottom: 2,
  },
  centerModalCode: {
    fontSize: responsiveSize(12),
    color: "#7f8c8d",
  },
  centerModalStats: {
    alignItems: "center",
  },
  centerModalAdmissions: {
    fontSize: responsiveSize(18),
    fontWeight: "bold",
    color: "#4CAF50",
  },
  centerModalLabel: {
    fontSize: responsiveSize(10),
    color: "#7f8c8d",
  },

  // Actions Section
  actionsSection: {
    marginBottom: responsiveSize(25),
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: responsiveSize(12),
  },
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: responsiveSize(12),
    padding: responsiveSize(15),
    alignItems: "center",
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: responsiveSize(100),
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  actionIconContainer: {
    width: responsiveSize(45),
    height: responsiveSize(45),
    borderRadius: responsiveSize(22.5),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveSize(8),
  },
  actionTitle: {
    fontSize: responsiveSize(12),
    fontWeight: "600",
    color: "#234785",
    textAlign: "center",
    lineHeight: responsiveSize(15),
    marginBottom: responsiveSize(5),
  },

  // System Info
  systemInfo: {
    marginBottom: responsiveSize(20),
  },
  systemCard: {
    backgroundColor: "#fff",
    borderRadius: responsiveSize(16),
    padding: responsiveSize(20),
    shadowColor: "#234785",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  systemItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: responsiveSize(12),
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  systemLabel: {
    fontSize: responsiveSize(14),
    color: "#7f8c8d",
    fontWeight: "500",
    flex: 1,
  },
  systemValue: {
    fontSize: responsiveSize(14),
    color: "#234785",
    fontWeight: "600",
    flex: 1.5,
    textAlign: "right",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#27ae60",
    marginRight: 6,
  },
  statusText: {
    fontSize: responsiveSize(14),
    color: "#27ae60",
    fontWeight: "600",
  },  
});