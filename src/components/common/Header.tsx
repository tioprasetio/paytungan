import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '../../theme/colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  backIcon,
  rightAction,
  transparent = false,
}) => {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : colors.background,
          borderBottomColor: transparent ? 'transparent' : colors.border,
        },
      ]}
    >
      <View style={styles.leftRow}>
        {onBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {backIcon || <ArrowLeft size={22} color={colors.textPrimary} />}
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  rightAction: {
    marginLeft: 12,
  },
});
