import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Text, Card, TextInput, Button, Avatar, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { colors } from '../theme/theme';

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
  messageType: string;
  attachments?: any;
}

interface BreakdownRequest {
  id: number;
  issueType: string;
  status: string;
  location: string;
  truckOwnerId: number;
  mechanicId?: number;
}

interface ChatScreenProps {
  navigation: any;
  route: {
    params: {
      requestId: number;
    };
  };
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  const { user } = useAuth();
  const { requestId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [request, setRequest] = useState<BreakdownRequest | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadRequest();
    loadMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [requestId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadRequest = async () => {
    try {
      // Try to get the specific request directly first
      let currentRequest;
      
      // For mechanics, get all requests (they can see pending and accepted ones)
      // For truck owners, get their own requests
      if (user?.role === 'mechanic') {
        const allRequests = await apiService.getBreakdownRequests();
        currentRequest = allRequests.find((r: any) => r.id === requestId);
      } else {
        // Truck owners should get their own requests
        const userRequests = await apiService.getUserRequests(user?.id || 0);
        currentRequest = userRequests.find((r: any) => r.id === requestId);
      }
      
      // If still not found, try the general endpoint as fallback
      if (!currentRequest) {
        console.log('🔍 Request not found in filtered results, trying general endpoint...');
        const allRequests = await apiService.getBreakdownRequests();
        currentRequest = allRequests.find((r: any) => r.id === requestId);
      }
      
      console.log('🔍 Chat request data:', {
        requestId,
        currentRequest,
        mechanicId: currentRequest?.mechanicId,
        truckOwnerId: currentRequest?.truckOwnerId,
        status: currentRequest?.status,
        userRole: user?.role,
        userId: user?.id
      });
      
      setRequest(currentRequest || null);
      
      // Set navigation title
      navigation.setOptions({
        title: currentRequest?.issueType || 'Chat',
      });
    } catch (error) {
      console.error('Failed to load request:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await apiService.getMessages(requestId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    console.log('🎯 Send button tapped!', {
      messageLength: newMessage.trim().length,
      hasUser: !!user,
      hasRequest: !!request,
      requestId,
      userRole: user?.role,
      requestStatus: request?.status
    });

    if (!newMessage.trim() || !user || !request) {
      console.log('📵 Send message blocked:', { 
        hasMessage: !!newMessage.trim(), 
        hasUser: !!user, 
        hasRequest: !!request,
        requestId 
      });
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setSending(true);

    try {
      const receiverId = user.role === 'truck_owner' ? request.mechanicId : request.truckOwnerId;
      
      if (!receiverId) {
        console.error('❌ No receiver ID found:', { 
          userRole: user.role, 
          mechanicId: request.mechanicId, 
          truckOwnerId: request.truckOwnerId 
        });
        // Allow messaging even if no mechanic assigned yet - they can still communicate
        console.log('💬 Allowing message to proceed anyway for communication');
        // Use null receiver ID for pending requests - backend will handle this
        const temporaryReceiverId = user.role === 'truck_owner' ? null : request.truckOwnerId;
        
        const messageData = {
          requestId,
          senderId: user.id,
          receiverId: temporaryReceiverId,
          content: messageContent,
          messageType: 'text',
        };

        console.log('📤 Sending message with temporary receiver:', messageData);
        
        try {
          await apiService.sendMessage(messageData);
          console.log('✅ Message sent successfully');
          await loadMessages();
        } catch (error: any) {
          console.error('❌ Failed to send message:', error);
          setNewMessage(messageContent);
        }
        setSending(false);
        return;
      }

      const messageData = {
        requestId,
        senderId: user.id,
        receiverId,
        content: messageContent,
        messageType: 'text',
      };

      console.log('📤 Sending message:', messageData);
      
      await apiService.sendMessage(messageData);
      console.log('✅ Message sent successfully');

      // Reload messages to get the new one
      await loadMessages();
    } catch (error: any) {
      console.error('❌ Failed to send message:', {
        error: error.message,
        status: error.status,
        requestId,
        userId: user.id
      });
      // Restore message on error
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getSenderName = (senderId: number) => {
    if (!request) return 'Unknown';
    if (senderId === request.truckOwnerId) return 'Truck Owner';
    if (senderId === request.mechanicId) return 'Mechanic';
    return 'Unknown';
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    const senderName = getSenderName(item.senderId);

    return (
      <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
        {!isOwn && (
          <Avatar.Text
            size={32}
            label={senderName[0]}
            style={[styles.avatar, { backgroundColor: colors.primary }]}
          />
        )}
        
        <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          {!isOwn && (
            <Text style={styles.senderName}>{senderName}</Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.headerContent}>
          <View style={styles.requestInfo}>
            <Text style={styles.issueType}>{request?.issueType}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
              <Text style={styles.location}>{request?.location}</Text>
            </View>
          </View>
          
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(request?.status || '') }]}
            textStyle={{ color: 'white' }}
          >
            {request?.status}
          </Chip>
        </View>
        
        {request?.status === 'accepted' || request?.status === 'in_progress' ? (
          <Text style={styles.statusMessage}>
            🤝 You can now exchange contact information and communicate directly
          </Text>
        ) : (
          <Text style={styles.statusMessage}>
            💬 Chat here until the job is accepted, then exchange contacts directly
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmptyMessages = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="chat" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Start the conversation</Text>
      <Text style={styles.emptyText}>
        Send a message to begin communicating about this breakdown request
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      enabled={Platform.OS === 'ios'}
    >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.messagesList,
            Platform.OS === 'android' && { paddingBottom: 100 }
          ]}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!loading ? renderEmptyMessages : null}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            mode="outlined"
            style={styles.textInput}
            multiline
            maxLength={500}
            disabled={sending}
            onSubmitEditing={() => {
              if (newMessage.trim() && !sending) {
                sendMessage();
              }
            }}
            blurOnSubmit={false}
            right={
              <TextInput.Icon
                icon="send"
                onPress={() => {
                  if (newMessage.trim() && !sending) {
                    sendMessage();
                    Keyboard.dismiss();
                  }
                }}
                disabled={!newMessage.trim() || sending}
              />
            }
          />
        </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  issueType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  statusChip: {
    marginLeft: 8,
  },
  statusMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  messagesList: {
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    marginRight: 8,
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  timestamp: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    lineHeight: 20,
  },
  inputContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    position: Platform.OS === 'android' ? 'absolute' : 'relative',
    bottom: Platform.OS === 'android' ? 0 : undefined,
    left: Platform.OS === 'android' ? 0 : undefined,
    right: Platform.OS === 'android' ? 0 : undefined,
  },
  textInput: {
    maxHeight: 100,
    minHeight: 40,
  },
});