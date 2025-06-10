// component/WaitingMessage.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../app/theme';

interface WaitingMessageProps {
  consultationType: 'online' | 'offline';
  consultationDate?: string;
  consultationTime?: string;
}

export default function WaitingMessage({ 
  consultationType, 
  consultationDate, 
  consultationTime 
}: WaitingMessageProps) {
  const getWaitingMessage = () => {
    if (consultationType === 'online') {
      return {
        greeting: 'Tunggu sebentar ya...',
        details: `Jadwal Konsultasi Chat akan dimulai pada ${consultationDate}, pukul ${consultationTime}.`
      };
    } else {
      return {
        greeting: 'Tunggu sebentar ya...',
        details: 'Kamu baru bisa mengirimkan pesan kepada arsitek 1 jam sebelum konsultasi tatap muka dimulai.'
      };
    }
  };

  const message = getWaitingMessage();
  
  return (
    <View style={styles.container}>
      <MaterialIcons 
        name={consultationType === 'online' ? 'chat' : 'schedule'} 
        size={64} 
        color={theme.colors.customGray[200]} 
        style={styles.icon}
      />
      <Text style={styles.greetingText}>
        {message.greeting}
      </Text>
      <Text style={styles.detailsText}>
        {message.details}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    marginBottom: 16,
  },
  greetingText: {
    ...theme.typography.body1,
    color: theme.colors.customGray[200],
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsText: {
    ...theme.typography.body1,
    color: theme.colors.customOlive[50],
    textAlign: 'center',
  },
});