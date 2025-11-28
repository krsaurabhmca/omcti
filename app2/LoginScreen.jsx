import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const AttractiveLoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState('');

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const usernameScale = useRef(new Animated.Value(1)).current;
  const passwordScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  
  // Floating elements
  const floatingElements = useRef([...Array(8)].map(() => ({
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(0.3),
    scale: new Animated.Value(1),
  }))).current;

  useEffect(() => {
    startInitialAnimations();
    startFloatingAnimations();
   // startShimmerAnimation();
  }, []);

  const startInitialAnimations = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation
    Animated.loop(
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const startFloatingAnimations = () => {
    floatingElements.forEach((element, index) => {
      const delay = index * 800;
      
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(element.translateY, {
              toValue: -30,
              duration: 3000 + Math.random() * 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(element.scale, {
              toValue: 0.8,
              duration: 3000 + Math.random() * 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(element.translateY, {
              toValue: 0,
              duration: 3000 + Math.random() * 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(element.scale, {
              toValue: 1,
              duration: 3000 + Math.random() * 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  };

  const startShimmerAnimation = () => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2000,
        easing: Easing.circle,
        useNativeDriver: true,
      })
    ).start();
  };

  const handleInputFocus = (inputName) => {
    setFocusedInput(inputName);
    const scaleAnim = inputName === 'username' ? usernameScale : passwordScale;
    
    Animated.spring(scaleAnim, {
      toValue: 1.05,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handleInputBlur = (inputName) => {
    setFocusedInput('');
    const scaleAnim = inputName === 'username' ? usernameScale : passwordScale;
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    handleLogin();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Authentication Required', 'Please enter both username and password to continue.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://omcti.in/apprise/api.php?task=verify_login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: username.trim(),
          user_pass: password,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        await AsyncStorage.setItem('userData', JSON.stringify(result));
        await AsyncStorage.setItem('userType', result.user_type);
        await AsyncStorage.setItem('userId', result.id.toString());
       
        if (result.user_type === 'ADMIN') {
          router.replace('AdminDashboard', { userData: result });
        } else if (result.user_type === 'CLIENT') {
          await AsyncStorage.setItem('centerId', result.data[0].center_id.toString()||0);

          router.replace({
            pathname: 'ClientDashboard',
            params: {
              userData: result,
              centerId: result.data[0].center_id,
            },
          });
        } else if (result.user_type === 'STUDENT') {
          router.replace('StudentDashboard', { userData: result });
        }
      } else {
        Alert.alert('Authentication Failed', 'The credentials you entered are invalid. Please verify your username and password and try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />
      
      <LinearGradient
        colors={['#234785', '#1a5a9e', '#2d7ab8', '#4a9ad1']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating Background Elements */}
        {floatingElements.map((element, index) => {
          const icons = ['diamond-outline', 'star-outline', 'heart-outline', 'flash-outline', 'leaf-outline', 'flame-outline', 'water-outline', 'sunny-outline'];
          return (
            <Animated.View
              key={index}
              style={[
                styles.floatingElement,
                {
                  left: (width / 8) * index,
                  top: (height / 10) * (index % 4) + 100,
                  transform: [
                    { translateY: element.translateY },
                    { scale: element.scale },
                  ],
                  opacity: element.opacity,
                },
              ]}
            >
              <Ionicons 
                name={icons[index]} 
                size={20 + (index % 3) * 5} 
                color="rgba(255, 235, 68, 0.3)" 
              />
            </Animated.View>
          );
        })}

        {/* Shimmer Effect */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <Animated.View
                style={[
                  styles.logoContainer,
                  { 
                    
                  }
                ]}
              >
                
                  <LinearGradient
                    colors={['#234785', '#1a5a9e']}
                    style={styles.logoInner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                     <Image
                              source={require('./assets/logo.png')}
                              style={styles.logoInner}
                            />
                            
                  </LinearGradient>
              
              </Animated.View>
              
              <View style={styles.titleContainer}>
                <Text style={styles.title}>OMCTI</Text>
                <View style={styles.subtitleContainer}>
                  <Ionicons name="star" size={16} color="#ffeb44" />
                  <Text style={styles.subtitle}>Computer Training Institute</Text>
                  <Ionicons name="star" size={16} color="#ffeb44" />
                </View>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                style={styles.formGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Username Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <Ionicons name="person" size={14} color="#234785" /> Username
                  </Text>
                  <Animated.View 
                    style={[
                      styles.inputContainer,
                      { transform: [{ scale: usernameScale }] }
                    ]}
                  >
                    <LinearGradient
                      colors={focusedInput === 'username' ? ['#234785', '#1a5a9e'] : ['#f8fafc', '#ffffff']}
                      style={[styles.inputWrapper, focusedInput === 'username' && styles.inputWrapperFocused]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={styles.inputContent}>
                        <Ionicons 
                          name="person-circle-outline" 
                          size={22} 
                          color={focusedInput === 'username' ? '#ffeb44' : '#234785'} 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, focusedInput === 'username' && styles.inputFocused]}
                          placeholder="Enter your username"
                          placeholderTextColor={focusedInput === 'username' ? 'rgba(255, 255, 255, 0.7)' : '#9ca3af'}
                          value={username}
                          onChangeText={setUsername}
                          onFocus={() => handleInputFocus('username')}
                          onBlur={() => handleInputBlur('username')}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                        />
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <Ionicons name="lock-closed" size={14} color="#234785" /> Password
                  </Text>
                  <Animated.View 
                    style={[
                      styles.inputContainer,
                      { transform: [{ scale: passwordScale }] }
                    ]}
                  >
                    <LinearGradient
                      colors={focusedInput === 'password' ? ['#234785', '#1a5a9e'] : ['#f8fafc', '#ffffff']}
                      style={[styles.inputWrapper, focusedInput === 'password' && styles.inputWrapperFocused]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={styles.inputContent}>
                        <Ionicons 
                          name="shield-checkmark-outline" 
                          size={22} 
                          color={focusedInput === 'password' ? '#ffeb44' : '#234785'} 
                          style={styles.inputIcon} 
                        />
                        <TextInput
                          style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
                          placeholder="Enter your password"
                          placeholderTextColor={focusedInput === 'password' ? 'rgba(255, 255, 255, 0.7)' : '#9ca3af'}
                          value={password}
                          onChangeText={setPassword}
                          onFocus={() => handleInputFocus('password')}
                          onBlur={() => handleInputBlur('password')}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                        >
                          <Ionicons
                            name={showPassword ? 'eye' : 'eye-off'}
                            size={20}
                            color={focusedInput === 'password' ? '#ffeb44' : '#234785'}
                          />
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </View>

                {/* Login Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleButtonPress}
                    disabled={isLoading}
                    accessibilityLabel="Sign in to your account"
                  >
                    <LinearGradient
                      colors={['#ffeb44', '#ffd700', '#ffb300']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#234785" />
                          <Text style={styles.loadingText}>Signing you in...</Text>
                        </View>
                      ) : (
                        <View style={styles.buttonContent}>
                          <Ionicons name="rocket" size={20} color="#234785" />
                          <Text style={styles.loginButtonText}>Launch into Learning</Text>
                          <Ionicons name="arrow-forward-circle" size={20} color="#234785" />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Additional Options */}
                {/* <View style={styles.optionsContainer}>
                  <TouchableOpacity style={styles.forgotPassword}>
                    <Ionicons name="help-circle-outline" size={16} color="#234785" />
                    <Text style={styles.forgotPasswordText}>Need help with your password?</Text>
                  </TouchableOpacity>
                </View> */}

            
              </LinearGradient>
            </View>

            {/* Security Notice */}
            {/* <View style={styles.securityNotice}>
              <LinearGradient
                colors={['rgba(35, 71, 133, 0.3)', 'rgba(26, 90, 158, 0.3)']}
                style={styles.securityGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="shield-checkmark" size={18} color="#ffeb44" />
                <Text style={styles.securityText}>🔒 Bank-level security • SSL encrypted</Text>
                <Ionicons name="checkmark-circle" size={18} color="#ffeb44" />
              </LinearGradient>
            </View> */}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>© 2022-25 OMCTI • Made with ❤️ for learners</Text>
             
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  floatingElement: {
    position: 'absolute',
    zIndex: 1,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 235, 68, 0.1)',
    transform: [{ skewX: '-20deg' }],
    width: 100,
    zIndex: 2,
  },
  keyboardAvoid: {
    flex: 1,
    zIndex: 3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 0,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    padding:25,
  },
  logoInner: {
    width: 110,
    height: 110,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffeb44',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    marginHorizontal: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  formContainer: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
  },
  formGradient: {
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 68, 0.3)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#234785',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  inputContainer: {
    // No additional styles needed, just for animation
  },
  inputWrapper: {
    borderRadius: 16,
    shadowColor: '#234785',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(35, 71, 133, 0.2)',
  },
  inputWrapperFocused: {
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderColor: 'rgba(255, 235, 68, 0.5)',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  inputFocused: {
    color: '#ffffff',
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
  loginButton: {
    borderRadius: 16,
    marginTop: 15,
    shadowColor: '#ffeb44',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
  buttonGradient: {
    borderRadius: 16,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#234785',
    fontSize: 17,
    fontWeight: '700',
    marginHorizontal: 10,
    letterSpacing: -0.3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#234785',
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '600',
  },
  optionsContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  forgotPasswordText: {
    color: '#234785',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  featuresContainer: {
    marginTop: 25,
    padding: 20,
    backgroundColor: 'rgba(35, 71, 133, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(35, 71, 133, 0.1)',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#234785',
    textAlign: 'center',
    marginBottom: 15,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#234785',
    marginLeft: 6,
  },
  securityNotice: {
    marginTop: 25,
    borderRadius: 12,
    overflow: 'hidden',
  },
  securityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  securityText: {
    color: '#ffeb44',
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 25,
  },
  footerText: {
    color: 'rgba(255, 235, 68, 0.9)',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    color: '#ffeb44',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    color: 'rgba(255, 235, 68, 0.6)',
    fontSize: 12,
    marginHorizontal: 10,
  },
});

export default AttractiveLoginScreen;