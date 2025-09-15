import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import RequestsScreen from '../screens/RequestsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateRequestScreen from '../screens/CreateRequestScreen';
import ChatScreen from '../screens/ChatScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MechanicSettingsScreen from '../screens/MechanicSettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Requests') {
            iconName = user?.role === 'mechanic' ? 'construction' : 'help-outline';
          } else if (route.name === 'Messages') {
            iconName = 'message';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'home';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e63946',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#e63946',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Requests" 
        component={RequestsScreen}
        options={{
          title: user?.role === 'mechanic' ? 'Jobs' : 'My Requests',
          tabBarBadge: user?.role === 'mechanic' && unreadCount > 0 ? unreadCount : undefined
        }}
      />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateRequest" 
        component={CreateRequestScreen}
        options={{ title: 'Request Assistance' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen as any}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="MechanicSettings" 
        component={MechanicSettingsScreen}
        options={{ title: 'Mechanic Settings' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <MainStack /> : <AuthStack />;
}