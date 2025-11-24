import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "react-native-web";

const AttendanceScreen = ({ navigation, route }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [holidayData, setHolidayData] = useState([]);
  const [holidayCount, setHolidayCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [statistics, setStatistics] = useState({
    present: 0,
    absent: 0,
    holiday: 0,
    total: 0,
    percentage: 0,
  });

  const { studentId } = useLocalSearchParams();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthKeys = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  // Fetch holiday data for the selected month
  const fetchHolidayData = async (month) => {
    try {
      const year = month.getFullYear();
      const monthNumber = String(month.getMonth() + 1).padStart(2, '0');
      
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=get_holidays",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            center_id: "273",
            month: monthNumber,
            year: year.toString()
          }),
        }
      );

      const data = await response.json();
      if (data && data.status === "success" && Array.isArray(data.data)) {
        setHolidayCount(data.count);
        setHolidayData(data.data);
      } else {
        setHolidayData([]);
        console.log("No holiday data found for this month");
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setHolidayData([]);
    }
  };

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ student_id: studentId }),          
          // body: JSON.stringify({ student_id: 48936 }),
        }
      );

      const data = await response.json();
      if (data && Array.isArray(data)) {
        setAttendanceData(data);
        calculateStatistics(data, selectedMonth);
      } else {
        Alert.alert("Error", "No attendance data found");
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      //Alert.alert("Error", "Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  // Check if a specific day is a holiday
  const isHoliday = (day) => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;
    const dayString = String(day).padStart(2, '0');
    const monthString = String(month).padStart(2, '0');
    const dateString = `${year}-${monthString}-${dayString}`;
    
    return holidayData.some(holiday => holiday.date === dateString);
  };

  // Get holiday title for a specific day
  const getHolidayTitle = (day) => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;
    const dayString = String(day).padStart(2, '0');
    const monthString = String(month).padStart(2, '0');
    const dateString = `${year}-${monthString}-${dayString}`;
    
    const holiday = holidayData.find(holiday => holiday.date === dateString);
    return holiday ? holiday.title : null;
  };

  // Calculate statistics for selected month
  const calculateStatistics = (data, month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const monthKey = `${monthKeys[monthIndex]}_${year}`;

    const monthData = data.find((item) => item.att_month === monthKey);

    if (!monthData) {
      setStatistics({
        present: 0,
        absent: 0,
        holiday: 0,
        total: 0,
        percentage: 0,
      });
      return;
    }

    let present = 0;
    let sunday = 0;
    let absent = 0;
    let holiday = 0;
    let total = 0;

    // Count attendance for each day
    for (let i = 1; i <= 31; i++) {
      const dayKey = `d_${i}`;
      const dayValue = monthData[dayKey];

      if (dayValue !== null && dayValue !== undefined) {
        total++;
        switch (dayValue) {
          case "P":
            present++;
            break;
          case "A":
            absent++;
            break;
          case "S":
            sunday++;
            break;
          case "H":
            holiday++;
            break;
          default:
            if (dayValue) present++;
            break;
        }
      }
    }

    const percentage =
      total > 0 ? parseInt((present / total) * 100).toFixed(1) : 0;

    setStatistics({
      present,
      absent,
      holiday,
      total,
      sunday,
      percentage: parseFloat(percentage),
    });
  };

  // Get calendar days for selected month
  const getCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Get attendance status for a specific day
  const getAttendanceStatus = (day) => {
    if (!day) return null;

    const year = selectedMonth.getFullYear();
    const monthIndex = selectedMonth.getMonth();
    const monthKey = `${monthKeys[monthIndex]}_${year}`;

    const monthData = attendanceData.find(
      (item) => item.att_month === monthKey
    );

    if (!monthData) return null;

    const dayKey = `d_${day}`;
    const attendanceStatus = monthData[dayKey];
    
    // If there's no attendance data but it's a holiday, return 'H'
    if ((attendanceStatus === null || attendanceStatus === undefined) && isHoliday(day)) {
      return 'H';
    }
    
    return attendanceStatus;
  };

  // Get color for attendance status
  const getStatusColor = (status) => {
    switch (status) {
      case "P":
        return "#4CAF50"; // Green for present
      case "A":
        return "#f44336"; // Red for absent
      case "S":
        return "#234785"; // Blue for Sunday
      case "H":
        return "#FF9800"; // Orange for holiday
      case null:
      case undefined:
        return "#E0E0E0"; // Gray for no data
      default:
        return "#4CAF50"; // Default to present
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "P":
        return "P";
      case "A":
        return "A";
      case "H":
        return "H";
      case "S":
        return "S";
      default:
        return "";
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = async () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(selectedMonth.getMonth() - 1);
    setSelectedMonth(newMonth);
    calculateStatistics(attendanceData, newMonth);
    await fetchHolidayData(newMonth);
  };

  // Navigate to next month
  const goToNextMonth = async () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(selectedMonth.getMonth() + 1);
    setSelectedMonth(newMonth);
    calculateStatistics(attendanceData, newMonth);
    await fetchHolidayData(newMonth);
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchAttendanceData();
      await fetchHolidayData(selectedMonth);
    };
    
    initializeData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const calendarDays = getCalendarDays();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <StatusBar backgroundColor="#234785" barStyle="light-content" />
      {/* Header Bar */}
      <LinearGradient
        colors={["#234785", "#1a3666"]}
        style={styles.footerButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendance</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>
      <ScrollView style={styles.content}>
        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            onPress={goToPreviousMonth}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={24} color="#234785" />
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </Text>

          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#234785" />
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        <View style={styles.statisticsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{holidayCount}</Text>
            <Text style={styles.statLabel}>Holiday</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.percentage}%</Text>
            <Text style={styles.statLabel}>Att %</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendar}>
          {/* Week days header */}
          <View style={styles.weekHeader}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar days */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const status = getAttendanceStatus(day);
              const statusColor = getStatusColor(status);
              const statusText = getStatusText(status);
              const holidayTitle = getHolidayTitle(day);

              return (
                <View key={index} style={styles.dayContainer}>
                  {day && (
                    <View
                      style={[styles.dayCell, { backgroundColor: statusColor }]}
                      title={holidayTitle} // Tooltip for holiday title
                    >
                      <Text style={styles.dayNumber}>{day}</Text>
                      {statusText && (
                        <Text style={styles.statusText}>{statusText}</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#4CAF50" }]}
              />
              <Text style={styles.legendText}>Present (P)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#f44336" }]}
              />
              <Text style={styles.legendText}>Absent (A)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#FF9800" }]}
              />
              <Text style={styles.legendText}>Holiday (H)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#234785" }]}
              />
              <Text style={styles.legendText}>Sunday (S)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#E0E0E0" }]}
              />
              <Text style={styles.legendText}>No Data</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingTop: 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffeb44",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#234785",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  navButton: {
    padding: 8,
    backgroundColor: "#ffeb44",
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#234785",
  },
  statisticsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#234785",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#234785",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontWeight: "600",
  },
  calendar: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#234785",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#ffeb44",
    borderRadius: 8,
    padding: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: "#234785",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayContainer: {
    width: "14.28%", // 100% / 7 days
    aspectRatio: 1,
    padding: 2,
  },
  dayCell: {
    flex: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  statusText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
    position: "absolute",
    bottom: 2,
  },
  legend: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#234785",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#234785",
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "48%",
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  legendText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});

export default AttendanceScreen;