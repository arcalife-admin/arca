export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { findPatientInOrganization } from '@/lib/patient-access'

async function ensurePatientAccess(patientId: string, organizationId: string) {
  return findPatientInOrganization(patientId, organizationId)
}

// Get all notes for a patient
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const patient = await ensurePatientAccess(params.id, session.user.organizationId)
    if (!patient) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const notes = await prisma.note.findMany({
      where: {
        patientId: params.id
      },
      include: {
        folder: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { pinOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// Create a new note
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const patient = await ensurePatientAccess(params.id, session.user.organizationId)
    if (!patient) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const data = await request.json()

    const note = await prisma.note.create({
      data: {
        content: data.content,
        isPinned: data.isPinned || false,
        pinOrder: data.pinOrder,
        createdBy: session.user.id,
        folderId: data.folderId,
        patientId: params.id
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating note:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// Update a note
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const patient = await ensurePatientAccess(params.id, session.user.organizationId)
    if (!patient) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const data = await request.json()
    const { noteId, ...updateData } = data

    const note = await prisma.note.update({
      where: {
        id: noteId,
        patientId: params.id
      },
      data: {
        ...updateData,
        // Only update updatedAt if content changes
        updatedAt: updateData.content ? new Date() : undefined
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error updating note:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// Delete a note
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const patient = await ensurePatientAccess(params.id, session.user.organizationId)
    if (!patient) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return new NextResponse('Note ID required', { status: 400 })
    }

    await prisma.note.delete({
      where: {
        id: noteId,
        patientId: params.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting note:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 