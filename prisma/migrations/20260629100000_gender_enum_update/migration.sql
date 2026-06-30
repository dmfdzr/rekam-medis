-- Create new enum type with desired values
CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE', 'UNDETERMINED', 'UNKNOWN', 'NOT_FILLED');

-- Alter column to use new enum
ALTER TABLE "patients" ALTER COLUMN "gender" TYPE "Gender_new" USING (CASE WHEN "gender"::text = 'OTHER' THEN 'NOT_FILLED'::text ELSE "gender"::text END)::"Gender_new";

-- Drop old enum and rename new one
DROP TYPE "Gender";
ALTER TYPE "Gender_new" RENAME TO "Gender";
