// frontend/src/services/notifications.js
import React, { createContext, useContext, useState, useEffect } from 'react';

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.enabled = true;
    this.init();
  }

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }
    }
  }

  show(title, options = {}) {
    if (!this.enabled || this.permission !== 'granted') {
      return null;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'sprintstudy',
      requireInteraction: false,
      ...options
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  showSessionComplete(duration) {
    return this.show('Study Session Complete! 🎉', {
      body: `Great work! You studied for ${Math.round(duration / 60)} minutes.`,
      tag: 'session-complete'
    });
  }

  showBreakTime(type = 'short') {
    const message = type === 'long' ? 
      'Time for a long break! Take 15 minutes to recharge.' :
      'Time for a short break! Take 5 minutes to refresh.';
    
    return this.show('Break Time! ☕', {
      body: message,
      tag: 'break-time'
    });
  }

  showGoalAchieved(goalTitle) {
    return this.show('Goal Achieved! 🏆', {
      body: `Congratulations! You've completed: ${goalTitle}`,
      tag: 'goal-achieved'
    });
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

// React Context Provider
const NotificationContext = createContext();

export const NotificationProvider = ({ children, enabled = true }) => {
  const [notificationService, setNotificationService] = useState(null);

  useEffect(() => {
    const service = new NotificationService();
    service.enabled = enabled;
    setNotificationService(service);
  }, [enabled]);

  return (
    <NotificationContext.Provider value={notificationService}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationService;