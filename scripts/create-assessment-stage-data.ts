import {
  DiagnosisType,
  MedicalRecordStatus,
  PatientType,
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

const assessmentSeeds = [
  { nik: "3177286410660666", diagnosisCode: "J06.9", diagnosis: "Infeksi saluran pernapasan akut", secondaryCode: "R50.9", secondary: "Demam tidak spesifik", procedureCode: "89.7", procedure: "General physical examination", complaint: "Demam, batuk, dan nyeri tenggorokan", history: "Keluhan muncul sejak dua hari, nafsu makan menurun, tidak ada sesak berat.", room: "Ruang Perawatan Dewasa" },
  { nik: "3172245503728614", diagnosisCode: "I10", diagnosis: "Hipertensi esensial", secondaryCode: "R51", secondary: "Nyeri kepala", procedureCode: "89.52", procedure: "Electrocardiogram", complaint: "Pusing dan tekanan darah meningkat", history: "Riwayat tekanan darah tinggi, kontrol obat tidak teratur.", room: "Ruang VIP" },
  { nik: "3171435011111586", diagnosisCode: "A09", diagnosis: "Gastroenteritis akut", secondaryCode: "E86", secondary: "Dehidrasi", procedureCode: "89.7", procedure: "General physical examination", complaint: "Diare dan nyeri perut", history: "Diare cair lebih dari lima kali sejak malam, muntah satu kali.", room: "Ruang Perawatan Anak" },
  { nik: "3176366205741121", diagnosisCode: "E11.9", diagnosis: "Diabetes melitus tipe 2", secondaryCode: "R53", secondary: "Malaise dan fatigue", procedureCode: "89.7", procedure: "General physical examination", complaint: "Lemas dan gula darah meningkat", history: "Pasien rutin kontrol diabetes, keluhan lemas sejak tiga hari.", room: "Ruang Kelas I" },
  { nik: "3179566508700531", diagnosisCode: "J45.9", diagnosis: "Asma", secondaryCode: "R06.0", secondary: "Dispnea", procedureCode: "89.37", procedure: "Vital capacity determination", complaint: "Sesak episodik dan batuk malam", history: "Sesak hilang timbul terutama malam, riwayat alergi debu.", room: "Ruang Melati" },
  { nik: "3178590804736927", diagnosisCode: "K30", diagnosis: "Dispepsia", secondaryCode: "R10.1", secondary: "Nyeri perut bagian atas", procedureCode: "89.7", procedure: "General physical examination", complaint: "Nyeri ulu hati dan mual", history: "Nyeri ulu hati setelah makan pedas, mual tanpa muntah.", room: "Ruang Mawar" },
  { nik: "3176895405268644", diagnosisCode: "J00", diagnosis: "Nasofaringitis akut", secondaryCode: "R05", secondary: "Batuk", procedureCode: "89.7", procedure: "General physical examination", complaint: "Pilek dan bersin", history: "Keluhan pilek sejak satu hari, tidak ada demam tinggi.", room: "Ruang Perawatan Anak" },
  { nik: "3174692103896524", diagnosisCode: "M54.5", diagnosis: "Nyeri punggung bawah", secondaryCode: "M79.1", secondary: "Mialgia", procedureCode: "93.01", procedure: "Functional evaluation", complaint: "Nyeri pinggang setelah aktivitas", history: "Nyeri bertambah saat membungkuk, tidak menjalar ke kaki.", room: "Ruang Kelas II" },
  { nik: "3177650301248341", diagnosisCode: "R50.9", diagnosis: "Demam tidak spesifik", secondaryCode: "R53", secondary: "Malaise dan fatigue", procedureCode: "89.7", procedure: "General physical examination", complaint: "Demam sejak satu hari", history: "Demam naik turun, masih dapat minum, tidak ada kejang.", room: "Ruang Perawatan Anak" },
  { nik: "3174315204165044", diagnosisCode: "L20.9", diagnosis: "Dermatitis atopik", secondaryCode: "L29.9", secondary: "Pruritus", procedureCode: "86.11", procedure: "Biopsy of skin and subcutaneous tissue", complaint: "Gatal dan ruam kulit", history: "Ruam berulang terutama setelah terpapar udara dingin.", room: "Ruang Anggrek" },
  { nik: "3175675012059378", diagnosisCode: "D64.9", diagnosis: "Anemia", secondaryCode: "R53", secondary: "Malaise dan fatigue", procedureCode: "89.7", procedure: "General physical examination", complaint: "Mudah lelah dan pucat", history: "Keluhan lemas beberapa minggu, nafsu makan menurun.", room: "Ruang Kelas III" },
  { nik: "3171635611437044", diagnosisCode: "M17.9", diagnosis: "Osteoartritis lutut", secondaryCode: "M25.5", secondary: "Nyeri sendi", procedureCode: "93.05", procedure: "Range of motion testing", complaint: "Nyeri lutut saat berjalan", history: "Nyeri lutut kronis memberat saat naik tangga.", room: "Ruang Dahlia" },
  { nik: "3179480110996457", diagnosisCode: "G44.2", diagnosis: "Sakit kepala tipe tegang", secondaryCode: "R42", secondary: "Pusing", procedureCode: "89.7", procedure: "General physical examination", complaint: "Sakit kepala menekan", history: "Sakit kepala setelah kurang tidur, tidak disertai muntah proyektil.", room: "Ruang Kenanga" },
  { nik: "3172111407225479", diagnosisCode: "J20.9", diagnosis: "Bronkitis akut", secondaryCode: "R05", secondary: "Batuk", procedureCode: "89.37", procedure: "Vital capacity determination", complaint: "Batuk berdahak dan demam ringan", history: "Batuk berdahak tiga hari, tidak ada riwayat asma.", room: "Ruang Bougenville" },
  { nik: "3172730304652462", diagnosisCode: "N39.0", diagnosis: "Infeksi saluran kemih", secondaryCode: "R30.0", secondary: "Disuria", procedureCode: "89.7", procedure: "General physical examination", complaint: "Nyeri saat berkemih", history: "Nyeri berkemih dan sering BAK sejak dua hari.", room: "Ruang Flamboyan" },
] as const

const vitalSigns = [
  { bloodPressure: "120/80", temperature: "37.4", weight: "58.0", height: "158.0", pulse: 86, respiration: 20, oxygenSaturation: 98 },
  { bloodPressure: "150/92", temperature: "36.8", weight: "70.0", height: "166.0", pulse: 88, respiration: 20, oxygenSaturation: 97 },
  { bloodPressure: "105/70", temperature: "37.8", weight: "34.0", height: "138.0", pulse: 96, respiration: 22, oxygenSaturation: 98 },
  { bloodPressure: "130/84", temperature: "36.9", weight: "64.0", height: "160.0", pulse: 82, respiration: 19, oxygenSaturation: 98 },
  { bloodPressure: "118/76", temperature: "36.7", weight: "55.0", height: "155.0", pulse: 94, respiration: 24, oxygenSaturation: 95 },
] as const

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

async function clearClinicalData() {
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
  ])
}

