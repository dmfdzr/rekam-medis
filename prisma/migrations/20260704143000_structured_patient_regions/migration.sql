-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('PROVINCE', 'CITY', 'DISTRICT');

-- AlterTable
ALTER TABLE "patients"
ADD COLUMN "province" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "district" TEXT;

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RegionType" NOT NULL,
    "parentId" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");

-- CreateIndex
CREATE INDEX "regions_type_idx" ON "regions"("type");

-- CreateIndex
CREATE INDEX "regions_parentId_idx" ON "regions"("parentId");

-- CreateIndex
CREATE INDEX "regions_name_idx" ON "regions"("name");

-- CreateIndex
CREATE INDEX "patients_province_idx" ON "patients"("province");

-- CreateIndex
CREATE INDEX "patients_city_idx" ON "patients"("city");

-- CreateIndex
CREATE INDEX "patients_district_idx" ON "patients"("district");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
