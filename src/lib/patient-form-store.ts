import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

export type StoredAttachment = {
  documentId: string
  fileName: string
  url: string
  uploadedAt: string
  linkedPatientFileId?: string
}

export type StoredPatientFormSet = {
  id: string
  createdAt: string
  patientId?: string
  patientName: string
  filledBy: string
  documentIds: string[]
  attachments: StoredAttachment[]
}

// Allow overriding the on-disk store location so devs can place it outside the project
// to avoid triggering Next's file watcher (eg. set ARCA_DATA_DIR=/tmp/arca-data)
const DATA_DIR = process.env.ARCA_DATA_DIR
  ? path.resolve(process.env.ARCA_DATA_DIR)
  : path.join(process.cwd(), 'data')

const STORE_PATH = path.join(DATA_DIR, 'patient-form-sets.json')

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(STORE_PATH)
  } catch {
    await fs.writeFile(STORE_PATH, '[]', 'utf8')
  }
}

export async function readPatientFormSets(): Promise<StoredPatientFormSet[]> {
  await ensureStoreFile()
  const raw = await fs.readFile(STORE_PATH, 'utf8')
  try {
    return JSON.parse(raw) as StoredPatientFormSet[]
  } catch {
    return []
  }
}

export async function writePatientFormSets(sets: StoredPatientFormSet[]) {
  await ensureStoreFile()
  await fs.writeFile(STORE_PATH, JSON.stringify(sets, null, 2), 'utf8')
}

export async function addPatientFormSet(
  setInput: Omit<StoredPatientFormSet, 'attachments'>
): Promise<StoredPatientFormSet> {
  const sets = await readPatientFormSets()
  const set: StoredPatientFormSet = { ...setInput, attachments: [] }
  sets.unshift(set)
  await writePatientFormSets(sets)
  return set
}

export async function addSetAttachment(params: {
  setId: string
  documentId: string
  fileName: string
  url: string
}): Promise<StoredPatientFormSet | null> {
  const sets = await readPatientFormSets()
  const index = sets.findIndex((set) => set.id === params.setId)
  if (index === -1) return null

  const set = sets[index]
  const nextAttachment: StoredAttachment = {
    documentId: params.documentId,
    fileName: params.fileName,
    url: params.url,
    uploadedAt: new Date().toISOString(),
  }

  const withoutSameDocument = set.attachments.filter((item) => item.documentId !== params.documentId)
  set.attachments = [...withoutSameDocument, nextAttachment]
  sets[index] = set
  await writePatientFormSets(sets)
  return set
}

export async function updatePatientFormSetPatient(params: {
  setId: string
  patientId: string
  patientName: string
}): Promise<StoredPatientFormSet | null> {
  const sets = await readPatientFormSets()
  const index = sets.findIndex((set) => set.id === params.setId)
  if (index === -1) return null

  const set = sets[index]
  set.patientId = params.patientId
  set.patientName = params.patientName
  sets[index] = set
  await writePatientFormSets(sets)
  return set
}

export async function markAttachmentLinkedToPatientFile(params: {
  setId: string
  documentId: string
  patientFileId: string
}): Promise<StoredPatientFormSet | null> {
  const sets = await readPatientFormSets()
  const index = sets.findIndex((set) => set.id === params.setId)
  if (index === -1) return null

  const set = sets[index]
  const attachmentIndex = set.attachments.findIndex((item) => item.documentId === params.documentId)
  if (attachmentIndex === -1) return set

  set.attachments[attachmentIndex] = {
    ...set.attachments[attachmentIndex],
    linkedPatientFileId: params.patientFileId,
  }

  sets[index] = set
  await writePatientFormSets(sets)
  return set
}
