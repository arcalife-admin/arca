'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Task, TaskStatus, TaskPriority, TaskType, TaskVisibility, TaskBoard, TaskFilters as TaskFiltersType, TaskSortOptions, CreateTaskData, UpdateTaskData } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, AlertCircle, ArrowLeft, Users, Globe, Lock } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useNotifications } from '@/contexts/NotificationContext';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function BoardTasksPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  // State management
  const [board, setBoard] = useState<TaskBoard | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(true);
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string; role: string }>>([]);
  const [patients, setPatients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [boards, setBoards] = useState<TaskBoard[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

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
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch board information
  const fetchBoard = useCallback(async () => {
    try {
      setBoardLoading(true);
      const response = await fetch(`/api/boards/${boardId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Panou negăsit',
            description: 'Panoul pe care îl căutați nu există.',
            variant: 'destructive',
          });
          router.push('/dashboard/tasks');
          return;
        }
        throw new Error('Încărcarea panoului a eșuat');
      }

      const boardData = await response.json();
      setBoard(boardData);
    } catch (error) {
      console.error('Error fetching board:', error);
      toast({
        title: 'Eroare',
        description: 'Încărcarea informațiilor panoului a eșuat',
        variant: 'destructive',
      });
    } finally {
      setBoardLoading(false);
    }
  }, [boardId, toast, router]);

  // Fetch tasks with current filters and sort, filtered by board
  const fetchTasks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Add pagination
      params.set('page', page.toString());
      params.set('limit', pagination.limit.toString());

      // Add board filter
      params.set('boardId', boardId);

      // Add other filters
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
  }, [filters, sortOptions, pagination.limit, toast, boardId]);

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
        setPatients(Array.isArray(patientsData) ? patientsData : patientsData.patients || []);
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
    if (session?.user && boardId) {
      fetchBoard();
      fetchTasks();
      fetchUsersAndPatients();
    }
  }, [session, boardId, fetchBoard, fetchTasks, fetchUsersAndPatients]);

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

  // Create task (with board pre-selected)
  const handleCreateTask = async (data: CreateTaskData) => {
    try {
      setFormLoading(true);
      const taskData = {
        ...data,
        boardId: boardId // Pre-select this board
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) throw new Error('Crearea task');

      const newTask = await response.json();

      toast({
        title: 'Succes',
        description: 'Sarcina a fost creată cu succes',
      });

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

      toast({
        title: 'Succes',
        description: 'Sarcina a fost actualizată cu succes',
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

      toast({
        title: 'Succes',
        description: 'Statusul sarcinii a fost actualizat cu succes',
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

      toast({
        title: 'Succes',
        description: 'V-ați atribuit sarcina cu succes',
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

      toast({
        title: 'Succes',
        description: 'Vot înregistrat cu succes',
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
    setEditingTask(undefined);
    setSelectedTask(undefined);
    setTaskToDelete(undefined);
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchTasks(newPage);
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (boardLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Panou negăsit</h3>
            <p className="text-muted-foreground mb-4">
              Panoul pe care îl căutați nu există.
            </p>
            <Button onClick={() => router.push('/dashboard/tasks')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la sarcini
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/tasks')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: board.color || '#3B82F6' }}
                  />
                  <h1 className="text-3xl font-bold">{board.name}</h1>
                  {board.isPublic ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <Globe className="w-3 h-3 mr-1" />
                      Publică
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      <Lock className="w-3 h-3 mr-1" />
                      Privat
                    </Badge>
                  )}
                </div>
                {board.description && (
                  <p className="text-muted-foreground">{board.description}</p>
                )}
              </div>
            </div>
            <Button onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Sarcină nouă
            </Button>
          </div>

          {/* Filters */}
          <TaskFilters
            filters={filters}
            sortOptions={sortOptions}
            onFiltersChange={handleFiltersChange}
            onSortChange={handleSortChange}
            onClearFilters={handleClearFilters}
            patients={patients}
          />

          {/* Task List */}
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      : 'Get started by creating your first task for this board.'}
                  </p>
                  <Button onClick={handleOpenCreateModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Creează sarcină
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Sidebar - Board Membri */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Board Membri</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {board.members && board.members.length > 0 ? (
                <div className="space-y-3">
                  {board.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.user.role}
                        </p>
                      </div>
                      {member.role === 'ADMIN' && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No members assigned to this board.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Board Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statistici panou</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total sarcini:</span>
                <span className="font-medium">{pagination.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Finalizate:</span>
                <span className="font-medium">
                  {tasks.filter(t => t.status === TaskStatus.COMPLETED).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>În lucru:</span>
                <span className="font-medium">
                  {tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>În așteptare:</span>
                <span className="font-medium">
                  {tasks.filter(t => t.status === TaskStatus.PENDING).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
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
