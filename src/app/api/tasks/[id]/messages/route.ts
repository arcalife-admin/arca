import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required')
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

    // Check if user has access to this task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        OR: [
          { createdBy: session.user.id },
          { assignments: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or insufficient permissions' }, { status: 404 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [messages, totalCount] = await Promise.all([
      prisma.taskMessage.findMany({
        where: { taskId: params.id },
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
        skip,
        take: limit
      }),
      prisma.taskMessage.count({
        where: { taskId: params.id }
      })
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching task messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        OR: [
          { createdBy: session.user.id },
          { assignments: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or insufficient permissions' }, { status: 404 });
    }

    const body = await request.json();
    const data = createMessageSchema.parse(body);

    const message = await prisma.taskMessage.create({
      data: {
        taskId: params.id,
        senderId: session.user.id,
        content: data.content
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(message, { status: 201 });

  } catch (error) {
    console.error('Error creating task message:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
} 