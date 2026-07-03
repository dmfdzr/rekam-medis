-- AlterTable
ALTER TABLE "medical_records"
ADD COLUMN IF NOT EXISTS "dischargeCondition" TEXT,
ADD COLUMN IF NOT EXISTS "dischargeInstruction" TEXT;
