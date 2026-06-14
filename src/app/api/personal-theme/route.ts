export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { DEFAULT_THEME_VALUES, pickThemeValues } from '@/lib/theme'
import { z } from 'zod'

const themeUpdateSchema = z.object({
  primaryColor: z.string().optional(),
  primaryForeground: z.string().optional(),
  secondaryColor: z.string().optional(),
  secondaryForeground: z.string().optional(),
  accentColor: z.string().optional(),
  accentForeground: z.string().optional(),
  backgroundColor: z.string().optional(),
  surfaceColor: z.string().optional(),
  borderColor: z.string().optional(),
  textPrimary: z.string().optional(),
  textSecondary: z.string().optional(),
  textMuted: z.string().optional(),
  successColor: z.string().optional(),
  warningColor: z.string().optional(),
  errorColor: z.string().optional(),
  infoColor: z.string().optional(),
  fontFamily: z.string().optional(),
  headingFontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  headingScale: z.string().optional(),
  lineHeight: z.string().optional(),
  letterSpacing: z.string().optional(),
  borderRadius: z.string().optional(),
  spacing: z.string().optional(),
  maxWidth: z.string().optional(),
  sidebarWidth: z.string().optional(),
  buttonSize: z.enum(['sm', 'md', 'lg']).optional(),
  inputSize: z.enum(['sm', 'md', 'lg']).optional(),
  avatarSize: z.enum(['sm', 'md', 'lg']).optional(),
  iconSize: z.string().optional(),
  shadowLevel: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
  animationSpeed: z.string().optional(),
  calendarTodayBg: z.string().optional(),
  calendarAccentBg: z.string().optional(),
  customVariables: z.record(z.string()).nullish(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Neautorizat' }, { status: 401 })
    }

    const themeSettings = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient()
      return prisma.personalThemeSettings.findUnique({
        where: { userId: session.user.id },
      })
    })

    return NextResponse.json(themeSettings)
  } catch (error) {
    console.error('Failed to get personal theme settings:', error)
    return NextResponse.json(
      { message: 'Obținerea setărilor temei personale a eșuat' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Neautorizat' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = themeUpdateSchema.parse(pickThemeValues(body))

    const themeSettings = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient()
      return prisma.personalThemeSettings.upsert({
        where: { userId: session.user.id },
        update: {
          ...validatedData,
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          ...validatedData,
        },
      })
    })

    return NextResponse.json(themeSettings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Eroare de validare', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to update personal theme settings:', error)
    return NextResponse.json(
      { message: 'Actualizarea setărilor temei personale a eșuat' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Neautorizat' }, { status: 401 })
    }

    await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient()
      await prisma.personalThemeSettings.deleteMany({
        where: { userId: session.user.id },
      })
    })

    return NextResponse.json({ defaults: DEFAULT_THEME_VALUES })
  } catch (error) {
    console.error('Failed to reset personal theme settings:', error)
    return NextResponse.json(
      { message: 'Resetarea setărilor temei personale a eșuat' },
      { status: 500 }
    )
  }
}
