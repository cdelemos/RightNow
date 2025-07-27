import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotifications, setToastNotifications] = useState([]);

  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unread_count);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Add a toast notification (temporary popup)
  const addToastNotification = (notification) => {
    const toastId = Date.now();
    const toast = { ...notification, id: toastId };
    
    setToastNotifications(prev => [...prev, toast]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToastNotification(toastId);
    }, 5000);
  };

  // Remove a toast notification
  const removeToastNotification = (toastId) => {
    setToastNotifications(prev => prev.filter(toast => toast.id !== toastId));
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post(`${API}/notifications/${notificationId}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post(`${API}/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Show XP gained notification
  const showXPNotification = (xpAmount, action) => {
    addToastNotification({
      type: 'xp_gained',
      title: `+${xpAmount} XP Earned!`,
      message: `You earned ${xpAmount} XP for ${action.replace('_', ' ')}`,
      icon: '⭐',
      priority: 'normal'
    });
  };

  // Show level up notification
  const showLevelUpNotification = (newLevel) => {
    addToastNotification({
      type: 'level_up',
      title: `🌟 Level Up! You're now Level ${newLevel}!`,
      message: `Congratulations! Keep up the great work!`,
      icon: '🏆',
      priority: 'high'
    });
  };

  // Show achievement notification
  const showAchievementNotification = (achievementName) => {
    addToastNotification({
      type: 'achievement',
      title: '🎯 Achievement Unlocked!',
      message: `You earned: ${achievementName}`,
      icon: '🏅',
      priority: 'high'
    });
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    notifications,
    unreadCount,
    toastNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addToastNotification,
    removeToastNotification,
    showXPNotification,
    showLevelUpNotification,
    showAchievementNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};