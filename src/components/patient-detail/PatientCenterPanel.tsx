import React from 'react'

/**
 * Patient center panel — procedure form moved to search + modal flow.
 * Kept as a no-op wrapper for compatibility with existing imports.
 */
interface PatientCenterPanelProps {
  patientId: string
  onProcedureCreated?: () => void
  [key: string]: unknown
}

export default function PatientCenterPanel(_props: PatientCenterPanelProps) {
  return null
}
