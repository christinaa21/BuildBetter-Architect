import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../app/theme';

interface LocationCardProps {
  date: string;
  time: string;
  location: string;
  locationDescription?: string;
}

export default function LocationCard({ date, time, location, locationDescription }: LocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if location is a URL (Google Maps or other map links)
  const isLocationUrl = (text: string): boolean => {
    const urlPattern = /^https?:\/\/.+/i;
    return urlPattern.test(text.trim());
  };

  const handleLocationPress = () => {
    if (isLocationUrl(location)) {
      // If location is already a URL, open it directly
      Linking.openURL(location);
    } else {
      // If location is plain text, create Google Maps search URL
      const encodedLocation = encodeURIComponent(location);
      const url = `https://maps.google.com/?q=${encodedLocation}`;
      Linking.openURL(url);
    }
  };

  const handleCardPress = () => {
    if (locationDescription) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleCardPress}
      activeOpacity={locationDescription ? 0.7 : 1}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="event-available" size={24} color={theme.colors.customGreen[300]} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Konsultasi Tatap Muka</Text>
        <Text style={styles.dateTime}>{date}, {time}</Text>
        
        <TouchableOpacity style={styles.locationContainer} onPress={handleLocationPress}>
          <MaterialIcons name="location-on" size={16} color={theme.colors.customGreen[300]} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.location} numberOfLines={1}>{location}</Text>
            {locationDescription && (
              <Text 
                style={[
                  styles.locationDescription,
                  !isExpanded && styles.truncatedDescription
                ]}
                numberOfLines={isExpanded ? undefined : 1}
              >
                {locationDescription}
              </Text>
            )}
            {locationDescription && !isExpanded && (
              <Text style={styles.expandHint}>Ketuk untuk lihat semua</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      {locationDescription && (
        <MaterialIcons 
          name={isExpanded ? "expand-less" : "expand-more"} 
          size={20} 
          color={theme.colors.customGray[200]} 
          style={styles.expandIcon}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.customWhite[50],
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.customGray[50],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    ...theme.typography.subtitle2,
    color: theme.colors.customOlive[50],
    marginBottom: 4,
  },
  dateTime: {
    ...theme.typography.body2,
    color: theme.colors.customOlive[50],
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 4,
  },
  location: {
    ...theme.typography.caption,
    color: theme.colors.customGreen[300],
    lineHeight: 16,
    textDecorationLine: 'underline',
  },
  locationDescription: {
    ...theme.typography.caption,
    color: theme.colors.customGray[200],
    lineHeight: 16,
    marginTop: 2,
  },
  truncatedDescription: {
    // Additional styling for truncated state if needed
  },
  expandHint: {
    ...theme.typography.caption,
    color: theme.colors.customGray[200],
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  expandIcon: {
    marginLeft: 8,
    marginTop: 4,
  },
});