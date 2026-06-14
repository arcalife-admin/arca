export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isPublicRegistrationEnabled } from '@/lib/require-auth'

export async function GET() {
  if (!isPublicRegistrationEnabled()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })
  }

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
    return NextResponse.json({ message: 'Eroare internă de server' }, { status: 500 })
  }
}
