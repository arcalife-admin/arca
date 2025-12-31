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
    const { cleaningMonths, procedureCode, useCustomText, customText, notes } = data

    // If useCustomText is true, store the custom text in notes as JSON
    let finalNotes = notes
    if (useCustomText && customText) {
      const notesData = {
        useCustomText: true,
        customText: customText,
        originalNotes: notes || ''
      }
      finalNotes = JSON.stringify(notesData)
    }

    const cleaningRecallRecord = await prisma.cleaningRecallRecord.create({
      data: {
        cleaningMonths,
        procedureCode,
        notes: finalNotes,
        patientId: params.id,
        createdBy: userId,
      },
    })

    return NextResponse.json(cleaningRecallRecord)
  } catch (error) {
    console.error('Error saving cleaning recall record:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 