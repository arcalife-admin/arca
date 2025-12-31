-- Add clinic scheduling system tables

-- Main clinic schedule table
CREATE TABLE "ClinicSchedule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "roomCount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicSchedule_pkey" PRIMARY KEY ("id")
);

-- Room assignments table
CREATE TABLE "RoomAssignment" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "roomNumber" INTEGER NOT NULL,
    "mainPractitionerId" TEXT,
    "sidePractitionerId" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "workingDays" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomAssignment_pkey" PRIMARY KEY ("id")
);

-- Schedule overrides for specific days
CREATE TABLE "ScheduleOverride" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "roomNumber" INTEGER,
    "practitionerId" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "isUnavailable" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- Other workers not assigned to specific rooms
CREATE TABLE "OtherWorkerSchedule" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "workingDays" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherWorkerSchedule_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "ClinicSchedule" ADD CONSTRAINT "ClinicSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoomAssignment" ADD CONSTRAINT "RoomAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClinicSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomAssignment" ADD CONSTRAINT "RoomAssignment_mainPractitionerId_fkey" FOREIGN KEY ("mainPractitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoomAssignment" ADD CONSTRAINT "RoomAssignment_sidePractitionerId_fkey" FOREIGN KEY ("sidePractitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClinicSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OtherWorkerSchedule" ADD CONSTRAINT "OtherWorkerSchedule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClinicSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OtherWorkerSchedule" ADD CONSTRAINT "OtherWorkerSchedule_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "ClinicSchedule_organizationId_idx" ON "ClinicSchedule"("organizationId");
CREATE INDEX "ClinicSchedule_isActive_idx" ON "ClinicSchedule"("isActive");
CREATE INDEX "ClinicSchedule_startDate_endDate_idx" ON "ClinicSchedule"("startDate", "endDate");

CREATE INDEX "RoomAssignment_scheduleId_idx" ON "RoomAssignment"("scheduleId");
CREATE INDEX "RoomAssignment_roomNumber_idx" ON "RoomAssignment"("roomNumber");
CREATE INDEX "RoomAssignment_mainPractitionerId_idx" ON "RoomAssignment"("mainPractitionerId");
CREATE INDEX "RoomAssignment_sidePractitionerId_idx" ON "RoomAssignment"("sidePractitionerId");

CREATE INDEX "ScheduleOverride_scheduleId_idx" ON "ScheduleOverride"("scheduleId");
CREATE INDEX "ScheduleOverride_date_idx" ON "ScheduleOverride"("date");
CREATE INDEX "ScheduleOverride_practitionerId_idx" ON "ScheduleOverride"("practitionerId");

CREATE INDEX "OtherWorkerSchedule_scheduleId_idx" ON "OtherWorkerSchedule"("scheduleId");
CREATE INDEX "OtherWorkerSchedule_practitionerId_idx" ON "OtherWorkerSchedule"("practitionerId");

-- Unique constraints
CREATE UNIQUE INDEX "RoomAssignment_scheduleId_roomNumber_key" ON "RoomAssignment"("scheduleId", "roomNumber");
CREATE UNIQUE INDEX "OtherWorkerSchedule_scheduleId_practitionerId_key" ON "OtherWorkerSchedule"("scheduleId", "practitionerId");
CREATE UNIQUE INDEX "ScheduleOverride_scheduleId_date_roomNumber_practitionerId_key" ON "ScheduleOverride"("scheduleId", "date", "roomNumber", "practitionerId");

-- Note: Only one active schedule per organization should be enforced at application level 