import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { TaskStatus, TaskPriority, TaskType, TaskVisibility, CreateTaskData, TaskFilters } from '@/types/task';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.nativeEnum(TaskType).optional().default(TaskType.TASK),
  visibility: z.nativeEnum(TaskVisibility).optional().default(TaskVisibility.PRIVATE),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  deadline: z.string().datetime().optional(),
  patientId: z.string().optional(),
  boardId: z.string().optional(),
  assignedUserIds: z.array(z.string()).min(1, 'At least one assignee is required'),
  reminders: z.array(z.object({
    reminderTime: z.string().datetime(),
    message: z.string().optional()
  })).optional(),
  options: z.array(z.object({
    text: z.string().min(1, 'Option text is required'),
    order: z.number().optional().default(0)
  })).optional()
});

const filtersSchema = z.object({
  status: z.array(z.nativeEnum(TaskStatus)).optional(),
  priority: z.array(z.nativeEnum(TaskPriority)).optional(),
  type: z.array(z.nativeEnum(TaskType)).optional(),
  visibility: z.array(z.nativeEnum(TaskVisibility)).optional(),
  assignedToMe: z.string().transform(val => val === 'true').optional(),
  createdByMe: z.string().transform(val => val === 'true').optional(),
  patientId: z.string().optional(),
  boardId: z.string().optional(),
  deadlineFrom: z.string().datetime().optional(),
  deadlineTo: z.string().datetime().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  search: z.string().optional(),
  sortField: z.enum(['createdAt', 'updatedAt', 'deadline', 'priority', 'status', 'title']).optional().default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.string().transform(val => parseInt(val) || 1).optional().default('1'),
  limit: z.string().transform(val => parseInt(val) || 20).optional().default('20')
});

// Helper function to validate session and get user data
async function validateSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized - No valid session');
  }

  // Ensure we have the required user data
  if (!session.user.organizationId) {
    throw new Error('Unauthorized - Missing organization ID');
  }

  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await validateSession();

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    // Parse multiple values for arrays
    const statusValues = url.searchParams.getAll('status');
    const priorityValues = url.searchParams.getAll('priority');

    if (statusValues.length > 0) {
      (searchParams as any).status = statusValues;
    }
    if (priorityValues.length > 0) {
      (searchParams as any).priority = priorityValues;
    }

    const filters = filtersSchema.parse(searchParams);

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    };

    // For public tasks, include visibility filter
    const visibilityConditions = [];

    // Always include tasks user created or is assigned to
    visibilityConditions.push({ createdBy: session.user.id });
    visibilityConditions.push({
      assignments: {
        some: { userId: session.user.id }
      }
    });

    // Include public tasks
    visibilityConditions.push({ visibility: 'PUBLIC' });

    // Include tasks on boards user is member of
    visibilityConditions.push({
      board: {
        OR: [
          { isPublic: true },
          {
            members: {
              some: { userId: session.user.id }
            }
          }
        ]
      }
    });

    // Filter by assignment or creation
    if (filters.assignedToMe || filters.createdByMe) {
      const conditions = [];
      if (filters.assignedToMe) {
        conditions.push({
          assignments: {
            some: {
              userId: session.user.id
            }
          }
        });
      }
      if (filters.createdByMe) {
        conditions.push({
          createdBy: session.user.id
        });
      }
      where.OR = [...(where.OR || []), ...conditions];
    } else {
      // Apply visibility conditions when no specific user filter
      where.OR = visibilityConditions;
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }

    // Visibility filter
    if (filters.visibility && filters.visibility.length > 0) {
      where.visibility = { in: filters.visibility };
    }

    // Patient filter
    if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    // Board filter
    if (filters.boardId) {
      where.boardId = filters.boardId;
    }

    // Deadline filter
    if (filters.deadlineFrom || filters.deadlineTo) {
      where.deadline = {};
      if (filters.deadlineFrom) {
        where.deadline.gte = new Date(filters.deadlineFrom);
      }
      if (filters.deadlineTo) {
        where.deadline.lte = new Date(filters.deadlineTo);
      }
    }

    // Created date filter
    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {};
      if (filters.createdFrom) {
        where.createdAt.gte = new Date(filters.createdFrom);
      }
      if (filters.createdTo) {
        where.createdAt.lte = new Date(filters.createdTo);
      }
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        ...(where.OR || []),
        {
          title: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Sort configuration
    const orderBy: any = {};
    if (filters.sortField === 'priority') {
      // Custom priority ordering
      orderBy.priority = filters.sortDirection;
    } else {
      orderBy[filters.sortField] = filters.sortDirection;
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;

    // Get tasks with relations using retry logic
    const [tasks, totalCount] = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await Promise.all([
        prisma.task.findMany({
          where,
          orderBy,
          skip,
          take: filters.limit,
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
              take: 5 // Latest 5 messages
            },
            reminders: {
              orderBy: {
                reminderTime: 'asc'
              }
            },
            options: {
              orderBy: {
                order: 'asc'
              }
            },
            votes: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                },
                option: true
              }
            },
            board: {
              select: {
                id: true,
                name: true,
                isPublic: true,
                color: true
              }
            }
          }
        }),
        prisma.task.count({ where })
      ]);
    });

    return NextResponse.json({
      tasks,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / filters.limit)
      }
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes('Database operations cannot be performed in the browser')) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await validateSession();

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    // Create task with assignments and reminders in a transaction using retry logic
    const task = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.$transaction(async (tx) => {
        // Create the task
        const newTask = await tx.task.create({
          data: {
            title: data.title,
            description: data.description,
            priority: data.priority,
            deadline: data.deadline ? new Date(data.deadline) : undefined,
            patientId: data.patientId,
            createdBy: session.user.id,
            organizationId: session.user.organizationId!,
            ...(data.type && { type: data.type }),
            ...(data.visibility && { visibility: data.visibility }),
            ...(data.boardId && { boardId: data.boardId })
          }
        });

        // Create task assignments
        await tx.taskAssignment.createMany({
          data: data.assignedUserIds.map(userId => ({
            taskId: newTask.id,
            userId,
            assignedBy: session.user.id
          }))
        });

        // Create reminders if provided
        if (data.reminders && data.reminders.length > 0) {
          await tx.taskReminder.createMany({
            data: data.reminders.map(reminder => ({
              taskId: newTask.id,
              reminderTime: new Date(reminder.reminderTime),
              message: reminder.message
            }))
          });
        }

        // Create poll options if provided
        if (data.options && data.options.length > 0) {
          await tx.taskOption.createMany({
            data: data.options.map((option, index) => ({
              taskId: newTask.id,
              text: option.text,
              order: option.order || index
            }))
          });
        }

        // Return the complete task with relations
        return tx.task.findUnique({
          where: { id: newTask.id },
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
              }
            },
            reminders: true,
            options: {
              orderBy: {
                order: 'asc'
              }
            },
            votes: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                },
                option: true
              }
            },
            board: {
              select: {
                id: true,
                name: true,
                isPublic: true,
                color: true
              }
            }
          }
        });
      });
    });

    return NextResponse.json(task, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes('Database operations cannot be performed in the browser')) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
} 