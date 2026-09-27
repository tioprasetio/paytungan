import { useThemeStore } from '../stores/themeStore';

export const LightColors = {
  // Brand Colors - Electric Indigo & Emerald Mint
  primary: '#4F46E5', // Electric Indigo
  primaryDark: '#3730A3',
  primaryLight: '#EEF2FF',
  primaryHover: '#4338CA',

  secondary: '#4F46E5',
  secondaryLight: '#EEF2FF',

  accent: '#10B981', // Emerald Mint
  accentDark: '#059669',
  accentLight: '#ECFDF5',

  // Neutrals - Off-White & Clean Slate
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // System Statuses
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Status Badges
  statusOpenBg: '#ECFDF5',
  statusOpenText: '#059669',
  statusLockedBg: '#FFFBEB',
  statusLockedText: '#D97706',
  statusCompletedBg: '#EFF6FF',
  statusCompletedText: '#2563EB',

  // iOS Shadow Helper
  shadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  shadowElevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
};

export const DarkColors = {
  // Brand Colors - Vibrant Indigo & Emerald
  primary: '#6366F1', // Soft Electric Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#1E1B4B',
  primaryHover: '#818CF8',

  secondary: '#6366F1',
  secondaryLight: '#1E1B4B',

  accent: '#10B981',
  accentDark: '#34D399',
  accentLight: '#064E3B',

  // Neutrals - Slate Midnight
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSubtle: '#334155',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.06)',

  // Typography
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // System Statuses
  success: '#10B981',
  successLight: '#064E3B',
  warning: '#F59E0B',
  warningLight: '#451A03',
  danger: '#EF4444',
  dangerLight: '#450A0A',
  info: '#3B82F6',
  infoLight: '#1E3A8A',

  // Status Badges
  statusOpenBg: '#064E3B',
  statusOpenText: '#34D399',
  statusLockedBg: '#451A03',
  statusLockedText: '#FBBF24',
  statusCompletedBg: '#1E3A8A',
  statusCompletedText: '#60A5FA',

  // iOS Shadow Helper
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  shadowElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 5,
  },
};

export const Colors = LightColors;
export type ThemeColors = typeof LightColors;

export const useThemeColors = (): ThemeColors => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  return isDarkMode ? DarkColors : LightColors;
};

