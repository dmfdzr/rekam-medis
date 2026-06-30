/*
  Warnings:

  - You are about to alter the column `weight` on the `vital_signs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `Decimal(5,1)`.
  - You are about to alter the column `height` on the `vital_signs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `Decimal(5,1)`.

*/
-- AlterTable
ALTER TABLE "prescription_items" ALTER COLUMN "medicineName" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vital_signs" ALTER COLUMN "weight" SET DATA TYPE DECIMAL(5,1),
ALTER COLUMN "height" SET DATA TYPE DECIMAL(5,1);

-- CreateTable
CREATE TABLE "laboratory_results" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "examinationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hemoglobin" DECIMAL(5,2),
    "leukosit" DECIMAL(10,2),
    "gds" DECIMAL(5,2),
    "crp" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratory_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "laboratory_results_visitId_key" ON "laboratory_results"("visitId");

-- AddForeignKey
ALTER TABLE "laboratory_results" ADD CONSTRAINT "laboratory_results_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
