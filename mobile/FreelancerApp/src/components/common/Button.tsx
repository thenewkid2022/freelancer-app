import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? '#007AFF' : 'white'} 
        />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon} 
              size={size === 'small' ? 14 : size === 'large' ? 20 : 16} 
              color={variant === 'outline' ? '#007AFF' : 'white'}
              style={styles.icon}
            />
          )}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
  },
  
  // Variants
  primary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  primaryText: {
    color: 'white',
  },
  
  secondary: {
    backgroundColor: '#6C757D',
    borderColor: '#6C757D',
  },
  secondaryText: {
    color: 'white',
  },
  
  danger: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  dangerText: {
    color: 'white',
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#007AFF',
  },
  outlineText: {
    color: '#007AFF',
  },
  
  // Sizes
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallText: {
    fontSize: 14,
  },
  
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mediumText: {
    fontSize: 16,
  },
  
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // States
  disabled: {
    backgroundColor: '#E9ECEF',
    borderColor: '#E9ECEF',
  },
  disabledText: {
    color: '#6C757D',
  },
});

export default Button;
