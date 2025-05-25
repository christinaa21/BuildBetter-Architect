import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authApi, UpdateProfileData, PhotoUploadPayload } from '@/services/api';
import Textfield from '@/components/Textfield';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import theme from '../theme';
import locationData from '@/data/location.json';

interface ProfileEditFormData {
  phoneNumber: string;
  email: string;
  username: string;
  province: string;
  city: string;
  photo: string | null;
  experience: string;
  rateOnline: string;
  rateOffline: string;
  portfolio: string;
}

interface ValidationState {
  phoneNumber: boolean;
  email: boolean;
  username: boolean;
  province: boolean;
  city: boolean;
  experience: boolean;
  rateOnline: boolean;
  rateOffline: boolean;
  portfolio: boolean;
}

export default function ProfileEdit() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string | null>(null);
  const [selectedImageFileName, setSelectedImageFileName] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileEditFormData>({
    phoneNumber: '',
    email: '',
    username: '',
    province: '',
    city: '',
    photo: null,
    experience: '',
    rateOnline: '',
    rateOffline: '',
    portfolio: '',
  });

  const [originalData, setOriginalData] = useState<ProfileEditFormData>({
    phoneNumber: '',
    email: '',
    username: '',
    province: '',
    city: '',
    photo: null,
    experience: '',
    rateOnline: '',
    rateOffline: '',
    portfolio: '',
  });

  const [errors, setErrors] = useState<Partial<ProfileEditFormData>>({});
  const [isValid, setIsValid] = useState<ValidationState>({
    phoneNumber: true,
    email: true,
    username: true,
    province: true,
    city: true,
    experience: true,
    rateOnline: true,
    rateOffline: true,
    portfolio: true,
  });

  const [cities, setCities] = useState<Array<{ label: string; value: string }>>([]);

  const provinces = locationData.provinces.map(province => ({
    label: province.label,
    value: province.value
  }));

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (formData.province) {
      const provinceCities = getCities(formData.province).map(city => ({
        label: city.label,
        value: city.value
      }));
      setCities(provinceCities);
    } else {
      setCities([]);
    }
  }, [formData.province]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getUserProfile();
      
      if (response.code === 200 && response.data) {
        const matchingProvince = locationData.provinces.find(
          p => p.label === response.data!.province
        );
        const provinceValue = matchingProvince?.value || response.data.province || '';

        let cityValue = response.data.city || '';
        if (matchingProvince) {
          const matchingCity = matchingProvince.cities.find(
            c => c.label === response.data!.city
          );
          cityValue = matchingCity?.value || response.data.city || '';
        }

        const profileData = {
          phoneNumber: response.data.phoneNumber || '',
          email: response.data.email || '',
          username: response.data.username || '',
          province: provinceValue,
          city: cityValue,
          photo: response.data.photo,
          experience: response.data.experience?.toString() || '0',
          rateOnline: response.data.rateOnline?.toString() || '0',
          rateOffline: response.data.rateOffline?.toString() || '0',
          portfolio: response.data.portfolio || '',
        };

        setFormData(profileData);
        setOriginalData(profileData);

        // Set the profile image if available
        if (response.data.photo) {
          setSelectedImageUri(response.data.photo);
        }

        // Pre-populate cities if province is already set
        if (provinceValue) {
          const provinceCities = getCities(provinceValue).map(city => ({
            label: city.label,
            value: city.value
          }));
          setCities(provinceCities);
        }

      } else {
        Alert.alert('Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const getCities = (provinceValue: string) => {
    const province = locationData.provinces.find(p => p.value === provinceValue);
    return province?.cities || [];
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email tidak boleh kosong';
    if (!emailRegex.test(email)) return 'Format email tidak valid';
    return undefined;
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const numberWithoutPrefix = cleanPhone.replace(/^(\+62|0)/, '');
    return '+62' + numberWithoutPrefix;
  };

  const validatePhone = (phone: string): string | undefined => {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    if (!cleanPhone) {
      return 'Nomor telepon tidak boleh kosong';
    }

    if (!cleanPhone.match(/^(\+62|0)/)) {
      return 'Nomor telepon harus dimulai dengan +62 atau 0';
    }

    const numberWithoutPrefix = cleanPhone.replace(/^(\+62|0)/, '');
    
    if (numberWithoutPrefix.length > 0 && numberWithoutPrefix[0] !== '8') {
      return 'Nomor telepon harus dimulai dengan 8 setelah kode negara/0';
    }

    if (numberWithoutPrefix.length < 9 || numberWithoutPrefix.length > 12) {
      return 'Panjang nomor telepon tidak valid (9-12 digit setelah prefix)';
    }

    return undefined;
  };

  const validateUsername = (username: string) => {
    if (!username) return 'Nama tidak boleh kosong';
    if (username.length < 2) return 'Nama minimal 2 karakter';
    return undefined;
  };

  const validateProvince = (province: string) => {
    if (!province) return 'Provinsi harus dipilih';
    return undefined;
  };

  const validateCity = (city: string) => {
    if (!city) return 'Kota harus dipilih';
    return undefined;
  };

  const validateExperience = (experience: string) => {
    if (!experience) return 'Pengalaman tidak boleh kosong';
    const num = parseInt(experience);
    if (isNaN(num)) return 'Pengalaman harus berupa angka';
    if (num < 0) return 'Pengalaman tidak boleh negatif';
    if (num > 50) return 'Pengalaman tidak boleh lebih dari 50 tahun';
    return undefined;
  };

  const validateRate = (rate: string, fieldName: string) => {
    if (!rate) return `${fieldName} tidak boleh kosong`;
    const num = parseFloat(rate);
    if (isNaN(num)) return `${fieldName} harus berupa angka`;
    if (num < 0) return `${fieldName} tidak boleh negatif`;
    if (num > 10000000) return `${fieldName} terlalu besar`;
    return undefined;
  };

  const validatePortfolio = (portfolio: string) => {
    if (!portfolio) return undefined; // Portfolio is optional
    
    // Basic URL validation
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlRegex.test(portfolio)) {
      return 'Format URL portfolio tidak valid';
    }
    return undefined;
  };

  const handleValidation = (field: keyof ValidationState, isFieldValid: boolean) => {
    setIsValid(prev => ({
      ...prev,
      [field]: isFieldValid,
    }));
  };

  const handleProvinceChange = (provinceValue: string) => {
    setFormData(prev => ({
      ...prev,
      province: provinceValue,
      city: '', 
    }));
    setErrors(prev => ({ ...prev, province: undefined, city: undefined }));
  };

  const handleCityChange = (cityValue: string) => {
    setFormData(prev => ({
      ...prev,
      city: cityValue,
    }));
    setErrors(prev => ({ ...prev, city: undefined }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);

      // Determine MIME type
      let determinedMimeType = asset.mimeType;
      if (!determinedMimeType) {
        const extension = asset.fileName?.split('.').pop()?.toLowerCase() || asset.uri.split('.').pop()?.toLowerCase();
        if (extension === 'png') {
          determinedMimeType = 'image/png';
        } else if (extension === 'jpg' || extension === 'jpeg') {
          determinedMimeType = 'image/jpeg';
        } else {
          determinedMimeType = 'image/jpeg'; // Fallback, or 'application/octet-stream'
          console.warn(`Could not determine MIME type for ${asset.uri}, falling back to image/jpeg. Asset filename: ${asset.fileName}`);
        }
      }
      setSelectedImageMimeType(determinedMimeType);
      
      // Determine filename
      const determinedFileName = asset.fileName || `photo.${asset.uri.split('.').pop()?.toLowerCase() || 'jpg'}`;
      setSelectedImageFileName(determinedFileName);

      // formData.photo stores the URI to indicate a change.
      setFormData(prev => ({ ...prev, photo: asset.uri }));
    }
  };

  const getProfileImageSource = () => {
    if (selectedImageUri) {
      return { uri: selectedImageUri };
    }
    return require('@/assets/images/blank-profile.png');
  };

  const hasChanges = () => {
    // Compare current form data with original data
    const currentFormForComparison = { ...formData };
    
    // If we have a new selected image, that counts as a change
    if (selectedImageUri && selectedImageUri !== originalData.photo) {
      return true;
    }
    
    // Compare other fields
    return JSON.stringify(currentFormForComparison) !== JSON.stringify(originalData);
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    // If no changes, just go back to profile
    if (!hasChanges()) {
      router.replace('/profile?refresh=true');
      return;
    }

    const phoneError = validatePhone(formData.phoneNumber);
    const emailError = validateEmail(formData.email);
    const usernameError = validateUsername(formData.username);
    const provinceError = validateProvince(formData.province);
    const cityError = validateCity(formData.city);
    const experienceError = validateExperience(formData.experience);
    const rateOnlineError = validateRate(formData.rateOnline, 'Rate Online');
    const rateOfflineError = validateRate(formData.rateOffline, 'Rate Offline');
    const portfolioError = validatePortfolio(formData.portfolio);

    setErrors({
      phoneNumber: phoneError,
      email: emailError,
      username: usernameError,
      province: provinceError,
      city: cityError,
      experience: experienceError,
      rateOnline: rateOnlineError,
      rateOffline: rateOfflineError,
      portfolio: portfolioError,
    });

    if (phoneError || emailError || usernameError || provinceError || cityError || 
        experienceError || rateOnlineError || rateOfflineError || portfolioError) {
      return;
    }

    setIsSaving(true);
    try {
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);
      
      const provinceObj = locationData.provinces.find(p => p.value === formData.province);
      const cityObj = provinceObj?.cities.find(c => c.value === formData.city);
      
      let photoPayloadForApi: PhotoUploadPayload | null = null;
      // Check if a new image was selected (selectedImageUri will be a local file URI)
      // originalData.photo is a URL from the server or null.
      if (selectedImageUri && selectedImageUri !== originalData.photo) {
        if (selectedImageMimeType && selectedImageFileName) {
          photoPayloadForApi = {
            uri: selectedImageUri,
            type: selectedImageMimeType,
            name: selectedImageFileName,
          };
        } else {
          // Fallback if mimeType or fileName weren't set (shouldn't happen if pickImage is robust)
          console.warn("MIME type or filename missing for selected image, attempting to infer.");
          const uriParts = selectedImageUri.split('.');
          const extension = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
          photoPayloadForApi = {
            uri: selectedImageUri,
            name: selectedImageUri.split('/').pop() || `profile-photo.${extension}`,
            type: extension === 'png' ? 'image/png' : 'image/jpeg',
          };
        }
      }
      
      const updateData: UpdateProfileData = { // This is the type from api.ts
        phoneNumber: formattedPhone,
        email: formData.email,
        username: formData.username,
        province: provinceObj?.label || formData.province,
        city: cityObj?.label || formData.city,
        photo: photoPayloadForApi, // Pass the prepared photo object
        experience: parseInt(formData.experience) || 0,
        rateOnline: parseFloat(formData.rateOnline) || 0,
        rateOffline: parseFloat(formData.rateOffline) || 0,
        portfolio: formData.portfolio || '',
      };

      const response = await authApi.updateProfile(updateData);
      if (response.code === 200) {
        // Update originalData with the successfully saved form data including the new photo URI (if any)
        const newOriginalData = { ...formData };
        if (photoPayloadForApi) { // If a new photo was uploaded
          // The server might return the new URL for the photo.
          // For simplicity here, we assume the local URI is what we want to track for "no changes" logic after save.
          // Or, better: reload profile after save to get the server URL for the new photo.
          // For now, setting formData.photo (which is selectedImageUri) to originalData.photo
          newOriginalData.photo = selectedImageUri;
        }
        setOriginalData(newOriginalData); 

        Alert.alert(
          'Berhasil',
          'Profil berhasil diperbarui',
          [{ text: 'OK', onPress: () => router.replace('/profile?refresh=true') }]
        );
      } else {
        let errorMessage = 'Gagal memperbarui profil';
        if (response.error) {
          if (Array.isArray(response.error)) {
            errorMessage = response.error.join('\n');
          } else if (typeof response.error === 'object') {
            errorMessage = Object.values(response.error).flat().join('\n');
          } else {
            errorMessage = response.error;
          }
        }
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.customGreen[300]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.profileImageOuterContainer}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <Image source={getProfileImageSource()} style={styles.profileImage} />
              <View style={styles.editIconContainer}>
                <Feather name="camera" size={18} color={theme.colors.customWhite[50]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <Textfield
              label="Nama"
              value={formData.username}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, username: text }));
                setErrors(prev => ({ ...prev, username: undefined }));
              }}
              error={errors.username}
              validate={validateUsername}
              onValidation={(isValid) => handleValidation('username', isValid)}
              autoCapitalize="words"
            />

            <Textfield
              label="Nomor HP"
              value={formData.phoneNumber}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, phoneNumber: text }));
                setErrors(prev => ({ ...prev, phoneNumber: undefined }));
              }}
              error={errors.phoneNumber}
              validate={validatePhone}
              onValidation={(isValid) => handleValidation('phoneNumber', isValid)}
              keyboardType="phone-pad"
            />

            <Textfield
              label="Email"
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
            />

            <Dropdown
              label="Provinsi"
              placeholder="Pilih provinsi"
              searchPlaceholder="Cari provinsi..."
              options={provinces}
              value={formData.province}
              onChange={handleProvinceChange}
              error={errors.province}
            />

            <Dropdown
              label="Kota/Kabupaten"
              placeholder="Pilih kota"
              searchPlaceholder="Cari kota..."
              options={cities}
              value={formData.city}
              onChange={handleCityChange}
              error={errors.city}
            />

            <Textfield
              label="Pengalaman (tahun)"
              value={formData.experience}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, experience: text }));
                setErrors(prev => ({ ...prev, experience: undefined }));
              }}
              error={errors.experience}
              validate={validateExperience}
              onValidation={(isValid) => handleValidation('experience', isValid)}
              keyboardType="numeric"
            />

            <Textfield
              label="Rate Online (Rp)"
              value={formData.rateOnline}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, rateOnline: text }));
                setErrors(prev => ({ ...prev, rateOnline: undefined }));
              }}
              error={errors.rateOnline}
              validate={(value) => validateRate(value, 'Rate Online')}
              onValidation={(isValid) => handleValidation('rateOnline', isValid)}
              keyboardType="numeric"
            />

            <Textfield
              label="Rate Offline (Rp)"
              value={formData.rateOffline}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, rateOffline: text }));
                setErrors(prev => ({ ...prev, rateOffline: undefined }));
              }}
              error={errors.rateOffline}
              validate={(value) => validateRate(value, 'Rate Offline')}
              onValidation={(isValid) => handleValidation('rateOffline', isValid)}
              keyboardType="numeric"
            />

            <Textfield
              label="Portfolio (URL)"
              value={formData.portfolio}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, portfolio: text }));
                setErrors(prev => ({ ...prev, portfolio: undefined }));
              }}
              error={errors.portfolio}
              validate={validatePortfolio}
              onValidation={(isValid) => handleValidation('portfolio', isValid)}
              keyboardType="url"
              autoCapitalize="none"
              placeholder="https://example.com"
            />
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={isSaving ? 'Menyimpan...' : 'Simpan'}
              variant="primary"
              onPress={handleSave}
              disabled={isSaving || Object.values(isValid).some(v => !v)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.customWhite[50],
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.customWhite[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  photoSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  profileImageOuterContainer: {
    position: 'relative',
    width: 120, 
    height: 120, 
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.customGreen[200],
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: theme.colors.customGreen[200],
    borderRadius: 40,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.customWhite[50],
    pointerEvents: 'none',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 10,
  },
});