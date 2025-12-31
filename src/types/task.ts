export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskType {
  TASK = 'TASK',
  POLL = 'POLL',
  PLAN = 'PLAN'
}

export enum TaskVisibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC'
}

export enum BoardRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface TaskBoard {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isPublic: boolean;
  createdBy: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  tasks?: Task[];
  members?: BoardMember[];
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: BoardRole;
  addedBy: string;
  createdAt: Date;

  // Relations
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  adder: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TaskOption {
  id: string;
  taskId: string;
  text: string;
  order: number;
  createdAt: Date;
  votes?: TaskVote[];
}

export interface TaskVote {
  id: string;
  taskId: string;
  optionId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  option?: TaskOption;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  visibility: TaskVisibility;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: Date;
  patientId?: string;
  boardId?: string;
  createdBy: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completedBy?: string;

  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  board?: TaskBoard;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  completer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignments: TaskAssignment[];
  messages: TaskMessage[];
  reminders: TaskReminder[];
  options: TaskOption[];
  votes: TaskVote[];
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedBy: string;
  isSelfAssigned: boolean;
  createdAt: Date;

  // Relations
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  assigner: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TaskMessage {
  id: string;
  taskId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TaskReminder {
  id: string;
  taskId: string;
  reminderTime: Date;
  message?: string;
  sent: boolean;
  sentAt?: Date;
  createdAt: Date;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  type?: TaskType;
  visibility?: TaskVisibility;
  priority?: TaskPriority;
  deadline?: Date;
  patientId?: string;
  boardId?: string;
  assignedUserIds: string[];
  reminders?: Array<{
    reminderTime: Date;
    message?: string;
  }>;
  options?: Array<{
    text: string;
    order?: number;
  }>;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  type?: TaskType;
  visibility?: TaskVisibility;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: Date;
  patientId?: string;
  boardId?: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: TaskType[];
  visibility?: TaskVisibility[];
  assignedToMe?: boolean;
  createdByMe?: boolean;
  patientId?: string;
  boardId?: string;
  deadline?: {
    from?: Date;
    to?: Date;
  };
  createdAt?: {
    from?: Date;
    to?: Date;
  };
  search?: string;
}

export interface TaskSortOptions {
  field: 'createdAt' | 'updatedAt' | 'deadline' | 'priority' | 'status' | 'title';
  direction: 'asc' | 'desc';
} 