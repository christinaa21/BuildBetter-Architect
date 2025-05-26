import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Textfield from '@/components/Textfield';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';
import { theme } from '@/app/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { authApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const router = useRouter();
  const { logout } = useAuth();

  const validateCurrentPassword = (password: string) => {
    if (!password) return 'Harap masukkan kata sandi saat ini';
    if (password.length < 6) return 'Kata sandi minimal 6 karakter';
    return undefined;
  };

  const validateNewPassword = (password: string) => {
    if (!password) return 'Harap masukkan kata sandi baru';
    if (password.length < 6) return 'Kata sandi minimal 6 karakter';
    if (password === currentPassword) return 'Kata sandi baru harus berbeda dari kata sandi saat ini';
    return undefined;
  };

  const validateConfirmPassword = (password: string) => {
    if (!password) return 'Harap konfirmasi kata sandi baru';
    if (password !== newPassword) return 'Konfirmasi kata sandi tidak cocok';
    return undefined;
  };

  const handleChangePassword = async () => {
    Keyboard.dismiss();

    // Validate all fields
    const currentPasswordError = validateCurrentPassword(currentPassword);
    const newPasswordError = validateNewPassword(newPassword);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);

    setErrors({
      currentPassword: currentPasswordError,
      newPassword: newPasswordError,
      confirmPassword: confirmPasswordError,
    });

    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      return;
    }

    setIsLoading(true);
    try {
      // Call the API for changing password
      const response = await authApi.changePassword({
        oldPassword: currentPassword,
        newPassword: newPassword,
        confirmNewPassword: confirmPassword,
      });
      
      if (response.code === 200) {
        setPasswordChanged(true);
      } else {
        // Handle different error cases
        let errorMessage = 'Gagal mengubah kata sandi. Silakan coba lagi.';
        
        if (response.error === 'Invalid old password') {
          errorMessage = 'Kata sandi saat ini salah. Silakan periksa kembali.';
        } else if (response.error === 'New password and confirm password do not match') {
          errorMessage = 'Kata sandi baru dan konfirmasi kata sandi tidak cocok.';
        } else if (response.code === 403) {
          errorMessage = 'Anda tidak memiliki izin untuk mengakses fitur ini.';
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert(
        'Error',
        'Gagal mengubah kata sandi. Silakan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
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
            {!passwordChanged ? (
              <>
                <View style={styles.headerContainer}>
                  <MaterialIcons name="lock-reset" size={120} color={theme.colors.customGreen[300]} />
                  <Text style={[styles.subheader, theme.typography.body1]}>
                    Harap masukkan kata sandi saat ini dan kata sandi baru yang Anda inginkan.
                  </Text>
                </View>

                <View style={styles.formContainer}>
                  <Textfield
                    label="Kata sandi saat ini"
                    example="Masukkan kata sandi saat ini"
                    value={currentPassword}
                    onChangeText={(text) => {
                      setCurrentPassword(text);
                      setErrors(prev => ({ ...prev, currentPassword: undefined }));
                    }}
                    error={errors.currentPassword}
                    validate={validateCurrentPassword}
                    isPassword
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                  
                  <Textfield
                    label="Kata sandi baru"
                    example="Masukkan kata sandi baru"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      setErrors(prev => ({ ...prev, newPassword: undefined }));
                    }}
                    error={errors.newPassword}
                    validate={validateNewPassword}
                    isPassword
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                  
                  <Textfield
                    label="Konfirmasi kata sandi baru"
                    example="Masukkan ulang kata sandi baru"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }}
                    error={errors.confirmPassword}
                    validate={validateConfirmPassword}
                    isPassword
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <Button
                    title={isLoading ? 'Mengubah...' : 'Ubah Kata Sandi'}
                    variant="primary"
                    onPress={handleChangePassword}
                    disabled={isLoading}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.successContainer}>
                  <MaterialIcons name="check-circle" size={120} color={theme.colors.customGreen[300]} />
                  <Text style={[styles.successHeader, theme.typography.title]}>Kata Sandi Berhasil Diubah!</Text>
                  <Text style={[styles.successMessage, theme.typography.body1]}>
                    Kata sandi Anda telah berhasil diubah. Silakan login kembali dengan kata sandi baru Anda.
                  </Text>
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    title="Login Kembali"
                    variant="primary"
                    onPress={handleBackToLogin}
                  />
                </View>
              </>
            )}
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
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  header: {
    color: theme.colors.customGreen[300],
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  subheader: {
    color: theme.colors.customOlive[50],
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 32,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 72,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  successHeader: {
    color: theme.colors.customGreen[300],
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    color: theme.colors.customOlive[50],
    textAlign: 'center',
    marginBottom: 32,
  },
});

export default ChangePassword;