import crypto from 'crypto'
import { db } from '@/lib/db'

export function calculateAsaScore(medicalHistory: Record<string, unknown> | null | undefined): number {
  if (!medicalHistory) return 1

  if (
    medicalHistory.heartFailure ||
    medicalHistory.cancerLeukemia ||
    medicalHistory.hivAids ||
    medicalHistory.kidneyDisease ||
    medicalHistory.liverDisease
  ) {
    return 4
  }

  if (
    medicalHistory.heartAttack ||
    medicalHistory.diabetes ||
    medicalHistory.asthma ||
    medicalHistory.thyroidProblems ||
    medicalHistory.bloodPressure ||
    medicalHistory.bleedingTendency ||
    medicalHistory.lungProblems ||
    medicalHistory.epilepsy
  ) {
    return 3
  }

  if (
    medicalHistory.chestPain ||
    medicalHistory.heartMurmur ||
    medicalHistory.vascularSurgery6Months ||
    medicalHistory.pacemakerICD ||
    medicalHistory.heartPalpitations ||
    medicalHistory.acuteRheumatism ||
    medicalHistory.hepatitisA ||
    medicalHistory.hepatitisB ||
    medicalHistory.hepatitisC ||
    medicalHistory.hepatitisD ||
    medicalHistory.smoking ||
    medicalHistory.drinking ||
    medicalHistory.pregnancy
  ) {
    return 2
  }

  return 1
}

export function generateAsaNotes(medicalHistory: Record<string, unknown> | null | undefined): string {
  if (!medicalHistory) return 'Initial assessment - healthy patient'

  const conditions: string[] = []
  if (medicalHistory.chestPain) conditions.push('Chest pain')
  if (medicalHistory.heartAttack) conditions.push('Previous heart attack')
  if (medicalHistory.heartMurmur) conditions.push('Heart murmur')
  if (medicalHistory.heartFailure) conditions.push('Heart failure')
  if (medicalHistory.bloodPressure) conditions.push('Hypertension')
  if (medicalHistory.lungProblems) conditions.push('Lung problems')
  if (medicalHistory.asthma) conditions.push('Asthma')
  if (medicalHistory.diabetes) conditions.push('Diabetes')
  if (medicalHistory.cancerLeukemia) conditions.push('Cancer/Leukemia')
  if (medicalHistory.epilepsy) conditions.push('Epilepsy')
  if (medicalHistory.bleedingTendency) conditions.push('Bleeding tendency')
  if (medicalHistory.smoking) conditions.push('Smoker')
  if (medicalHistory.drinking) conditions.push('Alcohol use')
  if (medicalHistory.pregnancy) conditions.push('Pregnant')

  if (conditions.length === 0) return 'Initial assessment - healthy patient'
  return `Initial assessment - ${conditions.join(', ')}`
}

export type CreatePatientInput = {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE'
  email?: string | null
  phone?: string | null
  address: {
    display_name: string
    lat: string
    lon: string
    altitude?: number
  }
  cnp: string
  country: string
  healthInsurance?: {
    provider: string
    policyNumber: string
    coverageDetails?: string
    validUntil: string
  } | null
  medicalHistory?: Record<string, unknown>
}

export async function createPatientRecord(params: {
  organizationId: string
  userId: string
  data: CreatePatientInput
}) {
  const { organizationId, userId, data } = params

  const patientCount = await db.executeWithRetry(async () => {
    const prisma = db.getPrismaClient()
    return prisma.patient.count({ where: { organizationId } })
  })

  const nextPatientCode = String(patientCount + 1)

  const patientId = await db.executeWithRetry(async () => {
    const prisma = db.getPrismaClient()
    const result = await prisma.$queryRaw`
      INSERT INTO "Patient" (
        id, "patientCode", "firstName", "lastName", "dateOfBirth", gender, email, phone,
        address, cnp, country, "healthInsurance", "medicalHistory",
        "organizationId", "createdAt", "updatedAt"
      ) VALUES (
        ${crypto.randomUUID()}, ${nextPatientCode}, ${data.firstName}, ${data.lastName},
        ${new Date(data.dateOfBirth)}, ${data.gender}, ${data.email || null},
        ${data.phone || null}, ${JSON.stringify(data.address)}::jsonb, ${data.cnp},
        ${data.country}, ${data.healthInsurance ? JSON.stringify(data.healthInsurance) : null}::jsonb,
        ${data.medicalHistory ? JSON.stringify(data.medicalHistory) : null}::jsonb,
        ${organizationId}, ${new Date()}, ${new Date()}
      ) RETURNING id
    ` as { id: string }[]
    return result[0].id
  })

  const patient = await db.executeWithRetry(async () => {
    const prisma = db.getPrismaClient()
    return prisma.patient.findUnique({ where: { id: patientId } })
  })

  if (!patient) throw new Error('Failed to create patient')

  const asaScore = calculateAsaScore(data.medicalHistory)
  const asaNotes = generateAsaNotes(data.medicalHistory)

  await db.executeWithRetry(async () => {
    const prisma = db.getPrismaClient()
    return prisma.asaRecord.create({
      data: {
        patientId: patient.id,
        score: asaScore,
        notes: asaNotes,
        date: new Date(),
        createdBy: userId,
      },
    })
  })

  return patient
}
