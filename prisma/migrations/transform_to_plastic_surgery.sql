-- Migration script to transform dental clinic database to plastic surgery clinic
-- Run this script after backing up your database

BEGIN;

-- Step 1: Rename tables
ALTER TABLE "DentalCode" RENAME TO "SurgicalProcedureCode";
ALTER TABLE "DentalProcedure" RENAME TO "SurgicalProcedure";

-- Step 2: Update SurgicalProcedureCode table
ALTER TABLE "SurgicalProcedureCode" 
  DROP COLUMN IF EXISTS "points",
  DROP COLUMN IF EXISTS "rate",
  ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "duration" INTEGER;

-- Step 3: Update SurgicalProcedure table - remove dental-specific fields
ALTER TABLE "SurgicalProcedure"
  DROP COLUMN IF EXISTS "toothNumber",
  DROP COLUMN IF EXISTS "subSurfaces",
  DROP COLUMN IF EXISTS "fillingMaterial",
  ADD COLUMN IF NOT EXISTS "bodyArea" TEXT,
  ADD COLUMN IF NOT EXISTS "procedureType" TEXT,
  ADD COLUMN IF NOT EXISTS "anesthesiaType" TEXT;

-- Step 4: Drop unique constraint that includes toothNumber
ALTER TABLE "SurgicalProcedure" 
  DROP CONSTRAINT IF EXISTS "SurgicalProcedure_patientId_toothNumber_codeId_key";

-- Step 5: Update Patient table - remove dental-specific fields
ALTER TABLE "Patient"
  DROP COLUMN IF EXISTS "dentalHistory",
  DROP COLUMN IF EXISTS "dentalChart",
  DROP COLUMN IF EXISTS "periodontalCharts",
  DROP COLUMN IF EXISTS "ppsScores",
  DROP COLUMN IF EXISTS "ppsTreatment",
  DROP COLUMN IF EXISTS "recallTerm",
  ADD COLUMN IF NOT EXISTS "surgicalHistory" JSONB,
  ADD COLUMN IF NOT EXISTS "beforeAfterPhotos" JSONB,
  ADD COLUMN IF NOT EXISTS "surgicalNotes" JSONB;

-- Step 6: Update Image table - remove dental-specific fields
ALTER TABLE "Image"
  DROP COLUMN IF EXISTS "toothNumber",
  DROP COLUMN IF EXISTS "side",
  ADD COLUMN IF NOT EXISTS "bodyArea" TEXT,
  ADD COLUMN IF NOT EXISTS "view" TEXT;

-- Step 7: Drop dental-specific tables
DROP TABLE IF EXISTS "PpsRecord";
DROP TABLE IF EXISTS "ScreeningRecallRecord";
DROP TABLE IF EXISTS "CleaningRecallRecord";
DROP TABLE IF EXISTS "FluorideFlavor";

-- Step 8: Update UserRole enum
-- Note: This requires dropping and recreating the enum, which is complex
-- We'll handle this in a separate step or use ALTER TYPE if supported

-- Step 9: Update ImageType enum values
-- This also requires dropping and recreating the enum

-- Step 10: Update foreign key references
ALTER TABLE "SurgicalProcedure"
  DROP CONSTRAINT IF EXISTS "SurgicalProcedure_codeId_fkey",
  ADD CONSTRAINT "SurgicalProcedure_codeId_fkey" 
    FOREIGN KEY ("codeId") REFERENCES "SurgicalProcedureCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SurgicalProcedure"
  DROP CONSTRAINT IF EXISTS "SurgicalProcedure_patientId_fkey",
  ADD CONSTRAINT "SurgicalProcedure_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 11: Create indexes for new fields
CREATE INDEX IF NOT EXISTS "SurgicalProcedure_bodyArea_idx" ON "SurgicalProcedure"("bodyArea");
CREATE INDEX IF NOT EXISTS "SurgicalProcedure_procedureType_idx" ON "SurgicalProcedure"("procedureType");
CREATE INDEX IF NOT EXISTS "Image_bodyArea_idx" ON "Image"("bodyArea");

-- Step 12: Update Organization table - remove FluorideFlavor relation
-- (This is handled by dropping the FluorideFlavor table above)

COMMIT;

-- Additional migration for enum updates (run separately if needed)
-- Note: PostgreSQL enum updates require special handling
-- You may need to:
-- 1. Create new enum types
-- 2. Update columns to use new enum types
-- 3. Drop old enum types

