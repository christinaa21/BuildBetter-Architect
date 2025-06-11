// component/ChatMessage.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal, 
  Dimensions,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../app/theme';

interface ChatMessageProps {
  id: string;
  message: string;
  timestamp: string;
  isFromUser: boolean;
  senderName?: string;
  senderAvatar?: string;
  isFirstMessageFromSender?: boolean;
  type?: 'TEXT' | 'IMAGE';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ChatMessage({ 
  message, 
  timestamp, 
  isFromUser, 
  senderAvatar,
  isFirstMessageFromSender = false,
  type = 'TEXT'
}: ChatMessageProps) {
  
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
  const getAvatarSource = () => {
    if (senderAvatar) {
      return { uri: senderAvatar };
    }
    return require('@/assets/images/blank-profile.png');
  };

  const isLocalImage = (uri: string) => {
    return uri.startsWith('file://') || uri.startsWith('content://') || !uri.startsWith('http');
  };

  // Render content based on type
  const renderMessageContent = () => {
    if (type === 'IMAGE') {
      const imageSource = isLocalImage(message) ? { uri: message } : { uri: message };
      
      if (imageError) {
        return (
          <View style={styles.imageErrorContainer}>
            <MaterialIcons name="broken-image" size={48} color={theme.colors.customGray[200]} />
            <Text style={styles.imageErrorText}>Failed to load image</Text>
          </View>
        );
      }

      return (
        <View style={styles.imageContainer}>
          <TouchableOpacity 
            onPress={() => setShowFullImage(true)}
            style={styles.imageWrapper}
          >
            <Image 
              source={imageSource}
              style={styles.messageImage}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={(e) => {
                console.log('Image loading error:', e.nativeEvent.error);
                setImageLoading(false);
                setImageError(true);
              }}
              resizeMode="cover"
            />
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color={theme.colors.customWhite[50]} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    
    // Default to rendering text
    return (
      <Text style={[styles.messageText, isFromUser ? styles.userText : styles.architectText]}>
        {message}
      </Text>
    );
  };

  const renderFullImageModal = () => {
    if (type !== 'IMAGE' || imageError) return null;

    return (
      <Modal 
        visible={showFullImage} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <SafeAreaView style={styles.fullImageModal}>
          <View style={styles.fullImageContainer}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowFullImage(false)}
            >
              <MaterialIcons name="close" size={30} color={theme.colors.customWhite[50]} />
            </TouchableOpacity>
            
            <Image 
              source={isLocalImage(message) ? { uri: message } : { uri: message }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <>
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
          type === 'IMAGE' && styles.imageBubble
        ]}>
          {renderMessageContent()}
          <Text style={[
            styles.timestamp, 
            isFromUser ? styles.userTimestamp : styles.architectTimestamp,
            type === 'IMAGE' && styles.imageTimestamp
          ]}>
            {timestamp}
          </Text>
        </View>
      </View>
      
      {renderFullImageModal()}
    </>
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
  imageContainer: {
    position: 'relative',
  },
  imageWrapper: {
    position: 'relative',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imageErrorContainer: {
    width: 200,
    height: 150,
    backgroundColor: theme.colors.customGray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imageErrorText: {
    ...theme.typography.caption,
    color: theme.colors.customGray[200],
    marginTop: 8,
    textAlign: 'center',
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
  },
  imageTimestamp: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: theme.colors.customWhite[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  // Full image modal styles
  fullImageModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  fullImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 25,
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
});