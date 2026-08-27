import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // Silently fail - notifications are non-critical
      console.debug('Notification fetch failed:', err.message);
    }
  }, []);

  const generateNotifications = useCallback(async () => {
    try {
      await api.generateNotifications();
      await fetchNotifications();
    } catch (err) {
      console.debug('Notification generation failed:', err.message);
    }
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  }, []);

  // Poll for notifications every 60 seconds
  useEffect(() => {
    fetchNotifications();
    generateNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications, generateNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      showPanel,
      setShowPanel,
      fetchNotifications,
      markAsRead,
      markAllRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
