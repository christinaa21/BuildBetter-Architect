import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../app/theme';
import { typography } from '@/app/theme/typography';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface TextfieldProps extends TextInputProps {
  label?: string;
  example?: string;
  error?: string;
  isPassword?: boolean;
  validate?: (text: string) => string | undefined;
  onValidation?: (isValid: boolean) => void;
}

const Textfield: React.FC<TextfieldProps> = ({
  label,
  example,
  error,
  isPassword,
  validate,
  onValidation,
  onChangeText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>(error);
  const [value, setValue] = useState(props.value || '');
  const [shouldValidate, setShouldValidate] = useState(false);
  
  const borderColorAnim = React.useRef(new Animated.Value(0)).current;
  const labelAnimation = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  const validateInput = useCallback(() => {
    if (validate && shouldValidate) {
      const validationError = validate(value);
      setLocalError(validationError);
      onValidation?.(!validationError);
    }
  }, [value, validate, shouldValidate, onValidation]);

  useEffect(() => {
    setLocalError(error);
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(validateInput, 100);
    return () => clearTimeout(timer);
  }, [value, validateInput]);

  useEffect(() => {
    if (isFocused && localError) {
      setLocalError(undefined);
    }
  }, [value, isFocused]);

  const animateFocus = (focused: boolean) => {
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

  const handleChangeText = (text: string) => {
    setValue(text);
    if (localError) {
      setLocalError(undefined);
    }
    onChangeText?.(text);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShouldValidate(false);
    animateFocus(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setShouldValidate(true);
    animateFocus(false);
    validateInput();
  };

  const getBorderColor = () => {
    if (localError) return 'red';
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
            isFocused && !localError && styles.labelFocused,
            localError && styles.labelError,
          ]}
        >
          {label || props.placeholder}
        </Animated.Text>
      </View>
      
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
        ]}
      >
        <TextInput
          style={[styles.input, typography.body1]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          value={value}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor={theme.colors.customGray[100]}
          placeholder={!isFocused ? example : ''}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? 
              <MaterialIcons name="visibility" size={20} color={theme.colors.customOlive[50]} /> :
              <MaterialIcons name="visibility-off" size={20} color={theme.colors.customOlive[50]} />
            }
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {localError && (
        <Text style={[styles.errorText, typography.caption]}>
          {localError}
        </Text>
      )}
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
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: theme.colors.customWhite[50],
    shadowColor: theme.colors.customGreen[300],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  input: {
    flex: 1,
    padding: 16,
    color: theme.colors.customGreen[500],
  },
  errorText: {
    color: 'red',
    marginTop: 4,
  },
  eyeIcon: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Textfield;