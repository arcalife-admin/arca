import type { HealthFormData } from './health-defaults'
import { createDefaultHealthFormData } from './health-defaults'

export type IntakeFlowType = 'digital' | 'manual'

export type IntakeDraft = {
  flow: IntakeFlowType
  basic: Record<string, unknown>
  health: HealthFormData
  documentFields: Record<string, string | boolean>
  signatures: Record<string, string | null>
  signedOnPaper: Record<string, boolean>
  updatedAt: string
}

const STORAGE_KEY = 'arca-patient-intake-draft'

export function loadIntakeDraft(flow: IntakeFlowType): IntakeDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as IntakeDraft
    if (parsed.flow !== flow) return null
    return {
      ...parsed,
      health: { ...createDefaultHealthFormData(), ...parsed.health },
      documentFields: parsed.documentFields || {},
      signatures: parsed.signatures || {},
      signedOnPaper: parsed.signedOnPaper || {},
    }
  } catch {
    return null
  }
}

export function saveIntakeDraft(draft: IntakeDraft): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
  )
}

/** Merge into the stored draft without dropping fields not included in the patch. */
export function patchIntakeDraft(
  flow: IntakeFlowType,
  patch: Partial<Omit<IntakeDraft, 'flow' | 'updatedAt'>>
): void {
  const existing = loadIntakeDraft(flow) ?? createEmptyDraft(flow)
  saveIntakeDraft({
    ...existing,
    ...patch,
    flow,
    updatedAt: new Date().toISOString(),
  })
}

export function clearIntakeDraft(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}

export function createEmptyDraft(flow: IntakeFlowType): IntakeDraft {
  return {
    flow,
    basic: {},
    health: createDefaultHealthFormData(),
    documentFields: {},
    signatures: {},
    signedOnPaper: {},
    updatedAt: new Date().toISOString(),
  }
}
