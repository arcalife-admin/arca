import { INTAKE_DOCUMENTS } from './documents'

export type DocumentFieldType = 'text' | 'checkbox' | 'date' | 'textarea'

export type DocumentFieldDef = {
  id: string
  documentId: string
  label: string
  type: DocumentFieldType
  pdfFieldNames?: string[]
  required?: boolean
}

export const DOCUMENT_FIELD_REGISTRY: DocumentFieldDef[] = [
  // form2 — GDPR
  { id: 'form2_patientName', documentId: 'form2', label: 'Nume și prenume pacient', type: 'text', pdfFieldNames: ['numeComplet', 'nume', 'Nume'], required: true },
  { id: 'form2_cnp', documentId: 'form2', label: 'CNP', type: 'text', pdfFieldNames: ['cnp', 'CNP'] },
  { id: 'form2_consentProcessing', documentId: 'form2', label: 'Consimt prelucrarea datelor cu caracter personal', type: 'checkbox', required: true },
  { id: 'form2_consentMarketing', documentId: 'form2', label: 'Consimt comunicări de marketing (opțional)', type: 'checkbox' },
  { id: 'form2_ackRights', documentId: 'form2', label: 'Am fost informat(ă) privind drepturile GDPR (acces, rectificare, ștergere)', type: 'checkbox', required: true },
  { id: 'form2_ackRetention', documentId: 'form2', label: 'Am luat la cunoștință perioada de stocare a datelor', type: 'checkbox', required: true },
  { id: 'form2_date', documentId: 'form2', label: 'Data', type: 'date', pdfFieldNames: ['data', 'Data'] },
  // form3 — confidentiality
  { id: 'form3_patientName', documentId: 'form3', label: 'Nume și prenume pacient', type: 'text', pdfFieldNames: ['numeComplet', 'nume'], required: true },
  { id: 'form3_ackConfidentiality', documentId: 'form3', label: 'Am luat la cunoștință politica de confidențialitate', type: 'checkbox', required: true },
  { id: 'form3_ackStaffDuty', documentId: 'form3', label: 'Înțeleg obligația personalului de a păstra confidențialitatea', type: 'checkbox', required: true },
  { id: 'form3_ackRecords', documentId: 'form3', label: 'Accept păstrarea evidențelor medicale confidențiale', type: 'checkbox', required: true },
  { id: 'form3_date', documentId: 'form3', label: 'Data', type: 'date', pdfFieldNames: ['data', 'Data'] },
  // form4 — intervention consent
  { id: 'form4_patientName', documentId: 'form4', label: 'Nume și prenume pacient', type: 'text', required: true },
  { id: 'form4_procedureDescription', documentId: 'form4', label: 'Descriere intervenție / tratament', type: 'textarea', pdfFieldNames: ['interventie', 'procedura'] },
  { id: 'form4_risksExplained', documentId: 'form4', label: 'Mi-au fost explicate riscurile și alternativele', type: 'checkbox', required: true },
  { id: 'form4_consentIntervention', documentId: 'form4', label: 'Consimt la efectuarea intervenției medicale', type: 'checkbox', required: true },
  { id: 'form4_ackAnesthesia', documentId: 'form4', label: 'Mi-au fost explicate opțiunile de anestezie/sedare', type: 'checkbox', required: true },
  { id: 'form4_ackPostOp', documentId: 'form4', label: 'Înțeleg indicațiile postoperatorii discutate', type: 'checkbox', required: true },
  { id: 'form4_emergencyContact', documentId: 'form4', label: 'Contact urgență', type: 'text' },
  { id: 'form4_date', documentId: 'form4', label: 'Data', type: 'date' },
  // form5 — imaging
  { id: 'form5_patientName', documentId: 'form5', label: 'Nume și prenume pacient', type: 'text', required: true },
  { id: 'form5_consentImaging', documentId: 'form5', label: 'Consimt la realizarea imaginilor medicale', type: 'checkbox', required: true },
  { id: 'form5_consentDataUse', documentId: 'form5', label: 'Consimt utilizarea datelor în actul medical', type: 'checkbox', required: true },
  { id: 'form5_consentResultsComm', documentId: 'form5', label: 'Consimt comunicarea rezultatelor', type: 'checkbox', required: true },
  { id: 'form5_consentTeaching', documentId: 'form5', label: 'Consimt utilizarea imaginilor în scop didactic (anonimizat)', type: 'checkbox' },
  { id: 'form5_preferredContact', documentId: 'form5', label: 'Modalitate preferată de contact pentru rezultate', type: 'text' },
  { id: 'form5_date', documentId: 'form5', label: 'Data', type: 'date' },
  // form6 — special risks
  { id: 'form6_patientName', documentId: 'form6', label: 'Nume și prenume pacient', type: 'text', required: true },
  { id: 'form6_ackSpecialRisks', documentId: 'form6', label: 'Am fost informat(ă) privind riscurile speciale', type: 'checkbox', required: true },
  { id: 'form6_ackAdditionalAct', documentId: 'form6', label: 'Accept actul adițional privind riscurile speciale', type: 'checkbox', required: true },
  { id: 'form6_ackBleeding', documentId: 'form6', label: 'Risc de sângerare — discutat și înțeles', type: 'checkbox', required: true },
  { id: 'form6_ackNerve', documentId: 'form6', label: 'Risc de lezare nervoasă — discutat și înțeles', type: 'checkbox', required: true },
  { id: 'form6_ackInfection', documentId: 'form6', label: 'Risc de infecție — discutat și înțeles', type: 'checkbox', required: true },
  { id: 'form6_riskNotes', documentId: 'form6', label: 'Observații / riscuri discutate', type: 'textarea' },
  { id: 'form6_date', documentId: 'form6', label: 'Data', type: 'date' },
]

