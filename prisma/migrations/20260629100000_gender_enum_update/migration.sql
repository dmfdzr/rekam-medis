-- AlterEnum: Update Gender enum (remove OTHER, add UNDETERMINED, UNKNOWN, NOT_FILLED)
-- First, update any rows that use OTHER to NOT_FILLED
UPDATE "Patient" SET "gender" = 'NOT_FILLED' WHERE "gender" = 'OTHER';

-- Create new enum type with desired values
CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE', 'UNDETERMINED', 'UNKNOWN', 'NOT_FILLED');

-- Alter column to use new enum
ALTER TABLE "Patient" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");

-- Drop old enum and rename new one
DROP TYPE "Gender";
ALTER TYPE "Gender_new" RENAME TO "Gender";
