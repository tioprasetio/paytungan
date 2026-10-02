import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore, useThemeStore } from '../stores';
import { useThemeColors } from '../theme/colors';

// Screens
import {
  AuthScreen,
  HomeScreen,
  CircleDetailScreen,
  CreateCircleModal,
  JoinCircleModal,
  CreateSessionScreen,
  JastipSessionScreen,
  InputPricesScreen,
  SplitBillRecapScreen,
  SettingsScreen,
  EditProfileScreen,
  PaymentSettingsScreen,
  SecuritySettingsScreen,
  MyCirclesScreen,
  SplashScreen,
  HistoryScreen,
  ActiveSessionsScreen,
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [isSplashDone, setIsSplashDone] = React.useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const colors = useThemeColors();

  // Display polished animated splash screen on app cold start & during hydration
  if (!isSplashDone) {
    return (
      <SplashScreen
        isReady={isHydrated}
        onFinish={() => setIsSplashDone(true)}
      />
    );
  }

  const navigationTheme = isDarkMode
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          primary: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          primary: colors.primary,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        {...(Platform.OS === 'android' ? { backgroundColor: colors.background } : {})}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CircleDetail" component={CircleDetailScreen} />
            <Stack.Screen
              name="CreateCircle"
              component={CreateCircleModal}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="JoinCircle"
              component={JoinCircleModal}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
            <Stack.Screen name="JastipSession" component={JastipSessionScreen} />
            <Stack.Screen name="InputPrices" component={InputPricesScreen} />
            <Stack.Screen name="SplitBillRecap" component={SplitBillRecapScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="PaymentSettings" component={PaymentSettingsScreen} />
            <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
            <Stack.Screen name="MyCircles" component={MyCirclesScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
