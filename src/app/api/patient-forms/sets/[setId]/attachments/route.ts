export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import {
  addSetAttachment,
  markAttachmentLinkedToPatientFile,
  readPatientFormSets,
  updatePatientFormSetPatient,
} from '@/lib/patient-form-store'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

type IntakeFieldValues = Record<string, string | boolean>

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function getFieldValue(values: IntakeFieldValues, keys: string[]): string {
  const normalizedKeys = new Set(keys.map(normalizeKey))
  for (const [rawKey, rawValue] of Object.entries(values)) {
    if (!normalizedKeys.has(normalizeKey(rawKey))) continue
    if (typeof rawValue === 'boolean') return rawValue ? 'true' : 'false'
    return String(rawValue || '').trim()
  }
  return ''
}

function parseDate(value: string): Date {
  const trimmed = value.trim()
  if (!trimmed) return new Date('1990-01-01')

  const direct = new Date(trimmed)
  if (!Number.isNaN(direct.getTime())) return direct

  const match = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (!match) return new Date('1990-01-01')

  const [, day, month, year] = match
  const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
  return Number.isNaN(parsed.getTime()) ? new Date('1990-01-01') : parsed
}

function mapGender(value: string): string {
  const normalized = normalizeKey(value)
  if (normalized.includes('f') || normalized.includes('fem') || normalized.includes('woman')) {
    return 'FEMALE'
  }
  return 'MALE'
}

async function createPatientFromIntake(params: {
  fieldValues: IntakeFieldValues
  organizationId: string
}) {
  const firstNameFromField = getFieldValue(params.fieldValues, ['prenume', 'firstName', 'givenName'])
  const lastNameFromField = getFieldValue(params.fieldValues, ['nume', 'lastName', 'surname'])
  const fullName = getFieldValue(params.fieldValues, ['numeComplet', 'fullName', 'numePrenume'])

  let firstName = firstNameFromField
  let lastName = lastNameFromField
  if ((!firstName || !lastName) && fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean)
    if (!lastName && parts.length > 0) lastName = parts[0]
    if (!firstName && parts.length > 1) firstName = parts.slice(1).join(' ')
  }

  if (!firstName) firstName = 'Pacient'
  if (!lastName) lastName = 'Nou'

  const dateOfBirth = parseDate(
    getFieldValue(params.fieldValues, [
      'dataNasterii',
      'dateOfBirth',
      'dob',
      'dataNastere',
    ])
  )

  const email = getFieldValue(params.fieldValues, ['email', 'eMail']) || null
  const phone = getFieldValue(params.fieldValues, ['telefon', 'phone', 'telefonMobil']) || null
  const addressText = getFieldValue(params.fieldValues, ['adresa', 'address'])
  const cnp = getFieldValue(params.fieldValues, ['cnp']) || `TEMP-${Date.now()}`
  const country = getFieldValue(params.fieldValues, ['tara', 'country']) || 'Romania'
  const genderRaw = getFieldValue(params.fieldValues, ['sex', 'gender', 'gen'])

  const patientCount = await prisma.patient.count({
    where: { organizationId: params.organizationId },
  })

  const patient = await prisma.patient.create({
    data: {
      patientCode: String(patientCount + 1),
      firstName,
      lastName,
      dateOfBirth,
      gender: mapGender(genderRaw),
      email,
      phone,
      address: {
        display_name: addressText || 'Nespecificat',
        lat: '0',
        lon: '0',
      },
      cnp,
      country,
      organizationId: params.organizationId,
      medicalHistory: {},
    },
  })

  return patient
}

async function syncAttachmentToPatientFile(params: {
  setId: string
  documentId: string
  patientId: string
  fileName: string
  fileSize: number
  url: string
}) {
  const createdFile = await prisma.file.create({
    data: {
      name: params.fileName,
      url: params.url,
      type: 'DOCUMENT',
      size: params.fileSize,
      patientId: params.patientId,
    },
  })

  await markAttachmentLinkedToPatientFile({
    setId: params.setId,
    documentId: params.documentId,
    patientFileId: createdFile.id,
  })
}

export async function POST(
  request: Request,
  { params }: { params: { setId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const documentId = String(formData.get('documentId') || '').trim()
    const file = formData.get('file') as File | null
    const rawFieldValues = formData.get('fieldValues')
    let fieldValues: IntakeFieldValues = {}

    if (!documentId || !file) {
      return NextResponse.json({ error: 'documentId și fișierul sunt obligatorii' }, { status: 400 })
    }

    if (typeof rawFieldValues === 'string' && rawFieldValues.trim()) {
      try {
        fieldValues = JSON.parse(rawFieldValues) as IntakeFieldValues
      } catch {
        fieldValues = {}
      }
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Sunt permise doar fișiere PDF' }, { status: 400 })
    }

    // Allow overriding uploads dir so devs can keep uploaded files outside the repo
    // (eg. export ARCA_UPLOADS_DIR=/tmp/arca-uploads)
    const baseUploads = process.env.ARCA_UPLOADS_DIR
      ? path.resolve(process.env.ARCA_UPLOADS_DIR)
      : path.join(process.cwd(), 'public', 'uploads')

    const uploadDir = path.join(baseUploads, 'patient-forms', params.setId)
    await fs.mkdir(uploadDir, { recursive: true })

    const safeName = sanitizeFileName(file.name)
    const storedName = `${Date.now()}-${safeName}`
    const diskPath = path.join(uploadDir, storedName)
    const publicUrl = `/uploads/patient-forms/${params.setId}/${storedName}`

    const bytes = await file.arrayBuffer()
    await fs.writeFile(diskPath, Buffer.from(bytes))

    let updatedSet = await addSetAttachment({
      setId: params.setId,
      documentId,
      fileName: file.name,
      url: publicUrl,
    })

    if (!updatedSet) {
      return NextResponse.json({ error: 'Setul nu a fost găsit' }, { status: 404 })
    }

    let patientId = updatedSet.patientId || ''

    if (!patientId && documentId === 'form1') {
      const organizationId = (session.user as unknown as { organizationId?: string }).organizationId
      if (organizationId) {
        const createdPatient = await createPatientFromIntake({
          fieldValues,
          organizationId,
        })
        const updatedWithPatient = await updatePatientFormSetPatient({
          setId: params.setId,
          patientId: createdPatient.id,
          patientName: `${createdPatient.firstName} ${createdPatient.lastName}`.trim(),
        })
        if (updatedWithPatient) {
          updatedSet = updatedWithPatient
          patientId = createdPatient.id
        }
      }
    }

    if (patientId) {
      // After patient exists, ensure every attachment in the set becomes a patient document.
      for (const attachment of updatedSet.attachments) {
        if (attachment.linkedPatientFileId) continue
        await syncAttachmentToPatientFile({
          setId: params.setId,
          documentId: attachment.documentId,
          patientId,
          fileName: attachment.fileName,
          fileSize: file.size,
          url: attachment.url,
        })
      }

      const refreshedSet = (await readPatientFormSets()).find((set) => set.id === params.setId)
      if (refreshedSet) {
        updatedSet = refreshedSet
      }
    }

    return NextResponse.json(updatedSet)
  } catch (error) {
    console.error('Failed to upload filled pdf:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
