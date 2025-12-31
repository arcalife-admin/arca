-- CreateTable
CREATE TABLE "DentalChartVisualState" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "toothNumber" INTEGER NOT NULL,
    "surface" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    "creationStatus" TEXT NOT NULL,
    "material" TEXT,
    "bridgeId" TEXT,
    "role" TEXT,
    "originalState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DentalChartVisualState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DentalChartVisualState_patientId_idx" ON "DentalChartVisualState"("patientId");

-- CreateIndex
CREATE INDEX "DentalChartVisualState_toothNumber_idx" ON "DentalChartVisualState"("toothNumber");

-- CreateIndex
CREATE INDEX "DentalChartVisualState_surface_idx" ON "DentalChartVisualState"("surface");

-- CreateIndex
CREATE UNIQUE INDEX "DentalChartVisualState_patientId_toothNumber_surface_key" ON "DentalChartVisualState"("patientId", "toothNumber", "surface");

-- AddForeignKey
ALTER TABLE "DentalChartVisualState" ADD CONSTRAINT "DentalChartVisualState_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
