-- Create PatientType enum
CREATE TYPE "PatientType" AS ENUM ('BPJS', 'UMUM');

-- Drop emergencyContact column from Patient
ALTER TABLE "patients" DROP COLUMN IF EXISTS "emergencyContact";

-- Add new fields to Visit
ALTER TABLE "visits" ADD COLUMN "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "visits" ADD COLUMN "dischargeDate" TIMESTAMP(3);
ALTER TABLE "visits" ADD COLUMN "patientType" "PatientType" NOT NULL DEFAULT 'UMUM';
