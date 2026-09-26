import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '../stores';
import { Colors } from '../theme/colors';

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
  MyCirclesScreen,
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  // While restoring session from AsyncStorage, display a clean splash/loading indicator
  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
            <Stack.Screen name="MyCircles" component={MyCirclesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
