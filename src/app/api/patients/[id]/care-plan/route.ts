import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const data = await request.json()

    // Check if patient exists and belongs to the user's organization
    const patient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        organizationId: (session.user as unknown as { organizationId: string }).organizationId,
      },
    })

    if (!patient) {
      return new NextResponse('Patient not found', { status: 404 })
    }

    // Upsert the care plan
    const carePlan = await prisma.carePlan.upsert({
      where: {
        patientId: params.id,
      },
      create: {
        patientId: params.id,
        careRequest: data.careRequest,
        careGoal: data.careGoal,
        policy: data.policy,
        riskProfile: data.riskProfile,
        createdBy: (session.user as unknown as { id: string }).id,
      },
      update: {
        careRequest: data.careRequest,
        careGoal: data.careGoal,
        policy: data.policy,
        riskProfile: data.riskProfile,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(carePlan)
  } catch (error) {
    console.error('Error updating care plan:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 