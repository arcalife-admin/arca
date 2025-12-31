'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task, TaskPriority, TaskType, TaskVisibility, TaskBoard, CreateTaskData, UpdateTaskData } from '@/types/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, X, Plus, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.nativeEnum(TaskType),
  visibility: z.nativeEnum(TaskVisibility),
  priority: z.nativeEnum(TaskPriority),
  deadline: z.string().optional(),
  patientId: z.string().optional(),
  boardId: z.string().optional(),
  assignedUserIds: z.array(z.string()).min(1, 'At least one assignee is required'),
  reminders: z.array(z.object({
    reminderTime: z.string(),
    message: z.string().optional()
  })).optional(),
  options: z.array(z.object({
    text: z.string().min(1, 'Option text is required'),
    order: z.number().optional()
  })).optional()
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskData | UpdateTaskData) => Promise<void>;
  task?: Task;
  users: Array<{ id: string; firstName: string; lastName: string; role: string }>;
  patients?: Array<{ id: string; firstName: string; lastName: string }>;
  boards?: TaskBoard[];
  isLoading?: boolean;
}

export default function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  users,
  patients = [],
  boards = [],
  isLoading = false
}: TaskFormModalProps) {
  const [reminders, setReminders] = useState<Array<{ reminderTime: string; message: string }>>([]);
  const [pollOptions, setPollOptions] = useState<Array<{ text: string; order: number }>>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      type: TaskType.TASK,
      visibility: TaskVisibility.PRIVATE,
      priority: TaskPriority.MEDIUM,
      assignedUserIds: []
    }
  });

  const watchedAssignedUserIds = watch('assignedUserIds');
  const watchedPatientId = watch('patientId');
  const watchedTaskType = watch('type');
  const watchedVisibility = watch('visibility');
  const watchedBoardId = watch('boardId');

  useEffect(() => {
    if (task) {
      // Populate form with existing task data
      setValue('title', task.title);
      setValue('description', task.description || '');
      setValue('type', task.type || TaskType.TASK);
      setValue('visibility', task.visibility || TaskVisibility.PRIVATE);
      setValue('priority', task.priority);
      setValue('deadline', task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd\'T\'HH:mm') : '');
      setValue('patientId', task.patientId || '');
      setValue('boardId', task.boardId || '');
      setValue('assignedUserIds', task.assignments.map(a => a.userId));

      // Set reminders
      setReminders(task.reminders.map(r => ({
        reminderTime: format(new Date(r.reminderTime), 'yyyy-MM-dd\'T\'HH:mm'),
        message: r.message || ''
      })));

      // Set poll options
      setPollOptions(task.options?.map(opt => ({
        text: opt.text,
        order: opt.order
      })) || []);
    } else {
      // Reset form for new task
      reset({
        type: TaskType.TASK,
        visibility: TaskVisibility.PRIVATE,
        priority: TaskPriority.MEDIUM,
        assignedUserIds: []
      });
      setReminders([]);
      setPollOptions([]);
    }
  }, [task, setValue, reset]);

  // Auto-assign board members and set visibility when board is selected
  useEffect(() => {
    if (!task && watchedBoardId) { // Only for new tasks
      const selectedBoard = boards.find(board => board.id === watchedBoardId);
      if (selectedBoard) {
        // Set visibility to match board's visibility
        const newVisibility = selectedBoard.isPublic ? TaskVisibility.PUBLIC : TaskVisibility.PRIVATE;
        setValue('visibility', newVisibility);

        // Auto-assign all board members to the task
        if (selectedBoard.members && selectedBoard.members.length > 0) {
          const memberIds = selectedBoard.members.map(member => member.userId);
          setValue('assignedUserIds', memberIds);
        }
      }
    }
  }, [watchedBoardId, boards, setValue, task]);

  const handleUserToggle = (userId: string) => {
    const current = watchedAssignedUserIds || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    setValue('assignedUserIds', updated);
  };

  const addReminder = () => {
    setReminders([...reminders, { reminderTime: '', message: '' }]);
  };

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const updateReminder = (index: number, field: 'reminderTime' | 'message', value: string) => {
    const updated = [...reminders];
    updated[index][field] = value;
    setReminders(updated);
  };

  const onFormSubmit = async (data: TaskFormData) => {
    try {
      const formData = {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        reminders: reminders.filter(r => r.reminderTime).map(r => ({
          reminderTime: new Date(r.reminderTime),
          message: r.message || undefined
        })),
        options: data.type === TaskType.POLL ? pollOptions.filter(opt => opt.text.trim()) : undefined
      };

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting task:', error);
    }
  };

  const selectedPatient = patients.find(p => p.id === watchedPatientId);
  const selectedUsers = users.filter(u => watchedAssignedUserIds?.includes(u.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                name={register('title').name}
                onChange={register('title').onChange}
                onBlur={register('title').onBlur}
                ref={register('title').ref}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Task Type</Label>
                <Select
                  value={watch('type')}
                  onValueChange={(value) => setValue('type', value as TaskType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskType.TASK}>Regular Task</SelectItem>
                    <SelectItem value={TaskType.POLL}>Poll</SelectItem>
                    <SelectItem value={TaskType.PLAN}>Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={watch('visibility')}
                  onValueChange={(value) => setValue('visibility', value as TaskVisibility)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskVisibility.PRIVATE}>Private</SelectItem>
                    <SelectItem value={TaskVisibility.PUBLIC}>Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={watch('priority')}
                  onValueChange={(value) => setValue('priority', value as TaskPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskPriority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  name={register('deadline').name}
                  onChange={register('deadline').onChange}
                  onBlur={register('deadline').onBlur}
                  ref={register('deadline').ref}
                />
              </div>
            </div>
          </div>

          {/* Board Selection */}
          {boards.length > 0 && (
            <div>
              <Label htmlFor="board">Task Board</Label>
              <Select
                value={watch('boardId') || 'no-board'}
                onValueChange={(value) => setValue('boardId', value === 'no-board' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a board (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-board">No board</SelectItem>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      <div className="flex items-center space-x-2">
                        <span>{board.name}</span>
                        {board.isPublic ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Public</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">Private</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {watchedBoardId && !task && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Board settings applied:</strong> Visibility and members automatically set based on board configuration.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Patient Assignment */}
          {patients.length > 0 && (
            <div>
              <Label htmlFor="patient">Associated Patient</Label>
              <Select
                value={watchedPatientId || 'no-patient'}
                onValueChange={(value) => setValue('patientId', value === 'no-patient' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-patient">No patient</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPatient && (
                <div className="mt-2">
                  <Badge variant="outline">
                    <User className="w-3 h-3 mr-1" />
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* User Assignment */}
          <div>
            <Label>Assigned Practitioners *</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={watchedAssignedUserIds?.includes(user.id) || false}
                    onCheckedChange={() => handleUserToggle(user.id)}
                  />
                  <Label className="flex-1 cursor-pointer">
                    {user.firstName} {user.lastName}
                    <span className="text-muted-foreground ml-2">({user.role})</span>
                  </Label>
                </div>
              ))}
            </div>
            {errors.assignedUserIds && (
              <p className="text-sm text-red-600 mt-1">{errors.assignedUserIds.message}</p>
            )}
            {selectedUsers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedUsers.map((user) => (
                  <Badge key={user.id} variant="secondary">
                    {user.firstName} {user.lastName}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Reminders */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Reminders</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReminder}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Reminder
              </Button>
            </div>

            {reminders.length > 0 && (
              <div className="mt-2 space-y-3">
                {reminders.map((reminder, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 border rounded-md">
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-xs">Reminder Time</Label>
                        <Input
                          type="datetime-local"
                          value={reminder.reminderTime}
                          onChange={(e) => updateReminder(index, 'reminderTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Message (optional)</Label>
                        <Input
                          placeholder="Reminder message"
                          value={reminder.message}
                          onChange={(e) => updateReminder(index, 'message', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReminder(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Poll Options */}
          {watchedTaskType === TaskType.POLL && (
            <div>
              <div className="flex items-center justify-between">
                <Label>Poll Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPollOptions([...pollOptions, { text: '', order: pollOptions.length }])}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>

              {pollOptions.length > 0 && (
                <div className="mt-2 space-y-2">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="w-8 text-sm text-muted-foreground">{index + 1}.</span>
                      <Input
                        placeholder="Option text"
                        value={option.text}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[index].text = e.target.value;
                          setPollOptions(updated);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = pollOptions.filter((_, i) => i !== index);
                          setPollOptions(updated);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {watchedTaskType === TaskType.POLL && pollOptions.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Add options for users to vote on. Leave empty for a simple yes/no poll.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 