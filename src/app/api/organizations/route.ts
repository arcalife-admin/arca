import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const organization = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
} 