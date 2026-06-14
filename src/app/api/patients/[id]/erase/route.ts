export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { requireManager, isAuthError } from '@/lib/require-auth'
import { erasePatientData } from '@/lib/patient-gdpr'
import { logActivity, LOG_ACTIONS, ENTITY_TYPES } from '@/lib/activity-logger'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireManager()
  if (isAuthError(auth)) return auth

  const result = await erasePatientData(params.id, auth.user.organizationId)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  await logActivity(
    {
      action: LOG_ACTIONS.GDPR_ERASURE,
      entityType: ENTITY_TYPES.PATIENT,
      entityId: params.id,
      description: `GDPR erasure completed for patient ${params.id}`,
      severity: 'WARN',
      patientId: params.id,
    },
    {
      userId: auth.user.id,
      organizationId: auth.user.organizationId,
    }
  )

  return NextResponse.json({ success: true, message: 'Datele pacientului au fost șterse' })
}
