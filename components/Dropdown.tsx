import React, { useState, useRef, useCallback, useMemo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  Dimensions,
  TextInput,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../app/theme';
import { typography } from '@/app/theme/typography';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: { label: string; value: any; additional?: React.ReactNode }[];
  value?: any;
  onChange: (value: any) => void;
  error?: string;
  searchPlaceholder?: string;
  maxHeight?: number;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder = 'Pilih salah satu',
  options,
  value,
  onChange,
  error,
  searchPlaceholder = 'Cari...',
  maxHeight= 0.6,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const labelAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;

  const selectedOption = options.find(option => option.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    
    return options.filter(option => 
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const animateFocus = (focused: boolean) => {
    if (disabled) return;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    Animated.parallel([
      Animated.timing(borderColorAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnimation, {
        toValue: focused || value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled) return;
    
    setIsOpen(true);
    setIsFocused(true);
    setSearchQuery('');
    animateFocus(true);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setIsOpen(false);
    setIsFocused(false);
    setSearchQuery('');
    animateFocus(false);
  };

  const handleSelect = (option: { label: string; value: any }) => {
    Keyboard.dismiss();
    onChange(option.value);
    handleClose();
  };

  const getBorderColor = () => {
    if (disabled) return theme.colors.customGray[50];
    if (error) return 'red';
    return borderColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.customGray[50], theme.colors.customGreen[300]],
    });
  };

  const labelStyle = {
    transform: [
      {
        translateY: labelAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Animated.Text 
          style={[
            styles.label,
            typography.body2,
            labelStyle,
            isFocused && !error && !disabled && styles.labelFocused,
            error && !disabled && styles.labelError,
            disabled && styles.labelDisabled,
          ]}
        >
          {label || placeholder}
        </Animated.Text>
      </View>

      <Pressable onPress={handlePress} disabled={disabled}>
        <Animated.View
          style={[
            styles.inputContainer,
            { borderColor: getBorderColor() },
            disabled && styles.inputContainerDisabled,
          ]}
        >
          <Text 
            style={[
              styles.selectedText,
              typography.body1,
              !selectedOption && styles.placeholder,
              disabled && styles.textDisabled,
            ]}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <MaterialIcons 
            name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color={disabled ? theme.colors.customGray[100] : theme.colors.customOlive[50]}
            style={styles.icon}
          />
        </Animated.View>
      </Pressable>

      {error && !disabled && (
        <Text style={[styles.errorText, typography.caption]}>
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen && !disabled}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View 
            style={[styles.modalContent, {maxHeight: Dimensions.get('window').height * maxHeight}]} 
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.searchContainer}>
              <MaterialIcons 
                name="search" 
                size={20} 
                color={theme.colors.customOlive[50]}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, typography.body1]}
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={theme.colors.customGray[100]}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0]);
                  }
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <MaterialIcons 
                    name="close" 
                    size={20} 
                    color={theme.colors.customOlive[50]}
                  />
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView 
              style={{maxHeight: Dimensions.get('window').height * maxHeight}}
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.option,
                      option.value === value && styles.selectedOption,
                      pressed && styles.pressedOption
                    ]}
                    onPress={() => handleSelect(option)}
                  >
                    {({ pressed }) => (
                      <>
                        <Text 
                          style={[
                            styles.optionText,
                            typography.body1,
                            option.value === value && styles.selectedOptionText,
                            pressed && styles.pressedOptionText
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.additional}
                      </>
                    )}
                  </Pressable>
                ))
              ) : (
                <View style={styles.noResults}>
                  <Text style={[styles.noResultsText, typography.body1]}>
                    No results found
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    paddingTop: 8,
  },
  labelContainer: {
    position: 'relative',
    height: 20,
    marginBottom: 4,
  },
  label: {
    position: 'absolute',
    left: 2,
    color: theme.colors.customOlive[50],
    backgroundColor: 'transparent',
  },
  labelFocused: {
    color: theme.colors.customGreen[300],
  },
  labelError: {
    color: 'red',
  },
  labelDisabled: {
    color: theme.colors.customGray[100],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: theme.colors.customWhite[50],
    shadowColor: theme.colors.customGreen[300],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  inputContainerDisabled: {
    backgroundColor: theme.colors.customWhite[50],
    shadowOpacity: 0,
    elevation: 0,
  },
  selectedText: {
    flex: 1,
    padding: 16,
    color: theme.colors.customGreen[500],
  },
  placeholder: {
    color: theme.colors.customGray[100],
  },
  textDisabled: {
    color: theme.colors.customGray[100],
  },
  icon: {
    padding: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.9,
    backgroundColor: theme.colors.customWhite[50],
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.customGray[50],
    backgroundColor: theme.colors.customWhite[50],
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: theme.colors.customGreen[500],
    padding: 0,
  },
  clearButton: {
    padding: 8,
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.customGray[50],
  },
  selectedOption: {
    backgroundColor: theme.colors.customGreen[300],
  },
  pressedOption: {
    backgroundColor: theme.colors.customGreen[600],
  },
  optionText: {
    color: theme.colors.customGreen[500],
  },
  selectedOptionText: {
    color: theme.colors.customWhite[50],
  },
  pressedOptionText: {
    color: theme.colors.customWhite[50],
  },
  noResults: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    color: theme.colors.customGray[100],
  },
});

export default Dropdown;