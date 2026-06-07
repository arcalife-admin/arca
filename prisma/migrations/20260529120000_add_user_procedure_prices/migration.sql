-- CreateTable
CREATE TABLE "UserProcedurePrice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProcedurePrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProcedurePrice_userId_codeId_key" ON "UserProcedurePrice"("userId", "codeId");

-- CreateIndex
CREATE INDEX "UserProcedurePrice_userId_idx" ON "UserProcedurePrice"("userId");

-- CreateIndex
CREATE INDEX "UserProcedurePrice_codeId_idx" ON "UserProcedurePrice"("codeId");

-- AddForeignKey
ALTER TABLE "UserProcedurePrice" ADD CONSTRAINT "UserProcedurePrice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProcedurePrice" ADD CONSTRAINT "UserProcedurePrice_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "SurgicalProcedureCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
