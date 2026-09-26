import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { SessionStatus } from '../../types';

interface BadgeProps {
  status: SessionStatus | string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'OPEN':
        return {
          label: 'OPEN',
          bg: Colors.statusOpenBg,
          text: Colors.statusOpenText,
        };
      case 'LOCKED':
        return {
          label: 'LOCKED',
          bg: Colors.statusLockedBg,
          text: Colors.statusLockedText,
        };
      case 'COMPLETED':
        return {
          label: 'COMPLETED',
          bg: Colors.statusCompletedBg,
          text: Colors.statusCompletedText,
        };
      default:
        return {
          label: status,
          bg: '#F1F5F9',
          text: '#64748B',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
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
