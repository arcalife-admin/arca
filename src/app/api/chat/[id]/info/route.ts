import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const chatRoomId = params.id;
    if (!chatRoomId) {
      return NextResponse.json({ error: 'Missing chat room id' }, { status: 400 });
    }
    // Check if user is a participant
    const isParticipant = await prisma.chatParticipant.findFirst({
      where: { chatRoomId, userId: session.user.id }
    });
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Fetch chat room info
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
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
      }
    });
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    // Message stats
    const messages = await prisma.message.findMany({
      where: { chatRoomId },
      select: {
        id: true,
        senderId: true,
        type: true,
        fileUrl: true,
        fileName: true,
        createdAt: true,
      },
    });
    const totalMessages = messages.length;
    const messagesPerParticipant = {};
    messages.forEach(msg => {
      messagesPerParticipant[msg.senderId] = (messagesPerParticipant[msg.senderId] || 0) + 1;
    });
    // Uploaded files
    const files = messages.filter(msg => msg.type === 'FILE' || msg.type === 'IMAGE').map(msg => ({
      id: msg.id,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      type: msg.type,
      createdAt: msg.createdAt,
      senderId: msg.senderId,
    }));
    return NextResponse.json({
      id: chatRoom.id,
      name: chatRoom.name,
      createdAt: chatRoom.createdAt,
      participants: chatRoom.participants.map(p => ({
        id: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        color: p.user.calendarSettings?.color || '#cfdbff',
      })),
      totalMessages,
      messagesPerParticipant,
      files,
    });
  } catch (error) {
    console.error('Error fetching group info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 