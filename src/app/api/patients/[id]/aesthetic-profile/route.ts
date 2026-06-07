import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { PatientAestheticProfile } from '@/types/patient-aesthetic-profile'

const aestheticProfileSchema = z.object({
  history: z.array(z.object({
    id: z.string(),
    procedureKey: z.string(),
    procedureLabel: z.string(),
    sizeCc: z.string().optional(),
    sizeCup: z.string().optional(),
    timeAgo: z.string().optional(),
    notes: z.string().optional(),
  })),
  goals: z.array(z.object({
    id: z.string(),
    procedureKey: z.string(),
    procedureLabel: z.string(),
    sizeCc: z.string().optional(),
    sizeCup: z.string().optional(),
    timeAgo: z.string().optional(),
    notes: z.string().optional(),
  })),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
})

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  if (value && typeof value === 'object') {
    return value as T
  }
  return fallback
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const aestheticProfile = aestheticProfileSchema.parse(body.aestheticProfile) as PatientAestheticProfile

    const patient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        organizationId: (session.user as { organizationId: string }).organizationId,
      },
    })

    if (!patient) {
      return new NextResponse('Patient not found', { status: 404 })
    }

    const existingSurgicalHistory = parseJsonField<Record<string, unknown>>(
      patient.surgicalHistory,
      {}
    )

    const user = session.user as { firstName?: string; lastName?: string; name?: string; email?: string }
    const updatedBy = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name || user.email || 'Unknown'

    const updatedSurgicalHistory = {
      ...existingSurgicalHistory,
      aestheticProfile: {
        ...aestheticProfile,
        updatedAt: new Date().toISOString(),
        updatedBy,
      },
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: params.id },
      data: { surgicalHistory: updatedSurgicalHistory },
    })

    const parsedSurgicalHistory = parseJsonField(
      updatedPatient.surgicalHistory,
      updatedSurgicalHistory
    )

    return NextResponse.json({
      aestheticProfile: (parsedSurgicalHistory as { aestheticProfile?: PatientAestheticProfile }).aestheticProfile,
      surgicalHistory: parsedSurgicalHistory,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    console.error('Error updating aesthetic profile:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
