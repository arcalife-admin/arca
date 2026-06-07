'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Task, TaskStatus, TaskPriority, TaskType, TaskVisibility, TaskBoard, TaskFilters as TaskFiltersType, TaskSortOptions, CreateTaskData, UpdateTaskData } from '@/types/task';
import { WaitingListStats, WaitingListEntry, CreateWaitingListEntryData } from '@/types/waiting-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import BoardManagementModal from '@/components/tasks/BoardManagementModal';
import WaitingListCard from '@/components/waiting-list/WaitingListCard';
import WaitingListTable from '@/components/waiting-list/WaitingListTable';
import WaitingListFormModal from '@/components/waiting-list/WaitingListFormModal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { logActivityClient, LOG_ACTIONS, ENTITY_TYPES, LOG_SEVERITY } from '@/lib/activity-logger';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function TasksPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const router = useRouter();
  const searchParams = useSearchParams();

  // View state
  const [currentView, setCurrentView] = useState<'tasks' | 'waiting-list' | 'waiting-details'>('tasks');
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null);
  const [selectedPractitionerName, setSelectedPractitionerName] = useState<string>('');

  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string; role: string }>>([]);
  const [patients, setPatients] = useState<Array<{ id: string; firstName: string; lastName: string; patientCode: string }>>([]);
  const [boards, setBoards] = useState<TaskBoard[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Waiting list state
  const [waitingListStats, setWaitingListStats] = useState<WaitingListStats[]>([]);
  const [waitingListEntries, setWaitingListEntries] = useState<WaitingListEntry[]>([]);
  const [waitingListLoading, setWaitingListLoading] = useState(false);

  // Filter and sort state
  const [filters, setFilters] = useState<TaskFiltersType>({});
  const [sortOptions, setSortOptions] = useState<TaskSortOptions>({
    field: 'createdAt',
    direction: 'desc'
  });

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [waitingListInitialPatientId, setWaitingListInitialPatientId] = useState<string | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [waitingListFormLoading, setWaitingListFormLoading] = useState(false);

  // Fetch tasks with current filters and sort
  const fetchTasks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Add pagination
      params.set('page', page.toString());
      params.set('limit', pagination.limit.toString());

      // Add filters
      if (filters.status) {
        filters.status.forEach(status => params.append('status', status));
      }
      if (filters.priority) {
        filters.priority.forEach(priority => params.append('priority', priority));
      }
      if (filters.assignedToMe) params.set('assignedToMe', 'true');
      if (filters.createdByMe) params.set('createdByMe', 'true');
      if (filters.patientId) params.set('patientId', filters.patientId);
      if (filters.deadline?.from) params.set('deadlineFrom', filters.deadline.from.toISOString());
      if (filters.deadline?.to) params.set('deadlineTo', filters.deadline.to.toISOString());
      if (filters.createdAt?.from) params.set('createdFrom', filters.createdAt.from.toISOString());
      if (filters.createdAt?.to) params.set('createdTo', filters.createdAt.to.toISOString());
      if (filters.search) params.set('search', filters.search);

      // Add sort
      params.set('sortField', sortOptions.field);
      params.set('sortDirection', sortOptions.direction);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error('Încărcarea sarcinilor a eșuat');

      const data = await response.json();
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Eroare',
        description: 'Încărcarea sarcinilor a eșuat',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, sortOptions, pagination.limit, toast]);

  // Fetch users, patients, and boards for task creation
  const fetchUsersAndPatients = useCallback(async () => {
    try {
      const [usersResponse, patientsResponse, boardsResponse] = await Promise.all([
        fetch('/api/practitioners'),
        fetch('/api/patients'),
        fetch('/api/boards?includePublic=true')
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        // Patients API returns array directly, not wrapped in patients property
        const patientList = Array.isArray(patientsData) ? patientsData : patientsData.patients || [];
        // Ensure patients have the required patientCode field
        const formattedPatients = patientList.map((patient: any) => ({
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          patientCode: patient.patientCode || patient.id,
        }));
        setPatients(formattedPatients);
      }

      if (boardsResponse.ok) {
        const boardsData = await boardsResponse.json();
        setBoards(Array.isArray(boardsData) ? boardsData : []);
      }
    } catch (error) {
      console.error('Error fetching users, patients, and boards:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (session?.user) {
      fetchTasks();
      fetchUsersAndPatients();
    }
  }, [session, fetchTasks, fetchUsersAndPatients]);

  // Handle URL parameters on component mount
  useEffect(() => {
    const view = searchParams.get('view');
    const practitionerId = searchParams.get('practitionerId');
    const create = searchParams.get('create');
    const patientId = searchParams.get('patientId');

    if (view === 'waiting-list') {
      setCurrentView('waiting-list');

      if (create === 'true') {
        if (patientId) {
          setWaitingListInitialPatientId(patientId);
        }
        setIsWaitingListModalOpen(true);
        router.replace('/dashboard/tasks?view=waiting-list');
      } else if (practitionerId) {
        setSelectedPractitionerId(practitionerId);
        // Fetch practitioner details to get name
        fetchPractitionerDetails(practitionerId);
        // Switch to waiting details view
        setCurrentView('waiting-details');
        // Fetch the waiting list entries for this practitioner
        fetchWaitingListEntries(practitionerId);
      }
    }
  }, [searchParams, router]); // Removed fetchWaitingListEntries since it's a useCallback function

  const fetchPractitionerDetails = async (practitionerId: string) => {
    try {
      const response = await fetch('/api/practitioners');
      if (response.ok) {
        const practitioners = await response.json();
        const practitioner = practitioners.find((p: any) => p.id === practitionerId);
        if (practitioner) {
          setSelectedPractitionerName(`${practitioner.firstName} ${practitioner.lastName}`);
        }
      }
    } catch (error) {
      console.error('Error fetching practitioner details:', error);
    }
  };


  // Handle filter changes
  const handleFiltersChange = (newFilters: TaskFiltersType) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle sort changes
  const handleSortChange = (newSortOptions: TaskSortOptions) => {
    setSortOptions(newSortOptions);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Create task
  const handleCreateTask = async (data: CreateTaskData) => {
    try {
      setFormLoading(true);
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Crearea task');

      const newTask = await response.json();

      toast({
        title: 'Succes',
        description: 'Sarcina a fost creată cu succes',
      });

      // Log task creation
      const patient = data.patientId ? patients.find(p => p.id === data.patientId) : null;
      await logActivityClient({
        action: LOG_ACTIONS.CREATE_TASK,
        entityType: ENTITY_TYPES.TASK,
        entityId: newTask.id,
        description: `Creat task: ${data.title}${patient ? ` for patient ${patient.firstName} ${patient.lastName}` : ''}`,
        details: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          type: data.type,
          visibility: data.visibility,
          deadline: data.deadline,
          boardId: data.boardId,
          assignedUserIds: data.assignedUserIds,
          remindersCount: data.reminders?.length || 0
        },
        page: '/dashboard/tasks',
        patientId: data.patientId,
        taskId: newTask.id,
        severity: LOG_SEVERITY.INFO
      });

      // Show notification for task creation
      addNotification({
        type: 'info',
        title: 'Sarcină creată',
        message: `Task "${data.title}" has been created successfully`,
        clickAction: {
          type: 'navigate',
          path: '/dashboard/tasks',
        },
        metadata: {
          taskId: newTask.id,
        },
      });

      // Show a single notification if reminders were set
      if (data.reminders && data.reminders.length > 0) {
        const upcomingReminders = data.reminders.filter(
          reminder => new Date(reminder.reminderTime) > new Date()
        );

        if (upcomingReminders.length > 0) {
          addNotification({
            type: 'info',
            title: 'Memento-uri sarcină setate',
            message: `${upcomingReminders.length} reminder${upcomingReminders.length > 1 ? 's' : ''} set for "${data.title}"`,
            clickAction: {
              type: 'navigate',
              path: '/dashboard/tasks',
            },
            metadata: {
              taskId: newTask.id,
            },
          });
        }
      }

      fetchTasks(pagination.page);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Eroare',
        description: 'Crearea sarcinii a eșuat',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Update task
  const handleUpdateTask = async (data: UpdateTaskData) => {
    if (!editingTask) return;

    try {
      setFormLoading(true);
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Actualizarea task');
      const updatedTask = await response.json();

      toast({
        title: 'Succes',
        description: 'Sarcina a fost actualizată cu succes',
      });

      // Log task update
      const patient = data.patientId ? patients.find(p => p.id === data.patientId) : null;
      await logActivityClient({
        action: LOG_ACTIONS.UPDATE_TASK,
        entityType: ENTITY_TYPES.TASK,
        entityId: editingTask.id,
        description: `Actualizat task: ${data.title || editingTask.title}${patient ? ` for patient ${patient.firstName} ${patient.lastName}` : ''}`,
        details: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          type: data.type,
          visibility: data.visibility,
          status: data.status,
          deadline: data.deadline,
          boardId: data.boardId
        },
        page: '/dashboard/tasks',
        patientId: data.patientId || editingTask.patientId,
        taskId: editingTask.id,
        severity: LOG_SEVERITY.INFO
      });

      fetchTasks(pagination.page);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Eroare',
        description: 'Actualizarea sarcinii a eșuat',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Ștergerea task');

      toast({
        title: 'Succes',
        description: 'Sarcina a fost ștearsă cu succes',
      });

      // Log task deletion
      const patient = taskToDelete.patientId ? patients.find(p => p.id === taskToDelete.patientId) : null;
      await logActivityClient({
        action: LOG_ACTIONS.DELETE_TASK,
        entityType: ENTITY_TYPES.TASK,
        entityId: taskToDelete.id,
        description: `Deleted task: ${taskToDelete.title}${patient ? ` for patient ${patient.firstName} ${patient.lastName}` : ''}`,
        details: {
          title: taskToDelete.title,
          description: taskToDelete.description,
          priority: taskToDelete.priority,
          type: taskToDelete.type,
          status: taskToDelete.status
        },
        page: '/dashboard/tasks',
        patientId: taskToDelete.patientId,
        taskId: taskToDelete.id,
        severity: LOG_SEVERITY.INFO
      });

      fetchTasks(pagination.page);
      setIsDeleteModalOpen(false);
      setTaskToDelete(undefined);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Eroare',
        description: 'Ștergerea sarcinii a eșuat',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Update task status
  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Actualizarea task status');

      const task = tasks.find(t => t.id === taskId);
      const taskTitle = task?.title || 'Task';

      toast({
        title: 'Succes',
        description: 'Statusul sarcinii a fost actualizat cu succes',
      });

      // Log status change
      const patient = task?.patientId ? patients.find(p => p.id === task.patientId) : null;
      await logActivityClient({
        action: LOG_ACTIONS.UPDATE_TASK,
        entityType: ENTITY_TYPES.TASK,
        entityId: taskId,
        description: `Changed task status to ${status.replace('_', ' ').toLowerCase()}: ${taskTitle}${patient ? ` for patient ${patient.firstName} ${patient.lastName}` : ''}`,
        details: {
          newStatus: status,
          previousStatus: task?.status,
          title: taskTitle
        },
        page: '/dashboard/tasks',
        patientId: task?.patientId,
        taskId: taskId,
        severity: LOG_SEVERITY.INFO
      });

      // Show notification for status change
      addNotification({
        type: status === TaskStatus.COMPLETED ? 'success' : 'info',
        title: 'Status sarcină actualizat',
        message: `"${taskTitle}" status changed to ${status.replace('_', ' ').toLowerCase()}`,
        clickAction: {
          type: 'navigate',
          path: '/dashboard/tasks',
        },
        metadata: {
          taskId,
        },
      });

      fetchTasks(pagination.page);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Eroare',
        description: 'Actualizarea statusului sarcinii a eșuat',
        variant: 'destructive',
      });
    }
  };

  // Handle self-assignment
  const handleSelfAssign = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/self-assign`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to self-assign task');

      const task = tasks.find(t => t.id === taskId);
      const taskTitle = task?.title || 'Task';

      toast({
        title: 'Succes',
        description: 'V-ați atribuit sarcina cu succes',
      });

      // Log self-assignment
      const patient = task?.patientId ? patients.find(p => p.id === task.patientId) : null;
      await logActivityClient({
        action: LOG_ACTIONS.ASSIGN_TASK,
        entityType: ENTITY_TYPES.TASK,
        entityId: taskId,
        description: `Self-assigned task: ${taskTitle}${patient ? ` for patient ${patient.firstName} ${patient.lastName}` : ''}`,
        details: {
          title: taskTitle,
          selfAssigned: true
        },
        page: '/dashboard/tasks',
        patientId: task?.patientId,
        taskId: taskId,
        severity: LOG_SEVERITY.INFO
      });

      addNotification({
        type: 'success',
        title: 'Sarcină auto-atribuită',
        message: `You've been assigned to "${taskTitle}"`,
        clickAction: {
          type: 'navigate',
          path: '/dashboard/tasks',
        },
        metadata: {
          taskId,
        },
      });

      fetchTasks(pagination.page);
    } catch (error) {
      console.error('Error self-assigning task:', error);
      toast({
        title: 'Eroare',
        description: 'Atribuirea sarcinii a eșuat',
        variant: 'destructive',
      });
    }
  };

  // Handle voting
  const handleVote = async (taskId: string, optionId?: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });

      if (!response.ok) throw new Error('Failed to cast vote');

      const task = tasks.find(t => t.id === taskId);
      const taskTitle = task?.title || 'Poll';

      toast({
        title: 'Succes',
        description: 'Vot înregistrat cu succes',
      });

      addNotification({
        type: 'info',
        title: 'Vot înregistrat',
        message: `Your vote has been recorded for "${taskTitle}"`,
        clickAction: {
          type: 'navigate',
          path: '/dashboard/tasks',
        },
        metadata: {
          taskId,
        },
      });

      fetchTasks(pagination.page);
    } catch (error) {
      console.error('Error casting vote:', error);
      toast({
        title: 'Eroare',
        description: 'Votarea a eșuat',
        variant: 'destructive',
      });
    }
  };

  // Modal handlers
  const handleOpenCreateModal = () => {
    setEditingTask(undefined);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDetailModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsBoardModalOpen(false);
    setIsWaitingListModalOpen(false);
    setWaitingListInitialPatientId(undefined);
    setEditingTask(undefined);
    setSelectedTask(undefined);
    setTaskToDelete(undefined);
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchTasks(newPage);
  };

  // Waiting list functions
  const fetchWaitingListStats = useCallback(async () => {
    try {
      setWaitingListLoading(true);
      const response = await fetch('/api/waiting-list/stats');
      if (!response.ok) throw new Error('Încărcarea statisticilor listei de așteptare a eșuat');

      const stats = await response.json();
      setWaitingListStats(stats);
    } catch (error) {
      console.error('Error fetching waiting list stats:', error);
      toast({
        title: 'Eroare',
        description: 'Încărcarea statisticilor listei de așteptare a eșuat',
        variant: 'destructive',
      });
    } finally {
      setWaitingListLoading(false);
    }
  }, [toast]);

  const fetchWaitingListEntries = useCallback(async (practitionerId: string) => {
    try {
      setWaitingListLoading(true);
      const response = await fetch(`/api/waiting-list?practitionerId=${practitionerId}`);
      if (!response.ok) throw new Error('Încărcarea intrărilor din lista de așteptare a eșuat');

      const entries = await response.json();
      setWaitingListEntries(entries);
    } catch (error) {
      console.error('Error fetching waiting list entries:', error);
      toast({
        title: 'Eroare',
        description: 'Încărcarea intrărilor din lista de așteptare a eșuat',
        variant: 'destructive',
      });
    } finally {
      setWaitingListLoading(false);
    }
  }, [toast]);

  const handleCreateWaitingListEntry = async (data: CreateWaitingListEntryData) => {
    try {
      setWaitingListFormLoading(true);
      const response = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Crearea waiting list entry');

      const newEntry = await response.json();

      toast({
        title: 'Succes',
        description: 'Pacient adăugat în lista de așteptare cu succes',
      });

      // Show notification
      addNotification({
        type: 'info',
        title: 'Pacient adăugat în lista de așteptare',
        message: `${newEntry.patient.firstName} ${newEntry.patient.lastName} has been added to the waiting list`,
      });

      // Refresh the appropriate view
      if (currentView === 'waiting-list') {
        fetchWaitingListStats();
      } else if (currentView === 'waiting-details' && selectedPractitionerId) {
        fetchWaitingListEntries(selectedPractitionerId);
      }
    } catch (error) {
      console.error('Error creating waiting list entry:', error);
      toast({
        title: 'Eroare',
        description: 'Adăugarea pacientului în lista de așteptare a eșuat',
        variant: 'destructive',
      });
    } finally {
      setWaitingListFormLoading(false);
    }
  };

  const handleWaitingListCardClick = (stats: WaitingListStats) => {
    setSelectedPractitionerId(stats.practitionerId);
    setSelectedPractitionerName(stats.practitionerName);
    setCurrentView('waiting-details');
    fetchWaitingListEntries(stats.practitionerId);
  };

  const handleBackToWaitingList = () => {
    setCurrentView('waiting-list');
    setSelectedPractitionerId(null);
    setSelectedPractitionerName('');
    setWaitingListEntries([]);
    fetchWaitingListStats();
  };

  const handlePatientClick = (patientId: string) => {
    router.push(`/dashboard/patients/${patientId}`);
  };

  const refreshWaitingListData = () => {
    if (currentView === 'waiting-details' && selectedPractitionerId) {
      fetchWaitingListEntries(selectedPractitionerId);
    } else if (currentView === 'waiting-list') {
      fetchWaitingListStats();
    }
  };

  // Load waiting list data when view changes
  useEffect(() => {
    if (session?.user && currentView === 'waiting-list') {
      fetchWaitingListStats();
    }
  }, [session?.user, currentView, fetchWaitingListStats]);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4">
            {currentView === 'waiting-details' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToWaitingList}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {currentView === 'tasks' && 'Sarcini'}
                {currentView === 'waiting-list' && 'Lista de așteptare'}
                {currentView === 'waiting-details' && `${selectedPractitionerName} - Lista de așteptare`}
              </h1>
              <p className="text-muted-foreground">
                {currentView === 'tasks' && 'Gestionați sarcinile și colaborați cu echipa'}
                {currentView === 'waiting-list' && 'Vizualizați pacienții care așteaptă programări, pe practician'}
                {currentView === 'waiting-details' && 'Gestionați pacienții care așteaptă acest practician'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {currentView === 'tasks' && (
            <>
              <Button variant="outline" onClick={() => setCurrentView('waiting-list')}>
                <Clock className="w-4 h-4 mr-2" />
                Lista de așteptare
              </Button>
              <Button variant="outline" onClick={() => setIsBoardModalOpen(true)}>
                Gestionați panourile
              </Button>
              <Button onClick={handleOpenCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Sarcină nouă
              </Button>
            </>
          )}
          {(currentView === 'waiting-list' || currentView === 'waiting-details') && (
            <>
              <Button variant="outline" onClick={() => setCurrentView('tasks')}>
                Înapoi la sarcini
              </Button>
              <Button onClick={() => setIsWaitingListModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adaugă pacient în lista de așteptare
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters - Only show for tasks view */}
      {currentView === 'tasks' && (
        <TaskFilters
          filters={filters}
          sortOptions={sortOptions}
          onFiltersChange={handleFiltersChange}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
          patients={patients}
        />
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Tasks View */}
        {currentView === 'tasks' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nicio sarcină găsită</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {Object.keys(filters).length > 0
                      ? 'Try adjusting your filters or create a new task.'
                      : 'Get started by creating your first task.'}
                  </p>
                  <Button onClick={handleOpenCreateModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Creează sarcină
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onEdit={handleOpenEditModal}
                      onDelete={handleDeleteTask}
                      onViewDetails={handleOpenDetailModal}
                      onSelfAssign={handleSelfAssign}
                      onVote={handleVote}
                      currentUserId={session.user.id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} tasks
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = i + 1;
                        const isActive = page === pagination.page;
                        return (
                          <Button
                            key={page}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Waiting List View */}
        {currentView === 'waiting-list' && (
          <>
            {waitingListLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : waitingListStats.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nicio intrare în lista de așteptare</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Niciun pacient în listele de așteptare momentan.
                  </p>
                  <Button onClick={() => setIsWaitingListModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă pacient în lista de așteptare
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {waitingListStats.map((stats) => (
                  <WaitingListCard
                    key={stats.practitionerId}
                    stats={stats}
                    onClick={() => handleWaitingListCardClick(stats)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Waiting List Details View */}
        {currentView === 'waiting-details' && (
          <WaitingListTable
            entries={waitingListEntries}
            practitionerName={selectedPractitionerName}
            onPatientClick={handlePatientClick}
            onRefresh={refreshWaitingListData}
          />
        )}
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        users={users}
        patients={patients}
        boards={boards}
        isLoading={formLoading}
      />

      {selectedTask && (
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseModals}
          task={selectedTask}
          onEdit={handleOpenEditModal}
          onStatusChange={handleStatusChange}
          currentUserId={session.user.id}
        />
      )}

      <BoardManagementModal
        isOpen={isBoardModalOpen}
        onClose={handleCloseModals}
        users={users}
        onBoardCreated={fetchUsersAndPatients}
      />

      {/* Waiting List Form Modal */}
      <WaitingListFormModal
        isOpen={isWaitingListModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleCreateWaitingListEntry}
        patients={patients}
        practitioners={users}
        isLoading={waitingListFormLoading}
        initialPatientId={waitingListInitialPatientId}
      />

      {/* Șterge Confirmation Modal */}
      <ConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Șterge Task"
        description={`Sigur doriți să ștergeți „${taskToDelete?.title}"? Această acțiune nu poate fi anulată.`}
        confirmText="Șterge Task"
        cancelText="Anulează"
        variant="destructive"
        icon="delete"
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
