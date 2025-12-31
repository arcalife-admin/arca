import { useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

export function useTaskReminders(isEmbedded: boolean = false) {
  const { addNotification } = useNotifications();
  const notifiedReminders = useRef(new Set<string>());

  const checkOverdueReminders = useCallback(async () => {
    // Skip execution if embedded to avoid duplicates
    if (isEmbedded) return;

    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) return;

      const data = await response.json();
      const tasks = data.tasks || [];
      const now = new Date();

      tasks.forEach((task: any) => {
        if (task.reminders) {
          task.reminders.forEach((reminder: any) => {
            const reminderTime = new Date(reminder.reminderTime);

            // Check if reminder is due (within the last 2 minutes and not sent)
            const timeDiff = now.getTime() - reminderTime.getTime();
            const isOverdue = timeDiff >= 0 && timeDiff <= 2 * 60 * 1000; // 2 minutes

            // Prevent duplicate notifications using a local cache
            const reminderKey = `${task.id}-${reminder.id}`;

            if (isOverdue && !reminder.sent && !notifiedReminders.current.has(reminderKey)) {
              // Add to cache immediately to prevent duplicates
              notifiedReminders.current.add(reminderKey);

              addNotification({
                type: 'task_reminder',
                title: 'Task Reminder',
                message: reminder.message || `Reminder for task: ${task.title}`,
                clickAction: {
                  type: 'navigate',
                  path: '/dashboard/tasks',
                },
                metadata: {
                  taskId: task.id,
                  reminderTime: reminderTime,
                },
              });

              // Mark reminder as sent in the database
              fetch(`/api/tasks/${task.id}/reminders/${reminder.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sent: true, sentAt: new Date() }),
              }).catch((error) => {
                console.error('Error marking reminder as sent:', error);
                // Remove from cache if API call failed so it can be retried
                notifiedReminders.current.delete(reminderKey);
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('Error checking overdue reminders:', error);
    }
  }, [addNotification, isEmbedded]);

  useEffect(() => {
    // Skip execution if embedded
    if (isEmbedded) return;

    // Check immediately
    checkOverdueReminders();

    // Then check every minute
    const interval = setInterval(checkOverdueReminders, 60000);

    return () => clearInterval(interval);
  }, [checkOverdueReminders, isEmbedded]);

  return { checkOverdueReminders };
} 