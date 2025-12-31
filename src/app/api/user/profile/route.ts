import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schemas
const userUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
})

const organizationUpdateSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        organization: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      organization: user.organization,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const updateType = body.type // 'user' or 'organization'

    if (updateType === 'user') {
      // Update user information
      const validatedData = userUpdateSchema.parse(body.data)

      // Check if email is being changed to an existing email
      if (validatedData.email !== session.user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: validatedData.email },
        })

        if (existingUser) {
          return NextResponse.json(
            { message: 'Email already exists' },
            { status: 400 }
          )
        }
      }

      const updatedUser = await prisma.user.update({
        where: { email: session.user.email },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          address: validatedData.address,
          updatedAt: new Date(),
        },
        include: {
          organization: true,
        },
      })

      const { password, ...userWithoutPassword } = updatedUser

      return NextResponse.json({
        user: userWithoutPassword,
        organization: updatedUser.organization,
      })

    } else if (updateType === 'organization') {
      // Update organization information - only for organization owners
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
          { message: 'Unauthorized - Only organization owners can update organization information' },
          { status: 403 }
        )
      }

      if (!user.organizationId) {
        return NextResponse.json(
          { message: 'User is not associated with an organization' },
          { status: 400 }
        )
      }

      const validatedData = organizationUpdateSchema.parse(body.data)

      const updatedOrganization = await prisma.organization.update({
        where: { id: user.organizationId },
        data: {
          name: validatedData.name,
          address: validatedData.address,
          phone: validatedData.phone,
          email: validatedData.email,
          updatedAt: new Date(),
        },
      })

      // Fetch updated user with organization
      const updatedUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { organization: true },
      })

      const { password, ...userWithoutPassword } = updatedUser!

      return NextResponse.json({
        user: userWithoutPassword,
        organization: updatedUser!.organization,
      })

    } else {
      return NextResponse.json(
        { message: 'Invalid update type. Must be "user" or "organization"' },
        { status: 400 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Profile update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 