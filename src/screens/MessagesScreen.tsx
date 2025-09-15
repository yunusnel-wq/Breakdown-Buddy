import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Badge, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { colors } from '../theme/theme';

interface Conversation {
  requestId: number;
  issueType: string;
  location: string;
  status: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  otherUserName: string;
  otherUserRole: string;
}

export default function MessagesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // Get user-specific requests based on role
      let requests;
      if (user?.role === 'mechanic') {
        // Mechanics see active requests and their accepted ones  
        requests = await apiService.getBreakdownRequests();
      } else {
        // Truck owners see only their own requests
        requests = await apiService.getUserRequests(user?.id || 0);
      }
      
      const userRequests = requests.filter((r: any) => 
        r.truckOwnerId === user?.id || r.mechanicId === user?.id
      );

      // Get conversations for each request
      const conversationPromises = userRequests.map(async (request: any) => {
        try {
          const messages = await apiService.getMessages(request.id);
          const lastMessage = messages[messages.length - 1];
          const unreadCount = messages.filter((m: any) => 
            !m.isRead && m.senderId !== user?.id
          ).length;

          const otherUserId = request.truckOwnerId === user?.id 
            ? request.mechanicId 
            : request.truckOwnerId;
          const otherUserRole = request.truckOwnerId === user?.id ? 'mechanic' : 'truck_owner';

          return {
            requestId: request.id,
            issueType: request.issueType,
            location: request.location,
            status: request.status,
            lastMessage: lastMessage?.content || 'No messages yet',
            lastMessageTime: lastMessage?.createdAt,
            unreadCount,
            otherUserName: otherUserRole === 'mechanic' ? 'Mechanic' : 'Truck Owner',
            otherUserRole,
          };
        } catch (error) {
          console.error(`Failed to load messages for request ${request.id}:`, error);
          return null;
        }
      });

      const conversationResults = await Promise.all(conversationPromises);
      const validConversations = conversationResults.filter(c => c !== null) as Conversation[];
      
      // Sort by last message time
      validConversations.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setConversations(validConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return date.toLocaleDateString('en-ZA', { 
        day: '2-digit', 
        month: 'short' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'accepted':
        return colors.info;
      case 'in_progress':
        return colors.secondary;
      case 'completed':
        return colors.success;
      default:
        return colors.border;
    }
  };

  const getAvatarIcon = (role: string) => {
    return role === 'mechanic' ? 'construction' : 'truck';
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Chat', { requestId: item.requestId } as any)}
    >
      <Card style={styles.conversationCard}>
        <Card.Content style={styles.conversationContent}>
          <View style={styles.avatarContainer}>
            <Avatar.Icon
              size={48}
              icon={getAvatarIcon(item.otherUserRole)}
              style={[styles.avatar, { backgroundColor: getStatusColor(item.status) }]}
            />
            {item.unreadCount > 0 && (
              <Badge style={styles.badge}>{item.unreadCount}</Badge>
            )}
          </View>

          <View style={styles.messageInfo}>
            <View style={styles.messageHeader}>
              <Text style={styles.userName}>{item.otherUserName}</Text>
              <Text style={styles.timestamp}>{formatTime(item.lastMessageTime)}</Text>
            </View>

            <Text style={styles.issueType}>{item.issueType}</Text>

            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={12} color={colors.textSecondary} />
              <Text style={styles.location}>{item.location}</Text>
            </View>

            <Text 
              style={[
                styles.lastMessage,
                item.unreadCount > 0 && styles.unreadMessage
              ]} 
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="message" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyText}>
        {user?.role === 'mechanic' 
          ? 'Accept a breakdown request to start chatting with truck owners'
          : 'Create a breakdown request to start chatting with mechanics'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.requestId.toString()}
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  conversationCard: {
    marginBottom: 8,
    elevation: 1,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
  },
  messageInfo: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  issueType: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unreadMessage: {
    fontWeight: '500',
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});