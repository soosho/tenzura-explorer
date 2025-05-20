"use client";

import React, { createContext, useState, useContext, useCallback } from 'react';
import { X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Define notification types
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification variants
const notificationVariants = cva(
  "fixed flex items-center gap-2 px-4 py-2 rounded shadow-lg transition-all",
  {
    variants: {
      type: {
        success: "bg-green-100 text-green-800 border-l-4 border-green-500",
        error: "bg-red-100 text-red-800 border-l-4 border-red-500",
        warning: "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500",
        info: "bg-blue-100 text-blue-800 border-l-4 border-blue-500",
      },
      position: {
        topRight: "top-4 right-4",
      },
    },
    defaultVariants: {
      type: "info",
      position: "topRight",
    },
  }
);

// Provider component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto dismiss after duration (default 5 seconds)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      dismissNotification(id);
    }, duration);
    
    return id;
  }, [dismissNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, dismissNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 min-w-[300px]">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={cn(notificationVariants({ type: notification.type }))}
          >
            <span className="flex-1">{notification.message}</span>
            <button onClick={() => dismissNotification(notification.id)} className="text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// Hook for consuming notifications
export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    // Provide fallback if used outside provider
    return (notification: Omit<Notification, 'id'>) => {
      console.warn('useNotification used outside of NotificationProvider, using alert fallback');
      const type = notification.type === 'error' ? 'Error' : 
                  notification.type === 'warning' ? 'Warning' : 
                  notification.type === 'success' ? 'Success' : 'Info';
      alert(`${type}: ${notification.message}`);
    };
  }
  
  // Return just the showNotification function for simplicity
  return context.showNotification;
}