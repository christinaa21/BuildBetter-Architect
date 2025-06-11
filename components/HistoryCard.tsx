import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import theme from '@/app/theme';
import Button from './Button';

export type HistoryStatus = 'Menunggu pembayaran' | 'Menunggu konfirmasi' | 'Dijadwalkan' | 'Berlangsung' | 'Berakhir';
export type HistoryMetode = 'Chat' | 'Tatap Muka';

export interface HistoryCardProps {
  id: string;
  orderCreatedAt: string;
  createdAtISO: string;
  userName: string;
  userCity: string;
  metode: HistoryMetode;
  tanggal: string; 
  waktu: string;   
  kota: string;
  totalPembayaran: number;
  status: HistoryStatus;
  roomId?: string | null;
  style?: StyleProp<ViewStyle>;
}

interface StatusDisplayProps {
  backgroundColor: string;
  dotColor: string;
  textColor: string;
}

const statusStyles: Record<HistoryStatus, StatusDisplayProps> = {
  'Menunggu pembayaran': { backgroundColor: '#FEFCE8', dotColor: '#EFB100', textColor: theme.colors.customOlive[50] },
  'Menunggu konfirmasi': { backgroundColor: '#FFF3E0', dotColor: '#FF9800', textColor: theme.colors.customOlive[50] },
  'Dijadwalkan': { backgroundColor: '#CAE1DB', dotColor: theme.colors.customGreen[300], textColor: theme.colors.customOlive[50] },
  'Berlangsung': { backgroundColor: '#E3F2FD', dotColor: '#2196F3', textColor: theme.colors.customOlive[50] },
  'Berakhir': { backgroundColor: theme.colors.customGray[50], dotColor: theme.colors.customOlive[50], textColor: theme.colors.customOlive[50] },
};

const HistoryCard: React.FC<HistoryCardProps> = (props) => {
  const { id, orderCreatedAt, userName, userCity, metode, tanggal, waktu, kota, totalPembayaran, status, roomId, style } = props;
  
  const router = useRouter();
  const currentStatusStyle = statusStyles[status];

  const handleLihatChat = () => {
    if (roomId) {
      alert(`Navigasi ke room chat: ${roomId}`); // Replace with actual navigation
    } else {
      alert('Room chat belum tersedia untuk konsultasi ini.');
    }
  };

  // Only show "Lihat Chat" button for scheduled, in-progress, and ended consultations
  const renderActionButton = () => {
    const buttonProps = {
      minHeight: 36,
      minWidth: 120,
      paddingVertical: 8,
      paddingHorizontal: 12,
      textStyle: theme.typography.caption,
    };

    if (status === 'Dijadwalkan' || status === 'Berlangsung' || status === 'Berakhir') {
      return <Button title="Lihat Chat" variant="outline" onPress={handleLihatChat} {...buttonProps} />;
    }

    return null;
  };

  return (
    <View style={[styles.card, style]}>
       <View style={styles.header}>
        <Text style={[theme.typography.caption, styles.dateText]}>{orderCreatedAt}</Text>
        <View style={[styles.statusChip, { backgroundColor: currentStatusStyle.backgroundColor }]}>
          <View style={[styles.statusDot, { backgroundColor: currentStatusStyle.dotColor }]} />
          <Text style={[theme.typography.overline, { color: currentStatusStyle.textColor }]}>{status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={[theme.typography.subtitle2, styles.serviceTitle]}>Layanan BuildConsult</Text>
      <Text style={[theme.typography.body2, styles.infoText]}>Klien: {userName}</Text>
      <Text style={[theme.typography.body2, styles.infoText]}>Kota klien: {userCity}</Text>
      <Text style={[theme.typography.body2, styles.infoText]}>Metode: {metode}</Text>
      <Text style={[theme.typography.body2, styles.infoText]}>Tanggal konsultasi: {tanggal}</Text>
      <Text style={[theme.typography.body2, styles.infoText]}>Waktu konsultasi: {waktu}</Text>
      {metode === 'Tatap Muka' &&
        <Text style={[theme.typography.body2, styles.infoText]}>Kota: {kota}</Text>
      }

      <View style={styles.footer}>
        <View>
          <Text style={[theme.typography.caption, styles.paymentLabel]}>Total Pembayaran</Text>
          <Text style={[theme.typography.subtitle1, styles.paymentAmount]}>
            Rp{totalPembayaran.toLocaleString('id-ID')}
          </Text>
        </View>
        {renderActionButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.customWhite[50],
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    dateText: {
      color: theme.colors.customGray[200],
    },
    statusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 8,
      marginRight: 6,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.customGray[50],
      marginVertical: 8,
    },
    serviceTitle: {
      color: theme.colors.customOlive[50],
      marginBottom: 4,
    },
    infoText: {
      color: theme.colors.customOlive[50],
      marginBottom: 2
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: 12,
    },
    paymentLabel: {
      color: theme.colors.customGray[200],
    },
    paymentAmount: {
      color: theme.colors.customOlive[50],
    },
  });

export default HistoryCard;