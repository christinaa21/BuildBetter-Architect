import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  BackHandler
} from 'react-native';
import Textfield from '@/components/Textfield';
import { Link, useRouter } from 'expo-router';
import Button from '@/components/Button';
import { theme } from './theme';
import { useAuth } from '@/context/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

interface ValidationState {
  email: boolean;
  password: boolean;
}

const Login = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState<ValidationState>({
    email: false,
    password: false,
  });

  const buttonAnimation = new Animated.Value(0);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Prevent going back to login page if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/temp');
    }
  }, [isAuthenticated]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isAuthenticated) {
        return true; // Prevent going back
      }
      return false; // Allow default behavior
    });

    return () => backHandler.remove();
  }, [isAuthenticated]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Harap masukkan email';
    if (!emailRegex.test(email)) return 'Format email salah';
    return undefined;
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Harap masukkan kata sandi';
    // Removed minimum 8-character validation
    return undefined;
  };

  const handleValidation = (field: keyof ValidationState, isFieldValid: boolean) => {
    setIsValid(prev => ({
      ...prev,
      [field]: isFieldValid,
    }));
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
  
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    setErrors({
      email: emailError,
      password: passwordError,
    });
  
    if (emailError || passwordError) {
      animateButton();
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(formData.email, formData.password);
      
      if (response.code === 200) {
        console.log('Login successful');
        router.replace('/temp');
      } else {
        // Handle specific error cases
        if (response.error === 'Architect not found') {
          Alert.alert('Gagal login', 'Akun arsitek belum terdaftar. Silakan hubungi admin BuildBetter.');
        } else if (response.error === 'Invalid password') {
          setErrors({
            password: 'Kata sandi salah',
          });
          // Error will persist until user changes password field
        } else {
          // Generic error handling
          Alert.alert('Gagal login', response.error || 'Terjadi kesalahan saat login');
        }
        animateButton();
      }
    } catch (error) {
      console.error('Login failed', error);
      Alert.alert(
        'Gagal Login',
        'Terjadi kesalahan saat menghubungi server. Silakan coba lagi nanti.'
      );
      animateButton();
    } finally {
      setIsLoading(false);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Image source={require('@/assets/images/adaptive-icon.png')} style={styles.logo}/>
            
            <View style={styles.inputContainer}>
              <Textfield
                label="E-mail"
                example="example@gmail.com"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, email: text }));
                  setErrors(prev => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                validate={validateEmail}
                onValidation={(isValid) => handleValidation('email', isValid)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Textfield
                label="Kata sandi"
                example='Password123!'
                value={formData.password}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, password: text }));
                  // Only clear password error when user changes the input
                  setErrors(prev => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                validate={validatePassword}
                onValidation={(isValid) => handleValidation('password', isValid)}
                isPassword
                autoComplete="password"
              />

              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                activeOpacity={0.7}
              >
                <Link style={[theme.typography.body2, styles.forgotPassword]} href='mailto:app.buildbetter@gmail.com'>Lupa kata sandi?</Link>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ translateX: buttonAnimation }] }}>
              <Button
                title={isLoading ? 'Loading...' : 'Login'}
                variant="primary"
                onPress={handleLogin}
                disabled={isLoading}
              />
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.customWhite[50],
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Dimensions.get('window').height * 0.1,
  },
  logo: {
    width: 180,
    height: 224,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  forgotPassword: {
    color: theme.colors.customGreen[200],
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  registerText: {
    color: theme.colors.customOlive[50],
  },
  registerLink: {
    color: theme.colors.customGreen[200],
    textDecorationLine: 'underline',
  },
});

export default Login;