export const ALL_DOCUMENT_FIELD_REGISTRY: DocumentFieldDef[] = [...DOCUMENT_FIELD_REGISTRY]

export function getDocumentFieldsByDocumentId(documentId: string): DocumentFieldDef[] {
  return ALL_DOCUMENT_FIELD_REGISTRY.filter((f) => f.documentId === documentId)
}

export function getDocumentStepSections(): { documentId: string; title: string; fields: DocumentFieldDef[] }[] {
  const ids = ['form2', 'form3', 'form4', 'form5', 'form6'] as const
  return ids
    .map((documentId) => ({
      documentId,
      title: INTAKE_DOCUMENTS[documentId]?.title || documentId,
      fields: getDocumentFieldsByDocumentId(documentId),
    }))
    .filter((s) => s.fields.length > 0)
}

export function createDefaultDocumentFieldValues(): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {}
  for (const field of ALL_DOCUMENT_FIELD_REGISTRY) {
    values[field.id] = field.type === 'checkbox' ? false : ''
  }
  return values
}

export function prefillDocumentFieldsFromBasic(
  basic: Record<string, unknown>,
  existing: Record<string, string | boolean>
): Record<string, string | boolean> {
  const next = { ...existing }
  const fullName = [basic.firstName, basic.lastName].filter(Boolean).join(' ').trim()
  const today = new Date().toISOString().slice(0, 10)

  for (const field of ALL_DOCUMENT_FIELD_REGISTRY) {
    if (field.id.endsWith('_patientName') && fullName && !next[field.id]) {
      next[field.id] = fullName
    }
    if (field.id.endsWith('_cnp') && basic.cnp && !next[field.id]) {
      next[field.id] = String(basic.cnp)
    }
    if (field.type === 'date' && field.id.endsWith('_date') && !next[field.id]) {
      next[field.id] = today
    }
    if (field.id === 'form4_emergencyContact' && basic.phone && !next[field.id]) {
      next[field.id] = String(basic.phone)
    }
  }
  return next
}
