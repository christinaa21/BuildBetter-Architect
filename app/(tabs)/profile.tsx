import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';

interface UserProfileResponse {
    id: string;
    email: string;
    username: string;
    photo: null | string;
    province: string;
    city: string;
    phoneNumber: string;
    experience: number;
    rateOnline: number;
    rateOffline: number;
    portfolio: string;
}

interface MenuOptionProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}

// Constants for styling
const PROFILE_IMAGE_SIZE = 100;
const GREEN_HEADER_VIEW_HEIGHT = 120;
const WHITE_SHEET_BORDER_RADIUS = 25;

export default function Profile() {
  const { logout, user } = useAuth();
  const name = user?.username;
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const response = await authApi.getUserProfile();
        if (response.code === 200 && response.data) {
          setUserProfile(response.data);
        } else {
          Alert.alert('Error', response.error || 'Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Keluar",
      "Anda yakin ingin keluar?",
      [
        {
          text: "Tidak",
          style: "cancel"
        },
        {
          text: "Ya",
          onPress: async () => {
            try {
              await logout();
              router.replace('/');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getProfileImageSource = () => {
    // If no photo URL or image failed to load, return blank profile
    if (!userProfile?.photo || imageLoadError) {
      return require('@/assets/images/blank-profile.png');
    }

    // Return the photo URL as source
    return { uri: userProfile.photo };
  };

  const handleImageError = () => {
    setImageLoadError(true);
  };

  const handleImageLoad = () => {
    setImageLoadError(false);
  };

  // Helper function to safely format currency
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'Tidak tersedia';
    }
    return `Rp${value.toLocaleString("id-ID")}`;
  };

  // Helper function to safely display text values
  const displayValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') {
      return 'Tidak tersedia';
    }
    return String(value);
  };

// Helper function to handle portfolio link press
  const handlePortfolioPress = async (portfolio: string | null | undefined) => {
    if (!portfolio || portfolio.trim() === '') {
      return;
    }

    const cleanPortfolio = portfolio.trim();
    let url = cleanPortfolio;

    // Add https:// if the URL doesn't have a protocol
    if (!cleanPortfolio.startsWith('http://') && !cleanPortfolio.startsWith('https://')) {
      url = `https://${cleanPortfolio}`;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Tidak dapat membuka link portfolio');
      }
    } catch (error) {
      console.error('Error opening portfolio link:', error);
      Alert.alert('Error', 'Gagal membuka link portfolio');
    }
  };

  // Helper function to truncate portfolio link to one line
  const truncatePortfolio = (portfolio: string | null | undefined): string => {
    if (!portfolio || portfolio.trim() === '') {
      return 'Tidak tersedia';
    }
    
    // Remove line breaks and extra spaces, then truncate if too long
    const cleanPortfolio = portfolio.replace(/\s+/g, ' ').trim();
    const maxLength = 40; // Adjust based on your UI needs
    
    if (cleanPortfolio.length > maxLength) {
      return cleanPortfolio.substring(0, maxLength) + '...';
    }
    
    return cleanPortfolio;
  };

  const MenuOption: React.FC<MenuOptionProps> = ({ icon, title, onPress }) => (
    <View>
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuIconContainer}>
          {icon}
        </View>
        <Text style={[theme.typography.body1, styles.menuText]}>{title}</Text>
        <Feather name="chevron-right" size={24} color={theme.colors.customGray[200]} />
      </TouchableOpacity>
      <View style={styles.menuDivider} />
    </View>
  );

  return (
    <View style={styles.baseContainer}>
      <View style={[styles.greenHeaderBackground, { height: GREEN_HEADER_VIEW_HEIGHT + insets.top, paddingTop: insets.top + 12 }]}>
        <Text style={[theme.typography.title, {color: theme.colors.customGreen[600]}]}>Profil</Text>
      </View>

      {/* Profile Image - Positioned absolutely */}
      <View style={[
        styles.profileImageWrapper,
        { top: (GREEN_HEADER_VIEW_HEIGHT + insets.top) - (PROFILE_IMAGE_SIZE / 1.6) }
      ]}>
        {isLoading ? (
          <View style={styles.profileImageLoaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.customGreen[300]} />
          </View>
        ) : (
          <Image
            source={getProfileImageSource()}
            style={styles.profileImage}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}
      </View>

      <ScrollView
        style={[styles.whiteSheet, { marginTop: -WHITE_SHEET_BORDER_RADIUS }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Content below the profile image */}
        <View style={styles.profileTextContent}>
          <Text style={[theme.typography.title, {color: theme.colors.customGreen[500]}]}>
            {displayValue(userProfile?.username || name)}
          </Text>
          <TouchableOpacity onPress={() => router.push('/profile/edit')}>
            <Text style={[styles.editProfileText, theme.typography.body2]}>Edit profil</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Details Section */}
        {userProfile && (
          <View style={styles.profileDetailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lokasi:</Text>
              <Text style={styles.detailValue}>
                {displayValue(userProfile.city)}{userProfile.city && userProfile.province ? ', ' : ''}{displayValue(userProfile.province)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pengalaman:</Text>
              <Text style={styles.detailValue}>
                {userProfile.experience !== null && userProfile.experience !== undefined 
                  ? `${userProfile.experience} tahun` 
                  : 'Tidak tersedia'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tarif Chat:</Text>
              <Text style={styles.detailValue}>{formatCurrency(userProfile.rateOnline)}/sesi (30 menit)</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tarif Offline:</Text>
              <Text style={styles.detailValue}>{formatCurrency(userProfile.rateOffline)}/sesi (1 jam)</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Portfolio:</Text>
              <TouchableOpacity 
                onPress={() => handlePortfolioPress(userProfile.portfolio)}
                disabled={!userProfile.portfolio || userProfile.portfolio.trim() === ''}
                style={styles.portfolioContainer}
              >
                <Text 
                  style={[
                    styles.detailValue, 
                    userProfile.portfolio && userProfile.portfolio.trim() !== '' ? styles.portfolioLink : null
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {truncatePortfolio(userProfile.portfolio)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          <MenuOption
            icon={<Feather name="phone" size={24} color={theme.colors.customGreen[300]} />}
            title="Pusat Bantuan"
            onPress={() => router.push('/profile/help')}
          />
          <MenuOption
            icon={<MaterialIcons name="lock-outline" size={24} color={theme.colors.customGreen[300]} />}
            title="Ubah Kata Sandi"
            onPress={() => router.push('/profile/change-password')}
          />
        </View>

        <View style={styles.footerContainer}>
          <Button
            title={'Keluar'}
            minHeight={10}
            paddingVertical={10}
            variant="outline"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    flex: 1,
    backgroundColor: theme.colors.customWhite[50],
  },
  greenHeaderBackground: {
    backgroundColor: theme.colors.customGreen[50],
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },
  profileImageWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  profileImage: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
    borderWidth: 4,
    borderColor: theme.colors.customWhite[50],
  },
  profileImageLoaderContainer: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
    borderWidth: 4,
    borderColor: theme.colors.customWhite[50],
    backgroundColor: theme.colors.customGray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: theme.colors.customWhite[50],
    borderTopLeftRadius: WHITE_SHEET_BORDER_RADIUS,
    borderTopRightRadius: WHITE_SHEET_BORDER_RADIUS,
    paddingTop: (PROFILE_IMAGE_SIZE / 2) + 20,
    paddingHorizontal: 24,
  },
  profileTextContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editProfileText: {
    marginTop: 6,
    textDecorationLine: 'underline',
    color: theme.colors.customGreen[200]
  },
  profileDetailsSection: {
    backgroundColor: theme.colors.customWhite[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.customGray[100],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.customGray[50],
  },
  detailLabel: {
    ...theme.typography.body2,
    color: theme.colors.customOlive[50],
    flex: 1,
    fontWeight: '500',
  },
  detailValue: {
    ...theme.typography.body2,
    color: theme.colors.customOlive[100],
    flex: 2,
    textAlign: 'right',
  },
  portfolioContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  portfolioLink: {
    color: theme.colors.customGreen[300],
    textDecorationLine: 'underline',
  },
  menuSection: {
    backgroundColor: theme.colors.customWhite[50],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.customWhite[50],
  },
  menuIconContainer: {
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    color: theme.colors.customOlive[50]
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.customGray[100],
    marginHorizontal: 8,
  },
  footerContainer: {
    marginVertical: 40,
    alignItems: 'center',
  },
});