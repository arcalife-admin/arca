/*
  Warnings:

  - You are about to drop the `DentalChartVisualState` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DentalChartVisualState" DROP CONSTRAINT "DentalChartVisualState_patientId_fkey";

-- DropTable
DROP TABLE "DentalChartVisualState";
