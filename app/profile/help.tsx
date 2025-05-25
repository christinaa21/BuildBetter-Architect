import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import theme from '../theme';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

interface MenuOptionProps {
  icon: React.ReactNode;
  title: string;
  content: string;
  onPress?: () => void;
}

export default function Profile() {
  const router = useRouter();

  const MenuOption: React.FC<MenuOptionProps> = ({ icon, title, content, onPress }) => (
    <View>
      <Text style={[theme.typography.subtitle1, styles.menuTitle]}>{title}</Text>
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuIconContainer}>
          {icon}
        </View>
        <Text style={[theme.typography.body1, styles.menuText]}>{content}</Text>
      </TouchableOpacity>
      <View style={styles.menuDivider} />
    </View>
  );

  return (
    <View style={styles.baseContainer}>
    <Text style={[theme.typography.body1, styles.text]}>Hubungi kami melalui:</Text>
    <MenuOption
      icon={<MaterialCommunityIcons name="gmail" size={24} color={theme.colors.customGreen[300]} />}
      title="Email"
      content="app.buildbetter@gmail.com"
      onPress={() => Linking.openURL('mailto:app.buildbetter@gmail.com')}
    />
    <MenuOption
      icon={<MaterialCommunityIcons name="whatsapp" size={24} color={theme.colors.customGreen[300]} />}
      title="Nomor WhatsApp"
      content="081274460188"
      onPress={() => Linking.openURL('https://wa.me/6281274460188')}
    />
    <MenuOption
      icon={<MaterialIcons name="location-pin" size={24} color={theme.colors.customGreen[300]} />}
      title="Alamat"
      content="Jl. Ganesa No.10, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung, Jawa Barat 40132"
      onPress={() => Linking.openURL('https://g.co/kgs/XNMTLx2')}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    flex: 1,
    backgroundColor: theme.colors.customWhite[50],
    paddingHorizontal: 24
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.customWhite[50],
  },
  text: {
    color: theme.colors.customOlive[50],
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 12,
    backgroundColor: theme.colors.customWhite[50],
  },
  menuIconContainer: {
    marginRight: 16,
  },
  menuTitle: {
    color: theme.colors.customGreen[200],
    paddingTop: 24,
  },
  menuText: {
    flex: 1,
    color: theme.colors.customOlive[50]
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.customGray[100],
    marginLeft: 40,
  },
});