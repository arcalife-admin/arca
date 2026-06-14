export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { erasePatientData } from '@/lib/patient-gdpr'

function getRetentionDays(envKey: string, defaultDays: number): number {
  const value = process.env[envKey]
  if (!value) return defaultDays
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? defaultDays : parsed
}

function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

/**
 * Scheduled data retention purge.
 * Configure in Vercel Cron: GET /api/cron/data-retention with Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const activityLogDays = getRetentionDays('RETENTION_ACTIVITY_LOG_DAYS', 730)
  const disabledPatientDays = getRetentionDays('RETENTION_DISABLED_PATIENT_DAYS', 730)

  const activityLogCutoff = new Date()
  activityLogCutoff.setDate(activityLogCutoff.getDate() - activityLogDays)

  const disabledPatientCutoff = new Date()
  disabledPatientCutoff.setDate(disabledPatientCutoff.getDate() - disabledPatientDays)

  const deletedLogs = await prisma.activityLog.deleteMany({
    where: {
      createdAt: { lt: activityLogCutoff },
    },
  })

  const patientsToPurge = await prisma.patient.findMany({
    where: {
      isDisabled: true,
      disabledAt: { lt: disabledPatientCutoff },
    },
    select: { id: true, organizationId: true },
  })

  let purgedPatients = 0
  for (const patient of patientsToPurge) {
    const result = await erasePatientData(patient.id, patient.organizationId)
    if (result.success) purgedPatients++
  }

  return NextResponse.json({
    success: true,
    deletedActivityLogs: deletedLogs.count,
    purgedDisabledPatients: purgedPatients,
    cutoffs: {
      activityLog: activityLogCutoff.toISOString(),
      disabledPatient: disabledPatientCutoff.toISOString(),
    },
  })
}
