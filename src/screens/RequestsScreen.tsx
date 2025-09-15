import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Chip, FAB, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { colors } from '../theme/theme';

interface BreakdownRequest {
  id: number;
  issueType: string;
  status: string;
  location: string;
  description: string;
  createdAt: string;
  truckOwnerId?: number;
  mechanicId?: number;
  distance?: number;
}

export default function RequestsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BreakdownRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      let data;
      
      if (user?.role === 'mechanic') {
        // Mechanics see active requests and their accepted ones
        data = await apiService.getBreakdownRequests();
      } else {
        // Truck owners see only their own requests
        data = await apiService.getUserRequests(user?.id || 0);
      }
      
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await apiService.acceptBreakdownRequest(requestId, user?.id || 0);
      Alert.alert(
        'Success', 
        'Request accepted! Opening chat with truck owner...', 
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to chat immediately
              navigation.navigate('Chat', { 
                requestId, 
                title: 'Chat with Truck Owner' 
              } as any);
            }
          }
        ]
      );
      loadRequests();
    } catch (error) {
      console.error('Failed to accept request:', error);
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleUpdateStatus = async (requestId: number, status: string) => {
    try {
      await apiService.updateRequestStatus(requestId, status);
      Alert.alert('Success', `Request status updated to ${status}`);
      loadRequests();
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: colors.warning, color: 'white' };
      case 'accepted':
        return { backgroundColor: colors.info, color: 'white' };
      case 'in_progress':
        return { backgroundColor: colors.secondary, color: 'white' };
      case 'completed':
        return { backgroundColor: colors.success, color: 'white' };
      default:
        return { backgroundColor: colors.border, color: colors.text };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isMechanic = user?.role === 'mechanic';
  const filteredRequests = isMechanic 
    ? requests.filter(r => r.status === 'pending' || r.mechanicId === user?.id)
    : requests.filter(r => r.truckOwnerId === user?.id);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRequests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons 
                name={isMechanic ? "construction" : "car-repair"} 
                size={48} 
                color={colors.textSecondary} 
              />
              <Text style={styles.emptyTitle}>
                {isMechanic ? 'No jobs available' : 'No requests yet'}
              </Text>
              <Text style={styles.emptyText}>
                {isMechanic 
                  ? 'Check back later for new breakdown requests in your area'
                  : 'Create your first breakdown request when you need assistance'
                }
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <Card.Content>
                <View style={styles.requestHeader}>
                  <Text style={styles.issueType}>{request.issueType}</Text>
                  <Chip 
                    style={[styles.statusChip, getStatusColor(request.status)]}
                    textStyle={{ color: getStatusColor(request.status).color }}
                  >
                    {request.status}
                  </Chip>
                </View>

                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                  <Text style={styles.location}>{request.location}</Text>
                  {request.distance && (
                    <Text style={styles.distance}>• {request.distance}km away</Text>
                  )}
                </View>

                <Text style={styles.description} numberOfLines={2}>
                  {request.description}
                </Text>

                <Text style={styles.timestamp}>
                  {formatDate(request.createdAt)}
                </Text>

                <Divider style={styles.divider} />

                <View style={styles.actionRow}>
                  {isMechanic && request.status === 'pending' && (
                    <Button
                      mode="contained"
                      onPress={() => handleAcceptRequest(request.id)}
                      style={[styles.actionButton, { backgroundColor: colors.success }]}
                      compact
                    >
                      Accept Job
                    </Button>
                  )}

                  {isMechanic && request.mechanicId === user?.id && request.status === 'accepted' && (
                    <Button
                      mode="contained"
                      onPress={() => handleUpdateStatus(request.id, 'in_progress')}
                      style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                      compact
                    >
                      Start Work
                    </Button>
                  )}

                  {isMechanic && request.mechanicId === user?.id && request.status === 'in_progress' && (
                    <Button
                      mode="contained"
                      onPress={() => handleUpdateStatus(request.id, 'completed')}
                      style={[styles.actionButton, { backgroundColor: colors.success }]}
                      compact
                    >
                      Complete
                    </Button>
                  )}

                  {(request.status === 'accepted' || request.status === 'in_progress') && (
                    <Button
                      mode="outlined"
                      onPress={() => navigation.navigate('Chat', { requestId: request.id } as any)}
                      style={styles.actionButton}
                      compact
                    >
                      Chat
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {!isMechanic && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('CreateRequest')}
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
  emptyCard: {
    marginTop: 40,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  requestCard: {
    marginBottom: 12,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueType: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: colors.text,
  },
  statusChip: {
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  distance: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  divider: {
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});