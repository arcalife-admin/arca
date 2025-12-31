-- CreateTable
CREATE TABLE "FluorideFlavor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "color" VARCHAR(8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FluorideFlavor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureBackup" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "backupType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcedureBackup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FluorideFlavor_organizationId_name_key" ON "FluorideFlavor"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedureBackup_procedureId_backupType_key" ON "ProcedureBackup"("procedureId", "backupType");

-- AddForeignKey
ALTER TABLE "FluorideFlavor" ADD CONSTRAINT "FluorideFlavor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
