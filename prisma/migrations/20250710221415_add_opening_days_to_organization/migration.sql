-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "openingDays" TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']::TEXT[];
