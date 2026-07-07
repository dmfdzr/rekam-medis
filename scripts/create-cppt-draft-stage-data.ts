import { MedicalRecordStatus, PrescriptionStatus, PrismaClient, VisitStatus } from "@prisma/client"
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

const patientNiks = [
  "3177286410660666",
  "3172245503728614",
  "3171435011111586",
  "3176366205741121",
  "3179566508700531",
  "3178590804736927",
  "3176895405268644",
  "3174692103896524",
  "3177650301248341",
  "3174315204165044",
  "3175675012059378",
  "3171635611437044",
  "3179480110996457",
  "3172111407225479",
  "3172730304652462",
] as const

const cpptNotes = [
  "Kondisi umum stabil, keluhan berkurang setelah terapi awal.",
  "Pasien kooperatif, tanda vital terpantau dalam batas aman.",
  "Asupan oral membaik, edukasi perawatan dan pemantauan dilanjutkan.",
  "Keluhan utama membaik, tidak ada tanda kegawatan saat evaluasi.",
] as const

async function main() {
  const pharmacist = await prisma.user.findFirstOrThrow({
    where: {
      OR: [
        { role: { key: "ADMIN" } },
        { role: { key: "MASTER" } },
      ],
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
  let prepared = 0

  for (const [index, nik] of patientNiks.entries()) {
    const visitId = `visit-prescription-stage-${nik}`
    const record = await prisma.medicalRecord.findFirst({
      where: {
        visit: {
          id: visitId,
          patient: {
            nik,
          },
        },
      },
      include: {
        visit: {
          include: {
            vitalSign: true,
          },
        },
        prescription: true,
      },
    })

    if (!record || !record.prescription) {
      console.warn(`Skipping ${nik}: medical record or prescription is missing.`)
      continue
    }

    const processedAt = new Date()
    const note = cpptNotes[index % cpptNotes.length]
    const physicalExam = [
      record.visit.vitalSign?.bloodPressure ? `TD ${record.visit.vitalSign.bloodPressure} mmHg` : "TD 120/80 mmHg",
      record.visit.vitalSign?.pulse ? `Nadi ${record.visit.vitalSign.pulse}/menit` : "Nadi 84/menit",
      record.visit.vitalSign?.temperature ? `Suhu ${record.visit.vitalSign.temperature.toString()} C` : "Suhu 37.2 C",
      record.visit.vitalSign?.respiration ? `RR ${record.visit.vitalSign.respiration}/menit` : "RR 20/menit",
      record.visit.vitalSign?.oxygenSaturation ? `SpO2 ${record.visit.vitalSign.oxygenSaturation}%` : "SpO2 98%",
    ].join("; ")

    await prisma.$transaction(async (tx) => {
      await tx.prescription.update({
        where: { id: record.prescription!.id },
        data: {
          status: PrescriptionStatus.PROCESSED,
          pharmacistId: pharmacist.id,
          processedAt,
        },
      })

      await tx.visit.update({
        where: { id: record.visitId },
        data: {
          status: VisitStatus.PHARMACY,
          dischargeDate: null,
        },
      })

      await tx.medicalRecord.update({
        where: { id: record.id },
        data: {
          subjective: record.subjective || note,
          objective: "Tanda vital stabil dan respons terapi awal baik.",
          assessment: record.assessment || "Evaluasi klinis lanjutan",
          plan: "Lanjutkan terapi sesuai resep, observasi respons klinis, dan edukasi pasien.",
          physicalExam,
          doctorNote: "Pantau kondisi pasien dan evaluasi ulang bila keluhan memberat.",
          followUpDate: null,
          status: MedicalRecordStatus.DRAFT,
          finalizedAt: null,
        },
      })
    })

    prepared += 1
  }

  console.log(`Prepared ${prepared} visits through CPPT draft stage. No medical record was finalized.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
