import {
  DiagnosisType,
  MedicalRecordStatus,
  PatientType,
  PrescriptionStatus,
  PrismaClient,
  VisitStatus,
} from "@prisma/client"
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

const clinicalSeeds = [
  { nik: "3177286410660666", diagnosisCode: "J06.9", diagnosis: "Infeksi saluran pernapasan akut", complaint: "Demam, batuk, dan nyeri tenggorokan", medicine: "Paracetamol 500mg", dosage: "500mg", usageRule: "3x sehari setelah makan bila demam", quantity: 10 },
  { nik: "3172245503728614", diagnosisCode: "I10", diagnosis: "Hipertensi esensial", complaint: "Pusing dan tekanan darah meningkat", medicine: "Amlodipine 5mg", dosage: "5mg", usageRule: "1x sehari malam hari", quantity: 30 },
  { nik: "3171435011111586", diagnosisCode: "A09", diagnosis: "Gastroenteritis akut", complaint: "Diare dan nyeri perut", medicine: "Oralit", dosage: "1 sachet", usageRule: "Setiap setelah diare", quantity: 6 },
  { nik: "3176366205741121", diagnosisCode: "E11.9", diagnosis: "Diabetes melitus tipe 2", complaint: "Lemas dan gula darah meningkat", medicine: "Metformin 500mg", dosage: "500mg", usageRule: "2x sehari setelah makan", quantity: 30 },
  { nik: "3179566508700531", diagnosisCode: "J45.9", diagnosis: "Asma", complaint: "Sesak episodik dan batuk malam", medicine: "Salbutamol inhaler", dosage: "100mcg", usageRule: "1-2 puff saat sesak", quantity: 1 },
  { nik: "3178590804736927", diagnosisCode: "K30", diagnosis: "Dispepsia", complaint: "Nyeri ulu hati dan mual", medicine: "Omeprazole 20mg", dosage: "20mg", usageRule: "1x sehari sebelum makan", quantity: 14 },
  { nik: "3176895405268644", diagnosisCode: "J00", diagnosis: "Nasofaringitis akut", complaint: "Pilek dan bersin", medicine: "Cetirizine 10mg", dosage: "10mg", usageRule: "1x sehari malam hari", quantity: 7 },
  { nik: "3174692103896524", diagnosisCode: "M54.5", diagnosis: "Nyeri punggung bawah", complaint: "Nyeri pinggang setelah aktivitas", medicine: "Ibuprofen 400mg", dosage: "400mg", usageRule: "2x sehari setelah makan bila nyeri", quantity: 10 },
  { nik: "3177650301248341", diagnosisCode: "R50.9", diagnosis: "Demam tidak spesifik", complaint: "Demam sejak satu hari", medicine: "Paracetamol syrup", dosage: "5ml", usageRule: "3x sehari bila demam", quantity: 1 },
  { nik: "3174315204165044", diagnosisCode: "L20.9", diagnosis: "Dermatitis atopik", complaint: "Gatal dan ruam kulit", medicine: "Hydrocortisone cream 1%", dosage: "Tipis", usageRule: "2x sehari pada area gatal", quantity: 1 },
  { nik: "3175675012059378", diagnosisCode: "D64.9", diagnosis: "Anemia", complaint: "Mudah lelah dan pucat", medicine: "Tablet tambah darah", dosage: "1 tablet", usageRule: "1x sehari setelah makan", quantity: 30 },
  { nik: "3171635611437044", diagnosisCode: "M17.9", diagnosis: "Osteoartritis lutut", complaint: "Nyeri lutut saat berjalan", medicine: "Meloxicam 7.5mg", dosage: "7.5mg", usageRule: "1x sehari setelah makan bila nyeri", quantity: 10 },
  { nik: "3179480110996457", diagnosisCode: "G44.2", diagnosis: "Sakit kepala tipe tegang", complaint: "Sakit kepala menekan", medicine: "Paracetamol 500mg", dosage: "500mg", usageRule: "3x sehari bila nyeri", quantity: 10 },
  { nik: "3172111407225479", diagnosisCode: "J20.9", diagnosis: "Bronkitis akut", complaint: "Batuk berdahak dan demam ringan", medicine: "Ambroxol 30mg", dosage: "30mg", usageRule: "3x sehari setelah makan", quantity: 15 },
  { nik: "3172730304652462", diagnosisCode: "N39.0", diagnosis: "Infeksi saluran kemih", complaint: "Nyeri saat berkemih", medicine: "Cefixime 100mg", dosage: "100mg", usageRule: "2x sehari setelah makan", quantity: 10 },
] as const

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

