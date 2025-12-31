import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Schema for creating a new user
const createUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  role: z.enum([
    'MANAGER',
    'DENTIST',
    'HYGIENIST',
    'RECEPTIONIST',
    'ASSISTANT',
    'ORTHODONTIST',
    'PERIODONTOLOGIST',
    'IMPLANTOLOGIST',
    'ENDODONTIST',
    'ANESTHESIOLOGIST',
    'DENTAL_TECHNICIAN',
    'DENTAL_LAB_TECHNICIAN',
  ]),
})

// Schema for updating user status
const updateUserStatusSchema = z.object({
  action: z.enum(['DISABLE', 'ENABLE', 'DELETE']),
  reason: z.string().optional(),
})

// Check if user has manager permissions
function hasManagerPermissions(userRole: string): boolean {
  return userRole === 'ORGANIZATION_OWNER' || userRole === 'MANAGER'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has manager permissions
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (!includeInactive) {
      where.isActive = true
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        isDisabled: true,
        disabledReason: true,
        disabledAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        disabledByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        // Analytics data
        _count: {
          select: {
            appointments: true,
            createdTasks: true,
            completedTasks: true,
            dentalProcedures: true,
            leaveRequests: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has manager permissions
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        password: hashedPassword,
        phone: validatedData.phone,
        address: validatedData.address,
        role: validatedData.role,
        organizationId: session.user.organizationId,
        isActive: true,
        isDisabled: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        isDisabled: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Add user to global chat if it exists
    const globalChat = await prisma.chatRoom.findFirst({
      where: { organizationId: session.user.organizationId, isGlobal: true },
    })

    if (globalChat) {
      await prisma.chatParticipant.create({
        data: {
          chatRoomId: globalChat.id,
          userId: user.id,
        },
      })
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has manager permissions
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, ...actionData } = body
    const validatedData = updateUserStatusSchema.parse(actionData)

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if target user exists and belongs to the same organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: session.user.organizationId,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent disabling/deleting organization owner
    if (targetUser.role === 'ORGANIZATION_OWNER') {
      return NextResponse.json(
        { error: 'Cannot disable or delete organization owner' },
        { status: 400 }
      )
    }

    // Prevent users from disabling themselves
    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot disable your own account' },
        { status: 400 }
      )
    }

    let updateData: any = {}

    switch (validatedData.action) {
      case 'DISABLE':
        updateData = {
          isDisabled: true,
          disabledReason: validatedData.reason || null,
          disabledAt: new Date(),
          disabledBy: session.user.id,
        }
        break

      case 'ENABLE':
        updateData = {
          isDisabled: false,
          disabledReason: null,
          disabledAt: null,
          disabledBy: null,
        }
        break

      case 'DELETE':
        // For safety, we'll deactivate instead of hard delete
        updateData = {
          isActive: false,
          isDisabled: true,
          disabledReason: `Account deleted by manager: ${validatedData.reason || 'No reason provided'}`,
          disabledAt: new Date(),
          disabledBy: session.user.id,
        }
        break
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        isDisabled: true,
        disabledReason: true,
        disabledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 