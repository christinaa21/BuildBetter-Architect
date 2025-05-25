// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   ScrollView,
//   TouchableOpacity,
//   Image,
//   Alert,
//   ActivityIndicator,
//   Keyboard,
//   KeyboardAvoidingView,
//   Platform,
//   Modal,
//   Dimensions,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Feather } from '@expo/vector-icons';
// import { authApi, UpdateProfileData } from '@/services/api';
// import Textfield from '@/component/Textfield';
// import Button from '@/component/Button';
// import Dropdown from '@/component/Dropdown';
// import theme from '../theme';
// import locationData from '@/data/location.json';

// interface ProfileEditFormData {
//   phoneNumber: string;
//   email: string;
//   username: string;
//   province: string;
//   city: string;
//   photo: string;
// }

// interface ValidationState {
//   phoneNumber: boolean;
//   email: boolean;
//   username: boolean;
//   province: boolean;
//   city: boolean;
// }

// // Profile image options for selection
// const profileImages = [
//   { id: '1', source: require('@/assets/images/1.png') },
//   { id: '2', source: require('@/assets/images/2.png') },
//   { id: '3', source: require('@/assets/images/3.png') },
//   { id: '4', source: require('@/assets/images/4.png') },
//   { id: '5', source: require('@/assets/images/5.png') },
//   { id: '6', source: require('@/assets/images/6.png') },
//   { id: '7', source: require('@/assets/images/7.png') },
//   { id: '8', source: require('@/assets/images/8.png') },
//   { id: '9', source: require('@/assets/images/9.png') },
//   { id: '10', source: require('@/assets/images/10.png') },
//   { id: '11', source: require('@/assets/images/11.png') },
//   { id: 'blank-profile', source: require('@/assets/images/blank-profile.png') },
// ];

// // Helper function to get image source by ID
// const findImageSourceById = (id: string, defaultSource: any = require('@/assets/images/blank-profile.png')) => {
//   const selectedImage = profileImages.find(img => img.id === id);
//   return selectedImage ? selectedImage.source : defaultSource;
// };

// interface ProfileImagePickerModalProps {
//   visible: boolean;
//   onClose: () => void;
//   currentPhotoId: string;
//   onSelectPhoto: (photoId: string) => void;
// }

// const ProfileImagePickerModal: React.FC<ProfileImagePickerModalProps> = ({
//   visible,
//   onClose,
//   currentPhotoId,
//   onSelectPhoto,
// }) => {
//   const [tempSelectedPhotoId, setTempSelectedPhotoId] = useState(currentPhotoId);

//   useEffect(() => {
//     if (visible) {
//       setTempSelectedPhotoId(currentPhotoId);
//     }
//   }, [visible, currentPhotoId]);

//   const handleSelect = () => {
//     onSelectPhoto(tempSelectedPhotoId);
//     onClose();
//   };

//   return (
//     <Modal
//       animationType="fade"
//       transparent={true}
//       visible={visible}
//       onRequestClose={onClose}
//     >
//       <View style={modalStyles.centeredView}>
//         <View style={modalStyles.modalView}>
//           <Text style={[theme.typography.title, modalStyles.modalTitle]}>Pilih Foto Profil</Text>
          
//           <Image
//             source={findImageSourceById(tempSelectedPhotoId)}
//             style={modalStyles.modalCurrentImage}
//           />

//           <ScrollView 
//             style={modalStyles.gridScrollView}
//             contentContainerStyle={modalStyles.imageGridModal}
//             showsVerticalScrollIndicator={false}
//           >
//             {profileImages.map((image) => (
//               <TouchableOpacity
//                 key={image.id}
//                 style={[
//                   modalStyles.imageOptionModal,
//                   tempSelectedPhotoId === image.id && modalStyles.selectedImageOptionModal,
//                 ]}
//                 onPress={() => setTempSelectedPhotoId(image.id)}
//               >
//                 <Image source={image.source} style={modalStyles.imageOptionImgModal} />
//               </TouchableOpacity>
//             ))}
//           </ScrollView>

//           <View style={modalStyles.modalButtonContainer}>
//             <Button title="Batal" variant="outline" onPress={onClose} />
//             <Button title="Pilih" variant="primary" onPress={handleSelect} />
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };


// export default function ProfileEdit() {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isImagePickerModalVisible, setIsImagePickerModalVisible] = useState(false);
  
//   const [formData, setFormData] = useState<ProfileEditFormData>({
//     phoneNumber: '',
//     email: '',
//     username: '',
//     province: '',
//     city: '',
//     photo: '', // Default photo ID
//   });

