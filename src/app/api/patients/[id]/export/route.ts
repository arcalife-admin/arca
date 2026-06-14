export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { requireManager, isAuthError } from '@/lib/require-auth'
import { exportPatientData } from '@/lib/patient-gdpr'
import { logActivity, LOG_ACTIONS, ENTITY_TYPES } from '@/lib/activity-logger'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireManager()
  if (isAuthError(auth)) return auth

  const data = await exportPatientData(params.id, auth.user.organizationId)

  if (!data) {
    return NextResponse.json({ error: 'Pacientul nu a fost găsit' }, { status: 404 })
  }

  await logActivity(
    {
      action: LOG_ACTIONS.EXPORT_DATA,
      entityType: ENTITY_TYPES.PATIENT,
      entityId: params.id,
      description: `GDPR export for patient ${params.id}`,
      severity: 'INFO',
      patientId: params.id,
    },
    {
      userId: auth.user.id,
      organizationId: auth.user.organizationId,
    }
  )

  return NextResponse.json(data, {
    headers: {
      'Content-Disposition': `attachment; filename="patient-export-${params.id}.json"`,
    },
  })
}
