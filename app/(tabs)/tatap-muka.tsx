// app/buildconsult/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import Button from '@/components/Button';
import Textfield from '@/components/Textfield';
import ConsultationCard, { ConsultationStatus } from '@/components/ConsultationCard';
import { useAuth } from '@/context/AuthContext';
import { authApi, Consultation } from '@/services/api';
import * as SecureStore from 'expo-secure-store';

// Helper function to map consultation status to ConsultationStatus
const mapConsultationStatus = (status: string): ConsultationStatus => {
  switch (status) {
    case 'scheduled':
      return 'Dijadwalkan';
    case 'in-progress':
      return 'Berlangsung';
    case 'ended':
      return 'Berakhir';
    case 'cancelled':
      return 'Dibatalkan';
    case 'waiting-for-payment':
      return 'Menunggu pembayaran';
    case 'waiting-for-confirmation':
      return 'Menunggu konfirmasi';
    default:
      return 'Berakhir';
  }
};

export default function TatapMuka() {
  const router = useRouter();
  const { user } = useAuth();
  const name = user?.username;
  
  const [hasConsultationHistory, setHasConsultationHistory] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define allowed statuses for display
  const allowedStatuses: Consultation['status'][] = ['scheduled', 'in-progress', 'ended'];

  // Filter consultations based on search query AND status
  const filteredConsultations = consultations.filter(consultation => {
    // First filter by allowed statuses
    const hasAllowedStatus = allowedStatuses.includes(consultation.status);
    
    // Then filter by search query (user name or city)
    const matchesSearch = consultation.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         consultation.userCity.toLowerCase().includes(searchQuery.toLowerCase());
    
    return hasAllowedStatus && matchesSearch;
  });

  useEffect(() => {
    fetchConsultationHistory();
  }, []);

  const fetchConsultationHistory = async () => {
    try {
      setLoading(true);
      
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        setError('Please log in to view consultation history.');
        setLoading(false);
        return;
      }

      // Call the architect's consultation API
      const consultationResponse = await authApi.getConsultation({
        type: 'offline',
        status: undefined,
        includeCancelled: false,
        upcoming: undefined,
      });
      
      if (consultationResponse.code !== 200 || !consultationResponse.data) {
        setError(consultationResponse.error || 'Failed to fetch consultation history');
        setLoading(false);
        return;
      }

      const consultationsData: Consultation[] = consultationResponse.data;

      if (consultationsData.length === 0) {
        setHasConsultationHistory(false);
        setLoading(false);
        return;
      }

      // Sort by creation date descending to get the latest first
      const sortedConsultations = consultationsData
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Group consultations by roomId and get the latest
      const latestConsultationsMap = new Map<string, Consultation>();

      sortedConsultations.forEach(consultation => {
        // Use roomId as the primary key for grouping.
        // If roomId is null (e.g., for an offline consultation), use the unique consultation.id instead.
        const groupKey = consultation.roomId || consultation.id;

        // Because the list is sorted with the newest first, we only add
        // the first one we encounter for each groupKey, effectively getting the latest.
        if (!latestConsultationsMap.has(groupKey)) {
          latestConsultationsMap.set(groupKey, consultation);
        }
      });

      const uniqueLatestConsultations = Array.from(latestConsultationsMap.values());
      uniqueLatestConsultations.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      // Update state with the processed, unique list of latest consultations
      setConsultations(uniqueLatestConsultations);
      
      // Check the processed list to determine if there's history to show
      const hasDisplayableConsultations = uniqueLatestConsultations.some(consultation => 
        allowedStatuses.includes(consultation.status)
      );
      
      setHasConsultationHistory(hasDisplayableConsultations);
      setError(null);

    } catch (err) {
      console.error('Error fetching consultation history:', err);
      setError('Network error or server unavailable. Please try again later.');
      setHasConsultationHistory(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleChatPress = (consultation: Consultation) => {
    if (!consultation.roomId) {
      Alert.alert("Error", "Chat room not available for this consultation.");
      return;
    }
    // Navigate to chat with user, passing roomId and the latest consultationId
    router.push({
      pathname: '/chat/[roomId]',
      params: { 
        roomId: consultation.roomId,
        consultationId: consultation.id 
      },
    });
  };

  const handleRetry = () => {
    fetchConsultationHistory();
  };

  // --- RENDER LOGIC ---

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.searchContainer}>
          <Textfield
            icon={<MaterialIcons name="search" size={16}/>}
            placeholder="Cari konsultasi di sini..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.customGreen[300]} />
          <Text style={[theme.typography.body2, styles.loadingText]}>
            Memuat daftar konsultasi...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.searchContainer}>
          <Textfield
            icon={<MaterialIcons name="search" size={16}/>}
            placeholder="Cari konsultasi di sini..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={theme.colors.customGray[100]} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Coba Lagi"
            variant="primary"
            onPress={handleRetry}
          />
        </View>
      </SafeAreaView>
    );
  }

  // First time architect view (no consultation history)
  if (!hasConsultationHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.searchContainer}>
          <Textfield
            icon={<MaterialIcons name="search" size={16}/>}
            placeholder="Cari konsultasi di sini..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <View style={styles.welcomeContent}>
          <Text style={[theme.typography.title, styles.titleText]}>
            Hai, {name}!
          </Text>
          <Text style={[theme.typography.body1, styles.description]}>
            Belum ada konsultasi tatap muka yang tersedia. Daftar konsultasi Anda akan muncul di sini.
          </Text>
          
          <View style={styles.infoBox}>
            <Text style={[theme.typography.body2, styles.infoTitle]}>
              Sebagai informasi:
            </Text>
            <Text style={[theme.typography.body2, styles.infoText]}>
              • 1 sesi chat = 30 menit
            </Text>
            <Text style={[theme.typography.body2, styles.infoText]}>
              • 1 sesi tatap muka = 1 jam
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Architect view with consultation history
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Textfield
          icon={<MaterialIcons name="search" size={16}/>}
          placeholder="Cari konsultasi di sini..."
          paddingVertical={12}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <ScrollView style={styles.consultationList} showsVerticalScrollIndicator={false}>
        <View style={styles.infoChip}>
          <Text style={[theme.typography.title, {color: theme.colors.customGreen[300]}]}>Daftar Konsultasi</Text>
        </View>
        
        {filteredConsultations.length === 0 && searchQuery.trim() !== '' && (
          <View style={styles.emptySearchContainer}>
            <MaterialIcons name="search-off" size={64} color={theme.colors.customGray[100]} />
            <Text style={styles.emptySearchText}>
              Tidak ada konsultasi yang sesuai dengan pencarian "{searchQuery}".
            </Text>
          </View>
        )}

        {filteredConsultations.map((consultation) => (
          <ConsultationCard
            key={consultation.roomId || consultation.id}
            id={consultation.id}
            userName={consultation.userName}
            consultationType={consultation.type}
            status={mapConsultationStatus(consultation.status)}
            startDate={consultation.startDate}
            endDate={consultation.endDate}
            onChatPress={() => handleChatPress(consultation)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.customWhite[50],
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: theme.colors.customOlive[50],
    marginTop: 16,
  },
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    ...theme.typography.body1,
    color: theme.colors.customGray[200],
    textAlign: 'center',
    marginVertical: 16,
  },
  // First time architect styles
  welcomeContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: '24%',
    alignItems: 'center',
  },
  titleText: {
    color: theme.colors.customGreen[300],
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: theme.colors.customOlive[50],
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#CAE1DB',
    borderRadius: 16,
    padding: 16,
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  infoTitle: {
    color: theme.colors.customOlive[50],
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: theme.colors.customOlive[50],
    marginBottom: 4,
  },
  
  // Architect consultation history styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  infoChip: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 4,
  },
  consultationList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptySearchText: {
    ...theme.typography.body1,
    color: theme.colors.customGray[200],
    textAlign: 'center',
    marginTop: 16,
  },
});