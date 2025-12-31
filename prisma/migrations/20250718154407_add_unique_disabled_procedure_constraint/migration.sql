/*
  Warnings:

  - A unique constraint covering the columns `[patientId,toothNumber,codeId]` on the table `DentalProcedure` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DentalProcedure_patientId_toothNumber_codeId_key" ON "DentalProcedure"("patientId", "toothNumber", "codeId");
