-- CreateTable
CREATE TABLE "ClinicMedication" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiresFridge" BOOLEAN NOT NULL DEFAULT false,
    "form" TEXT,
    "stockFarmacia" INTEGER NOT NULL DEFAULT 0,
    "stockEtaj1" INTEGER NOT NULL DEFAULT 0,
    "stockEtaj2" INTEGER NOT NULL DEFAULT 0,
    "stockEtaj3" INTEGER NOT NULL DEFAULT 0,
    "usageInstructions" TEXT,
    "prescriptionTemplate" TEXT,
    "documentationUrl" TEXT,
    "activeIngredient" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicMedication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicMedication_organizationId_idx" ON "ClinicMedication"("organizationId");

-- CreateIndex
CREATE INDEX "ClinicMedication_name_idx" ON "ClinicMedication"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicMedication_organizationId_name_key" ON "ClinicMedication"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "ClinicMedication" ADD CONSTRAINT "ClinicMedication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
