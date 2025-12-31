import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'

// Helper function to validate session and get user data
async function validateSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error('Unauthorized - No valid session')
  }

  // Ensure we have the required user data
  if (!session.user.organizationId) {
    throw new Error('Unauthorized - Missing organization ID')
  }

  return session
}

export async function GET(request: NextRequest) {
  try {
    const session = await validateSession()
    console.log('🔍 GET /api/user/dashboard - Session validated for user:', session.user.id)

    const dashboardData = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.userDashboard.findUnique({
        where: { userId: session.user.id },
        select: {
          quickNote: true,
          quickLinks: true,
          updatedAt: true
        }
      })
    })

    console.log('🔍 GET /api/user/dashboard - Found data:', dashboardData)

    // Return default values if no data exists
    const response = {
      quickNote: dashboardData?.quickNote || '',
      quickLinks: dashboardData?.quickLinks || [],
      updatedAt: dashboardData?.updatedAt || null
    }
    console.log('🔍 GET /api/user/dashboard - Returning response:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ GET /api/user/dashboard - Error:', error)

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Database operations cannot be performed in the browser')) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await validateSession()
    console.log('🔍 POST /api/user/dashboard - Session validated for user:', session.user.id)

    const body = await request.json()
    const { quickNote, quickLinks } = body
    console.log('🔍 POST /api/user/dashboard - Request body:', { quickNote, quickLinks })

    // Validate quickLinks format if provided
    if (quickLinks && !Array.isArray(quickLinks)) {
      console.log('❌ POST /api/user/dashboard - Invalid quickLinks format')
      return NextResponse.json({ error: 'quickLinks must be an array' }, { status: 400 })
    }

    // Validate each quick link has required fields
    if (quickLinks) {
      for (const link of quickLinks) {
        if (!link.id || !link.title || !link.url) {
          console.log('❌ POST /api/user/dashboard - Invalid link format:', link)
          return NextResponse.json({
            error: 'Each quick link must have id, title, and url fields'
          }, { status: 400 })
        }
      }
    }

    console.log('🔍 POST /api/user/dashboard - Attempting upsert for user:', session.user.id)

    const dashboardData = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.userDashboard.upsert({
        where: { userId: session.user.id },
        update: {
          quickNote: quickNote !== undefined ? quickNote : undefined,
          quickLinks: quickLinks !== undefined ? quickLinks : undefined,
        },
        create: {
          userId: session.user.id,
          quickNote: quickNote || '',
          quickLinks: quickLinks || [],
        },
        select: {
          quickNote: true,
          quickLinks: true,
          updatedAt: true
        }
      })
    })

    console.log('✅ POST /api/user/dashboard - Upsert successful:', dashboardData)

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('❌ POST /api/user/dashboard - Error:', error)

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('Database operations cannot be performed in the browser')) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 