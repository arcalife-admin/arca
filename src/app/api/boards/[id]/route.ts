export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const { id } = params;

    const board = await prisma.taskBoard.findFirst({
      where: {
        id,
        OR: [
          // Board creator
          { createdBy: session.user.id },
          // Board member
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          },
          // Public board in same organization
          {
            isPublic: true,
            organizationId: session.user.organizationId
          }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            },
            adder: {
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
        tasks: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Panoul nu a fost găsit' }, { status: 404 });
    }

    return NextResponse.json(board);

  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json(
      { error: 'Încărcarea panoului a eșuat' },
      { status: 500 }
    );
  }
} 