async function main() {
  const doctor = await prisma.user.findFirstOrThrow({
    where: {
      role: { key: "DOCTOR" },
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
  const admin = await prisma.user.findFirst({
    where: {
      role: { key: "ADMIN" },
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
  const start = new Date("2026-07-04T08:00:00+07:00")
  let prepared = 0

  for (const [index, seed] of clinicalSeeds.entries()) {
    const patient = await prisma.patient.findUniqueOrThrow({
      where: { nik: seed.nik },
      select: {
        id: true,
        fullName: true,
      },
    })
    const visitDate = addHours(start, index)
    const visitId = `visit-prescription-stage-${seed.nik}`
    const recordId = `record-prescription-stage-${seed.nik}`
    const prescriptionItemId = `prescription-item-stage-${seed.nik}`

    await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.upsert({
        where: { id: visitId },
        update: {
          patientId: patient.id,
          doctorId: doctor.id,
          visitDate,
          admissionDate: visitDate,
          service: "Ruang Perawatan Dewasa",
          chiefComplaint: seed.complaint,
          patientType: PatientType.UMUM,
          status: VisitStatus.EXAMINATION,
          createdById: admin?.id ?? null,
        },
        create: {
          id: visitId,
          patientId: patient.id,
          doctorId: doctor.id,
          visitDate,
          admissionDate: visitDate,
          service: "Ruang Perawatan Dewasa",
          chiefComplaint: seed.complaint,
          patientType: PatientType.UMUM,
          status: VisitStatus.EXAMINATION,
          createdById: admin?.id ?? null,
        },
      })

      await tx.vitalSign.upsert({
        where: { visitId: visit.id },
        update: {
          bloodPressure: "120/80",
          temperature: "37.2",
          weight: "60.0",
          height: "160.0",
          pulse: 84,
          respiration: 20,
          oxygenSaturation: 98,
          nurseNote: "Tanda vital awal sebelum resep.",
        },
        create: {
          visitId: visit.id,
          bloodPressure: "120/80",
          temperature: "37.2",
          weight: "60.0",
          height: "160.0",
          pulse: 84,
          respiration: 20,
          oxygenSaturation: 98,
          nurseNote: "Tanda vital awal sebelum resep.",
        },
      })

      const record = await tx.medicalRecord.upsert({
        where: { visitId: visit.id },
        update: {
          id: recordId,
          subjective: seed.complaint,
          assessment: seed.diagnosis,
          doctorId: doctor.id,
          status: MedicalRecordStatus.DRAFT,
        },
        create: {
          id: recordId,
          visitId: visit.id,
          subjective: seed.complaint,
          assessment: seed.diagnosis,
          doctorId: doctor.id,
          status: MedicalRecordStatus.DRAFT,
        },
      })

      await tx.diagnosis.deleteMany({ where: { medicalRecordId: record.id } })
      await tx.diagnosis.create({
        data: {
          medicalRecordId: record.id,
          code: seed.diagnosisCode,
          name: seed.diagnosis,
          type: DiagnosisType.PRIMARY,
          note: "Diagnosis awal untuk alur resep.",
        },
      })

      await tx.treatment.deleteMany({ where: { medicalRecordId: record.id } })
      await tx.treatment.create({
        data: {
          medicalRecordId: record.id,
          code: "CONS-GP",
          name: "Konsultasi dokter umum",
          performerId: doctor.id,
          note: "Pemeriksaan awal sebelum resep.",
        },
      })

      await tx.laboratoryResult.upsert({
        where: { visitId: visit.id },
        update: {
          examinationDate: addHours(visitDate, 1),
          hemoglobin: "13.50",
          leukosit: "7800.00",
          gds: "112.00",
          crp: "4.20",
        },
        create: {
          visitId: visit.id,
          examinationDate: addHours(visitDate, 1),
          hemoglobin: "13.50",
          leukosit: "7800.00",
          gds: "112.00",
          crp: "4.20",
        },
      })

      const prescription = await tx.prescription.upsert({
        where: { medicalRecordId: record.id },
        update: {
          status: PrescriptionStatus.PENDING,
          doctorId: doctor.id,
          pharmacistId: null,
          processedAt: null,
        },
        create: {
          medicalRecordId: record.id,
          status: PrescriptionStatus.PENDING,
          doctorId: doctor.id,
        },
      })

      await tx.prescriptionItem.upsert({
        where: { id: prescriptionItemId },
        update: {
          prescriptionId: prescription.id,
          medicineName: seed.medicine,
          dosage: seed.dosage,
          usageRule: seed.usageRule,
          quantity: seed.quantity,
          note: "Menunggu proses farmasi.",
        },
        create: {
          id: prescriptionItemId,
          prescriptionId: prescription.id,
          medicineName: seed.medicine,
          dosage: seed.dosage,
          usageRule: seed.usageRule,
          quantity: seed.quantity,
          note: "Menunggu proses farmasi.",
        },
      })
    })

    prepared += 1
  }

  console.log(`Prepared ${prepared} visits through pending prescription stage.`)
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
