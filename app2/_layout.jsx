import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack, usePathname } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";
import {
  ActivityIndicator,
  DefaultTheme,
  Provider as PaperProvider,
  Surface,
  Text,
} from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Custom theme for React Native Paper
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#667eea",
    secondary: "#764ba2",
    accent: "#f093fb",
    surface: "#ffffff",
    background: "#f5f6fa",
    text: "#2d3748",
    placeholder: "#a0aec0",
    backdrop: "rgba(0, 0, 0, 0.5)",
    error: "#e53e3e",
    success: "#38a169",
  },
  roundness: 12,
};

const LoadingScreen = () => (
  <Surface style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text variant="bodyLarge" style={styles.loadingText}>
      Loading...
    </Text>
  </Surface>
);

const _layout = () => {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState(null);
  const pathname = usePathname();

  const checkLogin = useCallback(async () => {
    try {
      setLoading(true);

      // Add a small delay to prevent rapid successive calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      const userId = await AsyncStorage.getItem("userId");
      const userType = await AsyncStorage.getItem("userType");

      console.log(
        "Auth Check - UserId:",
        userId,
        "UserType:",
        userType,
        "Current Path:",
        pathname
      );

      if (userId) {
        // User is logged in, determine dashboard route
        let targetRoute;
        if (userType === "ADMIN") {
          targetRoute = "/AdminDashboard";
        } else if (userType === "CLIENT") {
          targetRoute = "/ClientDashboard";
        } else {
          targetRoute = "/StudentDashboard";
        }

        // Only navigate if we're not already on the target route
        if (pathname !== targetRoute) {
          setInitialRoute(targetRoute);
          router.replace(targetRoute);
        } else {
          setInitialRoute(targetRoute);
        }
      } else {
        // User is not logged in
        if (pathname !== "/LoginScreen") {
          setInitialRoute("/LoginScreen");
          router.replace("/LoginScreen");
        } else {
          setInitialRoute("/LoginScreen");
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // On error, redirect to login only if not already there
      if (pathname !== "/LoginScreen") {
        setInitialRoute("/LoginScreen");
        router.replace("/LoginScreen");
      } else {
        setInitialRoute("/LoginScreen");
      }
    } finally {
      // Add a minimum loading time to prevent flashing
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [pathname]);

  useEffect(() => {
    // Only run auth check on app initialization or when pathname changes
    // Skip if we're already on the correct route
    if (loading || !initialRoute || pathname !== initialRoute) {
      checkLogin();
    }
  }, []); // Remove pathname dependency to prevent infinite loops

  // Handle route changes after initial load
  useEffect(() => {
    if (!loading && initialRoute) {
      // Only check auth again if user navigates to a protected route
      const protectedRoutes = [
        "/StudentDashboard",
        "/AdminDashboard",
        "/ClientDashboard",
      ];
      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isProtectedRoute && pathname !== initialRoute) {
        // User navigated to a different protected route, verify auth
        const verifyAuth = async () => {
          const userId = await AsyncStorage.getItem("userId");
          if (!userId) {
            router.replace("/LoginScreen");
          }
        };
        verifyAuth();
      }
    }
  }, [pathname, loading, initialRoute]);

  // Show loading screen during initial auth check
  if (loading) {
    return (
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar
              barStyle="light-content"
              backgroundColor={theme.colors.primary}
              translucent={false}
            />
            <LoadingScreen />
          </SafeAreaView>
        </SafeAreaProvider>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex:1 }} edges={['bottom']} >
          <StatusBar
            barStyle="light-content"
            backgroundColor={theme.colors.primary}
            translucent={false}
          />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: theme.colors.background,
                paddingTop: Platform.OS === "android" ? 0 : 0, // StatusBar height handled by SafeAreaView
                flex: 1,
                width: screenWidth,
                minHeight: screenHeight,
              },
              animation: "slide_from_right", // Smooth transitions
              gestureEnabled: true,
            }}
          >
            <Stack.Screen
              name="LoginScreen"
              options={{
                title: "Login",
                gestureEnabled: false, // Prevent swipe back from login
              }}
            />
            <Stack.Screen
              name="StudentDashboard"
              options={{
                title: "Student Dashboard",
              }}
            />
            <Stack.Screen
              name="AdminDashboard"
              options={{
                title: "Admin Dashboard",
              }}
            />
            <Stack.Screen
              name="ClientDashboard"
              options={{
                title: "Client Dashboard",
              }}
            />
            <Stack.Screen
              name="StudentProfileScreen"
              options={{
                title: "Profile",
                headerShown: false,
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "600",
                },
              }}
            />
            <Stack.Screen
              name="AttendanceScreen"
              options={{
                title: "Attendance",
                headerShown: false,
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "600",
                },
              }}
            />
            <Stack.Screen
              name="MarksheetScreen"
              options={{
                title: "Marksheet",
                headerShown: false,
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "600",
                },
              }}
            />
            <Stack.Screen
              name="PaymentHistoryScreen"
              options={{
                title: "Payment History",
                headerShown: false,
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "600",
                },
              }}
            />
            <Stack.Screen
              name="SubjectListScreen"
              options={{
                title: "Study Material",
                headerShown: false,
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "600",
                },
              }}
            />
            <Stack.Screen
              name="PracticeSet"
              options={{
                title: "Practice Sets",
                headerShown: false,
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "600",
                },
              }}
            />
            <Stack.Screen
              name="DownloadScreen"
              options={{
                title: "Downloads",
                headerShown: false,
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "600",
                },
              }}
            />
            <Stack.Screen
              name="HelpSupportScreen"
              options={{
                title: "Help & Support",
                headerShown: false,
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "600",
                },
              }}
            />
            
            <Stack.Screen
              name="AddStudentScreen"
              options={{
                title: "DownlAdd Studentoads",
                headerShown: false,
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "600",
                },
              }}
            />
          </Stack>
        </SafeAreaView>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

export default _layout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
    width: screenWidth,
    height: screenHeight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
    padding: 20,
    width: screenWidth,
    height: screenHeight,
  },
  loadingText: {
    marginTop: 16,
    color: "#2d3748",
    textAlign: "center",
    fontSize: screenWidth < 350 ? 14 : 16, // Responsive font size for small screens
  },
});
