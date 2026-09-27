import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../theme/colors';
import { SessionStatus } from '../../types';

interface BadgeProps {
  status: SessionStatus | string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const colors = useThemeColors();

  const getBadgeConfig = () => {
    switch (status) {
      case 'OPEN':
        return {
          label: 'OPEN',
          bg: colors.statusOpenBg,
          text: colors.statusOpenText,
        };
      case 'LOCKED':
        return {
          label: 'LOCKED',
          bg: colors.statusLockedBg,
          text: colors.statusLockedText,
        };
      case 'COMPLETED':
        return {
          label: 'COMPLETED',
          bg: colors.statusCompletedBg,
          text: colors.statusCompletedText,
        };
      default:
        return {
          label: status,
          bg: colors.surfaceSubtle,
          text: colors.textSecondary,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
