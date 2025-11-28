import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ClientDashboard = ({ navigation, route }) => {
const { centerId: paramCenterId } = useLocalSearchParams();
const [centerId, setCenterId] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await fetch('https://omcti.in/apprise/api.php?task=client_dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          center_id: centerId
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setDashboardData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard API Error:', err);
      setError(err.message);
      Alert.alert(
        'Error',
        'Failed to load dashboard data. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

const handleLogout = () => {
  Alert.alert(
    'Confirm Logout',
    'Are you sure you want to logout?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.clear(); 
            router.replace('/LoginScreen'); 
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ],
    { cancelable: true }
  );
};

  useEffect(() => {
  const resolveCenterId = async () => {
    try {
      if (paramCenterId) {
        setCenterId(paramCenterId.toString());
        await AsyncStorage.setItem('centerId', paramCenterId.toString());
      } else {
        const storedId = await AsyncStorage.getItem('centerId');
        if (storedId) {
          setCenterId(storedId);
        } else {
          Alert.alert(
            'Missing Center ID',
            'No center ID found in URL or storage. Please login again.',
            [{ text: 'OK', onPress: () => router.replace('/LoginScreen') }]
          );
        }
      }
    } catch (error) {
      console.error('Error resolving centerId:', error);
      Alert.alert('Error', 'Unable to resolve center ID.');
    }
  };

  resolveCenterId();
}, [paramCenterId]);

useEffect(() => {
  if (centerId) {
    fetchDashboardData();
  }
}, [centerId]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [centerId]);
  
  const menuItems = [
    {
      id: 1,
      title: 'Search Student',
      icon: 'search',
      iconType: 'Ionicons',
      color: '#234785',
      gradient: ['#234785', '#1a3666'],
    },
    {
      id: 2,
      title: 'Student Admission',
      icon: 'person-add',
      iconType: 'Ionicons',
      color: '#ffeb44',
      gradient: ['#ffeb44', '#ffd700'],
    },
    {
      id: 3,
      title: 'Wallet Statement',
      icon: 'wallet',
      iconType: 'Ionicons',
      color: '#234785',
      gradient: ['#3a5fa0', '#234785'],
    },
    {
      id: 4,
      title: 'Income & Expenses',
      icon: 'trending-up',
      iconType: 'Ionicons',
      color: '#ffeb44',
      gradient: ['#ffd700', '#ffeb44'],
    },
    {
      id: 5,
      title: 'Pay Fee Student',
      icon: 'card',
      iconType: 'Ionicons',
      color: '#234785',
      gradient: ['#234785', '#ffeb44'],
    },
    {
      id: 6,
      title: 'Marks Entry',
      icon: 'create',
      iconType: 'Ionicons',
      color: '#234785',
      gradient: ['#4d7ac7', '#234785'],
    },
    {
      id: 7,
      title: 'Download Certificate',
      icon: 'download',
      iconType: 'Ionicons',
      color: '#ffeb44',
      gradient: ['#ffeb44', '#234785'],
    },
    {
      id: 8,
      title: 'Recharge Request',
      icon: 'add-circle',
      iconType: 'Ionicons',
      color: '#234785',
      gradient: ['#1a3666', '#234785'],
    },
    {
      id: 9,
      title: 'Transactions',
      icon: 'cash-outline',
      iconType: 'Ionicons',
      color: '#ffeb44',
      gradient: ['#5b8dd8', '#ffeb44'],
    },
  ];

  const getIcon = (iconName, iconType, size = 24, color = '#fff') => {
    switch (iconType) {
      case 'Ionicons':
        return <Ionicons name={iconName} size={size} color={color} />;
      case 'MaterialIcons':
        return <MaterialIcons name={iconName} size={size} color={color} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} size={size} color={color} />;
      default:
        return <Ionicons name={iconName} size={size} color={color} />;
    }
  };

  const StatCard = ({ title, value, icon, gradient }) => (
    <LinearGradient colors={gradient} style={styles.statCard}>
      <View style={styles.iconTitleRow}>
        <View style={styles.statIcon}>
          <Ionicons name={icon} size={18} color="#fff" />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </LinearGradient>
  );

  const MenuItem = ({ item, onPress }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <LinearGradient colors={item.gradient} style={styles.menuIconContainer}>
        {getIcon(item.icon, item.iconType, 28, '#fff')}
      </LinearGradient>
      <Text style={styles.menuTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const handleMenuPress = (item) => {
    console.log(`Pressed: ${item.title}`);
    switch (item.id) {
      case 1:
        router.push({
          pathname: 'CenterStudentScreen',
          params: { center_id: centerId },
        });
        break;
      case 2:
        router.push({
          pathname: 'AddStudentScreen',
          params: { center_id: centerId },
        });
        break;
      case 3:
        router.push({
          pathname: 'WalletStatementScreen',
          params: { center_id: centerId },
        });
        break;
      case 4:
        router.push({
          pathname: 'AccountScreen',
          params: { center_id: centerId },
        });
        break;
      case 5:
        router.push({
          pathname: 'PaymentStudentScreen',
          params: { center_id: centerId },
        });
        break;
      case 6:
        router.push({
          pathname: 'StudentsScreen',
          params: { center_id: centerId },
        });
        break;
      case 7:
        router.push({
          pathname: 'DispatchStudentScreen',
          params: { center_id: centerId },
        });
        break;
      case 8:
        router.push({
          pathname: 'PaymentDetailsScreen',
          params: { center_id: centerId },
        });
        break;
      case 9:
        router.push({
          pathname: 'ViewTransactionScreen',
          params: { center_id: centerId },
        });
        break;
      default:
        console.log('Unknown menu item');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient colors={["#234785", "#1a3666"]} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.centerName}>Loading...</Text>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234785" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient colors={["#234785", "#1a3666"]} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.centerName}>Dashboard</Text>
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#234785" />
          <Text style={styles.errorText}>Failed to load dashboard</Text>
          <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const centerDetails = dashboardData.center_details?.[0];
  const totalStudents = dashboardData.total_student?.reduce((sum, item) => sum + parseInt(item.total || 0), 0) || 0;

  if (!centerDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient colors={["#234785", "#1a3666"]} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.centerName}>Dashboard</Text>
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="information-circle" size={48} color="#234785" />
          <Text style={styles.errorText}>No center data found</Text>
          <Text style={styles.errorSubtext}>Please contact support if this issue persists</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />
      
      {/* Header */}
      <LinearGradient colors={["#234785", "#1a3666"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.centerInfo}>
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Ionicons name="business" size={24} color="#ffeb44" />
              </View>
            </View>
            <View style={styles.centerDetails}>
              <Text style={styles.centerName}>{centerDetails.center_name}</Text>
              <Text style={styles.centerDirector}>Dir: {centerDetails.center_director}</Text>
              <Text style={styles.centerLocation}>
                <Ionicons name="location" size={12} color="#ffeb44" />
                {centerDetails.center_address}
              </Text>
            </View>
          </View>
          
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <Text style={styles.walletAmount}>₹{centerDetails.center_wallet || '0.00'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#234785']}
            tintColor="#234785"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Students"
            value={totalStudents.toString()}
            icon="people"
            gradient={['#234785', '#1a3666']}
          />

          <StatCard
            title="Pending"
            value={dashboardData.total_student?.find(s => s.status === 'PENDING')?.total || '0'}
            icon="clock"
            gradient={['#F59E0B', '#D97706']}
          />

          <StatCard
            title="Verified"
            value={dashboardData.total_student?.find(s => s.status === 'VERIFIED')?.total || '0'}
            icon="checkmark-circle"
            gradient={['#10B981', '#059669']}
          />

          <StatCard
            title="Result Updated"
            value={dashboardData.total_student?.find(s => s.status === 'RESULT UPDATED')?.total || '0'}
            icon="refresh-circle"
            gradient={['#3a5fa0', '#234785']}
          />

          <StatCard
            title="Results Out"
            value={dashboardData.total_student?.find(s => s.status === 'RESULT OUT')?.total || '0'}
            icon="document-text"
            gradient={['#4d7ac7', '#3a5fa0']}
          />

          <StatCard
            title="Dispatched"
            value={dashboardData.total_student?.find(s => s.status === 'DISPATCHED')?.total || '0'}
            icon="paper-plane"
            gradient={['#5b8dd8', '#4d7ac7']}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Manage your center operations</Text>
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <MenuItem key={item.id} item={item} onPress={handleMenuPress} />
          ))}
        </View>

        {/* Center Information */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Center Information</Text>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={16} color="#234785" />
            <Text style={styles.infoLabel}>Center Code:</Text>
            <Text style={styles.infoValue}>{centerDetails.center_code}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="call" size={16} color="#234785" />
            <Text style={styles.infoLabel}>Mobile:</Text>
            <Text style={styles.infoValue}>{centerDetails.center_mobile}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={16} color="#234785" />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{centerDetails.center_email}</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <LinearGradient
            colors={["#ffeb44", "#ffd700"]}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#234785" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    marginRight: 15,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffeb44',
  },
  centerDetails: {
    flex: 1,
  },
  centerName: {
    color: '#ffeb44',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  centerDirector: {
    color: 'rgba(255, 235, 68, 0.8)',
    fontSize: 12,
    marginBottom: 2,
  },
  centerLocation: {
    color: 'rgba(255, 235, 68, 0.8)',
    fontSize: 11,
  },
  walletInfo: {
    alignItems: 'flex-end',
  },
  walletLabel: {
    color: 'rgba(255, 235, 68, 0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  walletAmount: {
    color: '#ffeb44',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#234785',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#234785',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ffeb44',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#234785',
  },
  retryButtonText: {
    color: '#234785',
    fontSize: 16,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },

  statCard: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
  },

  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  statIcon: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  statTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },

  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#234785',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  menuItem: {
    width: (width - 60) / 3,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  menuIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#234785',
    textAlign: 'center',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#234785',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#234785',
  },
  logoutButton: {
    alignSelf: 'center',
    width: '60%',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
  },

  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#234785',
  },

  logoutText: {
    color: '#234785',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '700',
  },

  bottomPadding: {
    height: 10,
  },
});

export default ClientDashboard;