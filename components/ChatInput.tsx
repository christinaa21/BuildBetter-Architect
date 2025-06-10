import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import theme from '../app/theme';

interface ChatInputProps {
  onSendMessage: (message: string, images?: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Tulis pesanmu disini",
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const pickImages = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required to select images.",
          [{ text: "OK" }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const imageUris = result.assets.map(asset => asset.uri);
        // Send images immediately after selection
        onSendMessage('', imageUris);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert(
        "Error",
        "Failed to select images. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.imageButton}
          onPress={pickImages}
          disabled={disabled}
        >
          <Ionicons 
            name="image-outline" 
            size={24} 
            color={disabled ? theme.colors.customGray[100] : theme.colors.customOlive[50]} 
          />
        </TouchableOpacity>
        
        <TextInput
          style={[styles.textInput, disabled && styles.disabledInput]}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.customGray[200]}
          multiline
          maxLength={500}
          editable={!disabled}
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, (!message.trim() || disabled) && styles.disabledButton]}
          onPress={handleSend}
          disabled={!message.trim() || disabled}
        >
          <Ionicons 
            name="send" 
            size={16} 
            color={(!message.trim() || disabled) ? theme.colors.customGray[200] : theme.colors.customWhite[50]} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.customWhite[50],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.customGray[50],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F8F8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  imageButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    ...theme.typography.body2,
    color: theme.colors.customOlive[50],
    marginHorizontal: 8,
    maxHeight: 100,
    alignSelf: 'center',
    marginTop: 2,
  },
  disabledInput: {
    color: theme.colors.customGray[100],
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.customGreen[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: theme.colors.customGray[50],
  },
});