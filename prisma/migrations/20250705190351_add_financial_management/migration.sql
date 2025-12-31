/*
  Warnings:

  - The values [COMPLETED] on the enum `WaitingListStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('TREATMENT', 'CONSULTATION', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('MATERIALS', 'EQUIPMENT', 'RENT', 'UTILITIES', 'INSURANCE', 'MARKETING', 'PROFESSIONAL_DEVELOPMENT', 'TRAVEL', 'MEALS', 'SOFTWARE', 'OFFICE_SUPPLIES', 'PROFESSIONAL_SERVICES', 'PHONE_INTERNET', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- AlterEnum
BEGIN;
CREATE TYPE "WaitingListStatus_new" AS ENUM ('ACTIVE', 'CALLED', 'CONFIRMED', 'CANCELLED');
ALTER TABLE "WaitingListEntry" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "WaitingListEntry" ALTER COLUMN "status" TYPE "WaitingListStatus_new" USING ("status"::text::"WaitingListStatus_new");
ALTER TYPE "WaitingListStatus" RENAME TO "WaitingListStatus_old";
ALTER TYPE "WaitingListStatus_new" RENAME TO "WaitingListStatus";
DROP TYPE "WaitingListStatus_old";
ALTER TABLE "WaitingListEntry" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- CreateTable
CREATE TABLE "UserFinanceSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vatPercentage" DOUBLE PRECISION NOT NULL DEFAULT 21.0,
    "incomeTaxReservePercentage" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "monthlyIncomeGoal" DOUBLE PRECISION,
    "quarterlyIncomeGoal" DOUBLE PRECISION,
    "preferredCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "accountantName" TEXT,
    "accountantEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFinanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIncome" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "type" "IncomeType" NOT NULL DEFAULT 'TREATMENT',
    "date" TIMESTAMP(3) NOT NULL,
    "invoiceNumber" TEXT,
    "clientName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "vendor" TEXT,
    "isTaxDeductible" BOOLEAN NOT NULL DEFAULT true,
    "taxDeductiblePercentage" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "receiptUrl" TEXT,
    "receiptFileName" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalIncome" DOUBLE PRECISION NOT NULL,
    "totalExpenses" DOUBLE PRECISION NOT NULL,
    "netIncome" DOUBLE PRECISION NOT NULL,
    "estimatedTax" DOUBLE PRECISION NOT NULL,
    "pdfUrl" TEXT,
    "csvUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFinanceSettings_userId_key" ON "UserFinanceSettings"("userId");

-- CreateIndex
CREATE INDEX "UserFinanceSettings_userId_idx" ON "UserFinanceSettings"("userId");

-- CreateIndex
CREATE INDEX "UserIncome_userId_idx" ON "UserIncome"("userId");

-- CreateIndex
CREATE INDEX "UserIncome_date_idx" ON "UserIncome"("date");

-- CreateIndex
CREATE INDEX "UserExpense_userId_idx" ON "UserExpense"("userId");

-- CreateIndex
CREATE INDEX "UserExpense_date_idx" ON "UserExpense"("date");

-- CreateIndex
CREATE INDEX "UserExpense_category_idx" ON "UserExpense"("category");

-- CreateIndex
CREATE INDEX "FinancialReport_userId_idx" ON "FinancialReport"("userId");

-- CreateIndex
CREATE INDEX "FinancialReport_type_idx" ON "FinancialReport"("type");

-- AddForeignKey
ALTER TABLE "UserFinanceSettings" ADD CONSTRAINT "UserFinanceSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIncome" ADD CONSTRAINT "UserIncome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserExpense" ADD CONSTRAINT "UserExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialReport" ADD CONSTRAINT "FinancialReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
