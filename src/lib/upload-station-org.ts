import { prisma } from '@/lib/prisma'

let cachedOrganizationId: string | null | undefined

export async function resolveUploadStationOrganizationId(): Promise<string | null> {
  if (process.env.UPLOAD_STATION_ORGANIZATION_ID) {
    return process.env.UPLOAD_STATION_ORGANIZATION_ID
  }

  if (cachedOrganizationId !== undefined) {
    return cachedOrganizationId
  }

  const organizations = await prisma.organization.findMany({
    select: { id: true },
    take: 2,
  })

  if (organizations.length === 1) {
    cachedOrganizationId = organizations[0].id
    return cachedOrganizationId
  }

  cachedOrganizationId = null
  return null
}
