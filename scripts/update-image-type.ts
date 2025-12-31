import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add new enum values
  await prisma.$executeRaw`ALTER TYPE "ImageType" ADD VALUE IF NOT EXISTS 'BITEWING'`
  await prisma.$executeRaw`ALTER TYPE "ImageType" ADD VALUE IF NOT EXISTS 'OPG'`
  await prisma.$executeRaw`ALTER TYPE "ImageType" ADD VALUE IF NOT EXISTS 'SOLO'`

  // Add side column
  await prisma.$executeRaw`ALTER TABLE "Image" ADD COLUMN IF NOT EXISTS "side" TEXT`

  console.log('Successfully updated ImageType enum and added side column')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 