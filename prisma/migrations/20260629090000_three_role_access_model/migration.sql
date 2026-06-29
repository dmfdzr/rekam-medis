-- Keep clinical records intact while removing obsolete application users.
DELETE FROM "users"
WHERE "roleId" IN (
  SELECT "id"
  FROM "roles"
  WHERE "key"::text NOT IN ('ADMIN', 'DOCTOR', 'MASTER', 'SUPER_ADMIN')
);

DELETE FROM "roles"
WHERE "key"::text NOT IN ('ADMIN', 'DOCTOR', 'MASTER', 'SUPER_ADMIN');

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('MASTER', 'ADMIN', 'DOCTOR');

ALTER TABLE "roles"
  ALTER COLUMN "key" TYPE "UserRole"
  USING (
    CASE
      WHEN "key"::text = 'SUPER_ADMIN' THEN 'MASTER'
      WHEN "key"::text = 'MASTER' THEN 'MASTER'
      WHEN "key"::text = 'ADMIN' THEN 'ADMIN'
      WHEN "key"::text = 'DOCTOR' THEN 'DOCTOR'
    END
  )::"UserRole";

DROP TYPE "UserRole_old";
