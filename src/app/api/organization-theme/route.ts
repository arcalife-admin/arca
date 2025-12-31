import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { z } from 'zod'

const themeUpdateSchema = z.object({
  // Colors - Primary Theme
  primaryColor: z.string().optional(),
  primaryForeground: z.string().optional(),
  secondaryColor: z.string().optional(),
  secondaryForeground: z.string().optional(),
  accentColor: z.string().optional(),
  accentForeground: z.string().optional(),

  // Background Colors
  backgroundColor: z.string().optional(),
  surfaceColor: z.string().optional(),
  borderColor: z.string().optional(),

  // Text Colors
  textPrimary: z.string().optional(),
  textSecondary: z.string().optional(),
  textMuted: z.string().optional(),

  // State Colors
  successColor: z.string().optional(),
  warningColor: z.string().optional(),
  errorColor: z.string().optional(),
  infoColor: z.string().optional(),

  // Typography
  fontFamily: z.string().optional(),
  headingFontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  headingScale: z.string().optional(),
  lineHeight: z.string().optional(),
  letterSpacing: z.string().optional(),

  // Spacing & Layout
  borderRadius: z.string().optional(),
  spacing: z.string().optional(),
  maxWidth: z.string().optional(),
  sidebarWidth: z.string().optional(),

  // Component Sizes
  buttonSize: z.enum(['sm', 'md', 'lg']).optional(),
  inputSize: z.enum(['sm', 'md', 'lg']).optional(),
  avatarSize: z.enum(['sm', 'md', 'lg']).optional(),
  iconSize: z.string().optional(),

  // Shadows & Effects
  shadowLevel: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
  animationSpeed: z.string().optional(),

  // Calendar Specific
  calendarTodayBg: z.string().optional(),
  calendarAccentBg: z.string().optional(),

  // Custom CSS Variables
  customVariables: z.record(z.string()).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get theme settings for the organization
    let themeSettings = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.organizationThemeSettings.findUnique({
        where: {
          organizationId: session.user.organizationId,
        },
      })
    })

    // If no theme settings exist, create default ones
    if (!themeSettings) {
      themeSettings = await db.executeWithRetry(async () => {
        const prisma = db.getPrismaClient();
        return await prisma.organizationThemeSettings.create({
          data: {
            organizationId: session.user.organizationId,
          },
        })
      })
    }

    return NextResponse.json(themeSettings)
  } catch (error) {
    console.error('Error fetching theme settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId || session.user.role !== 'ORGANIZATION_OWNER') {
      return NextResponse.json(
        { message: 'Unauthorized - Only organization owners can update theme settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = themeUpdateSchema.parse(body)

    // Upsert theme settings (create if doesn't exist, update if it does)
    const themeSettings = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.organizationThemeSettings.upsert({
        where: {
          organizationId: session.user.organizationId,
        },
        update: {
          ...validatedData,
          updatedAt: new Date(),
        },
        create: {
          organizationId: session.user.organizationId,
          ...validatedData,
        },
      })
    })

    return NextResponse.json(themeSettings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating theme settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 