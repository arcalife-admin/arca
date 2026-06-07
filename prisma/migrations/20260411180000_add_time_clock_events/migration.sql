-- CreateEnum
CREATE TYPE "TimeClockEventType" AS ENUM ('CLOCK_IN', 'CLOCK_OUT');

-- CreateTable
CREATE TABLE "TimeClockEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "TimeClockEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'manual',

    CONSTRAINT "TimeClockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeClockEvent_organizationId_occurredAt_idx" ON "TimeClockEvent"("organizationId", "occurredAt");

CREATE INDEX "TimeClockEvent_userId_occurredAt_idx" ON "TimeClockEvent"("userId", "occurredAt");

-- AddForeignKey
ALTER TABLE "TimeClockEvent" ADD CONSTRAINT "TimeClockEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TimeClockEvent" ADD CONSTRAINT "TimeClockEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