//   const [originalData, setOriginalData] = useState<ProfileEditFormData>({
//     phoneNumber: '',
//     email: '',
//     username: '',
//     province: '',
//     city: '',
//     photo: '',
//   });

//   const [errors, setErrors] = useState<Partial<ProfileEditFormData>>({});
//   const [isValid, setIsValid] = useState<ValidationState>({
//     phoneNumber: true,
//     email: true,
//     username: true,
//     province: true,
//     city: true,
//   });

//   const [cities, setCities] = useState<Array<{ label: string; value: string }>>([]);

//   const provinces = locationData.provinces.map(province => ({
//     label: province.label,
//     value: province.value
//   }));

//   useEffect(() => {
//     loadUserProfile();
//   }, []);

//   useEffect(() => {
//     if (formData.province) {
//       const provinceCities = getCities(formData.province).map(city => ({
//         label: city.label,
//         value: city.value
//       }));
//       setCities(provinceCities);
//     } else {
//       setCities([]); // Clear cities if no province is selected
//     }
//   }, [formData.province]);

//   const loadUserProfile = async () => {
//     try {
//       setIsLoading(true);
//       const response = await authApi.getUserProfile();
      
//       if (response.code === 200 && response.data) {
//         const matchingProvince = locationData.provinces.find(
//           p => p.label === response.data!.province
//         );
//         const provinceValue = matchingProvince?.value || response.data.province || '';

//         let cityValue = response.data.city || '';
//         if (matchingProvince) {
//           const matchingCity = matchingProvince.cities.find(
//             c => c.label === response.data!.city
//           );
//           cityValue = matchingCity?.value || response.data.city || '';
//         }

//         const profileData = {
//           phoneNumber: response.data.phoneNumber || '',
//           email: response.data.email || '',
//           username: response.data.username || '',
//           province: provinceValue,
//           city: cityValue,
//           photo: response.data.photo || '', // Ensure photo has a default if empty
//         };

//         setFormData(profileData);
//         setOriginalData(profileData);

//         // Pre-populate cities if province is already set
//         if (provinceValue) {
//             const provinceCities = getCities(provinceValue).map(city => ({
//                 label: city.label,
//                 value: city.value
//             }));
//             setCities(provinceCities);
//         }

//       } else {
//         Alert.alert('Error', 'Failed to load profile data');
//       }
//     } catch (error) {
//       console.error('Error loading profile:', error);
//       Alert.alert('Error', 'Failed to load profile data');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getCities = (provinceValue: string) => {
//     const province = locationData.provinces.find(p => p.value === provinceValue);
//     return province?.cities || [];
//   };

//   const validateEmail = (email: string) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!email) return 'Email tidak boleh kosong';
//     if (!emailRegex.test(email)) return 'Format email tidak valid';
//     return undefined;
//   };

//   const formatPhoneNumber = (phone: string): string => {
//     const cleanPhone = phone.replace(/[^\d+]/g, '');
//     const numberWithoutPrefix = cleanPhone.replace(/^(\+62|0)/, '');
//     return '+62' + numberWithoutPrefix;
//   };

//   const validatePhone = (phone: string): string | undefined => {
//     const cleanPhone = phone.replace(/[^\d+]/g, '');
    
//     if (!cleanPhone) {
//       return 'Nomor telepon tidak boleh kosong';
//     }

//     if (!cleanPhone.match(/^(\+62|0)/)) {
//       return 'Nomor telepon harus dimulai dengan +62 atau 0';
//     }

//     const numberWithoutPrefix = cleanPhone.replace(/^(\+62|0)/, '');
    
//     if (numberWithoutPrefix.length > 0 && numberWithoutPrefix[0] !== '8') {
//       return 'Nomor telepon harus dimulai dengan 8 setelah kode negara/0';
//     }

//     if (numberWithoutPrefix.length < 9 || numberWithoutPrefix.length > 12) { // Adjusted to typical Indonesian lengths (e.g., 8123456789 to 812345678901)
//       return 'Panjang nomor telepon tidak valid (9-12 digit setelah prefix)';
//     }

//     return undefined;
//   };

//   const validateUsername = (username: string) => {
//     if (!username) return 'Nama tidak boleh kosong';
//     if (username.length < 2) return 'Nama minimal 2 karakter';
//     return undefined;
//   };

//   const validateProvince = (province: string) => {
//     if (!province) return 'Provinsi harus dipilih';
//     return undefined;
//   };

//   const validateCity = (city: string) => {
//     if (!city) return 'Kota harus dipilih';
//     return undefined;
//   };

