import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import DateTimePickerModal from "react-native-modal-datetime-picker";
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import theme from '@/app/theme';
import HistoryCard, { HistoryCardProps, HistoryStatus, HistoryMetode } from '@/components/HistoryCard';
import MultiSelectDrawer from '@/components/MultiSelectDrawer';
import Button from '@/components/Button';
import { authApi, Consultation } from '@/services/api';
import { useFocusEffect } from 'expo-router';

const STATUS_FILTER_OPTIONS: HistoryStatus[] = ['Menunggu pembayaran', 'Menunggu konfirmasi', 'Dijadwalkan', 'Berlangsung', 'Berakhir'];
const METODE_FILTER_OPTIONS: HistoryMetode[] = ['Chat', 'Tatap Muka'];

// Helper functions
const mapApiStatusToDisplayStatus = (apiStatus: string): HistoryStatus => {
  switch (apiStatus) {
    case 'waiting-for-payment': return 'Menunggu pembayaran';
    case 'waiting-for-confirmation': return 'Menunggu konfirmasi';
    case 'scheduled': return 'Dijadwalkan';
    case 'in-progress': return 'Berlangsung';
    case 'ended': return 'Berakhir';
    default: return 'Berakhir';
  }
};

const mapApiTypeToDisplayMetode = (apiType: string): HistoryMetode => {
  return apiType === 'online' ? 'Chat' : 'Tatap Muka';
};

const formatApiDateToIndonesian = (isoDateString: string): string => {
  const date = new Date(isoDateString);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day.toString().padStart(2, '0')} ${month} ${year}`;
};

const formatApiTimeRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formatTime = (date: Date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const convertConsultationToHistoryCardProps = (consultation: Consultation): HistoryCardProps => {
  return {
    id: consultation.id,
    orderCreatedAt: formatApiDateToIndonesian(consultation.createdAt),
    createdAtISO: consultation.createdAt,
    tanggal: formatApiDateToIndonesian(consultation.startDate),
    waktu: formatApiTimeRange(consultation.startDate, consultation.endDate),
    userName: consultation.userName,
    userCity: consultation.userCity,
    metode: mapApiTypeToDisplayMetode(consultation.type),
    kota: consultation.location,
    totalPembayaran: consultation.total,
    status: mapApiStatusToDisplayStatus(consultation.status),
    roomId: consultation.roomId,
  };
};

const parseConsultationDate = (dateString: string): Date | null => {
    const months: { [key: string]: number } = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 };
    const parts = dateString.split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthName = parts[1];
      const year = parseInt(parts[2], 10);
      const month = months[monthName];
      if (!isNaN(day) && month !== undefined && !isNaN(year)) return new Date(year, month, day);
    }
    return null;
};

const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return "Pilih";
    const day = date.getDate();
    const year = date.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${day} ${monthNames[date.getMonth()]} ${year}`;
};

