import { prisma } from '@/lib/prisma'

export async function findPatientInOrganization(
  patientId: string,
  organizationId: string
) {
  return prisma.patient.findFirst({
    where: {
      id: patientId,
      organizationId,
    },
    select: { id: true },
  })
}

export async function assertPatientInOrganization(
  patientId: string,
  organizationId: string
): Promise<boolean> {
  const patient = await findPatientInOrganization(patientId, organizationId)
  return patient !== null
}
