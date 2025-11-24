// app/DashboardCount.js
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DashboardCount() {
  const [counts, setCounts] = useState(null);
  const [totals, setTotals] = useState({});
  const [strength, setStrength] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      // Fetch counts
      const countRes = await axios.get(
        "https://omcti.in/apprise/api.php?task=dash_couts"
      );
      if (countRes.data) setCounts(countRes.data);

      // Fetch strength
      const strengthRes = await axios.get(
        "https://omcti.in/apprise/api.php?task=strength"
      );
      if (strengthRes.data) {
        setStrength(strengthRes.data.data || []);
        setTotals(strengthRes.data.totals || {});
      }
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#234785" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (!counts) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#234785" />
        <Text style={styles.errorText}>Failed to load data</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboard}>
          <Ionicons name="reload" size={20} color="#234785" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={["#234785", "#1a3666"]}
          style={styles.header}
        >
          <Text style={styles.headerText}>Dashboard</Text>
          <Text style={styles.headerSubtext}>Overview & Statistics</Text>
        </LinearGradient>

        {/* Counts Section */}
        <View style={styles.grid}>
          {Object.entries(counts).map(([key, value], index) => (
            <TouchableOpacity key={index} style={styles.card} activeOpacity={0.8}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={
                    key === "CENTERS"
                      ? "business"
                      : key === "STUDENTS"
                      ? "school"
                      : key === "COURSES"
                      ? "book"
                      : key === "NOTICE"
                      ? "notifications"
                      : "analytics"
                  }
                  size={28}
                  color="#234785"
                />
              </View>
              <Text style={styles.cardValue}>{value}</Text>
              <Text style={styles.cardLabel}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Totals */}
        <Text style={styles.sectionTitle}>Overall Totals</Text>
        <View style={styles.totalBox}>
          {Object.entries(totals).map(([key, value], index) => (
            <View style={styles.totalRow} key={index}>
              <View style={styles.totalLabelContainer}>
                <View
                  style={[
                    styles.totalDot,
                    {
                      backgroundColor:
                        key === "PENDING"
                          ? "#F59E0B"
                          : key === "VERIFIED"
                          ? "#10B981"
                          : key === "DISPATCHED"
                          ? "#3B82F6"
                          : "#234785",
                    },
                  ]}
                />
                <Text style={styles.totalLabel}>{key}</Text>
              </View>
              <Text
                style={[
                  styles.totalValue,
                  {
                    color:
                      key === "PENDING"
                        ? "#F59E0B"
                        : key === "VERIFIED"
                        ? "#10B981"
                        : key === "DISPATCHED"
                        ? "#3B82F6"
                        : "#234785",
                  },
                ]}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>

        {/* Center Strength */}
        <Text style={styles.sectionTitle}>Center Strength</Text>
        {strength.map((item, idx) => (
          <View key={item.center_id} style={styles.centerCard}>
            <View style={styles.centerHeader}>
              <View style={styles.centerIconContainer}>
                <Ionicons name="business" size={20} color="#234785" />
              </View>
              <View style={styles.centerInfo}>
                <Text style={styles.centerName}>{item.center_name}</Text>
                <Text style={styles.centerCode}>Code: {item.center_code}</Text>
              </View>
            </View>
            <View style={styles.centerRow}>
              <View style={styles.statusBadge}>
                <Ionicons name="time" size={14} color="#F59E0B" />
                <Text style={styles.statusTextPending}>{item.PENDING}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.statusTextVerified}>{item.VERIFIED}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name="paper-plane" size={14} color="#3B82F6" />
                <Text style={styles.statusTextDispatched}>
                  {item.DISPATCHED}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#234785",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#234785",
    fontWeight: "600",
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: "row",
    backgroundColor: "#ffeb44",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#234785",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryBtnText: {
    color: "#234785",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
  },
  header: {
    padding: 20,
    paddingTop: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffeb44",
    textAlign: "center",
  },
  headerSubtext: {
    fontSize: 14,
    color: "rgba(255, 235, 68, 0.8)",
    textAlign: "center",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 235, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#234785",
    marginVertical: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    color: "#234785",
  },
  totalBox: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#234785",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  totalLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  totalLabel: { fontSize: 14, color: "#374151", fontWeight: "500" },
  totalValue: { fontSize: 16, fontWeight: "bold" },
  centerCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  centerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  centerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 235, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#234785",
  },
  centerCode: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  centerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusTextPending: {
    color: "#F59E0B",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  statusTextVerified: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  statusTextDispatched: {
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  bottomPadding: {
    height: 20,
  },
});
