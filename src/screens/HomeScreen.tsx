import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, Card, Button, FAB, Chip, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { apiService } from '../services/api';
import { colors } from '../theme/theme';

interface DashboardStats {
  activeRequests: number;
  completedJobs: number;
  unreadMessages: number;
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { expoPushToken } = useNotifications();
  const [stats, setStats] = useState<DashboardStats>({
    activeRequests: 0,
    completedJobs: 0,
    unreadMessages: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load basic stats
      const requests = await apiService.getBreakdownRequests();
      const notifications = await apiService.getNotifications();
      
      setStats({
        activeRequests: requests.filter((r: any) => r.status !== 'completed').length,
        completedJobs: requests.filter((r: any) => r.status === 'completed').length,
        unreadMessages: notifications.filter((n: any) => !n.isRead).length,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleEmergencyRequest = () => {
    navigation.navigate('CreateRequest');
  };


  const isMechanic = user?.role === 'mechanic';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.businessName || user?.username}!
            </Text>
            <Chip 
              icon="account" 
              style={[styles.roleChip, { backgroundColor: isMechanic ? colors.secondary : colors.primary }]}
              textStyle={{ color: 'white' }}
            >
              {isMechanic ? 'Mechanic' : 'Truck Owner'}
            </Chip>
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Quick Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="construction" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>{stats.activeRequests}</Text>
                <Text style={styles.statLabel}>
                  {isMechanic ? 'Available Jobs' : 'Active Requests'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
                <Text style={styles.statNumber}>{stats.completedJobs}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="message" size={24} color={colors.info} />
                <Text style={styles.statNumber}>{stats.unreadMessages}</Text>
                <Text style={styles.statLabel}>New Messages</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            {!isMechanic && (
              <>
                <Button
                  mode="contained"
                  icon="car-emergency"
                  onPress={handleEmergencyRequest}
                  style={[styles.actionButton, { backgroundColor: colors.error }]}
                  contentStyle={styles.buttonContent}
                >
                  Request Emergency Help
                </Button>
                <Divider style={styles.divider} />
              </>
            )}

            <Button
              mode="outlined"
              icon="message"
              onPress={() => navigation.navigate('Messages')}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              View Messages
            </Button>

            <Button
              mode="outlined"
              icon={isMechanic ? "wrench" : "truck"}
              onPress={() => navigation.navigate('Requests')}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              {isMechanic ? 'View Available Jobs' : 'My Requests'}
            </Button>
          </Card.Content>
        </Card>

        {/* Push Token Debug (only show in development) */}
        {__DEV__ && expoPushToken && (
          <Card style={styles.debugCard}>
            <Card.Content>
              <Text style={styles.debugTitle}>Debug Info</Text>
              <Text style={styles.debugText}>
                Push Token: {expoPushToken.substring(0, 20)}...
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button for Emergency (Truck Owners) */}
      {!isMechanic && (
        <FAB
          icon="car-emergency"
          style={styles.fab}
          onPress={handleEmergencyRequest}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text,
  },
  roleChip: {
    alignSelf: 'flex-start',
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionButton: {
    marginBottom: 12,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  divider: {
    marginVertical: 8,
  },
  debugCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    elevation: 1,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.textSecondary,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.error,
  },
});