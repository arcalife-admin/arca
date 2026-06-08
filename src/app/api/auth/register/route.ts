export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { uploadImage } from '@/lib/cloudinary'

const addressSchema = z.object({
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
  address: z.object({
    house_number: z.string().optional(),
    road: z.string().optional(),
    suburb: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional(),
  }),
})

const registerSchema = z.object({
  firstName: z.string().min(2, 'Prenumele trebuie să aibă cel puțin 2 caractere'),
  lastName: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
  email: z.string().email('Adresă de e-mail invalidă'),
  password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere'),
  phone: z.string().min(1, 'Numărul de telefon este obligatoriu'),
  address: z.string().min(1, 'Adresa este obligatorie'),
  role: z.enum([
    'ORGANIZATION_OWNER',
    'MANAGER',
    'PLASTIC_SURGEON',
    'SURGEON',
    'NURSE',
    'RECEPTIONIST',
    'ASSISTANT',
    'ANESTHESIOLOGIST',
    'AESTHETIC_NURSE',
    'MEDICAL_ASSISTANT',
    'COUNSELOR',
    'PHOTOGRAPHER',
  ]),
  organization: z
    .object({
      name: z.string().min(2, 'Organization name must be at least 2 characters'),
      email: z.string().email('Invalid organization email address'),
      phone: z.string().min(1, 'Organization phone number is required'),
      address: z.string().min(1, 'Organization address is required'),
      logoUrl: z.string().url().optional(),
    })
    .optional(),
  organizationId: z.string().optional(),
}).refine((data) => {
  // If role is ORGANIZATION_OWNER, organization is required
  if (data.role === 'ORGANIZATION_OWNER') {
    return !!data.organization
  }
  // If role is not ORGANIZATION_OWNER, organizationId is required
  return !!data.organizationId
}, {
  message: 'Detaliile organizației sunt obligatorii în funcție de rolul dvs.',
  path: ["organization", "organizationId"]
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const body = Object.fromEntries(formData.entries())

    // Handle file upload if present
    let logoUrl: string | undefined
    const logoFile = formData.get('organization.logo') as File | null
    if (logoFile) {
      logoUrl = await uploadImage(logoFile)
    }

    const validatedData = registerSchema.parse({
      ...body,
      organization: body.organization ? {
        ...JSON.parse(body.organization as string),
        logoUrl,
      } : undefined,
    })

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Utilizatorul există deja' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    let user, organization

    if (validatedData.role === 'ORGANIZATION_OWNER') {
      // Require organization info
      if (!validatedData.organization) {
        return NextResponse.json(
          { message: 'Informațiile organizației sunt obligatorii pentru proprietar' },
          { status: 400 }
        )
      }
      // Create organization and user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: validatedData.organization!.name,
            address: validatedData.organization!.address,
            phone: validatedData.organization!.phone,
            email: validatedData.organization!.email,
            latitude: 0,
            longitude: 0,
            logoUrl: validatedData.organization!.logoUrl || null,
          } as any, // Prisma.OrganizationUncheckedCreateInput is not defined, using 'any' for now
        })
        const user = await tx.user.create({
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            password: hashedPassword,
            phone: validatedData.phone,
            address: validatedData.address,
            role: validatedData.role,
            organizationId: organization.id,
          } as any, // Prisma.UserUncheckedCreateInput is not defined, using 'any' for now
        })
        return { user, organization }
      })
      user = result.user
      organization = result.organization
    } else {
      // Require organizationId for non-organization owners
      if (!validatedData.organizationId) {
        return NextResponse.json(
          { message: 'Selectarea organizației este obligatorie' },
          { status: 400 }
        )
      }

      // Verify organization exists
      const existingOrg = await prisma.organization.findUnique({
        where: { id: validatedData.organizationId },
      })

      if (!existingOrg) {
        return NextResponse.json(
          { message: 'Organizația selectată nu există' },
          { status: 400 }
        )
      }

      user = await prisma.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          password: hashedPassword,
          phone: validatedData.phone,
          address: validatedData.address,
          role: validatedData.role,
          organizationId: validatedData.organizationId,
        } as any, // Prisma.UserUncheckedCreateInput is not defined, using 'any' for now
      })
      organization = existingOrg
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    // Ensure global chat exists for the organization and user is a participant
    let globalChat = await prisma.chatRoom.findFirst({
      where: { organizationId: organization.id, isGlobal: true },
    });
    if (!globalChat) {
      globalChat = await prisma.chatRoom.create({
        data: {
          name: organization.name,
          type: 'GROUP',
          isGlobal: true,
          organizationId: organization.id,
        },
      });
    }
    // Add user as participant if not already
    const isParticipant = await prisma.chatParticipant.findFirst({
      where: { chatRoomId: globalChat.id, userId: user.id },
    });
    if (!isParticipant) {
      await prisma.chatParticipant.create({
        data: {
          chatRoomId: globalChat.id,
          userId: user.id,
        },
      });
    }

    return NextResponse.json(
      {
        message: 'Utilizator înregistrat cu succes',
        user: userWithoutPassword,
        organization,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      // Format validation errors for better user feedback
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return NextResponse.json(
        { 
          message: 'Eroare de validare', 
          errors: errorMessages,
          details: error.errors 
        },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Eroare internă de server', error: error instanceof Error ? error.message : 'Eroare necunoscută' },
      { status: 500 }
    )
  }
} 