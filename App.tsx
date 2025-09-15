import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

// Configure how notifications should behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';

// Create a client
const queryClient = new QueryClient();

export default function App() {
  const navigationRef = useRef<any>();

  useEffect(() => {
    // Global notification response handler
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Global notification response:', response);
      
      try {
        const { data } = response.notification.request.content;
        
        if (data?.navigateTo && data?.screenParams && navigationRef.current) {
          // Navigate to the specified screen with parameters
          navigationRef.current.navigate(data.navigateTo, data.screenParams);
        }
      } catch (error) {
        console.error('Error handling global notification:', error);
      }
    });

    return () => {
      responseListener?.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <AuthProvider>
              <NotificationProvider>
                <AppNavigator />
                <StatusBar style="auto" />
              </NotificationProvider>
            </AuthProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </NavigationContainer>
  );
}