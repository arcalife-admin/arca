import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

// Get all folders for a patient
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const folders = await prisma.noteFolder.findMany({
      where: {
        patientId: params.id
      },
      include: {
        notes: {
          orderBy: [
            { isPinned: 'desc' },
            { pinOrder: 'asc' },
            { createdAt: 'desc' }
          ]
        }
      }
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error('Error fetching folders:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// Create a new folder
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

    const folder = await prisma.noteFolder.create({
      data: {
        name: data.name,
        patientId: params.id
      }
    })

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Error creating folder:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// Update a folder
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const data = await request.json()
    const { folderId, ...updateData } = data

    const folder = await prisma.noteFolder.update({
      where: {
        id: folderId,
        patientId: params.id
      },
      data: updateData
    })

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Error updating folder:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// Delete a folder
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')

    if (!folderId) {
      return new NextResponse('Folder ID required', { status: 400 })
    }

    // First move all notes in this folder to no folder
    await prisma.note.updateMany({
      where: {
        folderId,
        patientId: params.id
      },
      data: {
        folderId: null
      }
    })

    // Then delete the folder
    await prisma.noteFolder.delete({
      where: {
        id: folderId,
        patientId: params.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 