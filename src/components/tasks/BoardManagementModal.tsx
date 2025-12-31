'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TaskBoard, BoardRole } from '@/types/task';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Users, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const boardSchema = z.object({
  name: z.string().min(1, 'Board name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  isPublic: z.boolean().default(false),
  memberIds: z.array(z.string()).optional()
});

type BoardFormData = z.infer<typeof boardSchema>;

interface BoardManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: Array<{ id: string; firstName: string; lastName: string; role: string }>;
  onBoardCreated?: () => void;
}

const BOARD_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export default function BoardManagementModal({
  isOpen,
  onClose,
  users,
  onBoardCreated
}: BoardManagementModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [boards, setBoards] = useState<TaskBoard[]>([]);
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      isPublic: false,
      memberIds: []
    }
  });

  const watchedMemberIds = watch('memberIds');
  const watchedIsPublic = watch('isPublic');

  // Fetch existing boards
  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/boards');
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBoards();
    }
  }, [isOpen]);

  const handleUserToggle = (userId: string) => {
    const current = watchedMemberIds || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    setValue('memberIds', updated);
  };

  const onSubmit = async (data: BoardFormData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          color: selectedColor
        }),
      });

      if (!response.ok) throw new Error('Failed to create board');

      toast({
        title: 'Success',
        description: 'Board created successfully',
      });

      reset();
      setSelectedColor(BOARD_COLORS[0]);
      await fetchBoards();
      onBoardCreated?.();

    } catch (error) {
      console.error('Error creating board:', error);
      toast({
        title: 'Error',
        description: 'Failed to create board',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedUsers = users.filter(u => watchedMemberIds?.includes(u.id));

  const handleBoardClick = (boardId: string) => {
    onClose();
    router.push(`/dashboard/boards/${boardId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Board Management</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="create" className="space-y-4">
          <TabsList>
            <TabsTrigger value="create">Create Board</TabsTrigger>
            <TabsTrigger value="boards">My Boards</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Board Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Christmas Preparations"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="What is this board for?"
                    rows={3}
                  />
                </div>

                {/* Color Selection */}
                <div>
                  <Label className="flex items-center space-x-2">
                    <Palette className="w-4 h-4" />
                    <span>Board Color</span>
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BOARD_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                          }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={watchedIsPublic}
                    onCheckedChange={(checked) => setValue('isPublic', checked)}
                  />
                  <Label>Make this board public</Label>
                </div>
                {watchedIsPublic && (
                  <p className="text-sm text-muted-foreground">
                    Public boards are visible to everyone in your organization
                  </p>
                )}
              </div>

              {/* Member Selection */}
              <div>
                <Label className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Board Members</span>
                </Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={watchedMemberIds?.includes(user.id) || false}
                        onCheckedChange={() => handleUserToggle(user.id)}
                      />
                      <Label className="flex-1 cursor-pointer">
                        {user.firstName} {user.lastName}
                        <span className="text-muted-foreground ml-2">({user.role})</span>
                      </Label>
                    </div>
                  ))}
                </div>
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Board'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="boards" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boards.map((board) => (
                <Card
                  key={board.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                  onClick={() => handleBoardClick(board.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: board.color || BOARD_COLORS[0] }}
                        />
                        <span>{board.name}</span>
                        {board.isPublic && (
                          <Badge variant="outline" className="text-xs">Public</Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {board.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {board.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span>{board.tasks?.length || 0} tasks</span>
                      <span>{board.members?.length || 0} members</span>
                    </div>
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      Click to view tasks →
                    </div>
                  </CardContent>
                </Card>
              ))}

              {boards.length === 0 && (
                <div className="col-span-2 text-center py-8">
                  <p className="text-muted-foreground">No boards created yet. Create your first board!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 