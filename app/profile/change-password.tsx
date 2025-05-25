// import React, { useState } from 'react';
// import {
//   View,
//   StyleSheet,
//   SafeAreaView,
//   Text,
//   Keyboard,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Alert,
// } from 'react-native';
// import Textfield from '@/component/Textfield';
// import Button from '@/component/Button';
// import { useRouter } from 'expo-router';
// import { theme } from '@/app/theme';
// import { MaterialIcons } from '@expo/vector-icons';
// import { authApi } from '@/services/api';
// import { useAuth } from '@/context/AuthContext';

// const ForgotPassword = () => {
//   const [email, setEmail] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [emailSent, setEmailSent] = useState(false);
//   const [error, setError] = useState<string | undefined>(undefined);
//   const router = useRouter();
//   const { logout } = useAuth();

//   const validateEmail = (email: string) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!email) return 'Harap masukkan email';
//     if (!emailRegex.test(email)) return 'Format email salah';
//     return undefined;
//   };

//   const handleSendLink = async () => {
//     Keyboard.dismiss();

//     const emailError = validateEmail(email);
//     setError(emailError);

//     if (emailError) {
//       return;
//     }

//     setIsLoading(true);
//     try {
//       // Call the API for sending reset link
//       const response = await authApi.forgotPassword(email);
      
//       if (response.code === 200) {
//         setEmailSent(true);
//       } else {
//         // Show error message from API or default error
//         Alert.alert(
//           'Error',
//           response.error?.toString() || 'Gagal mengirim link reset kata sandi. Silakan coba lagi.'
//         );
//       }
//     } catch (error) {
//       console.error('Forgot password error:', error);
//       Alert.alert(
//         'Error',
//         'Gagal mengirim link reset kata sandi. Silakan coba lagi.'
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleBackToLogin = async () => {
//     try {
//       await logout();
//       router.replace('/login');
//     } catch (error) {
//       console.error('Error logging out:', error);
//       Alert.alert('Error', 'Failed to logout. Please try again.');
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardAvoid}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           keyboardShouldPersistTaps="handled"
//         >
//           <View style={styles.content}>
//             {!emailSent ? (
//               <>
//                 <View style={styles.headerContainer}>
//                   <MaterialIcons name="lock-reset" size={120} color={theme.colors.customGreen[300]} />
//                   <Text style={[styles.subheader, theme.typography.body1]}>
//                     Mohon masukkan email yang terdaftar pada akun Anda. Kami akan mengirimkan link untuk reset kata sandi.
//                   </Text>
//                 </View>

//                 <View style={styles.formContainer}>
//                   <Textfield
//                     label="E-mail"
//                     example="example@gmail.com"
//                     value={email}
//                     onChangeText={(text) => {
//                       setEmail(text);
//                       setError(undefined);
//                     }}
//                     error={error}
//                     validate={validateEmail}
//                     keyboardType="email-address"
//                     autoCapitalize="none"
//                     autoComplete="email"
//                   />
//                 </View>

//                 <View style={styles.buttonContainer}>
//                   <Button
//                     title={isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
//                     variant="primary"
//                     onPress={handleSendLink}
//                     disabled={isLoading}
//                   />
//                 </View>
//               </>
//             ) : (
//               <>
//                 <View style={styles.successContainer}>
//                     <MaterialIcons name="mark-email-read" size={120} color={theme.colors.customGreen[300]} />
//                     <Text style={[styles.successHeader, theme.typography.title]}>Email Terkirim!</Text>
//                     <Text style={[styles.successMessage, theme.typography.body1]}>
//                     Link reset kata sandi telah dikirim ke alamat email Anda. Silakan cek inbox atau folder spam Anda.
//                     </Text>
//                 </View>
//                 <View style={styles.buttonContainer}>
//                 <Button
//                     title="Kembali ke Login"
//                     variant="primary"
//                     onPress={handleBackToLogin}
//                 />
//                 </View>
//               </>
//             )}
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.customWhite[50],
//   },
//   keyboardAvoid: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//   },
//   content: {
//     flex: 1,
//     paddingTop: 24,
//     paddingHorizontal: 24,
//   },
//   headerContainer: {
//     marginBottom: 24,
//     alignItems: 'center',
//   },
//   header: {
//     color: theme.colors.customGreen[300],
//     marginTop: 8,
//     marginBottom: 16,
//     textAlign: 'center',
//   },
//   subheader: {
//     color: theme.colors.customOlive[50],
//     textAlign: 'center',
//   },
//   formContainer: {
//     marginBottom: 32,
//   },
//   buttonContainer: {
//     marginTop: 'auto',
//     marginBottom: 24,
//   },
//   successContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 16,
//   },
//   successHeader: {
//     color: theme.colors.customGreen[300],
//     marginTop: 8,
//     marginBottom: 16,
//     textAlign: 'center',
//   },
//   successMessage: {
//     color: theme.colors.customOlive[50],
//     textAlign: 'center',
//     marginBottom: 32,
//   },
// });

// export default ForgotPassword;

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '@/app/theme';

export default function Temp() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Home Screen</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.customWhite[50],
  },
  content: {
    flex: 1,
    padding: 24,
  },
  text: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: theme.colors.customOlive[50],
  },
});