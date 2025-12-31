import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { TaskVisibility } from '@/types/task';

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

    // Check if task exists and get its details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          where: { userId: session.user.id }
        },
        board: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user is already assigned
    if (task.assignments.length > 0) {
      return NextResponse.json({ error: 'You are already assigned to this task' }, { status: 400 });
    }

    // Check if user has permission to self-assign
    let canSelfAssign = false;

    // Can self-assign to public tasks
    if (task.visibility === TaskVisibility.PUBLIC) {
      canSelfAssign = true;
    }
    // Can self-assign to tasks they created
    else if (task.createdBy === session.user.id) {
      canSelfAssign = true;
    }
    // Can self-assign to tasks on boards they're members of
    else if (task.board && task.board.members.length > 0) {
      canSelfAssign = true;
    }
    // Can self-assign to public boards
    else if (task.board && task.board.isPublic) {
      canSelfAssign = true;
    }

    if (!canSelfAssign) {
      return NextResponse.json({ error: 'You do not have permission to assign yourself to this task' }, { status: 403 });
    }

    // Create self-assignment
    const assignment = await prisma.taskAssignment.create({
      data: {
        taskId: taskId,
        userId: session.user.id,
        assignedBy: session.user.id,
        isSelfAssigned: true
      },
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
    });

    return NextResponse.json(assignment, { status: 201 });

  } catch (error) {
    console.error('Error self-assigning task:', error);
    return NextResponse.json(
      { error: 'Failed to self-assign task' },
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

    // Check if user is assigned to this task
    const assignment = await prisma.taskAssignment.findUnique({
      where: {
        taskId_userId: {
          taskId: taskId,
          userId: session.user.id
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'You are not assigned to this task' }, { status: 400 });
    }

    // Only allow removing self-assignments or if user is the one who assigned
    if (!assignment.isSelfAssigned && assignment.assignedBy !== session.user.id) {
      return NextResponse.json({ error: 'You can only remove your own assignments' }, { status: 403 });
    }

    // Remove the assignment
    await prisma.taskAssignment.delete({
      where: {
        taskId_userId: {
          taskId: taskId,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({ message: 'Successfully removed assignment' });

  } catch (error) {
    console.error('Error removing assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove assignment' },
      { status: 500 }
    );
  }
} 