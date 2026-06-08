export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Schema for creating a new user
const createUserSchema = z.object({
  firstName: z.string().min(2, 'Prenumele trebuie să aibă cel puțin 2 caractere'),
  lastName: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
  email: z.string().email('Adresă de e-mail invalidă'),
  password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere'),
  phone: z.string().min(1, 'Numărul de telefon este obligatoriu'),
  address: z.string().min(1, 'Adresa este obligatorie'),
  role: z.enum([
    'ORGANIZATION_OWNER',
    'MANAGER',
    'PLASTIC_SURGEON',
    'SURGEON',
    'NURSE',
    'RECEPTIONIST',
    'ASSISTANT',
    'ANESTHESIOLOGIST',
    'AESTHETIC_NURSE',
    'MEDICAL_ASSISTANT',
    'COUNSELOR',
    'PHOTOGRAPHER',
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
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    // Check if user has manager permissions
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Permisiuni insuficiente' }, { status: 403 })
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
            surgicalProcedures: true,
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
    return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    // Check if user has manager permissions
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Permisiuni insuficiente' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Există deja un utilizator cu acest e-mail' },
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
        { error: 'Validarea a eșuat', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    // Check if user has manager permissions
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Permisiuni insuficiente' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, ...actionData } = body
    const validatedData = updateUserStatusSchema.parse(actionData)

    if (!userId) {
      return NextResponse.json({ error: 'ID-ul utilizatorului este obligatoriu' }, { status: 400 })
    }

    // Check if target user exists and belongs to the same organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: session.user.organizationId,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilizatorul nu a fost găsit' }, { status: 404 })
    }

    // Prevent disabling/deleting organization owner
    if (targetUser.role === 'ORGANIZATION_OWNER') {
      return NextResponse.json(
        { error: 'Nu se poate dezactiva sau șterge proprietarul organizației' },
        { status: 400 }
      )
    }

    // Prevent users from disabling themselves
    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'Nu vă puteți dezactiva propriul cont' },
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
        { error: 'Validarea a eșuat', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 })
  }
} 