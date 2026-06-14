import { prisma } from '@/lib/prisma'
import {
  deletePatientMedia,
  getSignedPatientMediaUrl,
} from '@/lib/cloudinary-patient-media'

export async function exportPatientData(patientId: string, organizationId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, organizationId },
    include: {
      appointments: true,
      surgicalProcedures: { include: { code: true } },
      asaHistory: true,
      images: true,
      files: true,
      notes: true,
      noteFolders: true,
      treatments: true,
      statusHistory: true,
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 500,
      },
    },
  })

  if (!patient) return null

  return {
    exportedAt: new Date().toISOString(),
    format: 'ArcaLife GDPR export v1',
    patient: {
      ...patient,
      images: patient.images.map((img) => ({
        ...img,
        signedUrl: getSignedPatientMediaUrl(img.url),
      })),
      files: patient.files.map((file) => ({
        ...file,
        signedUrl: getSignedPatientMediaUrl(file.url, { fileName: file.name }),
      })),
    },
  }
}

export async function erasePatientData(
  patientId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, organizationId },
    include: {
      images: true,
      files: true,
    },
  })

  if (!patient) {
    return { success: false, error: 'Pacientul nu a fost găsit' }
  }

  for (const image of patient.images) {
    try {
      await deletePatientMedia(image.url)
    } catch (error) {
      console.error(`Failed to delete image ${image.id} from Cloudinary:`, error)
    }
  }

  for (const file of patient.files) {
    try {
      await deletePatientMedia(file.url, { fileName: file.name })
    } catch (error) {
      console.error(`Failed to delete file ${file.id} from Cloudinary:`, error)
    }
  }

  await prisma.patient.delete({
    where: { id: patientId },
  })

  return { success: true }
}
