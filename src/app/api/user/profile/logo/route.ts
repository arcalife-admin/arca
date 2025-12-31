import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { uploadImage } from '@/lib/cloudinary'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const dynamic = 'force-dynamic'

// Upload organization logo
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user and check if they're organization owner
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'ORGANIZATION_OWNER') {
      return NextResponse.json(
        { message: 'Unauthorized - Only organization owners can update the logo' },
        { status: 403 }
      )
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { message: 'User is not associated with an organization' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json(
        { message: 'No logo file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Delete old logo from Cloudinary if it exists
    if (user.organization?.logoUrl) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.organization.logoUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const publicId = fileName.split('.')[0]
        const fullPublicId = `dentiva/${publicId}`

        await cloudinary.uploader.destroy(fullPublicId)
      } catch (error) {
        console.error('Error deleting old logo from Cloudinary:', error)
        // Continue with upload even if old logo deletion fails
      }
    }

    // Upload new logo
    const logoUrl = await uploadImage(file)

    // Update organization with new logo URL
    const updatedOrganization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        logoUrl: logoUrl,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      logoUrl: updatedOrganization.logoUrl,
      message: 'Logo uploaded successfully',
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove organization logo
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user and check if they're organization owner
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'ORGANIZATION_OWNER') {
      return NextResponse.json(
        { message: 'Unauthorized - Only organization owners can remove the logo' },
        { status: 403 }
      )
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { message: 'User is not associated with an organization' },
        { status: 400 }
      )
    }

    // Delete logo from Cloudinary if it exists
    if (user.organization?.logoUrl) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.organization.logoUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const publicId = fileName.split('.')[0]
        const fullPublicId = `dentiva/${publicId}`

        await cloudinary.uploader.destroy(fullPublicId)
      } catch (error) {
        console.error('Error deleting logo from Cloudinary:', error)
        // Continue with database update even if Cloudinary deletion fails
      }
    }

    // Update organization to remove logo URL
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        logoUrl: null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Logo removed successfully',
    })

  } catch (error) {
    console.error('Logo removal error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 