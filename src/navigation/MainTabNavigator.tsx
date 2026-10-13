import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Coins, History, User } from 'lucide-react-native';
import { useThemeColors } from '../theme/colors';
import {
  HomeScreen,
  BountyBoardScreen,
  HistoryScreen,
  SettingsScreen,
} from '../screens';

const Tab = createBottomTabNavigator();

const renderHomeIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => <Home size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />;

const renderBountyIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => <Coins size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />;

const renderHistoryIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <History size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />
);

const renderUserIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => <User size={size || 22} color={color} strokeWidth={focused ? 2.5 : 2} />;

export const MainTabNavigator: React.FC = () => {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Beranda',
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tab.Screen
        name="BountyBoard"
        component={BountyBoardScreen}
        options={{
          tabBarLabel: 'Titipan',
          tabBarIcon: renderBountyIcon,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Riwayat',
          tabBarIcon: renderHistoryIcon,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Akun',
          tabBarIcon: renderUserIcon,
        }}
      />
    </Tab.Navigator>
  );
};
