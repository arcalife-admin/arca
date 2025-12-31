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
    const messages = await prisma.message.findMany({
      where: { chatRoomId },
      orderBy: { createdAt: 'asc' },
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
    });
    const formatted = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: `${msg.sender.firstName} ${msg.sender.lastName}`,
      senderId: msg.sender.id,
      color: msg.sender.calendarSettings?.color || '#cfdbff',
      timestamp: msg.createdAt,
      type: msg.type.toLowerCase(),
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
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
    const body = await req.json();
    const { content, type = 'text', fileUrl, fileName } = body;
    if (!content && !fileUrl) {
      return NextResponse.json({ error: 'Message content or file required' }, { status: 400 });
    }
    const message = await prisma.message.create({
      data: {
        content: content || '',
        type: type.toUpperCase(),
        fileUrl,
        fileName,
        chatRoomId,
        senderId: session.user.id,
      },
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
    });
    return NextResponse.json({
      id: message.id,
      content: message.content,
      sender: `${message.sender.firstName} ${message.sender.lastName}`,
      senderId: message.sender.id,
      color: message.sender.calendarSettings?.color || '#cfdbff',
      timestamp: message.createdAt,
      type: message.type.toLowerCase(),
      fileUrl: message.fileUrl,
      fileName: message.fileName,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 