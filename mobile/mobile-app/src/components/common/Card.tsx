import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  touchableProps?: Omit<TouchableOpacityProps, 'style' | 'onPress'>;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
  onPress,
  touchableProps,
}) => {
  const cardStyle = [
    styles.card,
    styles[variant],
    styles[`${padding}Padding`],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: 'white',
  },
  
  // Variants
  default: {
    backgroundColor: 'white',
  },
  elevated: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  outlined: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  
  // Padding
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: 8,
  },
  mediumPadding: {
    padding: 16,
  },
  largePadding: {
    padding: 24,
  },
});

export default Card;
