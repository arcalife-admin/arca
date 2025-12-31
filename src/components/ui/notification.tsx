'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageSquare, Clock, Bell, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notification } from '@/types/notification';
import { useNotifications } from '@/contexts/NotificationContext';
import { format } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
}

const notificationIcons = {
  chat: MessageSquare,
  task_message: MessageSquare,
  task_reminder: Clock,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const notificationColors = {
  chat: 'border-blue-500 bg-blue-50',
  task_message: 'border-purple-500 bg-purple-50',
  task_reminder: 'border-orange-500 bg-orange-50',
  info: 'border-blue-500 bg-blue-50',
  success: 'border-green-500 bg-green-50',
  warning: 'border-yellow-500 bg-yellow-50',
  error: 'border-red-500 bg-red-50',
};

function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();
  const { removeNotification, markAsRead } = useNotifications();
  const [isRemoving, setIsRemoving] = useState(false);

  const Icon = notificationIcons[notification.type];

  const handleClick = () => {
    if (notification.clickAction?.type === 'navigate') {
      const { path, params } = notification.clickAction;
      let finalPath = path;

      // Replace path parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          finalPath = finalPath.replace(`[${key}]`, value);
        });
      }

      markAsRead(notification.id);
      router.push(finalPath);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300);
  };

  return (
    <Card
      className={`
        cursor-pointer transition-all duration-300 mb-3 w-80 shadow-lg
        ${notificationColors[notification.type]}
        ${isRemoving ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'}
        hover:shadow-xl
      `}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <Icon className="w-5 h-5 text-current" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {format(notification.timestamp, 'HH:mm')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2 hover:bg-gray-200"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationContainer() {
  const { notifications } = useNotifications();

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {notifications.slice(0, 5).map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>
    </div>
  );
} 