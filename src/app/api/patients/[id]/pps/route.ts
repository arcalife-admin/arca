import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
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
    const { quadrant1, quadrant2, quadrant3, quadrant4, treatment, notes } = data

    const ppsRecord = await prisma.ppsRecord.create({
      data: {
        quadrant1,
        quadrant2,
        quadrant3,
        quadrant4,
        treatment,
        notes,
        patientId: params.id,
        createdBy: userId,
      },
    })

    return NextResponse.json(ppsRecord)
  } catch (error) {
    console.error('Error saving PPS record:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 