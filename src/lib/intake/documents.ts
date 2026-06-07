export type IntakeDocument = {
  id: string
  title: string
  description: string
  filePath: string | null
}

export const INTAKE_DOCUMENTS: Record<string, IntakeDocument> = {
  form1: {
    id: 'form1',
    title: 'Fișa pacient nou - chestionar medical inițial',
    description: 'Date medicale inițiale pacient nou',
    filePath: '/documents/FIȘĂ PACIENT NOU – CHESTIONAR MEDICAL INIȚIAL.pdf',
  },
  form2: {
    id: 'form2',
    title: 'Acord prelucrare date personale',
    description: 'Acord GDPR pentru date cu caracter personal',
    filePath: '/documents/ACORD PRIVIND PRELUCRAREA DATELOR CU CARACTER PERSONAL.pdf',
  },
  form3: {
    id: 'form3',
    title: 'Declarație confidențialitate',
    description: 'Declarație privind confidențialitatea',
    filePath: '/documents/DECLARAȚIE PRIVIND CONFIDENȚIALITATEA.pdf',
  },
  form4: {
    id: 'form4',
    title: 'Consimțământ informat intervenție medicală',
    description: 'Consimțământ informat pentru intervenție',
    filePath: '/documents/CONSIMȚĂMÂNT INFORMAT PENTRU INTERVENȚIE MEDICALĂ.pdf',
  },
  form5: {
    id: 'form5',
    title: 'Consimțământ imagini și comunicare rezultate',
    description: 'Imagini medicale, utilizare date, comunicare rezultate',
    filePath:
      '/documents/CONSIMȚĂMÂNT PRIVIND IMAGINILE MEDICALE, UTILIZAREA DATELOR ÎN ACTUL MEDICAL ȘI COMUNICAREA REZULTATELOR.pdf',
  },
  form6: {
    id: 'form6',
    title: 'Act adițional - riscuri speciale',
    description: 'Acord privind riscurile speciale',
    filePath: '/documents/ACT ADIȚIONAL PRIVIND RISCURILE SPECIALE.pdf',
  },
}

export const INTAKE_DOCUMENT_LIST = Object.values(INTAKE_DOCUMENTS)

export const PRINT_BUNDLE_DOCUMENT_IDS = [
  'generated-basic',
  'generated-health',
  ...INTAKE_DOCUMENT_LIST.map((d) => d.id),
]
