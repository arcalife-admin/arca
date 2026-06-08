export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import {
  ensureClinicMedicationsSeeded,
  medicationTotalStock,
  sanitizeMedicationForRole,
} from '@/lib/medications/service'
import { hasManagerPermissions } from '@/lib/medications/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const organizationId = session.user.organizationId
    await ensureClinicMedicationsSeeded(organizationId)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() ?? ''
    const managerView = hasManagerPermissions(session.user.role)

    const medications = await prisma.clinicMedication.findMany({
      where: { organizationId },
      orderBy: { sortOrder: 'asc' },
    })

    const normalizedQuery = query.toLowerCase()
    const filtered = query
      ? medications.filter((med) => {
          const haystack = [
            med.name,
            med.activeIngredient ?? '',
            ...med.aliases,
          ]
            .join(' ')
            .toLowerCase()
          return haystack.includes(normalizedQuery)
        })
      : medications

    const results = filtered.map((med) => {
      const base = sanitizeMedicationForRole(med, managerView)
      return managerView
        ? { ...base, totalStock: medicationTotalStock(med) }
        : base
    })

    return NextResponse.json({
      results,
      isManager: managerView,
      count: results.length,
    })
  } catch (error) {
    console.error('Medications search failed:', error)
    return NextResponse.json({ error: 'Încărcarea medicamentelor a eșuat' }, { status: 500 })
  }
}
