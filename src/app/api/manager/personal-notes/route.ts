import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

// GET - Fetch personal notes and links
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager or organization owner
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true }
    })

    if (!user || !['MANAGER', 'ORGANIZATION_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get or create personal notes record
    let personalNotes = await prisma.managerPersonalNotes.findFirst({
      where: {
        userId: session.user.id,
        organizationId: user.organizationId
      },
      include: {
        links: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!personalNotes) {
      personalNotes = await prisma.managerPersonalNotes.create({
        data: {
          userId: session.user.id,
          organizationId: user.organizationId,
          notes: ''
        },
        include: {
          links: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    }

    return NextResponse.json({
      notes: personalNotes.notes || '',
      links: personalNotes.links.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url
      }))
    })

  } catch (error) {
    console.error('Error fetching personal notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personal notes' },
      { status: 500 }
    )
  }
}

// PUT - Update personal notes or links
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager or organization owner
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true }
    })

    if (!user || !['MANAGER', 'ORGANIZATION_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()

    if (body.action === 'updateLink') {
      // Update a specific link
      const { linkId, title, url } = body

      if (!linkId || !title?.trim() || !url?.trim()) {
        return NextResponse.json(
          { error: 'Link ID, title, and URL are required' },
          { status: 400 }
        )
      }

      const updatedLink = await prisma.managerPersonalLink.update({
        where: {
          id: linkId,
          personalNotes: {
            userId: session.user.id,
            organizationId: user.organizationId
          }
        },
        data: {
          title: title.trim(),
          url: url.trim(),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        link: {
          id: updatedLink.id,
          title: updatedLink.title,
          url: updatedLink.url
        }
      })

    } else {
      // Update notes
      const { notes } = body

      if (typeof notes !== 'string') {
        return NextResponse.json(
          { error: 'Notes must be a string' },
          { status: 400 }
        )
      }

      // Get or create personal notes record
      let personalNotes = await prisma.managerPersonalNotes.findFirst({
        where: {
          userId: session.user.id,
          organizationId: user.organizationId
        }
      })

      if (!personalNotes) {
        personalNotes = await prisma.managerPersonalNotes.create({
          data: {
            userId: session.user.id,
            organizationId: user.organizationId,
            notes: notes
          }
        })
      } else {
        personalNotes = await prisma.managerPersonalNotes.update({
          where: { id: personalNotes.id },
          data: {
            notes: notes,
            updatedAt: new Date()
          }
        })
      }

      return NextResponse.json({ success: true })
    }

  } catch (error) {
    console.error('Error updating personal notes:', error)
    return NextResponse.json(
      { error: 'Failed to update personal notes' },
      { status: 500 }
    )
  }
}

// POST - Add new link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager or organization owner
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true }
    })

    if (!user || !['MANAGER', 'ORGANIZATION_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { action, title, url } = await request.json()

    if (action !== 'addLink' || !title?.trim() || !url?.trim()) {
      return NextResponse.json(
        { error: 'Title and URL are required for adding a link' },
        { status: 400 }
      )
    }

    // Get or create personal notes record
    let personalNotes = await prisma.managerPersonalNotes.findFirst({
      where: {
        userId: session.user.id,
        organizationId: user.organizationId
      }
    })

    if (!personalNotes) {
      personalNotes = await prisma.managerPersonalNotes.create({
        data: {
          userId: session.user.id,
          organizationId: user.organizationId,
          notes: ''
        }
      })
    }

    // Create the new link
    const newLink = await prisma.managerPersonalLink.create({
      data: {
        personalNotesId: personalNotes.id,
        title: title.trim(),
        url: url.trim()
      }
    })

    return NextResponse.json({
      success: true,
      link: {
        id: newLink.id,
        title: newLink.title,
        url: newLink.url
      }
    })

  } catch (error) {
    console.error('Error adding personal link:', error)
    return NextResponse.json(
      { error: 'Failed to add personal link' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a link
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager or organization owner
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, organizationId: true }
    })

    if (!user || !['MANAGER', 'ORGANIZATION_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { linkId } = await request.json()

    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      )
    }

    // Delete the link (ensure it belongs to this user)
    await prisma.managerPersonalLink.delete({
      where: {
        id: linkId,
        personalNotes: {
          userId: session.user.id,
          organizationId: user.organizationId
        }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting personal link:', error)
    return NextResponse.json(
      { error: 'Failed to delete personal link' },
      { status: 500 }
    )
  }
} 