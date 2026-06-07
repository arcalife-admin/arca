import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const organizationSettingsSchema = z.object({
  roomCount: z.number().min(1).max(50).optional(),
  openingDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
  eurToRonRate: z.number().min(0.01).max(100).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Neautorizat' },
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
        eurToRonRate: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { message: 'Organizația nu a fost găsită' },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error fetching organization settings:', error)
    return NextResponse.json(
      { message: 'Eroare internă de server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Neautorizat' },
        { status: 401 }
      )
    }

    // Check if user has permission to update organization settings
    const userRole = session.user.role
    if (userRole !== 'ORGANIZATION_OWNER' && userRole !== 'MANAGER') {
      return NextResponse.json(
        { message: 'Neautorizat — doar proprietarii și managerii pot actualiza setările' },
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
        eurToRonRate: true,
      },
    })

    return NextResponse.json(updatedOrganization)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Eroare de validare', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating organization settings:', error)
    return NextResponse.json(
      { message: 'Eroare internă de server' },
      { status: 500 }
    )
  }
} 