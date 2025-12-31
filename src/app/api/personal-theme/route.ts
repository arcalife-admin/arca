import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get personal theme settings for the user
    let themeSettings = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    // If no personal theme settings exist, create default ones
    if (!themeSettings) {
      themeSettings = await prisma.user.create({
        data: {
          id: session.user.id,
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phone: '',
          address: '',
          role: session.user.role as UserRole,
          organizationId: ''
        }
      })
    }

    return NextResponse.json(themeSettings)
  } catch (error) {
    console.error('Failed to get personal theme settings:', error)
    return NextResponse.json(
      { message: 'Failed to get personal theme settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    // Remove id, userId, createdAt, updatedAt from updates to prevent issues
    const { id, userId, createdAt, updatedAt, ...validUpdates } = updates

    // Update or create personal theme settings
    const themeSettings = await prisma.user.upsert({
      where: { id: session.user.id },
      update: validUpdates,
      create: {
        id: session.user.id,
        ...validUpdates
      }
    })

    return NextResponse.json(themeSettings)
  } catch (error) {
    console.error('Failed to update personal theme settings:', error)
    return NextResponse.json(
      { message: 'Failed to update personal theme settings' },
      { status: 500 }
    )
  }
} 