import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, TextStyle } from 'react-native';
import { Colors, useThemeColors } from '../../theme/colors';

interface AvatarItem {
  id?: number | string;
  name?: string;
  avatarUrl?: string;
}

interface AvatarStackProps {
  users?: AvatarItem[];
  maxDisplay?: number;
  size?: number;
  showAddButton?: boolean;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
];

export const AvatarStack: React.FC<AvatarStackProps> = ({
  users = [],
  maxDisplay = 3,
  size = 32,
  showAddButton = true,
}) => {
  const colors = useThemeColors();
  const displayList = users.length > 0 ? users.slice(0, maxDisplay) : [1, 2, 3];
  const remainingCount = users.length > maxDisplay ? users.length - maxDisplay : 0;

  const getWrapperStyle = (index: number): ViewStyle => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    marginLeft: index === 0 ? 0 : -size * 0.35,
    zIndex: displayList.length - index,
    borderColor: colors.surface,
  });

  const badgeOffsetStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    marginLeft: -size * 0.35,
    borderColor: colors.surface,
  };

  const initialTextStyle: TextStyle = {
    fontSize: size * 0.4,
  };

  const moreTextStyle: TextStyle = {
    fontSize: size * 0.35,
  };

  const addTextStyle: TextStyle = {
    fontSize: size * 0.45,
  };

  return (
    <View style={styles.container}>
      {displayList.map((user, index) => {
        const fallbackImg = DEFAULT_AVATARS[index % DEFAULT_AVATARS.length];
        const isObject = typeof user === 'object' && user !== null;
        const uri = isObject && user.avatarUrl ? user.avatarUrl : fallbackImg;
        const nameInitial = isObject && user.name ? user.name.charAt(0).toUpperCase() : '?';

        return (
          <View
            key={isObject && user.id ? user.id : index}
            style={[styles.avatarWrapper, getWrapperStyle(index)]}
          >
            {uri ? (
              <Image source={{ uri }} style={styles.image} />
            ) : (
              <View style={[styles.fallback, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.initialText, initialTextStyle, { color: colors.primary }]}>
                  {nameInitial}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {remainingCount > 0 ? (
        <View style={[styles.avatarWrapper, styles.moreBadge, badgeOffsetStyle, { backgroundColor: colors.surfaceSubtle }]}>
          <Text style={[styles.moreText, moreTextStyle, { color: colors.textSecondary }]}>
            +{remainingCount}
          </Text>
        </View>
      ) : showAddButton ? (
        <View style={[styles.avatarWrapper, styles.addBadge, badgeOffsetStyle, { backgroundColor: colors.surfaceSubtle }]}>
          <Text style={[styles.addText, addTextStyle, { color: colors.textSecondary }]}>+</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  moreBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#FFFFFF',
    zIndex: 0,
  },
  moreText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  addBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#FFFFFF',
    zIndex: 0,
  },
  addText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
