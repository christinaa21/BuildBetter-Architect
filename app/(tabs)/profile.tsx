import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';
import theme from '../theme';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import Button from '@/components/Button';

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
//   const name = user?.username;
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true); // Set loading true when fetch starts
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
        setIsLoading(false); // Set loading false when fetch completes or fails
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
              router.replace('/');  // Navigate back to login screen
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getProfileImageSource = () => { // Renamed for clarity, as it returns the source object
    if (!userProfile || userProfile.photo === null) {
      return require('@/assets/images/blank-profile.png');
    }

    try {
      const photoNumber = parseInt(userProfile.photo);
      if (isNaN(photoNumber) || photoNumber < 1 || photoNumber > 11) {
        return require('@/assets/images/blank-profile.png');
      }

      // Using a map for cleaner switch
      const imageMap: { [key: number]: any } = {
        1: require('@/assets/images/1.png'),
        2: require('@/assets/images/2.png'),
        3: require('@/assets/images/3.png'),
        4: require('@/assets/images/4.png'),
        5: require('@/assets/images/5.png'),
        6: require('@/assets/images/6.png'),
        7: require('@/assets/images/7.png'),
        8: require('@/assets/images/8.png'),
        9: require('@/assets/images/9.png'),
        10: require('@/assets/images/10.png'),
        11: require('@/assets/images/11.png'),
      };
      return imageMap[photoNumber] || require('@/assets/images/blank-profile.png');

    } catch (error) {
      console.error('Error loading profile image:', error);
      return require('@/assets/images/blank-profile.png');
    }
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
          />
        )}
      </View>

      <ScrollView
        style={[styles.whiteSheet, { marginTop: -WHITE_SHEET_BORDER_RADIUS }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Content below the profile image, shifted down by paddingTop in whiteSheet */}
        <View style={styles.profileTextContent}>
          {/* Display username from auth context (available early) or from fetched profile */}
          <Text style={[theme.typography.title, {color: theme.colors.customGreen[500]}]}>
            {userProfile?.username || 'Pengguna'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/profile/edit')}>
            <Text style={[styles.editProfileText, theme.typography.body2]}>Edit profil</Text>
          </TouchableOpacity>
        </View>

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
  // ADDED: Style for the loader container to match profile image dimensions
  profileImageLoaderContainer: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
    borderWidth: 4,
    borderColor: theme.colors.customWhite[50],
    backgroundColor: theme.colors.customGray[50], // A light background for the loader
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: theme.colors.customWhite[50],
    borderTopLeftRadius: WHITE_SHEET_BORDER_RADIUS,
    borderTopRightRadius: WHITE_SHEET_BORDER_RADIUS,
    paddingTop: (PROFILE_IMAGE_SIZE / 2) + 20, // Ensure content starts below the profile image
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
    marginTop: 40,
    alignItems: 'center',
  },
});