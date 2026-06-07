-- Replace placeholder surgical procedure catalog with clinic price list.
-- Safe to re-run on empty catalog: deletes all codes and re-inserts.

DELETE FROM "UserProcedurePrice";
DELETE FROM "SurgicalProcedure";
DELETE FROM "SurgicalProcedureCode";

-- Inserts are applied by migration 20260607120001_replace_surgical_procedure_catalog.
-- For manual/dev re-seeding use: npm run db:seed
