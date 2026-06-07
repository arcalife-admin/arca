import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma';
import { z } from 'zod'
import { authOptions } from '@/lib/auth-config'

const patientSchema = z.object({
  firstName: z.string().min(1, 'Prenumele este obligatoriu'),
  lastName: z.string().min(1, 'Numele este obligatoriu'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  email: z.string().email('Adresă de e-mail invalidă').optional(),
  phone: z.string().optional(),
  address: z.object({
    display_name: z.string().min(1, 'Adresa este obligatorie'),
    lat: z.string(),
    lon: z.string(),
  }),
  cnp: z.string().min(1, 'CNP is required'),
  country: z.string().default('Netherlands'),
  healthInsurance: z.object({
    provider: z.string().min(1, 'Provider is required'),
    policyNumber: z.string().min(1, 'Policy number is required'),
    coverageDetails: z.string().optional(),
    validUntil: z.string().min(1, 'Valid until date is required'),
  }).optional(),
})

const patientUpdateSchema = z.object({
  firstName: z.string().min(1, 'Prenumele este obligatoriu'),
  lastName: z.string().min(1, 'Numele este obligatoriu'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  email: z.string().email('Adresă de e-mail invalidă').or(z.literal('')).optional(),
  phone: z.string().or(z.literal('')).optional(),
  address: z.object({
    display_name: z.string().min(1, 'Adresa este obligatorie'),
    lat: z.string(),
    lon: z.string(),
  }).optional(),
  cnp: z.string().min(1, 'CNP is required'),
  country: z.string().default('Netherlands'),
  allowEarlySpotContact: z.boolean().optional(),
  isLongTermCareAct: z.boolean().optional(),
  statusPraesens: z.any().optional(),
  surgicalHistory: z.any().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // First try to find the patient without organization ID to debug
    const patientWithoutOrg = await prisma.patient.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!patientWithoutOrg) {
      return new NextResponse('Patient not found', { status: 404 })
    }

    // Now try to find with organization ID
    const patient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        organizationId: (session.user as any).organizationId,
      },
      include: {
        asaHistory: {
          orderBy: { date: 'desc' }
        },
      }
    })

    if (!patient) {
      return new NextResponse('Patient not found in your organization', { status: 404 })
    }

    // Transform the patient object
    const transformedPatient = {
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
      surgicalHistory: typeof patient.surgicalHistory === 'string' ?
        (() => {
          try {
            return JSON.parse(patient.surgicalHistory)
          } catch {
            return {}
          }
        })() : patient.surgicalHistory ?? {},
      // Include the history records
      asaHistory: patient.asaHistory?.map(record => ({
        ...record,
        date: record.date.toISOString()
      })) || [],
    }

    return NextResponse.json(transformedPatient)
  } catch (error) {
    console.error('Error fetching patient:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    console.log('Raw request body received:', body)

    const validatedData = patientUpdateSchema.parse(body)
    console.log('Validated data:', validatedData)

    const patient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        organizationId: (session.user as any).organizationId,
      },
    })

    if (!patient) {
      return new NextResponse('Patient not found', { status: 404 })
    }

    const updateData: any = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      dateOfBirth: new Date(validatedData.dateOfBirth),
      gender: validatedData.gender,
      email: !validatedData.email ? null : validatedData.email,
      phone: !validatedData.phone ? null : validatedData.phone,
      cnp: validatedData.cnp,
      country: validatedData.country,
    }

    // Only update address if it was provided (meaning it was actually changed)
    if (validatedData.address) {
      updateData.address = JSON.stringify(validatedData.address)
      console.log('Address being updated to:', updateData.address)
    } else {
      console.log('Address NOT being updated - not provided in request')
    }

    if (validatedData.allowEarlySpotContact !== undefined) {
      updateData.allowEarlySpotContact = validatedData.allowEarlySpotContact
    }

    if (validatedData.isLongTermCareAct !== undefined) {
      updateData.isLongTermCareAct = validatedData.isLongTermCareAct
    }


    if (body.statusPraesens !== undefined) {
      updateData.statusPraesens = body.statusPraesens
    }

    if (body.surgicalHistory !== undefined) {
      updateData.surgicalHistory = body.surgicalHistory
    }

    console.log('Final updateData for database:', updateData)

    const updatedPatient = await prisma.patient.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        asaHistory: {
          orderBy: { date: 'desc' }
        }
      }
    })

    // Transform the response to match the frontend interface
    const transformedPatient = {
      ...updatedPatient,
      dateOfBirth: updatedPatient.dateOfBirth.toISOString(),
      address: typeof updatedPatient.address === 'string' ?
        (() => {
          try {
            return JSON.parse(updatedPatient.address)
          } catch {
            return {
              display_name: updatedPatient.address || '',
              lat: '',
              lon: ''
            }
          }
        })() : updatedPatient.address,
      healthInsurance: typeof updatedPatient.healthInsurance === 'string' ?
        (() => {
          try {
            return JSON.parse(updatedPatient.healthInsurance as string)
          } catch {
            return undefined
          }
        })() : updatedPatient.healthInsurance,
      medicalHistory: typeof updatedPatient.medicalHistory === 'string' ?
        (() => {
          try {
            return JSON.parse(updatedPatient.medicalHistory as string)
          } catch {
            return undefined
          }
        })() : updatedPatient.medicalHistory,
      surgicalHistory: typeof updatedPatient.surgicalHistory === 'string' ?
        (() => {
          try {
            return JSON.parse(updatedPatient.surgicalHistory as string)
          } catch {
            return {}
          }
        })() : updatedPatient.surgicalHistory ?? {},
      // Include the history records
      asaHistory: updatedPatient.asaHistory?.map(record => ({
        ...record,
        date: record.date.toISOString()
      })) || [],
    }

    return NextResponse.json(transformedPatient)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }

    console.error('Error updating patient:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { message: 'Neautorizat' },
        { status: 401 }
      )
    }

    // Check if patient exists and belongs to the user's organization
    const patient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        organizationId: (session.user as unknown as { organizationId: string }).organizationId,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { message: 'Pacientul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Delete the patient (this will cascade to related records)
    await prisma.patient.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { message: 'Eroare internă de server' },
      { status: 500 }
    )
  }
} 