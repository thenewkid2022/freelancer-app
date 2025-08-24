import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: ViewStyle;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#007AFF',
  text,
  style,
  overlay = false,
}) => {
  const containerStyle = [
    styles.container,
    overlay && styles.overlay,
    style,
  ];

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoadingSpinner;
