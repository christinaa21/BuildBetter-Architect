import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../app/theme';
import { typography } from '@/app/theme/typography';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'outline';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  minHeight?: number;
  minWidth?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  onPress,
  disabled = false,
  selected = false,
  style,
  textStyle,
  minHeight = 48,
  minWidth = 120,
  paddingVertical = 12,
  paddingHorizontal = 24,
}) => {
  // Get the current text color based on button state
  const getTextColor = () => {
    if (disabled && variant != 'primary') return theme.colors.customGray[200];
    return variant === 'primary' ? theme.colors.customWhite[50] : theme.colors.customGreen[300];
  };

  // Get the current text size based on button state
  const getTextSize = () => {
    if (disabled) return theme.typography.body1.fontSize;
    return theme.typography.body1.fontSize + 9;
  };

  // Handle icon with proper TypeScript safety
  const renderIcon = () => {
    if (!icon) return null;
    
    // For safety, we don't attempt to modify the icon directly
    // Instead, we wrap it in a container with the appropriate styling
    return (
      <View
        style={[
          styles.iconContainer,
          iconPosition === 'right' ? styles.iconRight : styles.iconLeft,
        ]}
      >
        {icon}
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        styles.button,
        // Base styles
        variant === 'primary' && styles.primaryButton,
        variant === 'outline' && styles.outlineButton,
        // Hover or Selected state
        (hovered || selected) && variant === 'primary' && styles.primaryButtonHover,
        (hovered || selected) && variant === 'outline' && styles.outlineButtonHover,
        // Pressed state
        pressed && variant === 'primary' && styles.primaryButtonPressed,
        pressed && variant === 'outline' && styles.outlineButtonPressed,
        // Disabled state
        disabled && variant === 'primary' && styles.primaryButtonDisabled,
        disabled && variant === 'outline' && styles.outlineButtonDisabled,
        style,
      ]}
    >
    {/* Outer border container for primary button */}
    {variant === 'primary' && (
    <View>
      <View style={styles.outerLayer} />
        <View style={styles.primaryBorderContainer}>
            <View style={[styles.innerContainer, {minHeight: minHeight, minWidth: minWidth, paddingVertical: paddingVertical, paddingHorizontal: paddingHorizontal}]}>
            <View
                style={[
                styles.contentContainer,
                { flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row' },
                ]}
            >
                {renderIcon()}
                <Text style={[styles.text, typography.body1, { color: getTextColor() }, textStyle]}>
                {title}
                </Text>
            </View>
            </View>
        </View>
    </View>
    )}

    {/* For outline buttons or other variants */}
    {variant !== 'primary' && (
      <View style={[styles.innerContainer, {minHeight: minHeight, minWidth: minWidth, paddingVertical: paddingVertical, paddingHorizontal: paddingHorizontal}]}>
        <View
          style={[
            styles.contentContainer,
            { flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row' },
          ]}
        >
          {renderIcon()}
          <Text style={[styles.text, typography.body1, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </View>
      </View>
    )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  outerLayer: {
    position: 'absolute',
    width:'100%',
    height:'100%',
    borderRadius: 26,
  },
  primaryBorderContainer: {
    borderWidth: 2,
    borderColor: theme.colors.customWhite[50],
    borderRadius: 24,
    margin: 2,
  },
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: 8,
    marginBottom: 2,
  },
  iconRight: {
    marginLeft: 8,
    marginBottom: 2,
  },
  // Primary Button Styles
  primaryButton: {
    backgroundColor: theme.colors.customGreen[300],
  },
  primaryInnerBorder: {
    borderWidth: 1,
    borderColor: theme.colors.customWhite[50],
  },
  primaryButtonHover: {
    backgroundColor: theme.colors.customGreen[600],
  },
  primaryButtonPressed: {
    backgroundColor: theme.colors.customGreen[700],
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.customGray[200],
  },
  // Outline Button Styles
  outlineButton: {
    backgroundColor: theme.colors.customWhite[50],
    borderWidth: 1,
    borderColor: theme.colors.customGreen[300],
  },
  outlineButtonHover: {
    backgroundColor: '#CAE1DB',
  },
  outlineButtonPressed: {
    backgroundColor: '#8CA8A1',
  },
  outlineButtonDisabled: {
    borderColor: theme.colors.customGray[200],
    backgroundColor: 'transparent',
  },
  text: {
    textAlign: 'center',
  },
});

export default Button;