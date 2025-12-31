-- CreateTable
CREATE TABLE "ManagerPersonalNotes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerPersonalNotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerPersonalLink" (
    "id" TEXT NOT NULL,
    "personalNotesId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerPersonalLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManagerPersonalNotes_userId_idx" ON "ManagerPersonalNotes"("userId");

-- CreateIndex
CREATE INDEX "ManagerPersonalNotes_organizationId_idx" ON "ManagerPersonalNotes"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagerPersonalNotes_userId_organizationId_key" ON "ManagerPersonalNotes"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "ManagerPersonalLink_personalNotesId_idx" ON "ManagerPersonalLink"("personalNotesId");

-- AddForeignKey
ALTER TABLE "ManagerPersonalNotes" ADD CONSTRAINT "ManagerPersonalNotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerPersonalNotes" ADD CONSTRAINT "ManagerPersonalNotes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerPersonalLink" ADD CONSTRAINT "ManagerPersonalLink_personalNotesId_fkey" FOREIGN KEY ("personalNotesId") REFERENCES "ManagerPersonalNotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "DentalProcedure" ADD COLUMN "subSurfaces" TEXT[];
ALTER TABLE "DentalProcedure" ADD COLUMN "fillingMaterial" TEXT;
