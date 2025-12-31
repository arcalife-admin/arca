import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma';
import { z } from 'zod'
import { authOptions } from '@/lib/auth-config'

const statusUpdateSchema = z.object({
  action: z.enum(['DISABLE', 'ENABLE']),
  reason: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = statusUpdateSchema.parse(body)
    const userId = (session.user as unknown as { id: string }).id

    // Check if patient exists and belongs to the user's organization
    const patient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        organizationId: (session.user as unknown as { organizationId: string }).organizationId,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { message: 'Patient not found' },
        { status: 404 }
      )
    }

    // Update patient status
    const updateData: any = {
      isDisabled: validatedData.action === 'DISABLE',
    }

    if (validatedData.action === 'DISABLE') {
      updateData.disabledReason = validatedData.reason || null
      updateData.disabledAt = new Date()
      updateData.disabledBy = userId
    } else {
      updateData.disabledReason = null
      updateData.disabledAt = null
      updateData.disabledBy = null
    }

    await prisma.patient.update({
      where: { id: params.id },
      data: updateData,
    })

    // Create status history record
    await prisma.patientStatusRecord.create({
      data: {
        patientId: params.id,
        action: validatedData.action,
        reason: validatedData.reason || null,
        createdBy: userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating patient status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get patient status history
    const statusHistory = await prisma.patientStatusRecord.findMany({
      where: {
        patientId: params.id,
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            organizationId: true,
          },
        },
      },
    })

    // Verify the patient belongs to the user's organization
    if (statusHistory.length > 0 &&
      statusHistory[0].patient.organizationId !== (session.user as unknown as { organizationId: string }).organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(statusHistory)
  } catch (error) {
    console.error('Error fetching patient status history:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 