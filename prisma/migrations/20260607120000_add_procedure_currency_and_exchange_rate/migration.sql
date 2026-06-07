-- Add currency to procedure catalog and EUR/RON exchange rate to organization

ALTER TABLE "SurgicalProcedureCode" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'EUR';

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "eurToRonRate" DOUBLE PRECISION NOT NULL DEFAULT 5.26;
