'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { dateFnsLocale } from '@/lib/date-locale';
import TaskDetailModal from './TaskDetailModal';
import { useSession } from 'next-auth/react';

interface PatientTaskListProps {
  patientId: string;
  patientName: string;
  onCreateTask?: () => void;
  limit?: number;
  showCreateButton?: boolean;
}

const statusColors = {
  [TaskStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [TaskStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'În așteptare',
  [TaskStatus.IN_PROGRESS]: 'În desfășurare',
  [TaskStatus.COMPLETED]: 'Finalizat',
  [TaskStatus.CANCELLED]: 'Anulat',
};

const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Scăzută',
  [TaskPriority.MEDIUM]: 'Medie',
  [TaskPriority.HIGH]: 'Ridicată',
  [TaskPriority.URGENT]: 'Urgentă',
};

const priorityColors = {
  [TaskPriority.LOW]: 'bg-gray-100 text-gray-800',
  [TaskPriority.MEDIUM]: 'bg-blue-100 text-blue-800',
  [TaskPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [TaskPriority.URGENT]: 'bg-red-100 text-red-800'
};

export default function PatientTaskList({
  patientId,
  patientName,
  onCreateTask,
  limit = 5,
  showCreateButton = true
}: PatientTaskListProps) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        patientId,
        limit: limit.toString(),
        sortField: 'createdAt',
        sortDirection: 'desc'
      });

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error('Încărcarea sarcinilor a eșuat');

      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Error fetching patient tasks:', error);
      setError('Încărcarea sarcinilor a eșuat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [patientId]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    // Navigate to tasks page with task selected for edit
    if (onCreateTask) {
      onCreateTask();
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Actualizarea sarcinii a eșuat');

      // Refresh tasks
      fetchTasks();
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sarcini pacient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sarcini pacient</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Sarcini pacient ({tasks.length})</CardTitle>
            {showCreateButton && onCreateTask && (
              <Button size="sm" onClick={onCreateTask}>
                <Plus className="w-4 h-4 mr-1" />
                Sarcină nouă
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Nu există sarcini pentru acest pacient.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{task.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={statusColors[task.status]} variant="secondary">
                          {statusLabels[task.status]}
                        </Badge>
                        <Badge className={priorityColors[task.priority]} variant="outline">
                          {priorityLabels[task.priority]}
                        </Badge>
                        {task.deadline && (
                          <span className="text-xs text-muted-foreground">
                            Termen: {format(new Date(task.deadline), 'd MMM', { locale: dateFnsLocale })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {tasks.length >= limit && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" onClick={onCreateTask}>
                    Vezi toate sarcinile
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          task={selectedTask}
          onEdit={handleEditTask}
          onStatusChange={handleStatusChange}
          currentUserId={session?.user?.id || ''}
        />
      )}
    </>
  );
} 