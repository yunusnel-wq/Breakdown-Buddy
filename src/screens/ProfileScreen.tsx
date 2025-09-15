import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Divider, List, Switch } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { colors } from '../theme/theme';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { expoPushToken } = useNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return 'BB';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const isMechanic = user?.role === 'mechanic';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={getInitials(user?.businessName || user?.username)}
            style={[styles.avatar, { backgroundColor: isMechanic ? colors.secondary : colors.primary }]}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.businessName || user?.username}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleContainer}>
              <MaterialIcons 
                name={isMechanic ? "construction" : "truck"} 
                size={16} 
                color={isMechanic ? colors.secondary : colors.primary} 
              />
              <Text style={[styles.roleText, { color: isMechanic ? colors.secondary : colors.primary }]}>
                {isMechanic ? 'Mechanic' : 'Truck Owner'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Account Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('EditProfile')}
          />
          
          <Divider />
          
          <List.Item
            title="Business Information"
            description={user?.businessType || "Add business details"}
            left={(props) => <List.Icon {...props} icon="office-building" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate(isMechanic ? 'MechanicSettings' : 'EditProfile')}
          />
        </Card.Content>
      </Card>

      {/* Notification Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <List.Item
            title="Push Notifications"
            description="Receive notifications for new messages and requests"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                color={colors.primary}
              />
            )}
          />
          
          <List.Item
            title="Notification System"
            description={
              expoPushToken 
                ? "✅ Push notifications enabled" 
                : "❌ Push notifications disabled"
            }
            left={(props) => <List.Icon {...props} icon={expoPushToken ? "bell-check" : "bell-off"} />}
          />
          
          {expoPushToken && (
            <List.Item
              title="Device Token"
              description={
                expoPushToken.startsWith('dev-token-') 
                  ? "🧪 Development token active"
                  : "🔑 Production FCM token active"
              }
              left={(props) => <List.Icon {...props} icon="key" />}
            />
          )}
        </Card.Content>
      </Card>

      {/* App Information */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <List.Item
            title="Help & Support"
            description="Get help with using the app"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Support', 'Contact support at help@breakdownbuddy.com')}
          />
          
          <Divider />
          
          <List.Item
            title="Privacy Policy"
            description="Learn about how we protect your data"
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Privacy', 'Privacy policy will be available soon')}
          />
          
          <Divider />
          
          <List.Item
            title="Terms of Service"
            description="Review our terms and conditions"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Terms', 'Terms of service will be available soon')}
          />
          
          <Divider />
          
          <List.Item
            title="App Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Card style={styles.logoutCard}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            contentStyle={styles.logoutButtonContent}
            buttonColor={colors.error}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>

      {/* Debug Information (Development only) */}
      {__DEV__ && (
        <Card style={styles.debugCard}>
          <Card.Content>
            <Text style={styles.debugTitle}>Debug Information</Text>
            <Text style={styles.debugText}>User ID: {user?.id}</Text>
            <Text style={styles.debugText}>Role: {user?.role}</Text>
            <Text style={styles.debugText}>Environment: Development</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  settingsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  logoutCard: {
    marginBottom: 16,
    elevation: 2,
  },
  logoutButton: {
    marginTop: 8,
  },
  logoutButtonContent: {
    paddingVertical: 8,
  },
  debugCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    elevation: 1,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.textSecondary,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});