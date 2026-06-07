/** @deprecated Legacy patient-forms sets API. Use `/api/patients/intake/complete` via Add Patient intake flow. */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { addPatientFormSet, readPatientFormSets } from '@/lib/patient-form-store'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const sets = await readPatientFormSets()
    return NextResponse.json({ sets })
  } catch (error) {
    console.error('Failed to read patient form sets:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const patientId = String(body?.patientId || '').trim()
    const patientName = String(body?.patientName || '').trim()
    const filledBy = String(body?.filledBy || '').trim()
    const documentIds = Array.isArray(body?.documentIds)
      ? body.documentIds.map((id: unknown) => String(id))
      : []

    if (documentIds.length === 0) {
      return NextResponse.json({ error: 'Câmpuri obligatorii lipsă' }, { status: 400 })
    }

    const created = await addPatientFormSet({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      patientId: patientId || undefined,
      patientName: patientName || 'New patient (from intake form)',
      filledBy: filledBy || 'Clerk nespecificat',
      documentIds,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Failed to create patient form set:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
