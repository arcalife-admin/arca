'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Task, TaskStatus, TaskPriority, TaskType, TaskVisibility } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  User,
  MessageSquare,
  MoreVertical,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  BarChart3,
  Vote,
  Globe,
  Lock,
  UserPlus
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onViewDetails: (task: Task) => void;
  currentUserId: string;
  onSelfAssign?: (taskId: string) => void;
  onVote?: (taskId: string, optionId?: string) => void;
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

const priorityIcons = {
  [TaskPriority.LOW]: null,
  [TaskPriority.MEDIUM]: null,
  [TaskPriority.HIGH]: AlertTriangle,
  [TaskPriority.URGENT]: AlertTriangle
};

export default function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onViewDetails,
  currentUserId,
  onSelfAssign,
  onVote
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(task.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== TaskStatus.COMPLETED;
  const isCreator = task.createdBy === currentUserId;
  const isAssigned = task.assignments.some(a => a.userId === currentUserId);
  const canEdit = isCreator || isAssigned;
  const canSelfAssign = !isAssigned && !isCreator && (task.visibility === TaskVisibility.PUBLIC || task.board?.isPublic);
  const userVote = task.votes?.find(v => v.userId === currentUserId);
  const totalVotes = task.votes?.length || 0;

  const PriorityIcon = priorityIcons[task.priority];

  const handleVote = async (optionId?: string) => {
    if (!onVote) return;
    setIsVoting(true);
    try {
      await onVote(task.id, optionId);
    } finally {
      setIsVoting(false);
    }
  };

  const handleSelfAssign = async () => {
    if (!onSelfAssign) return;
    setIsUpdating(true);
    try {
      await onSelfAssign(task.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-medium line-clamp-2">
              {task.title}
            </CardTitle>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(task)}>
                View Details
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    Edit Task
                  </DropdownMenuItem>
                  {task.status !== TaskStatus.COMPLETED && (
                    <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.COMPLETED)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Complete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {isCreator && (
                    <DropdownMenuItem
                      onClick={() => onDelete(task.id)}
                      className="text-red-600"
                    >
                      Delete Task
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.type === TaskType.POLL && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <BarChart3 className="w-3 h-3 mr-1" />
                Poll
              </Badge>
            )}
            {task.visibility === TaskVisibility.PUBLIC && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Globe className="w-3 h-3 mr-1" />
                Public
              </Badge>
            )}
            <Badge className={statusColors[task.status]}>
              {task.status.replace('_', ' ')}
            </Badge>
            <Badge className={priorityColors[task.priority]} variant="outline">
              {PriorityIcon && <PriorityIcon className="w-3 h-3 mr-1" />}
              {task.priority}
            </Badge>
          </div>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {task.deadline && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Due: {format(new Date(task.deadline), 'MMM dd, yyyy')}</span>
            </div>
          )}

          {task.patient && (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Patient: {task.patient.firstName} {task.patient.lastName}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>
              Assigned to: {task.assignments.length === 1
                ? `${task.assignments[0].user.firstName} ${task.assignments[0].user.lastName}`
                : `${task.assignments.length} practitioners`
              }
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Created: {format(new Date(task.createdAt), 'MMM dd, yyyy')}</span>
          </div>

          {task.messages && task.messages.length > 0 && (
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>{task.messages.length} message{task.messages.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {task.type === TaskType.POLL && (
            <div className="flex items-center space-x-2">
              <Vote className="w-4 h-4" />
              <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
              {userVote && <span className="text-green-600">• You voted</span>}
            </div>
          )}
        </div>

        {/* Poll Voting Section */}
        {task.type === TaskType.POLL && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-sm font-medium">Poll Options:</p>
            <div className="space-y-2">
              {task.options && task.options.length > 0 ? (
                task.options.map((option) => {
                  const optionVotes = task.votes?.filter(v => v.optionId === option.id).length || 0;
                  const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                  const isUserChoice = userVote?.optionId === option.id;

                  return (
                    <div key={option.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant={isUserChoice ? "default" : "outline"}
                            onClick={() => handleVote(option.id)}
                            disabled={isVoting}
                            className="h-7 px-2"
                          >
                            {option.text}
                          </Button>
                          {isUserChoice && <span className="text-xs text-green-600">✓</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {optionVotes} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                // Simple abstain vote when no options are provided
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant={userVote ? "default" : "outline"}
                        onClick={() => handleVote(undefined)}
                        disabled={isVoting}
                        className="h-7 px-2"
                      >
                        Vote
                      </Button>
                      {userVote && <span className="text-xs text-green-600">✓ You voted</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {canSelfAssign && onSelfAssign && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelfAssign}
              disabled={isUpdating}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign to me
            </Button>
          )}

          {task.status !== TaskStatus.COMPLETED && canEdit && task.type !== TaskType.POLL && (
            <>
              {task.status === TaskStatus.PENDING && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
                  disabled={isUpdating}
                >
                  Start Task
                </Button>
              )}
              {task.status === TaskStatus.IN_PROGRESS && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(TaskStatus.COMPLETED)}
                  disabled={isUpdating}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              )}
            </>
          )}
        </div>

        {task.completedAt && task.completer && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            Completed by {task.completer.firstName} {task.completer.lastName} on{' '}
            {format(new Date(task.completedAt), 'MMM dd, yyyy \'at\' HH:mm')}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 