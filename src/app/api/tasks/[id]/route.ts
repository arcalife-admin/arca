import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { TaskStatus, TaskPriority, UpdateTaskData } from '@/types/task';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  deadline: z.string().datetime().optional(),
  patientId: z.string().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        OR: [
          { createdBy: session.user.id },
          { assignments: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        completer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            },
            assigner: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        reminders: {
          orderBy: {
            reminderTime: 'asc'
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);

  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateTaskSchema.parse(body);

    // Check if user has permission to update this task
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        OR: [
          { createdBy: session.user.id },
          { assignments: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found or insufficient permissions' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    };

    // If status is being changed to COMPLETED, set completion info
    if (data.status === TaskStatus.COMPLETED && existingTask.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
      updateData.completedBy = session.user.id;
    }

    // If status is being changed from COMPLETED, clear completion info
    if (data.status && data.status !== TaskStatus.COMPLETED && existingTask.status === TaskStatus.COMPLETED) {
      updateData.completedAt = null;
      updateData.completedBy = null;
    }

    // Convert deadline string to Date if provided
    if (data.deadline) {
      updateData.deadline = new Date(data.deadline);
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        completer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            },
            assigner: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        reminders: {
          orderBy: {
            reminderTime: 'asc'
          }
        }
      }
    });

    return NextResponse.json(updatedTask);

  } catch (error) {
    console.error('Error updating task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete this task (only creator can delete)
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        createdBy: session.user.id
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found or insufficient permissions' }, { status: 404 });
    }

    // Delete task (this will cascade delete assignments, messages, and reminders)
    await prisma.task.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
} 