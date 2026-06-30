-- DropForeignKey
ALTER TABLE "prescription_items" DROP CONSTRAINT IF EXISTS "prescription_items_medicineId_fkey";

-- DropTable
DROP TABLE "medicines";

-- DropEnum
DROP TYPE "MedicineStatus";

-- AlterTable: Remove VALIDATING_STOCK from PrescriptionStatus enum
-- First, update any rows that use VALIDATING_STOCK to PENDING
UPDATE "prescriptions" SET "status" = 'PENDING' WHERE "status" = 'VALIDATING_STOCK';

-- DropIndex
DROP INDEX "prescription_items_medicineId_idx";

-- AlterTable
ALTER TABLE "prescription_items" DROP COLUMN "medicineId",
ADD COLUMN "medicineName" TEXT NOT NULL DEFAULT '';

-- AlterEnum: Remove VALIDATING_STOCK from PrescriptionStatus
-- Note: PostgreSQL doesn't support removing enum values directly
-- We need to recreate the enum type
BEGIN;
-- Create a new enum type with only the values we want
CREATE TYPE "PrescriptionStatus_new" AS ENUM ('PENDING', 'PROCESSED', 'CANCELLED');
-- Drop default before alter
ALTER TABLE "prescriptions" ALTER COLUMN "status" DROP DEFAULT;
-- Alter the column to use the new enum
ALTER TABLE "prescriptions" ALTER COLUMN "status" TYPE "PrescriptionStatus_new" USING ("status"::text::"PrescriptionStatus_new");
ALTER TABLE "prescriptions" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"PrescriptionStatus_new";
-- Drop the old enum
DROP TYPE "PrescriptionStatus";
-- Rename the new enum
ALTER TYPE "PrescriptionStatus_new" RENAME TO "PrescriptionStatus";
COMMIT;
