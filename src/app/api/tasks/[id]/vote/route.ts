import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { TaskType } from '@/types/task';
import { z } from 'zod';

const voteSchema = z.object({
  optionId: z.string().optional() // null for abstain votes
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    const body = await request.json();
    const { optionId } = voteSchema.parse(body);

    // Check if task exists and is a poll
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        options: true,
        assignments: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.type !== TaskType.POLL) {
      return NextResponse.json({ error: 'Task is not a poll' }, { status: 400 });
    }

    // Check if user has permission to vote
    const canVote = task.visibility === 'PUBLIC' ||
      task.createdBy === session.user.id ||
      task.assignments.length > 0;

    if (!canVote) {
      return NextResponse.json({ error: 'You do not have permission to vote on this poll' }, { status: 403 });
    }

    // If optionId is provided, validate it exists
    if (optionId) {
      const option = task.options.find(opt => opt.id === optionId);
      if (!option) {
        return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
      }
    }

    // Upsert vote (create or update existing vote)
    const vote = await prisma.taskVote.upsert({
      where: {
        taskId_userId: {
          taskId: taskId,
          userId: session.user.id
        }
      },
      update: {
        optionId: optionId || null,
        updatedAt: new Date()
      },
      create: {
        taskId: taskId,
        optionId: optionId || null,
        userId: session.user.id
      },
      include: {
        option: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(vote);

  } catch (error) {
    console.error('Error casting vote:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to cast vote' },
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

    const taskId = params.id;

    // Check if vote exists
    const existingVote = await prisma.taskVote.findUnique({
      where: {
        taskId_userId: {
          taskId: taskId,
          userId: session.user.id
        }
      }
    });

    if (!existingVote) {
      return NextResponse.json({ error: 'Vote not found' }, { status: 404 });
    }

    // Delete the vote
    await prisma.taskVote.delete({
      where: {
        taskId_userId: {
          taskId: taskId,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({ message: 'Vote removed successfully' });

  } catch (error) {
    console.error('Error removing vote:', error);
    return NextResponse.json(
      { error: 'Failed to remove vote' },
      { status: 500 }
    );
  }
} 