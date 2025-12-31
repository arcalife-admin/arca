'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Task, TaskMessage, TaskStatus, TaskPriority } from '@/types/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  User,
  Users,
  Clock,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle,
  Edit,
  Bell
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onEdit: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  currentUserId: string;
}

const priorityColors = {
  [TaskPriority.LOW]: 'bg-gray-100 text-gray-800',
  [TaskPriority.MEDIUM]: 'bg-blue-100 text-blue-800',
  [TaskPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [TaskPriority.URGENT]: 'bg-red-100 text-red-800'
};

const statusColors = {
  [TaskStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [TaskStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
};

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onEdit,
  onStatusChange,
  currentUserId
}: TaskDetailModalProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messages, setMessages] = useState<TaskMessage[]>(task.messages || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== TaskStatus.COMPLETED;
  const isCreator = task.createdBy === currentUserId;
  const isAssigned = task.assignments.some(a => a.userId === currentUserId);
  const canEdit = isCreator || isAssigned;

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim()
        }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    await onStatusChange(task.id, newStatus);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const upcomingReminders = task.reminders
    ?.filter(r => !r.sent && new Date(r.reminderTime) > new Date())
    .sort((a, b) => new Date(a.reminderTime).getTime() - new Date(b.reminderTime).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <DialogTitle className="text-xl font-semibold">
                {task.title}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <Badge className={statusColors[task.status]}>
                  {task.status.replace('_', ' ')}
                </Badge>
                <Badge className={priorityColors[task.priority]} variant="outline">
                  {task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT ? (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  ) : null}
                  {task.priority}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
              </div>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Details */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-medium">Task Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{task.description}</p>
                  </div>
                )}

                {task.deadline && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="text-sm font-medium">
                        {format(new Date(task.deadline), 'MMM dd, yyyy \'at\' HH:mm')}
                      </p>
                    </div>
                  </div>
                )}

                {task.patient && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Patient</p>
                      <p className="text-sm font-medium">
                        {task.patient.firstName} {task.patient.lastName}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {format(new Date(task.createdAt), 'MMM dd, yyyy \'at\' HH:mm')} by {task.creator.firstName} {task.creator.lastName}
                    </p>
                  </div>
                </div>

                {task.completedAt && task.completer && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-sm">
                        {format(new Date(task.completedAt), 'MMM dd, yyyy \'at\' HH:mm')} by {task.completer.firstName} {task.completer.lastName}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned Users */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Assigned Practitioners ({task.assignments.length})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {task.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(assignment.user.firstName, assignment.user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{assignment.user.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reminders */}
            {upcomingReminders && upcomingReminders.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-medium flex items-center">
                    <Bell className="w-4 h-4 mr-2" />
                    Upcoming Reminders ({upcomingReminders.length})
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingReminders.map((reminder) => (
                      <div key={reminder.id} className="text-sm">
                        <p className="font-medium">
                          {format(new Date(reminder.reminderTime), 'MMM dd, yyyy \'at\' HH:mm')}
                        </p>
                        {reminder.message && (
                          <p className="text-muted-foreground">{reminder.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Actions */}
            {task.status !== TaskStatus.COMPLETED && canEdit && (
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-medium">Quick Actions</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  {task.status === TaskStatus.PENDING && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleStatusUpdate(TaskStatus.IN_PROGRESS)}
                    >
                      Start Task
                    </Button>
                  )}
                  {task.status === TaskStatus.IN_PROGRESS && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusUpdate(TaskStatus.COMPLETED)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Messages */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <h3 className="font-medium flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages ({messages.length})
                </h3>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {getInitials(message.sender.firstName, message.sender.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium">
                                {message.sender.firstName} {message.sender.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                              </p>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {canEdit && (
                  <>
                    <Separator />
                    <div className="p-4 flex-shrink-0">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={isSendingMessage}
                        />
                        <Button
                          size="sm"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || isSendingMessage}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 