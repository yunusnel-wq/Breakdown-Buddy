import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  sendTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => {
        setExpoPushToken(token);
        if (token && user) {
          registerTokenWithBackend(token);
        }
      })
      .catch(error => {
        console.log('Push notification setup failed:', error);
        // Continue without push notifications
      });

    let notificationListener: any;
    let responseListener: any;

    try {
      notificationListener = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });

      responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        handleNotificationResponse(response);
      });
    } catch (error) {
      console.log('Notification listeners setup failed:', error);
    }

    return () => {
      try {
        notificationListener?.remove();
        responseListener?.remove();
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    };
  }, [user]);

  const handleNotificationResponse = (response: any) => {
    try {
      const { data } = response.notification.request.content;
      console.log('Notification data:', data);
      
      if (data?.navigateTo === 'messages' && data?.requestId) {
        // Navigate to chat screen with the request
        // This requires navigation prop - will be handled in App.tsx
        console.log(`Should navigate to messages for request ${data.requestId}`);
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  };

  const registerTokenWithBackend = async (token: string) => {
    try {
      await apiService.registerPushToken(token);
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  };

  const sendTestNotification = async () => {
    if (!expoPushToken) {
      console.log('No push token available');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification 📱",
          body: 'This is a test notification from Breakdown Buddy!',
          data: { type: 'test' },
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    sendTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  try {
    if (Platform.OS === 'android') {
      // Create notification channels for different types
      await Notifications.setNotificationChannelAsync('breakdown-requests', {
        name: 'Breakdown Requests',
        importance: Notifications.AndroidImportance.MAX,
        description: 'Urgent breakdown assistance requests',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e63946',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });
      
      await Notifications.setNotificationChannelAsync('job-updates', {
        name: 'Job Updates',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Updates about accepted jobs and messages',
        vibrationPattern: [0, 150, 150, 150],
        lightColor: '#f77f00',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });
      
      // Default channel for backwards compatibility
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'General notifications',
        sound: 'default',
        showBadge: true,
      });
    }

    if (Device.isDevice) {
      // Use Expo push notifications
      console.log('📱 Requesting push notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }
      
      // Get real Expo push token with FCM
      try {
        // Try to get FCM-enabled Expo push token (now that Firebase is configured)
        const tokenData = await Notifications.getExpoPushTokenAsync();
        console.log('✅ Got FCM-enabled Expo push token:', tokenData.data.substring(0, 50) + '...');
        return tokenData.data;
      } catch (tokenError) {
        console.log('❌ Failed to get Expo push token:', tokenError);
        console.log('This might indicate a Firebase configuration issue.');
        // Still return null so the app doesn't crash
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  } catch (error) {
    console.log('Push notification setup error (continuing without):', error);
  }

  return token;
}