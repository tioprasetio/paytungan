import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useThemeColors } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'flat' | 'highlight';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
}) => {
  const colors = useThemeColors();

  const getCardStyle = (): StyleProp<ViewStyle> => {
    const base: ViewStyle[] = [
      styles.card,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
    ];

    if (variant === 'default') base.push(styles.elevated);
    else if (variant === 'flat')
      base.push(styles.flat, { backgroundColor: colors.surfaceSubtle });
    else if (variant === 'highlight') base.push(styles.highlight);

    return [base, style];
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={getCardStyle()}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  flat: {
    borderWidth: 0,
  },
  highlight: {
    borderColor: '#C7D2FE',
    backgroundColor: '#FAFAFF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
});
