import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { BoardRole } from '@/types/task';
import { z } from 'zod';

const createBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  isPublic: z.boolean().default(false),
  memberIds: z.array(z.string()).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const includePublic = url.searchParams.get('includePublic') === 'true';

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (includePublic) {
      // Include public boards and boards where user is a member or creator
      where.OR = [
        { isPublic: true },
        { createdBy: session.user.id },
        {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      ];
    } else {
      // Only boards where user is creator or member
      where.OR = [
        { createdBy: session.user.id },
        {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      ];
    }

    const boards = await prisma.taskBoard.findMany({
      where,
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
            }
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            type: true,
            visibility: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(boards);

  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createBoardSchema.parse(body);

    // Create board with members in a transaction
    const board = await prisma.$transaction(async (tx) => {
      // Create the board
      const newBoard = await tx.taskBoard.create({
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          isPublic: data.isPublic,
          createdBy: session.user.id,
          organizationId: session.user.organizationId!
        }
      });

      // Add creator as admin member
      await tx.boardMember.create({
        data: {
          boardId: newBoard.id,
          userId: session.user.id,
          role: BoardRole.ADMIN,
          addedBy: session.user.id
        }
      });

      // Add additional members if provided
      if (data.memberIds && data.memberIds.length > 0) {
        await tx.boardMember.createMany({
          data: data.memberIds
            .filter(id => id !== session.user.id) // Don't duplicate creator
            .map(userId => ({
              boardId: newBoard.id,
              userId,
              role: BoardRole.MEMBER,
              addedBy: session.user.id
            }))
        });
      }

      // Return the complete board with relations
      return tx.taskBoard.findUnique({
        where: { id: newBoard.id },
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
            }
          }
        }
      });
    });

    return NextResponse.json(board, { status: 201 });

  } catch (error) {
    console.error('Error creating board:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    );
  }
} 