import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'mechanic') {
      setUnreadCount(0);
      return;
    }

    // Function to fetch notifications
    const fetchNotifications = async () => {
      try {
        const notifications = await apiService.getNotifications();
        
        // Count unread new_request notifications for mechanics
        const unreadRequests = notifications.filter((n: any) => 
          !n.isRead && n.type === 'new_request'
        ).length;
        
        setUnreadCount(unreadRequests);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
  }, [user]);

  return { unreadCount };
}