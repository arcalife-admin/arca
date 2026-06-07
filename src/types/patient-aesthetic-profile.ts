export type AestheticProcedureEntry = {
  id: string
  procedureKey: string
  procedureLabel: string
  sizeCc?: string
  sizeCup?: string
  timeAgo?: string
  notes?: string
}

export type PatientAestheticProfile = {
  history: AestheticProcedureEntry[]
  goals: AestheticProcedureEntry[]
  updatedAt?: string
  updatedBy?: string
}

export type PatientSurgicalHistory = {
  aestheticProfile?: PatientAestheticProfile
  [key: string]: unknown
}

export function getAestheticProfile(
  surgicalHistory: PatientSurgicalHistory | null | undefined
): PatientAestheticProfile {
  return surgicalHistory?.aestheticProfile ?? { history: [], goals: [] }
}

export function createEmptyEntry(): AestheticProcedureEntry {
  return {
    id: crypto.randomUUID(),
    procedureKey: '',
    procedureLabel: '',
  }
}
