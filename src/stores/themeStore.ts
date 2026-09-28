import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'light',
      isDarkMode: false,
      setThemeMode: (mode: ThemeMode) => {
        const isDark =
          mode === 'system'
            ? Appearance.getColorScheme() === 'dark'
            : mode === 'dark';
        set({ themeMode: mode, isDarkMode: isDark });
      },
      toggleTheme: () => {
        const current = get().isDarkMode;
        const nextIsDark = !current;
        set({
          isDarkMode: nextIsDark,
          themeMode: nextIsDark ? 'dark' : 'light',
        });
      },
    }),
    {
      name: 'paytungan-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);
