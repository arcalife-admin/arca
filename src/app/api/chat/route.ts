import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';

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



export async function GET() {
  try {
    const session = await validateSession();

    // Find all chat rooms the user is a participant in
    const chatParticipants = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.chatParticipant.findMany({
        where: { userId: session.user.id },
        select: { chatRoomId: true }
      });
    });

    const chatRoomIds = chatParticipants.map(cp => cp.chatRoomId);

    const chatRooms = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.chatRoom.findMany({
        where: { id: { in: chatRoomIds } },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  calendarSettings: { select: { color: true } }
                }
              }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  calendarSettings: { select: { color: true } }
                }
              }
            }
          }
        }
      });
    });

    // Format the response to match the frontend expectations
    const formatted = chatRooms.map(room => ({
      id: room.id,
      name: room.name,
      type: room.type,
      isGlobal: room.isGlobal,
      participants: room.participants.map(p => ({
        id: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        color: p.user.calendarSettings?.color || '#cfdbff',
      })),
      lastMessage: room.messages[0]
        ? {
          content: room.messages[0].content,
          timestamp: room.messages[0].createdAt,
          sender: `${room.messages[0].sender.firstName} ${room.messages[0].sender.lastName}`,
          color: room.messages[0].sender.calendarSettings?.color || '#cfdbff',
        }
        : undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await validateSession();

    const body = await req.json();
    const { name, participantIds, type = 'PRIVATE' } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
      return NextResponse.json({ error: 'At least one participant required' }, { status: 400 });
    }

    // Ensure all participants are in the same organization
    const users = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.user.findMany({
        where: {
          id: { in: participantIds },
          organizationId: session.user.organizationId,
        },
      });
    });

    if (users.length !== participantIds.length) {
      return NextResponse.json({ error: 'Invalid participants' }, { status: 400 });
    }

    // Always include the current user as a participant
    const allParticipantIds = Array.from(new Set([...participantIds, session.user.id]));

    // Create the chat room
    const chatRoom = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.chatRoom.create({
        data: {
          name,
          type,
          organizationId: session.user.organizationId,
          participants: {
            create: allParticipantIds.map(userId => ({ userId })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  calendarSettings: { select: { color: true } }
                }
              }
            }
          }
        }
      });
    });

    return NextResponse.json({
      id: chatRoom.id,
      name: chatRoom.name,
      type: chatRoom.type,
      participants: chatRoom.participants.map(p => ({
        id: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        color: p.user.calendarSettings?.color || '#cfdbff',
      })),
    });
  } catch (error) {
    console.error('Error creating chat:', error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 