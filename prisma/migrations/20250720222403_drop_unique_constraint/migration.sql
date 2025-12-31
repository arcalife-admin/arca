-- Drop the unique constraint that's causing issues
DROP INDEX IF EXISTS "DentalProcedure_patientId_toothNumber_codeId_key"; 