import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const organizationSettingsSchema = z.object({
  roomCount: z.number().min(1).max(50).optional(),
  openingDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
  // Add other organization settings here as needed
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get organization settings
    const organization = await prisma.organization.findUnique({
      where: {
        id: session.user.organizationId,
      },
      select: {
        id: true,
        name: true,
        roomCount: true,
        openingDays: true,
        // Add other fields as needed
      },
    })

    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error fetching organization settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to update organization settings
    const userRole = session.user.role
    if (userRole !== 'ORGANIZATION_OWNER' && userRole !== 'MANAGER') {
      return NextResponse.json(
        { message: 'Unauthorized - Only organization owners and managers can update settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = organizationSettingsSchema.parse(body)

    // Update organization settings
    const updatedOrganization = await prisma.organization.update({
      where: {
        id: session.user.organizationId,
      },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        roomCount: true,
        openingDays: true,
      },
    })

    return NextResponse.json(updatedOrganization)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating organization settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 