//   const handleValidation = (field: keyof ValidationState, isFieldValid: boolean) => {
//     setIsValid(prev => ({
//       ...prev,
//       [field]: isFieldValid,
//     }));
//   };

//   const handleProvinceChange = (provinceValue: string) => {
//     setFormData(prev => ({
//       ...prev,
//       province: provinceValue,
//       city: '', 
//     }));
//     setErrors(prev => ({ ...prev, province: undefined, city: undefined }));
//   };

//   const handleCityChange = (cityValue: string) => {
//     setFormData(prev => ({
//       ...prev,
//       city: cityValue,
//     }));
//     setErrors(prev => ({ ...prev, city: undefined }));
//   };

//   const getSelectedProfileImageSource = () => {
//     return findImageSourceById(formData.photo);
//   };

//   const hasChanges = () => {
//     return JSON.stringify(formData) !== JSON.stringify(originalData);
//   };

//   const openImagePicker = () => {
//     setIsImagePickerModalVisible(true);
//   };

//   const handleSave = async () => {
//     Keyboard.dismiss();

//     const phoneError = validatePhone(formData.phoneNumber);
//     const emailError = validateEmail(formData.email);
//     const usernameError = validateUsername(formData.username);
//     const provinceError = validateProvince(formData.province);
//     const cityError = validateCity(formData.city);

//     setErrors({
//       phoneNumber: phoneError,
//       email: emailError,
//       username: usernameError,
//       province: provinceError,
//       city: cityError,
//     });

//     if (phoneError || emailError || usernameError || provinceError || cityError) {
//       return;
//     }

//     if (!hasChanges()) {
//       Alert.alert('Info', 'Tidak ada perubahan untuk disimpan');
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const formattedPhone = formatPhoneNumber(formData.phoneNumber);
      
//       const provinceObj = locationData.provinces.find(p => p.value === formData.province);
//       const cityObj = provinceObj?.cities.find(c => c.value === formData.city);
      
//       const updateData: UpdateProfileData = {
//         phoneNumber: formattedPhone,
//         email: formData.email,
//         username: formData.username,
//         province: provinceObj?.label || formData.province,
//         city: cityObj?.label || formData.city,
//         photo: formData.photo,
//       };

//       const response = await authApi.updateProfile(updateData);
      
//       if (response.code === 200) {
//         setOriginalData(formData);
//         Alert.alert(
//           'Berhasil',
//           'Profil berhasil diperbarui',
//           [
//             {
//               text: 'OK',
//               onPress: () => router.replace('/profile?refresh=true')
//             }
//           ]
//         );
//       } else {
//         let errorMessage = 'Gagal memperbarui profil';
//         if (response.error) {
//           if (Array.isArray(response.error)) {
//             errorMessage = response.error.join('\n');
//           } else if (typeof response.error === 'object') {
//             // Handle cases where error is an object, e.g., validation errors
//             errorMessage = Object.values(response.error).flat().join('\n');
//           }
//            else {
//             errorMessage = response.error;
//           }
//         }
//         Alert.alert('Error', errorMessage);
//       }
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={theme.colors.customGreen[300]} />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView 
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardAvoid}
//       >
//         <ScrollView
//           style={styles.scrollView}
//           contentContainerStyle={styles.scrollContent}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Profile Photo Section */}
//           <View style={styles.photoSection}>
//             <TouchableOpacity
//               style={styles.profileImageOuterContainer}
//               onPress={openImagePicker}
//               activeOpacity={0.8}
//             >
//               <Image source={getSelectedProfileImageSource()} style={styles.profileImage} />
//               <View style={styles.editIconContainer}>
//                 <Feather name="edit-2" size={18} color={theme.colors.customWhite[50]} />
//               </View>
//             </TouchableOpacity>
//           </View>

//           {/* Form Fields */}
//           <View style={styles.formContainer}>
//             <Textfield
//               label="Nama"
//               value={formData.username}
//               onChangeText={(text) => {
//                 setFormData(prev => ({ ...prev, username: text }));
//                 setErrors(prev => ({ ...prev, username: undefined }));
//               }}
//               error={errors.username}
//               validate={validateUsername}
//               onValidation={(isValid) => handleValidation('username', isValid)}
//               autoCapitalize="words"
//             />

//             <Textfield
//               label="Nomor HP"
//               value={formData.phoneNumber}
//               onChangeText={(text) => {
//                 setFormData(prev => ({ ...prev, phoneNumber: text }));
//                 setErrors(prev => ({ ...prev, phoneNumber: undefined }));
//               }}
//               error={errors.phoneNumber}
//               validate={validatePhone}
//               onValidation={(isValid) => handleValidation('phoneNumber', isValid)}
//               keyboardType="phone-pad"
//             />

