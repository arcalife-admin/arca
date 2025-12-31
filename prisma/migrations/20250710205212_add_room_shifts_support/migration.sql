-- CreateTable
CREATE TABLE "RoomShift" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "roomNumber" INTEGER NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "sidePractitionerId" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "dayOfWeek" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomShift_scheduleId_idx" ON "RoomShift"("scheduleId");

-- CreateIndex
CREATE INDEX "RoomShift_roomNumber_idx" ON "RoomShift"("roomNumber");

-- CreateIndex
CREATE INDEX "RoomShift_practitionerId_idx" ON "RoomShift"("practitionerId");

-- CreateIndex
CREATE INDEX "RoomShift_sidePractitionerId_idx" ON "RoomShift"("sidePractitionerId");

-- CreateIndex
CREATE INDEX "RoomShift_date_idx" ON "RoomShift"("date");

-- CreateIndex
CREATE INDEX "RoomShift_dayOfWeek_idx" ON "RoomShift"("dayOfWeek");

-- CreateIndex
CREATE INDEX "RoomShift_scheduleId_roomNumber_date_idx" ON "RoomShift"("scheduleId", "roomNumber", "date");

-- CreateIndex
CREATE INDEX "RoomShift_scheduleId_roomNumber_dayOfWeek_idx" ON "RoomShift"("scheduleId", "roomNumber", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "RoomShift" ADD CONSTRAINT "RoomShift_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClinicSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomShift" ADD CONSTRAINT "RoomShift_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomShift" ADD CONSTRAINT "RoomShift_sidePractitionerId_fkey" FOREIGN KEY ("sidePractitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
