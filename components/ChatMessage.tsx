// component/ChatMessage.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import theme from '../app/theme';

interface ChatMessageProps {
  id: string;
  message: string;
  timestamp: string;
  isFromUser: boolean;
  senderName?: string;
  senderAvatar?: string;
  isFirstMessageFromSender?: boolean;
  type?: 'TEXT' | 'IMAGE'; // Add type prop
}

export default function ChatMessage({ 
  message, 
  timestamp, 
  isFromUser, 
  senderAvatar,
  isFirstMessageFromSender = false,
  type = 'TEXT' // Default to 'TEXT' for safety
}: ChatMessageProps) {
  
  const getAvatarSource = () => {
    if (senderAvatar) {
      return { uri: senderAvatar };
    }
    return require('@/assets/images/blank-profile.png');
  };

  // Render content based on type
  const renderMessageContent = () => {
    if (type === 'IMAGE') {
      return (
        <Image 
          source={{ uri: message }} 
          style={styles.messageImage}
          // Optional: add a loading indicator while the image loads
          onLoadStart={() => console.log('Image loading started...')}
          onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
        />
      );
    }
    
    // Default to rendering text
    return (
      <Text style={[styles.messageText, isFromUser ? styles.userText : styles.architectText]}>
        {message}
      </Text>
    );
  };

  return (
    <View style={[
      styles.container, 
      isFromUser ? styles.userMessage : styles.architectMessage,
      isFirstMessageFromSender && styles.firstMessageFromSender
    ]}>
      {!isFromUser && (
        <View style={styles.avatarContainer}>
          <Image 
            source={getAvatarSource()} 
            style={styles.avatar}
          />
        </View>
      )}
      
      <View style={[
        styles.bubble, 
        isFromUser ? styles.userBubble : styles.architectBubble,
        // Use a different style for image bubbles if needed (e.g., no padding)
        type === 'IMAGE' && styles.imageBubble
      ]}>
        {renderMessageContent()}
        <Text style={[styles.timestamp, isFromUser ? styles.userTimestamp : styles.architectTimestamp]}>
          {timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  architectMessage: {
    justifyContent: 'flex-start',
  },
  firstMessageFromSender: {
    marginTop: 12,
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: theme.colors.customGreen[300],
    borderBottomRightRadius: 4,
  },
  architectBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  // Style for image bubbles to remove padding and let the image fill it
  imageBubble: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  messageText: {
    ...theme.typography.body2,
    lineHeight: 20,
  },
  userText: {
    color: theme.colors.customWhite[50],
  },
  architectText: {
    color: theme.colors.customOlive[50],
  },
  // New style for the image content
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12, // Match bubble's radius
    resizeMode: 'cover',
  },
  timestamp: {
    ...theme.typography.caption,
    marginTop: 4,
    fontSize: 11,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  architectTimestamp: {
    color: theme.colors.customGray[200],
    // For images, timestamp might need a background to be visible
    alignSelf: 'flex-end', // Ensure it's at the bottom right
  },
});