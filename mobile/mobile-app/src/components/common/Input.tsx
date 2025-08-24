import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  variant?: 'default' | 'outlined' | 'filled';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  variant = 'default',
  secureTextEntry,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const handleToggleSecure = () => {
    setIsSecure(!isSecure);
  };

  const inputContainerStyle = [
    styles.inputContainer,
    styles[variant],
    isFocused && styles.focused,
    error && styles.error,
  ];

  const showPasswordToggle = secureTextEntry && !rightIcon;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={20} 
            color={error ? '#FF3B30' : isFocused ? '#007AFF' : '#6C757D'}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[styles.input, inputStyle]}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#999"
          {...props}
        />
        
        {showPasswordToggle && (
          <TouchableOpacity onPress={handleToggleSecure} style={styles.rightIcon}>
            <Ionicons 
              name={isSecure ? 'eye-off' : 'eye'} 
              size={20} 
              color="#6C757D"
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !showPasswordToggle && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={error ? '#FF3B30' : isFocused ? '#007AFF' : '#6C757D'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.errorText, errorStyle]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  
  // Variants
  default: {
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: 'white',
  },
  outlined: {
    borderWidth: 2,
    borderColor: '#E9ECEF',
    backgroundColor: 'transparent',
  },
  filled: {
    borderWidth: 0,
    backgroundColor: '#F8F9FA',
  },
  
  // States
  focused: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  error: {
    borderColor: '#FF3B30',
  },
});

export default Input;