export default function History() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedStatuses, setSelectedStatuses] = useState<HistoryStatus[]>([]);
  const [selectedMetodes, setSelectedMetodes] = useState<HistoryMetode[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const [isDateFilterModalVisible, setDateFilterModalVisible] = useState(false);
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [isStatusDrawerVisible, setStatusDrawerVisible] = useState(false);
  const [isMetodeDrawerVisible, setMetodeDrawerVisible] = useState(false);

  // Use useFocusEffect to refresh data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConsultationHistory();
    }, [])
  );

  const historyData = useMemo(() => {
    return consultations.map(convertConsultationToHistoryCardProps);
  }, [consultations]);

  const filteredHistory = useMemo(() => {
    return historyData.filter(item => {
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(item.status)) return false;
      if (selectedMetodes.length > 0 && !selectedMetodes.includes(item.metode)) return false;
      const consultationItemDate = parseConsultationDate(item.tanggal);
      if (!consultationItemDate) return true;
      if (startDate) {
        const filterStartDate = new Date(startDate);
        filterStartDate.setHours(0,0,0,0);
        if (consultationItemDate < filterStartDate) return false;
      }
      if (endDate) {
        const filterEndDate = new Date(endDate);
        filterEndDate.setHours(23,59,59,999);
        if (consultationItemDate > filterEndDate) return false;
      }
      return true;
    });
  }, [historyData, selectedStatuses, selectedMetodes, startDate, endDate]);

  const fetchConsultationHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        setError('Please log in to view consultation history.');
        setLoading(false);
        return;
      }

      // Step 1: Refresh consultations first to update expired ones
      try {
        const refreshResponse = await authApi.refreshConsultations();
        if (refreshResponse.code !== 200) {
          console.warn('Failed to refresh consultations:', refreshResponse.error);
        }
      } catch (refreshError) {
        console.warn('Error refreshing consultations:', refreshError);
      }

      // Step 2: Fetch the (now updated) list of consultations
      // Exclude cancelled consultations for architect view
      const consultationResponse = await authApi.getConsultation({
        includeCancelled: false
      });
      
      if (consultationResponse.code !== 200 || !consultationResponse.data) {
        setError(consultationResponse.error || 'Failed to fetch consultation history');
        setLoading(false);
        return;
      }

      const consultationsData: Consultation[] = consultationResponse.data;

      // Sort by creation date (newest first)
      const sortedConsultations = consultationsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setConsultations(sortedConsultations);

    } catch (err) {
      console.error('Error fetching consultation history:', err);
      setError('Network error or server unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const showStartDatePicker = () => setStartDatePickerVisibility(true);
  const hideStartDatePicker = () => setStartDatePickerVisibility(false);
  const handleStartDateConfirm = (date: Date) => {
    setStartDate(date);
    hideStartDatePicker();
    if (endDate && date > endDate) setEndDate(null);
  };

  const showEndDatePicker = () => setEndDatePickerVisibility(true);
  const hideEndDatePicker = () => setEndDatePickerVisibility(false);
  const handleEndDateConfirm = (date: Date) => {
    setEndDate(date);
    hideEndDatePicker();
    if (startDate && date < startDate) setStartDate(null);
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  }

  const applyDateFiltersAndClose = () => {
    setDateFilterModalVisible(false);
  }

  const getDateFilterButtonText = () => {
    if (startDate && endDate) return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
    if (startDate) return `Mulai: ${formatDateForDisplay(startDate)}`;
    if (endDate) return `Hingga: ${formatDateForDisplay(endDate)}`;
    return "Tanggal";
  }

  const getMultiSelectButtonText = (selectedItems: string[], defaultText: string) => {
    if (selectedItems.length === 0) return defaultText;
    if (selectedItems.length === 1) return selectedItems[0];
    return `${selectedItems.length} Terpilih`;
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={64} color={theme.colors.customGray[100]} />
      <Text style={styles.emptyText}>Tidak ada riwayat konsultasi yang sesuai.</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="error-outline" size={64} color={theme.colors.customGray[100]} />
      <Text style={styles.emptyText}>{error}</Text>
      <Button
        title="Coba Lagi"
        variant="primary"
        onPress={fetchConsultationHistory}
        style={{ marginTop: 16 }}
      />
    </View>
  );

  const renderLoading = () => (
    <View style={styles.emptyContainer}>
      <ActivityIndicator size="large" color={theme.colors.customGreen[300]} />
      <Text style={[styles.emptyText, { marginTop: 16 }]}>Memuat riwayat konsultasi...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <Text style={styles.pageTitle}>Riwayat Konsultasi</Text>
      </View>

      <View style={styles.topFiltersBar}>
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollViewContent}
        >
            <Pressable style={styles.filterButton} onPress={() => setDateFilterModalVisible(true)}>
                <Text style={styles.filterButtonText} numberOfLines={1}>{getDateFilterButtonText()}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={18} color={theme.colors.customGreen[300]} />
            </Pressable>
            <Pressable style={styles.filterButton} onPress={() => setStatusDrawerVisible(true)}>
                <Text style={styles.filterButtonText} numberOfLines={1}>{getMultiSelectButtonText(selectedStatuses, "Status")}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={18} color={theme.colors.customGreen[300]} />
            </Pressable>
            <Pressable style={styles.filterButton} onPress={() => setMetodeDrawerVisible(true)}>
                <Text style={styles.filterButtonText} numberOfLines={1}>{getMultiSelectButtonText(selectedMetodes, "Metode")}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={18} color={theme.colors.customGreen[300]} />
            </Pressable>
        </ScrollView>
      </View>

      <FlatList
        data={filteredHistory}
        renderItem={({ item }) => <HistoryCard {...item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={loading ? renderLoading : error ? renderError : renderEmptyList}
        refreshing={loading}
        onRefresh={fetchConsultationHistory}
      />

      {/* Date Filter Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDateFilterModalVisible}
        onRequestClose={() => setDateFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDateFilterModalVisible(false)}>
          <SafeAreaView style={styles.dateModalContentContainer} edges={['bottom', 'left', 'right']}>
            <Pressable style={styles.dateModalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.dateModalTitle}>Filter Tanggal Konsultasi</Text>
              <Pressable onPress={showStartDatePicker} style={styles.datePickerButton}>
                <Text style={styles.datePickerButtonTextLabel}>Dari:</Text>
                <Text style={styles.datePickerButtonTextValue}>{formatDateForDisplay(startDate) === "Pilih" ? "Pilih Tanggal Mulai" : formatDateForDisplay(startDate)}</Text>
              </Pressable>
              <Pressable onPress={showEndDatePicker} style={styles.datePickerButton}>
                <Text style={styles.datePickerButtonTextLabel}>Sampai:</Text>
                <Text style={styles.datePickerButtonTextValue}>{formatDateForDisplay(endDate) === "Pilih" ? "Pilih Tanggal Akhir" : formatDateForDisplay(endDate)}</Text>
              </Pressable>
              <View style={styles.dateModalActions}>
                <Button
                    title="Hapus"
                    variant="outline"
                    onPress={clearDateFilters}
                    style={{flex: 1}}
                />
                <Button
                    title="Set"
                    variant="primary"
                    onPress={applyDateFiltersAndClose}
                    style={{flex: 1}}
                />
              </View>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>

      {/* <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        onConfirm={handleStartDateConfirm}
        onCancel={hideStartDatePicker}
        maximumDate={endDate || undefined}
        date={startDate || new Date()}
      />
      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        onConfirm={handleEndDateConfirm}
        onCancel={hideEndDatePicker}
        minimumDate={startDate || undefined}
        date={endDate || startDate || new Date()}
      /> */}

      <MultiSelectDrawer
        isVisible={isStatusDrawerVisible}
        onClose={() => setStatusDrawerVisible(false)}
        title="Filter by Status"
        options={STATUS_FILTER_OPTIONS}
        selectedValues={selectedStatuses}
        onApply={(values) => setSelectedStatuses(values as HistoryStatus[])}
      />
      <MultiSelectDrawer
        isVisible={isMetodeDrawerVisible}
        onClose={() => setMetodeDrawerVisible(false)}
        title="Filter by Metode"
        options={METODE_FILTER_OPTIONS}
        selectedValues={selectedMetodes}
        onApply={(values) => setSelectedMetodes(values as HistoryMetode[])}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.customWhite[50],
    },
    headerContainer: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: theme.colors.customWhite[50],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.customGray[50],
    },
    pageTitle: {
      ...theme.typography.title,
      color: theme.colors.customGreen[300],
      textAlign: 'center',
    },
    topFiltersBar: {
      flexDirection: 'row',
      paddingVertical: 12,
      backgroundColor: theme.colors.customWhite[50],
      paddingHorizontal: 16,
    },
    filtersScrollViewContent: {
      alignItems: 'center',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.customWhite[50],
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.customGreen[200],
      marginHorizontal: 4,
      height: 36,
    },
    filterButtonText: {
      ...theme.typography.caption,
      color: theme.colors.customOlive[50],
      marginRight: 4,
    },
    // Date Filter Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    dateModalContentContainer: {
       backgroundColor: theme.colors.customWhite[50],
       borderTopLeftRadius: 16,
       borderTopRightRadius: 16,
    },
    dateModalContent: {
      padding:24
    },
    dateModalTitle: {
      ...theme.typography.subtitle1,
      color: theme.colors.customOlive[50],
      textAlign: 'center',
      marginBottom: 24,
    },
    datePickerButton: {
      borderWidth: 1,
      borderColor: theme.colors.customGray[100],
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.customWhite[50],
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    datePickerButtonTextLabel: {
      ...theme.typography.body2,
      color: theme.colors.customGray[200],
    },
    datePickerButtonTextValue: {
      ...theme.typography.body2,
      color: theme.colors.customOlive[50],
    },
    dateModalActions: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 16,
    },
    // List Styles
    listContentContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      ...theme.typography.body1,
      color: theme.colors.customGray[200],
      textAlign: 'center',
      marginTop: 16,
    },
  });