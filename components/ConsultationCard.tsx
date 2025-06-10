// components/ConsultationCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, StyleProp, ViewStyle } from 'react-native';
import theme from '@/app/theme';
import Button from './Button';
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';

export type ConsultationStatus = 'Dijadwalkan' | 'Berlangsung' | 'Berakhir' | 'Menunggu konfirmasi' | 'Menunggu pembayaran' | 'Dibatalkan';
export type ConsultationType = 'online' | 'offline';

export interface ConsultationCardProps {
  id: string;
  userName: string;
  consultationType: ConsultationType;
  status: ConsultationStatus;
  startDate: string;
  endDate: string;
  onChatPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

interface StatusDisplayProps {
  backgroundColor: string;
  dotColor: string;
  textColor: string;
}

const statusStyles: Record<ConsultationStatus, StatusDisplayProps> = {
  'Menunggu pembayaran': { backgroundColor: '#FEFCE8', dotColor: '#EFB100', textColor: theme.colors.customOlive[50] },
  'Menunggu konfirmasi': { backgroundColor: '#FFF3E0', dotColor: '#FF9800', textColor: theme.colors.customOlive[50] },
  'Dibatalkan': { backgroundColor: '#FFEBEE', dotColor: '#F44336', textColor: theme.colors.customOlive[50] },
  'Dijadwalkan': { backgroundColor: '#CAE1DB', dotColor: theme.colors.customGreen[300], textColor: theme.colors.customOlive[50] },
  'Berlangsung': { backgroundColor: '#E3F2FD', dotColor: '#2196F3', textColor: theme.colors.customOlive[50] },
  'Berakhir': { backgroundColor: theme.colors.customGray[50], dotColor: theme.colors.customOlive[50], textColor: theme.colors.customOlive[50] },
};

// Helper function to safely handle text truncation
function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

// Helper function to format date range as "Today, HH:mm - HH:mm" or "dd Mmm yyyy, HH:mm - HH:mm"
const formatDateTimeRange = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    const isToday = start.getDate() === today.getDate() &&
                  start.getMonth() === today.getMonth() &&
                  start.getFullYear() === today.getFullYear();

    const dateDisplay = isToday ? 'Hari ini' : start.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });

    const startTime = start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const endTime = end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

    return `${dateDisplay}, ${startTime} - ${endTime}`;
  } catch (error) {
    console.warn("Invalid date for formatting:", error);
    return 'Invalid date range';
  }
};

const ConsultationCard: React.FC<ConsultationCardProps> = ({
  userName,
  consultationType,
  status,
  startDate,
  endDate,
  onChatPress,
  style,
}) => {
  const safeName = truncate(userName, 25) || 'Unknown User';
  const dateTimeRange = formatDateTimeRange(startDate, endDate);

  const consultationTypeDisplay = consultationType === 'online' ? 'Konsultasi via Chat' : 'Konsultasi Tatap Muka';
  const consultationIcon = consultationType === 'online' ? 'comment-dots' : 'handshake';
  
  return (
    <View style={[styles.card, style]}>
      {/* Top Section: Photo, Name, Status, Type */}
      <View style={styles.topSection}>
        <Image 
          source={require('@/assets/images/blank-profile.png')} 
          style={styles.photo}
        />
        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <View style={styles.nameContainer}>
              <Text style={[theme.typography.subtitle2, styles.name]} numberOfLines={1}>
                {safeName}
              </Text>
            </View>
            {status && statusStyles[status] && (
              <View style={[styles.statusChip, { backgroundColor: statusStyles[status].backgroundColor }]}>
                <View style={[styles.statusDot, { backgroundColor: statusStyles[status].dotColor }]} />
                <Text style={[theme.typography.overline, { color: statusStyles[status].textColor }]}>
                  {status}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.consultationTypeContainer}>
            <FontAwesome6 
              name={consultationIcon} 
              size={14} 
              color={theme.colors.customOlive[50]} 
            />
            <Text style={[styles.consultationTypeText]}>
              {consultationTypeDisplay}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Section: Date/Time and Action Button */}
      <View style={styles.bottomSection}>
        <View style={styles.dateTimeContainer}>
          <MaterialCommunityIcons 
            name="clock-outline" 
            size={16} 
            color={theme.colors.customOlive[50]} 
          />
          <Text style={[theme.typography.caption, styles.dateTimeText]}>
            {dateTimeRange}
          </Text>
        </View>

        <Button
            title="Lihat Chat"
            icon={<MaterialCommunityIcons name="chat" size={16} color={theme.colors.customWhite[50]} />}
            variant="primary"
            onPress={onChatPress}
            minHeight={20}
            minWidth={80}
            paddingVertical={4}
            paddingHorizontal={10}
            textStyle={[theme.typography.caption]}
          />
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
    shadowColor: theme.colors.customGray[200],
    elevation: 6,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  photo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    color: theme.colors.customOlive[50],
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  consultationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consultationTypeText: {
    marginLeft: 8,
    color: theme.colors.customOlive[50],
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.customGray[50],
    marginVertical: 12,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dateTimeText: {
    color: theme.colors.customOlive[50],
    marginLeft: 8,
    marginTop: 2,
  },
});

export default ConsultationCard;