/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `ProcedureBackup` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProcedureBackup_procedureId_backupType_key";

-- CreateIndex
CREATE UNIQUE INDEX "ProcedureBackup_id_key" ON "ProcedureBackup"("id");
