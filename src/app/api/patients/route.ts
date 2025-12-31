import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import crypto from 'crypto'

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: z.object({
    display_name: z.string().min(1, 'Address is required'),
    lat: z.string(),
    lon: z.string(),
  }),
  bsn: z.string().min(1, 'BSN is required'),
  country: z.string().default('Netherlands'),
  healthInsurance: z.object({
    provider: z.string().min(1, 'Provider is required'),
    policyNumber: z.string().min(1, 'Policy number is required'),
    coverageDetails: z.string().optional(),
    validUntil: z.string().min(1, 'Valid until date is required'),
  }).optional(),
  medicalHistory: z.any().optional(),
  dentalHistory: z.any().optional(),
})

// Function to calculate ASA score based on medical history
function calculateAsaScore(medicalHistory: any): number {
  if (!medicalHistory) return 1

  // Check for severe conditions that indicate ASA 4-5
  if (medicalHistory.heartFailure ||
    medicalHistory.cancerLeukemia ||
    medicalHistory.hivAids ||
    medicalHistory.kidneyDisease ||
    medicalHistory.liverDisease) {
    return 4
  }

  // Check for moderate conditions that indicate ASA 3
  if (medicalHistory.heartAttack ||
    medicalHistory.diabetes ||
    medicalHistory.asthma ||
    medicalHistory.thyroidProblems ||
    medicalHistory.bloodPressure ||
    medicalHistory.bleedingTendency ||
    medicalHistory.lungProblems ||
    medicalHistory.epilepsy) {
    return 3
  }

  // Check for mild conditions that indicate ASA 2
  if (medicalHistory.chestPain ||
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
    medicalHistory.pregnancy) {
    return 2
  }

  // Default to ASA 1 for healthy patients
  return 1
}

// Function to generate ASA notes based on medical history
function generateAsaNotes(medicalHistory: any): string {
  if (!medicalHistory) return 'Initial assessment - healthy patient'

  const conditions = []

  // Cardiovascular
  if (medicalHistory.chestPain) conditions.push('Chest pain')
  if (medicalHistory.heartAttack) conditions.push('Previous heart attack')
  if (medicalHistory.heartMurmur) conditions.push('Heart murmur')
  if (medicalHistory.heartFailure) conditions.push('Heart failure')
  if (medicalHistory.bloodPressure) conditions.push('Hypertension')

  // Respiratory
  if (medicalHistory.lungProblems) conditions.push('Lung problems')
  if (medicalHistory.asthma) conditions.push('Asthma')

  // Other conditions
  if (medicalHistory.diabetes) conditions.push('Diabetes')
  if (medicalHistory.cancerLeukemia) conditions.push('Cancer/Leukemia')
  if (medicalHistory.epilepsy) conditions.push('Epilepsy')
  if (medicalHistory.bleedingTendency) conditions.push('Bleeding tendency')
  if (medicalHistory.smoking) conditions.push('Smoker')
  if (medicalHistory.drinking) conditions.push('Alcohol use')
  if (medicalHistory.pregnancy) conditions.push('Pregnant')

  if (conditions.length === 0) {
    return 'Initial assessment - healthy patient'
  }

  return `Initial assessment - ${conditions.join(', ')}`
}

// Helper function to validate session and get user data
async function validateSession() {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error('Unauthorized - No valid session')
  }

  const organizationId = (session.user as unknown as { organizationId: string }).organizationId

  if (!organizationId) {
    throw new Error('Unauthorized - Missing organization ID')
  }

  return { session, organizationId }
}



export async function GET() {
  try {
    const { organizationId } = await validateSession()

    const patientsRaw = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.patient.findMany({
        where: {
          organizationId: organizationId,
        } as any,
        orderBy: {
          createdAt: 'desc',
        },
      })
    })

    // Transform patients to parse JSON fields (especially healthInsurance)
    const patients = patientsRaw.map(patient => ({
      ...patient,
      dateOfBirth: patient.dateOfBirth.toISOString(),
      address: typeof patient.address === 'string' ?
        (() => {
          try {
            return JSON.parse(patient.address)
          } catch {
            return {
              display_name: patient.address || ''
            }
          }
        })() : patient.address,
      healthInsurance: typeof patient.healthInsurance === 'string' ?
        (() => {
          try {
            return JSON.parse(patient.healthInsurance)
          } catch {
            return null
          }
        })() : patient.healthInsurance,
      medicalHistory: typeof patient.medicalHistory === 'string' ?
        (() => {
          try {
            return JSON.parse(patient.medicalHistory)
          } catch {
            return {}
          }
        })() : patient.medicalHistory,
      dentalHistory: typeof patient.dentalHistory === 'string' ?
        (() => {
          try {
            return JSON.parse(patient.dentalHistory)
          } catch {
            return {}
          }
        })() : patient.dentalHistory,
    }))

    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching patients:', error)

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
    }

    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { session, organizationId } = await validateSession()

    const body = await req.json()

    const validatedData = patientSchema.parse(body)

    // Generate the next patient code
    // Get all patients for this organization and count them
    const patientCount = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.patient.count({
        where: {
          organizationId: organizationId,
        }
      })
    })

    // The next patient code is simply the count + 1
    const nextPatientCode = (patientCount + 1).toString()

    // Create patient using raw SQL to bypass Prisma client issues
    const patientId = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.$queryRaw`
        INSERT INTO "Patient" (
          id, "patientCode", "firstName", "lastName", "dateOfBirth", gender, email, phone, 
          address, bsn, country, "healthInsurance", "medicalHistory", "dentalHistory", 
          "organizationId", "createdAt", "updatedAt"
        ) VALUES (
          ${crypto.randomUUID()}, ${nextPatientCode}, ${validatedData.firstName}, ${validatedData.lastName}, 
          ${new Date(validatedData.dateOfBirth)}, ${validatedData.gender}, ${validatedData.email || null}, 
          ${validatedData.phone || null}, ${JSON.stringify(validatedData.address)}::jsonb, ${validatedData.bsn}, 
          ${validatedData.country}, ${validatedData.healthInsurance ? JSON.stringify(validatedData.healthInsurance) : null}::jsonb, 
          ${validatedData.medicalHistory ? JSON.stringify(validatedData.medicalHistory) : null}::jsonb, 
          ${validatedData.dentalHistory ? JSON.stringify(validatedData.dentalHistory) : null}::jsonb, 
          ${organizationId}, ${new Date()}, ${new Date()}
        ) RETURNING id
      ` as { id: string }[]
    })

    // Get the created patient data for the response
    const patient = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.patient.findUnique({
        where: { id: patientId[0].id }
      })
    })

    if (!patient) {
      throw new Error('Failed to create patient')
    }

    // Create initial ASA assessment
    const asaScore = calculateAsaScore(validatedData.medicalHistory)
    const asaNotes = generateAsaNotes(validatedData.medicalHistory)
    const userId = (session.user as unknown as { id: string }).id

    await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.asaRecord.create({
        data: {
          patientId: patient.id,
          score: asaScore,
          notes: asaNotes,
          date: new Date(),
          createdBy: userId,
        },
      })
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating patient:', error)

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 