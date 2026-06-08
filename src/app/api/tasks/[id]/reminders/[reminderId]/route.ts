export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; reminderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const body = await request.json();
    const { sent, sentAt } = body;

    // First verify the reminder belongs to a task the user has access to
    const reminder = await prisma.taskReminder.findFirst({
      where: {
        id: params.reminderId,
        task: {
          id: params.id,
          organizationId: session.user.organizationId,
          OR: [
            { createdBy: session.user.id },
            { assignments: { some: { userId: session.user.id } } }
          ]
        }
      }
    });

    if (!reminder) {
      return NextResponse.json({ error: 'Memento negăsit' }, { status: 404 });
    }

    // Update the reminder
    const updatedReminder = await prisma.taskReminder.update({
      where: { id: params.reminderId },
      data: {
        sent: sent,
        sentAt: sentAt ? new Date(sentAt) : (sent ? new Date() : null)
      }
    });

    return NextResponse.json(updatedReminder);

  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { error: 'Actualizarea mementoului a eșuat' },
      { status: 500 }
    );
  }
} 