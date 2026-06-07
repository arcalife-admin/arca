import { getDocumentStepSections } from './document-fields'

export type DocumentStepValidationResult =
  | { ok: true }
  | { ok: false; message: string; documentId: string }

export function validateDocumentStep(params: {
  documentFields: Record<string, string | boolean>
  signatures: Record<string, string | null>
  signedOnPaper: Record<string, boolean>
}): DocumentStepValidationResult {
  const sections = getDocumentStepSections()

  for (const section of sections) {
    for (const field of section.fields) {
      if (!field.required) continue
      const val = params.documentFields[field.id]
      if (field.type === 'checkbox' && !val) {
        return {
          ok: false,
          message: `Completați: ${field.label} (${section.title})`,
          documentId: section.documentId,
        }
      }
      if (field.type !== 'checkbox' && !String(val || '').trim()) {
        return {
          ok: false,
          message: `Completați: ${field.label} (${section.title})`,
          documentId: section.documentId,
        }
      }
    }

    const docId = section.documentId
    if (!params.signedOnPaper[docId] && !params.signatures[docId]) {
      return {
        ok: false,
        message: `Semnătură necesară pentru: ${section.title} (sau bifați „Semnat pe hârtie”)`,
        documentId: docId,
      }
    }
  }

  return { ok: true }
}

export function isDocumentSectionComplete(params: {
  documentId: string
  documentFields: Record<string, string | boolean>
  signatures: Record<string, string | null>
  signedOnPaper: Record<string, boolean>
}): boolean {
  const section = getDocumentStepSections().find((s) => s.documentId === params.documentId)
  if (!section) return false

  for (const field of section.fields) {
    if (!field.required) continue
    const val = params.documentFields[field.id]
    if (field.type === 'checkbox' && !val) return false
    if (field.type !== 'checkbox' && !String(val || '').trim()) return false
  }

  return Boolean(params.signedOnPaper[params.documentId] || params.signatures[params.documentId])
}
