import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config } from "dotenv"

config({ path: ".env.local" })
config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.$transaction([
    prisma.medicalDocument.deleteMany(),
    prisma.prescriptionItem.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.diagnosis.deleteMany(),
    prisma.treatment.deleteMany(),
    prisma.medicalRecord.deleteMany(),
    prisma.laboratoryResult.deleteMany(),
    prisma.vitalSign.deleteMany(),
    prisma.visitCompanionDoctor.deleteMany(),
    prisma.visit.deleteMany(),
    prisma.auditLog.deleteMany({
      where: {
        OR: [
          { entityName: { in: ["Visit", "MedicalRecord", "Prescription", "MedicalDocument", "LaboratoryResult", "VitalSign", "Diagnosis", "Treatment"] } },
          { action: { contains: "VISIT" } },
          { action: { contains: "MEDICAL_RECORD" } },
          { action: { contains: "PRESCRIPTION" } },
          { action: { contains: "MEDICAL_DOCUMENT" } },
        ],
      },
    }),
  ])
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log("Clinical data cleared. Patients, users, roles, and sessions were preserved.")
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
