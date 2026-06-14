export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { findPatientInOrganization } from '@/lib/patient-access'
import {
  getSignedPatientMediaUrl,
  uploadPatientMediaBuffer,
  withSignedPatientMediaUrls,
} from '@/lib/cloudinary-patient-media'

function getFileType(filename: string): 'XRAY' | 'DOCUMENT' | 'IMAGE' | 'OTHER' {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) return 'OTHER'

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return 'IMAGE'
  }
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
    return 'DOCUMENT'
  }
  if (['dcm', 'dicom'].includes(ext)) {
    return 'XRAY'
  }
  return 'OTHER'
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const patient = await findPatientInOrganization(params.id, session.user.organizationId)
    if (!patient) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const files = await prisma.file.findMany({
      where: { patientId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(withSignedPatientMediaUrls(files))
  } catch (error) {
    console.error('Error fetching patient files:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const patient = await findPatientInOrganization(params.id, session.user.organizationId)
    if (!patient) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return new NextResponse('No file provided', { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await uploadPatientMediaBuffer(buffer, {
      folder: 'patient-files',
      resource_type: 'auto',
    })

    const savedFile = await prisma.file.create({
      data: {
        name: file.name,
        url: result.public_id,
        type: getFileType(file.name),
        size: file.size,
        patientId: params.id,
      },
    })

    return NextResponse.json({
      ...savedFile,
      url: getSignedPatientMediaUrl(savedFile.url, { fileName: savedFile.name }),
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
