import { useThemeStore } from '../stores/themeStore';

export const LightColors = {
  bgGradient: ['#F8FAFC', '#F8FAFC'] as [string, string],
  // Brand Colors - Electric Indigo & Emerald Mint
  primary: '#4F46E5', // Electric Indigo
  primaryDark: '#3730A3',
  primaryLight: '#EEF2FF',
  primaryHover: '#4338CA',

  secondary: '#4F46E5',
  secondaryLight: '#EEF2FF',
  secondaryThird: '#4F46E5',

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
  bgGradient: ['#0B0F19', '#1E293B'] as [string, string],
  // Brand Colors - Vibrant Indigo & Emerald (optimized for dark contrast)
  primary: '#818CF8', // Indigo 400 (terang & kontras di dark mode)
  primaryDark: '#6366F1',
  primaryLight: 'rgba(129, 140, 248, 0.16)', // Translucent glow, tidak nyaru/mati
  primaryHover: '#A5B4FC',

  secondary: '#818CF8',
  secondaryLight: 'rgba(129, 140, 248, 0.16)',
  secondaryThird: '#F8FAFC',

  accent: '#34D399', // Emerald 400
  accentDark: '#10B981',
  accentLight: 'rgba(52, 211, 153, 0.16)',

  // Neutrals - Deep Slate
  background: '#0B0F19',
  surface: '#1E293B',
  surfaceSubtle: '#334155',
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.08)',

  // Typography
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#FFFFFF', // Fix: text pada button warna primary/danger tetap putih terang

  // System Statuses
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  danger: '#F87171',
  dangerLight: 'rgba(248, 113, 113, 0.15)',
  info: '#60A5FA',
  infoLight: 'rgba(96, 165, 250, 0.15)',

  // Status Badges
  statusOpenBg: 'rgba(52, 211, 153, 0.15)',
  statusOpenText: '#34D399',
  statusLockedBg: 'rgba(251, 191, 36, 0.15)',
  statusLockedText: '#FBBF24',
  statusCompletedBg: 'rgba(129, 140, 248, 0.15)',
  statusCompletedText: '#818CF8',

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

