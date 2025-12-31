-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('DENTAL_CHAIR', 'XRAY_MACHINE', 'AUTOCLAVE', 'COMPRESSOR', 'VACUUM_SYSTEM', 'LIGHTING', 'HVAC', 'INSTRUMENTS', 'COMPUTER_EQUIPMENT', 'PHONE_SYSTEM', 'SECURITY_SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "RepairUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('REPORTED', 'ACKNOWLEDGED', 'SCHEDULED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'TESTED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IssueCategory" AS ENUM ('MECHANICAL', 'ELECTRICAL', 'SOFTWARE', 'MAINTENANCE', 'CALIBRATION', 'CLEANING', 'INSTALLATION', 'UPGRADE', 'EMERGENCY', 'OTHER');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "category" "EquipmentCategory" NOT NULL,
    "locationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactPerson" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "specialties" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationContact" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "contactPersonId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" "RepairUrgency" NOT NULL DEFAULT 'NORMAL',
    "equipmentId" TEXT,
    "locationId" TEXT NOT NULL,
    "issueCategory" "IssueCategory" NOT NULL,
    "symptoms" TEXT[],
    "requestedById" TEXT NOT NULL,
    "status" "RepairStatus" NOT NULL DEFAULT 'REPORTED',
    "contactPersonId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "estimatedDuration" INTEGER,
    "arrivedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "workPerformed" TEXT,
    "partsUsed" TEXT,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "warrantyUntil" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Location_organizationId_idx" ON "Location"("organizationId");

-- CreateIndex
CREATE INDEX "Equipment_organizationId_idx" ON "Equipment"("organizationId");

-- CreateIndex
CREATE INDEX "Equipment_locationId_idx" ON "Equipment"("locationId");

-- CreateIndex
CREATE INDEX "Equipment_category_idx" ON "Equipment"("category");

-- CreateIndex
CREATE INDEX "ContactPerson_organizationId_idx" ON "ContactPerson"("organizationId");

-- CreateIndex
CREATE INDEX "ContactPerson_isActive_idx" ON "ContactPerson"("isActive");

-- CreateIndex
CREATE INDEX "LocationContact_locationId_idx" ON "LocationContact"("locationId");

-- CreateIndex
CREATE INDEX "LocationContact_contactPersonId_idx" ON "LocationContact"("contactPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "LocationContact_locationId_contactPersonId_key" ON "LocationContact"("locationId", "contactPersonId");

-- CreateIndex
CREATE INDEX "RepairRequest_organizationId_idx" ON "RepairRequest"("organizationId");

-- CreateIndex
CREATE INDEX "RepairRequest_locationId_idx" ON "RepairRequest"("locationId");

-- CreateIndex
CREATE INDEX "RepairRequest_equipmentId_idx" ON "RepairRequest"("equipmentId");

-- CreateIndex
CREATE INDEX "RepairRequest_contactPersonId_idx" ON "RepairRequest"("contactPersonId");

-- CreateIndex
CREATE INDEX "RepairRequest_status_idx" ON "RepairRequest"("status");

-- CreateIndex
CREATE INDEX "RepairRequest_urgency_idx" ON "RepairRequest"("urgency");

-- CreateIndex
CREATE INDEX "RepairRequest_scheduledDate_idx" ON "RepairRequest"("scheduledDate");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactPerson" ADD CONSTRAINT "ContactPerson_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationContact" ADD CONSTRAINT "LocationContact_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationContact" ADD CONSTRAINT "LocationContact_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "ContactPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "ContactPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
