-- Create PatientType enum
CREATE TYPE "PatientType" AS ENUM ('BPJS', 'UMUM');

-- Drop emergencyContact column from Patient
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "emergencyContact";

-- Add new fields to Visit
ALTER TABLE "Visit" ADD COLUMN "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Visit" ADD COLUMN "dischargeDate" TIMESTAMP(3);
ALTER TABLE "Visit" ADD COLUMN "patientType" "PatientType" NOT NULL DEFAULT 'UMUM';
