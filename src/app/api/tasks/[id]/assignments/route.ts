export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignUserSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required')
});

const unassignUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
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
      return NextResponse.json({ error: 'Sarcina nu a fost găsită sau permisiuni insuficiente' }, { status: 404 });
    }

    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true
          }
        },
        assigner: {
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
    });

    return NextResponse.json(assignments);

  } catch (error) {
    console.error('Error fetching task assignments:', error);
    return NextResponse.json(
      { error: 'Încărcarea atribuirilor a eșuat' },
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
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    // Check if user has access to this task and can assign users
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
      return NextResponse.json({ error: 'Sarcina nu a fost găsită sau permisiuni insuficiente' }, { status: 404 });
    }

    const body = await request.json();
    const data = assignUserSchema.parse(body);

    // Verify all users exist and belong to the same organization
    const users = await prisma.user.findMany({
      where: {
        id: { in: data.userIds },
        organizationId: session.user.organizationId
      }
    });

    if (users.length !== data.userIds.length) {
      return NextResponse.json({ error: 'Unul sau mai mulți utilizatori nu au fost găsiți' }, { status: 400 });
    }

    // Get existing assignments to avoid duplicates
    const existingAssignments = await prisma.taskAssignment.findMany({
      where: {
        taskId: params.id,
        userId: { in: data.userIds }
      }
    });

    const existingUserIds = existingAssignments.map(a => a.userId);
    const newUserIds = data.userIds.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return NextResponse.json({ error: 'Toți utilizatorii sunt deja atribuiți la această sarcină' }, { status: 400 });
    }

    // Create new assignments
    await prisma.taskAssignment.createMany({
      data: newUserIds.map(userId => ({
        taskId: params.id,
        userId,
        assignedBy: session.user.id
      }))
    });

    // Return updated assignments
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true
          }
        },
        assigner: {
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
    });

    return NextResponse.json(assignments, { status: 201 });

  } catch (error) {
    console.error('Error assigning users to task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validarea a eșuat', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Atribuirea utilizatorilor a eșuat' },
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
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const body = await request.json();
    const data = unassignUserSchema.parse(body);

    // Check if user has access to this task and can unassign users
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
      return NextResponse.json({ error: 'Sarcina nu a fost găsită sau permisiuni insuficiente' }, { status: 404 });
    }

    // Check if assignment exists
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId: params.id,
        userId: data.userId
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Atribuirea nu a fost găsită' }, { status: 404 });
    }

    // Don't allow removing the last assignment
    const assignmentCount = await prisma.taskAssignment.count({
      where: { taskId: params.id }
    });

    if (assignmentCount <= 1) {
      return NextResponse.json({ error: 'Nu se poate elimina ultima atribuire de la o sarcină' }, { status: 400 });
    }

    // Remove assignment
    await prisma.taskAssignment.delete({
      where: { id: assignment.id }
    });

    return NextResponse.json({ message: 'Utilizatorul a fost dezatribuit cu succes' });

  } catch (error) {
    console.error('Error unassigning user from task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validarea a eșuat', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Dezatribuirea utilizatorului a eșuat' },
      { status: 500 }
    );
  }
} 