async function main() {
  const [doctors, admin] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { key: "DOCTOR" },
        status: "ACTIVE",
      },
      orderBy: { username: "asc" },
      select: { id: true, username: true },
    }),
    prisma.user.findFirst({
      where: {
        role: { key: "ADMIN" },
        status: "ACTIVE",
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ])

  if (doctors.length === 0) {
    throw new Error("Tidak ada user dokter aktif.")
  }

  await clearClinicalData()

  const start = new Date("2026-07-04T08:00:00+07:00")
  let prepared = 0

  for (const [index, seed] of assessmentSeeds.entries()) {
    const patient = await prisma.patient.findUniqueOrThrow({
      where: { nik: seed.nik },
      select: {
        id: true,
        fullName: true,
      },
    })
    const doctor = doctors[index % doctors.length]
    const companion = doctors[(index + 3) % doctors.length]
    const isJointCare = index % 5 === 0 && companion.id !== doctor.id
    const visitDate = addHours(start, index)
    const vital = vitalSigns[index % vitalSigns.length]
    const visitId = `visit-assessment-stage-${seed.nik}`
    const recordId = `record-assessment-stage-${seed.nik}`

    await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.create({
        data: {
          id: visitId,
          patientId: patient.id,
          doctorId: doctor.id,
          visitDate,
          admissionDate: visitDate,
          service: seed.room,
          chiefComplaint: seed.complaint,
          patientType: PatientType.UMUM,
          status: VisitStatus.VITAL_SIGN,
          isJointCare,
          createdById: admin?.id ?? null,
          companionDoctors: isJointCare
            ? {
                create: {
                  doctorId: companion.id,
                  order: 1,
                },
              }
            : undefined,
        },
      })

      await tx.vitalSign.create({
        data: {
          visitId: visit.id,
          bloodPressure: vital.bloodPressure,
          temperature: vital.temperature,
          weight: vital.weight,
          height: vital.height,
          pulse: vital.pulse,
          respiration: vital.respiration,
          oxygenSaturation: vital.oxygenSaturation,
          nurseNote: "Tanda vital awal saat asesmen.",
        },
      })

      const record = await tx.medicalRecord.create({
        data: {
          id: recordId,
          visitId: visit.id,
          subjective: seed.history,
          assessment: seed.diagnosis,
          doctorId: doctor.id,
          status: MedicalRecordStatus.DRAFT,
        },
      })

      await tx.diagnosis.createMany({
        data: [
          {
            medicalRecordId: record.id,
            code: seed.diagnosisCode,
            name: seed.diagnosis,
            type: DiagnosisType.PRIMARY,
            note: "Diagnosa utama saat asesmen.",
          },
          {
            medicalRecordId: record.id,
            code: seed.secondaryCode,
            name: seed.secondary,
            type: DiagnosisType.SECONDARY,
            note: "Diagnosa sekunder saat asesmen.",
          },
        ],
      })

      await tx.treatment.create({
        data: {
          medicalRecordId: record.id,
          code: seed.procedureCode,
          name: seed.procedure,
          performerId: doctor.id,
          note: "Tindakan tercatat pada asesmen awal.",
        },
      })
    })

    prepared += 1
    console.log(`Prepared assessment for ${patient.fullName} with ${doctor.username}.`)
  }

  console.log(`Prepared ${prepared} patients through assessment stage only.`)
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
