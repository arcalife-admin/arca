export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { findPatientInOrganization } from '@/lib/patient-access'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const patient = await findPatientInOrganization(params.id, session.user.organizationId)
    if (!patient) {
      return new NextResponse('Not Found', { status: 404 })
    }

    let userId = session.user.id

    // Fallback: if user ID is not in session, try to get it from database
    if (!userId && session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
      if (user) {
        userId = user.id
      }
    }

    if (!userId) {
      return new NextResponse('User ID not found', { status: 400 })
    }

    const data = await request.json()
    const { score, notes } = data

    const asaRecord = await prisma.asaRecord.create({
      data: {
        score,
        notes,
        patientId: params.id,
        createdBy: userId,
      },
    })

    return NextResponse.json(asaRecord)
  } catch (error) {
    console.error('Error saving ASA record:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 