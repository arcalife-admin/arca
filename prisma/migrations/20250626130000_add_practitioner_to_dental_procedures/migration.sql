-- Migration: Add practitionerId to DentalProcedure

-- Add the practitionerId column allowing nulls for historical records
ALTER TABLE "DentalProcedure" ADD COLUMN "practitionerId" TEXT;

-- Add foreign key constraint referencing User table
ALTER TABLE "DentalProcedure" ADD CONSTRAINT "DentalProcedure_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index to improve lookups by practitionerId
CREATE INDEX "DentalProcedure_practitionerId_idx" ON "DentalProcedure"("practitionerId"); 