//             <Textfield
//               label="Email"
//               value={formData.email}
//               onChangeText={(text) => {
//                 setFormData(prev => ({ ...prev, email: text }));
//                 setErrors(prev => ({ ...prev, email: undefined }));
//               }}
//               error={errors.email}
//               validate={validateEmail}
//               onValidation={(isValid) => handleValidation('email', isValid)}
//               keyboardType="email-address"
//               autoCapitalize="none"
//             />

//             <Dropdown
//               label="Provinsi"
//               placeholder="Pilih provinsi"
//               searchPlaceholder="Cari provinsi..."
//               options={provinces}
//               value={formData.province}
//               onChange={handleProvinceChange}
//               error={errors.province}
//             />

//             <Dropdown
//               label="Kota/Kabupaten"
//               placeholder="Pilih kota"
//               searchPlaceholder="Cari kota..."
//               options={cities}
//               value={formData.city}
//               onChange={handleCityChange}
//               error={errors.city}
//             />
//           </View>

//           {/* Save Button */}
//           <View style={styles.buttonContainer}>
//             <Button
//               title={isSaving ? 'Menyimpan...' : 'Simpan'}
//               variant="primary"
//               onPress={handleSave}
//               disabled={isSaving || !hasChanges() || Object.values(isValid).some(v => !v)}
//             />
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
      
//       <ProfileImagePickerModal
//         visible={isImagePickerModalVisible}
//         onClose={() => setIsImagePickerModalVisible(false)}
//         currentPhotoId={formData.photo}
//         onSelectPhoto={(photoId) => {
//           setFormData(prev => ({ ...prev, photo: photoId }));
//         }}
//       />
//     </SafeAreaView>
//   );
// }

// const screenHeight = Dimensions.get('window').height;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.customWhite[50],
//   },
//   keyboardAvoid: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: theme.colors.customWhite[50],
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 24,
//   },
//   photoSection: {
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     paddingTop: 24,
//   },
//   profileImageOuterContainer: {
//     position: 'relative',
//     width: 120, 
//     height: 120, 
//   },
//   profileImage: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 60,
//     borderWidth: 3,
//     borderColor: theme.colors.customGreen[200],
//   },
//   editIconContainer: {
//     position: 'absolute',
//     bottom: 5,
//     right: 5,
//     backgroundColor: theme.colors.customGreen[200],
//     borderRadius: 40,
//     padding: 8,
//     borderWidth: 1,
//     borderColor: theme.colors.customWhite[50],
//     // Remove pointer events to allow TouchableOpacity parent to handle touch
//     pointerEvents: 'none',
//   },
//   formContainer: {
//     paddingHorizontal: 24,
//     paddingTop: 16,
//   },
//   buttonContainer: {
//     paddingHorizontal: 24,
//     paddingTop: 24,
//     paddingBottom: 10,
//   },
// });

// const modalStyles = StyleSheet.create({
//   centeredView: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.6)',
//   },
//   modalView: {
//     margin: 24,
//     backgroundColor: theme.colors.customWhite[50],
//     borderRadius: 24,
//     padding: 24,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//     width: '90%',
//     maxHeight: screenHeight * 0.8, 
//   },
//   modalTitle: {
//     marginBottom: 16,
//     textAlign: 'center',
//     color: theme.colors.customOlive[50]
//   },
//   modalCurrentImage: {
//     width: 136,
//     height: 136,
//     borderRadius: 75,
//     marginBottom: 16,
//     borderWidth: 3,
//     borderColor: theme.colors.customGreen[200],
//   },
//   gridScrollView: {
//     width: '100%',
//     maxHeight: screenHeight * 0.35,
//   },
//   imageGridModal: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     paddingBottom: 8, // Space for scrollbar
//   },
//   imageOptionModal: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//     margin: 8,
//     borderWidth: 3,
//     borderColor: 'transparent',
//     alignItems: 'center',
//     justifyContent: 'center',
//     overflow: 'hidden',
//   },
//   selectedImageOptionModal: {
//     borderColor: theme.colors.customGreen[200],
//   },
//   imageOptionImgModal: {
//     width: '100%', // Make image fill the TouchableOpacity
//     height: '100%',
//     borderRadius: 32, // Slightly smaller to show border
//   },
//   modalButtonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '100%',
//     marginTop: 16,
//   },
// });

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