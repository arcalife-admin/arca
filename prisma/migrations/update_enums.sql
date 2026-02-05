-- Migration script to update enum types for plastic surgery clinic
-- This script handles the complex enum updates

BEGIN;

-- Step 1: Create new UserRole enum
CREATE TYPE "UserRole_new" AS ENUM (
  'ORGANIZATION_OWNER',
  'MANAGER',
  'PLASTIC_SURGEON',
  'SURGEON',
  'NURSE',
  'RECEPTIONIST',
  'ASSISTANT',
  'ANESTHESIOLOGIST',
  'AESTHETIC_NURSE',
  'MEDICAL_ASSISTANT',
  'COUNSELOR',
  'PHOTOGRAPHER'
);

-- Step 2: Create new ImageType enum
CREATE TYPE "ImageType_new" AS ENUM (
  'BEFORE_PHOTO',
  'AFTER_PHOTO',
  'PRE_OPERATIVE',
  'POST_OPERATIVE',
  'XRAY',
  'CT_SCAN',
  'MRI',
  'ULTRASOUND',
  'DOCUMENTATION',
  'OTHER'
);

-- Step 3: Update User table to use new UserRole enum
ALTER TABLE "User" 
  ALTER COLUMN "role" TYPE "UserRole_new" 
  USING CASE
    WHEN "role"::text = 'DENTIST' THEN 'PLASTIC_SURGEON'::"UserRole_new"
    WHEN "role"::text = 'HYGIENIST' THEN 'NURSE'::"UserRole_new"
    WHEN "role"::text = 'ORTHODONTIST' THEN 'SURGEON'::"UserRole_new"
    WHEN "role"::text = 'PERIODONTOLOGIST' THEN 'SURGEON'::"UserRole_new"
    WHEN "role"::text = 'IMPLANTOLOGIST' THEN 'SURGEON'::"UserRole_new"
    WHEN "role"::text = 'ENDODONTIST' THEN 'SURGEON'::"UserRole_new"
    WHEN "role"::text = 'DENTAL_TECHNICIAN' THEN 'MEDICAL_ASSISTANT'::"UserRole_new"
    WHEN "role"::text = 'DENTAL_LAB_TECHNICIAN' THEN 'MEDICAL_ASSISTANT'::"UserRole_new"
    ELSE "role"::text::"UserRole_new"
  END;

-- Step 4: Update Image table to use new ImageType enum
ALTER TABLE "Image"
  ALTER COLUMN "type" TYPE "ImageType_new"
  USING CASE
    WHEN "type"::text = 'BITEWING' THEN 'XRAY'::"ImageType_new"
    WHEN "type"::text = 'OPG' THEN 'XRAY'::"ImageType_new"
    WHEN "type"::text = 'SOLO' THEN 'DOCUMENTATION'::"ImageType_new"
    WHEN "type"::text = 'INTRAORAL' THEN 'DOCUMENTATION'::"ImageType_new"
    WHEN "type"::text = 'EXTRAORAL' THEN 'DOCUMENTATION'::"ImageType_new"
    WHEN "type"::text = 'PANORAMIC' THEN 'XRAY'::"ImageType_new"
    WHEN "type"::text = 'CBCT' THEN 'CT_SCAN'::"ImageType_new"
    ELSE 'OTHER'::"ImageType_new"
  END;

-- Step 5: Drop old enum types
DROP TYPE IF EXISTS "UserRole";
DROP TYPE IF EXISTS "ImageType";

-- Step 6: Rename new enum types
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TYPE "ImageType_new" RENAME TO "ImageType";

COMMIT;

