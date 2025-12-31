-- CreateEnum
CREATE TYPE "WaitingListStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "WaitingListEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "waitingAppointmentId" TEXT,
    "status" "WaitingListStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "WaitingListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitingAppointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "WaitingAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitingListEntry_waitingAppointmentId_key" ON "WaitingListEntry"("waitingAppointmentId");

-- CreateIndex
CREATE INDEX "WaitingListEntry_patientId_idx" ON "WaitingListEntry"("patientId");

-- CreateIndex
CREATE INDEX "WaitingListEntry_practitionerId_idx" ON "WaitingListEntry"("practitionerId");

-- CreateIndex
CREATE INDEX "WaitingListEntry_createdBy_idx" ON "WaitingListEntry"("createdBy");

-- CreateIndex
CREATE INDEX "WaitingListEntry_status_idx" ON "WaitingListEntry"("status");

-- CreateIndex
CREATE INDEX "WaitingAppointment_patientId_idx" ON "WaitingAppointment"("patientId");

-- CreateIndex
CREATE INDEX "WaitingAppointment_createdBy_idx" ON "WaitingAppointment"("createdBy");

-- AddForeignKey
ALTER TABLE "WaitingListEntry" ADD CONSTRAINT "WaitingListEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingListEntry" ADD CONSTRAINT "WaitingListEntry_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingListEntry" ADD CONSTRAINT "WaitingListEntry_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingListEntry" ADD CONSTRAINT "WaitingListEntry_waitingAppointmentId_fkey" FOREIGN KEY ("waitingAppointmentId") REFERENCES "WaitingAppointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingAppointment" ADD CONSTRAINT "WaitingAppointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingAppointment" ADD CONSTRAINT "WaitingAppointment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
