export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'chat' | 'task_message' | 'task_reminder' | 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  clickAction?: {
    type: 'navigate';
    path: string;
    params?: Record<string, string>;
  };
  metadata?: {
    chatId?: string;
    taskId?: string;
    senderId?: string;
    reminderTime?: Date;
  };
}

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
} 