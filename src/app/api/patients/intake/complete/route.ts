export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth-config'
import { createPatientRecord, type CreatePatientInput } from '@/lib/intake/create-patient'
import { generateMedicalSummary } from '@/lib/intake/generate-medical-summary'
import { fillIntakePdf } from '@/lib/intake/fill-pdf'
import { INTAKE_DOCUMENT_LIST } from '@/lib/intake/documents'
import { uploadPatientFile } from '@/lib/intake/upload-patient-file'
import type { HealthFormData } from '@/lib/intake/health-defaults'

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE']),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.object({
    display_name: z.string(),
    lat: z.string(),
    lon: z.string(),
    altitude: z.number().optional(),
  }),
  cnp: z.string().min(1),
  country: z.string(),
  healthInsurance: z
    .object({
      provider: z.string(),
      policyNumber: z.string(),
      coverageDetails: z.string().optional(),
      validUntil: z.string(),
    })
    .optional()
    .nullable(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const organizationId = (session.user as { organizationId?: string }).organizationId
    const userId = (session.user as { id?: string }).id
    if (!organizationId || !userId) {
      return NextResponse.json({ error: 'Sesiune invalidă' }, { status: 401 })
    }

    const formData = await request.formData()
    const payloadRaw = formData.get('payload')
    if (typeof payloadRaw !== 'string') {
      return NextResponse.json({ error: 'payload required' }, { status: 400 })
    }

    const payload = JSON.parse(payloadRaw) as {
      flow: 'digital' | 'manual'
      tabletMode?: boolean
      health: HealthFormData
      documentFields: Record<string, string | boolean>
      signatures: Record<string, string | null>
      signedOnPaper: Record<string, boolean>
    }

    const basic = patientSchema.parse(JSON.parse(String(formData.get('basic') || '{}')))

    const medicalSummary = generateMedicalSummary(payload.health)
    const medicalHistory = {
      ...payload.health,
      notes: medicalSummary,
      intake: {
        flow: payload.flow,
        completedAt: new Date().toISOString(),
        documentFields: payload.documentFields,
        signatures: payload.signatures,
        signedOnPaper: payload.signedOnPaper,
        tabletMode: Boolean(payload.tabletMode),
        clerkId: userId,
      },
    }

    const patient = await createPatientRecord({
      organizationId,
      userId,
      data: {
        firstName: basic.firstName,
        lastName: basic.lastName,
        dateOfBirth: basic.dateOfBirth,
        gender: basic.gender,
        email: basic.email || null,
        phone: basic.phone || null,
        address: basic.address,
        cnp: basic.cnp,
        country: basic.country,
        healthInsurance: basic.healthInsurance?.provider && basic.healthInsurance?.policyNumber
          ? {
              provider: basic.healthInsurance.provider,
              policyNumber: basic.healthInsurance.policyNumber,
              coverageDetails: basic.healthInsurance.coverageDetails,
              validUntil: basic.healthInsurance.validUntil,
            }
          : null,
        medicalHistory,
      } as CreatePatientInput,
    })

    const basicRecord = basic as Record<string, unknown>
    const uploadWarnings: string[] = []

    for (const doc of INTAKE_DOCUMENT_LIST) {
      try {
        const signature = payload.signatures[doc.id] ?? null
        const filled = await fillIntakePdf({
          documentId: doc.id,
          basic: basicRecord,
          health: payload.health,
          documentFields: payload.documentFields,
          signatureDataUrl: payload.signedOnPaper[doc.id] ? null : signature,
        })
        if (!filled) continue

        const file = new File([new Uint8Array(filled)], `${doc.id}-intake.pdf`, {
          type: 'application/pdf',
        })
        await uploadPatientFile({
          patientId: patient.id,
          file,
          fileName: `${doc.title}.pdf`,
        })
      } catch (docError) {
        console.error(`Intake PDF upload failed for ${doc.id}:`, docError)
        uploadWarnings.push(doc.id)
      }
    }

    let scanIndex = 0
    while (formData.has(`scan_${scanIndex}`)) {
      try {
        const scan = formData.get(`scan_${scanIndex}`) as File
        if (scan?.size) {
          await uploadPatientFile({
            patientId: patient.id,
            file: scan,
            fileName: scan.name || `intake-scan-${scanIndex + 1}`,
          })
        }
      } catch (scanError) {
        console.error(`Intake scan upload failed for index ${scanIndex}:`, scanError)
        uploadWarnings.push(`scan_${scanIndex}`)
      }
      scanIndex++
    }

    return NextResponse.json(
      { id: patient.id, patient, uploadWarnings: uploadWarnings.length ? uploadWarnings : undefined },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detail = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
      return NextResponse.json(
        { message: detail || 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    console.error('Intake complete error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
