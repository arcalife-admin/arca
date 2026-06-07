import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import {
  medicationTotalStock,
  sanitizeMedicationForRole,
} from '@/lib/medications/service'
import { hasManagerPermissions } from '@/lib/medications/permissions'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { id } = await context.params
    const managerView = hasManagerPermissions(session.user.role)

    const medication = await prisma.clinicMedication.findFirst({
      where: { id, organizationId: session.user.organizationId },
    })

    if (!medication) {
      return NextResponse.json({ error: 'Medicamentul nu a fost găsit' }, { status: 404 })
    }

    const base = sanitizeMedicationForRole(medication, managerView)
    return NextResponse.json({
      medication: managerView
        ? { ...base, totalStock: medicationTotalStock(medication) }
        : base,
      isManager: managerView,
    })
  } catch (error) {
    console.error('Medication detail failed:', error)
    return NextResponse.json({ error: 'Încărcarea medicamentului a eșuat' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Permisiuni insuficiente' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()

    const existing = await prisma.clinicMedication.findFirst({
      where: { id, organizationId: session.user.organizationId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Medicamentul nu a fost găsit' }, { status: 404 })
    }

    const stockFields = ['stockFarmacia', 'stockEtaj1', 'stockEtaj2', 'stockEtaj3'] as const
    const updateData: Record<string, number | string | null> = {}

    for (const field of stockFields) {
      if (body[field] !== undefined) {
        const value = Number(body[field])
        if (!Number.isFinite(value) || value < 0) {
          return NextResponse.json({ error: `Valoare invalidă pentru ${field}` }, { status: 400 })
        }
        updateData[field] = Math.floor(value)
      }
    }

    if (body.documentationUrl !== undefined) {
      updateData.documentationUrl = body.documentationUrl || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nu există câmpuri valide de actualizat' }, { status: 400 })
    }

    const medication = await prisma.clinicMedication.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      medication: {
        ...medication,
        totalStock: medicationTotalStock(medication),
      },
    })
  } catch (error) {
    console.error('Medication update failed:', error)
    return NextResponse.json({ error: 'Actualizarea medicamentului a eșuat' }, { status: 500 })
  }
}
