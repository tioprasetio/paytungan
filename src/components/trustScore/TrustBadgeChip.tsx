import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrustBadge, UserTrustScore } from '../../types';
import {
  Crown,
  Zap,
  ShieldCheck,
  Coffee,
  AlertTriangle,
  Sparkles,
  Award,
} from 'lucide-react-native';

interface TrustBadgeChipProps {
  trustScore?: UserTrustScore | null;
  badge?: TrustBadge | null;
  type?: 'buyer' | 'runner' | 'auto';
  showScore?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

const getBadgeIcon = (code?: string) => {
  switch (code) {
    case 'MASTER':
      return Crown;
    case 'SATSET':
      return Zap;
    case 'SULTAN':
      return Sparkles;
    case 'AMANAH':
    case 'ANDAL':
      return ShieldCheck;
    case 'NGARET':
      return AlertTriangle;
    case 'SANTAI':
      return Coffee;
    default:
      return Award;
  }
};

export const TrustBadgeChip: React.FC<TrustBadgeChipProps> = ({
  trustScore,
  badge: customBadge,
  type = 'auto',
  showScore = true,
  onPress,
  size = 'md',
}) => {
  // Determine which badge to show if trustScore is passed
  const badge = useMemo(() => {
    if (customBadge) return customBadge;
    if (!trustScore) return null;
    if (type === 'runner') return trustScore.runnerBadge;
    if (type === 'buyer') return trustScore.buyerBadge;
    // Auto: prioritize warning if ngaret, else runner master, else buyer
    if (trustScore.isNgaret) return trustScore.buyerBadge;
    if (trustScore.runnerBadge.level === 'MASTER')
      return trustScore.runnerBadge;
    return trustScore.buyerBadge;
  }, [customBadge, trustScore, type]);

  if (!badge) return null;

  const isWarning = badge.level === 'WARNING';
  const isMaster = badge.level === 'MASTER';
  const IconComponent = getBadgeIcon(badge.badgeCode);

  const scoreDisplay = trustScore?.overallScore ?? trustScore?.buyerScore;

  const content = (
    <View
      style={[
        styles.container,
        size === 'sm' ? styles.containerSm : styles.containerMd,
        {
          borderColor: isWarning
            ? '#FCA5A5'
            : isMaster
            ? '#FDE68A'
            : badge.color + '40',
        },
      ]}
    >
      <IconComponent size={size === 'sm' ? 11 : 13} color={badge.color} />
      <Text
        style={[
          styles.titleText,
          size === 'sm' ? styles.titleTextSm : styles.titleTextMd,
          { color: badge.color },
        ]}
        numberOfLines={1}
      >
        {badge.title}
      </Text>

      {showScore && scoreDisplay !== undefined && (
        <View
          style={[styles.scorePill, { backgroundColor: badge.color + '20' }]}
        >
          <Text style={[styles.scoreText, { color: badge.color }]}>
            {scoreDisplay}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  containerMd: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  titleText: {
    fontWeight: '700',
  },
  titleTextSm: {
    fontSize: 10,
  },
  titleTextMd: {
    fontSize: 11,
  },
  scorePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 2,
  },
  scoreText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
