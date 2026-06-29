import bcrypt from "bcryptjs"
import {
  DiagnosisType,
  DocumentType,
  Gender,
  MedicalRecordStatus,
  MedicineStatus,
  PatientStatus,
  PrescriptionStatus,
  PrismaClient,
  UserRole,
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

const roles = [
  {
    key: UserRole.MASTER,
    name: "Master",
    description: "Akses penuh seluruh fitur aplikasi.",
  },
  {
    key: UserRole.ADMIN,
    name: "Admin Pendaftaran",
    description: "Mengelola data pasien dan kunjungan.",
  },
  {
    key: UserRole.DOCTOR,
    name: "Dokter",
    description: "Mengelola alur klinis selain pendaftaran, manajemen user, dan audit log.",
  },
]

const users = [
  {
    name: "Master User",
    email: "master@medrecord.local",
    username: "master",
    role: UserRole.MASTER,
    password: "master123",
  },
  {
    name: "Admin Pendaftaran",
    email: "admin@medrecord.local",
    username: "admin",
    role: UserRole.ADMIN,
    password: "admin123",
  },
  {
    name: "dr. Raka Mahendra",
    email: "dokter@medrecord.local",
    username: "dokter",
    role: UserRole.DOCTOR,
    password: "dokter123",
  },
]

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description,
      },
      create: role,
    })
  }

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12)
    const role = await prisma.role.findUniqueOrThrow({
      where: { key: user.role },
      select: { id: true },
    })

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        username: user.username,
        roleId: role.id,
        passwordHash,
      },
      create: {
        name: user.name,
        email: user.email,
        username: user.username,
        passwordHash,
        roleId: role.id,
      },
    })
  }

  await prisma.user.deleteMany({
    where: {
      username: {
        notIn: users.map((user) => user.username),
      },
    },
  })

  await prisma.role.deleteMany({
    where: {
      key: {
        notIn: roles.map((role) => role.key),
      },
    },
  })

  const master = await prisma.user.findUniqueOrThrow({
    where: { email: "master@medrecord.local" },
    select: { id: true },
  })
  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@medrecord.local" },
    select: { id: true },
  })
  const doctor = await prisma.user.findUniqueOrThrow({
    where: { email: "dokter@medrecord.local" },
    select: { id: true },
  })

  const patient = await prisma.patient.upsert({
    where: { medicalRecordNumber: "26-00-41" },
    update: {
      fullName: "Siti Aminah",
      phone: "0812-4432-1180",
      allergies: "Amoxicillin",
      status: PatientStatus.ACTIVE,
    },
    create: {
      medicalRecordNumber: "26-00-41",
      nik: "3273010101900001",
      fullName: "Siti Aminah",
      birthDate: new Date("1990-01-01"),
      gender: Gender.FEMALE,
      address: "Jl. Melati No. 12, Bandung",
      phone: "0812-4432-1180",
      bloodType: "O",
      allergies: "Amoxicillin",
      status: PatientStatus.ACTIVE,
    },
  })

  await prisma.patient.upsert({
    where: { medicalRecordNumber: "26-00-42" },
    update: {
      fullName: "Bima Pratama",
      phone: "0821-7789-1044",
      status: PatientStatus.ACTIVE,
    },
    create: {
      medicalRecordNumber: "26-00-42",
      nik: "3273011205170032",
      fullName: "Bima Pratama",
      birthDate: new Date("2017-05-12"),
      gender: Gender.MALE,
      address: "Jl. Anggrek No. 5, Bandung",
      phone: "0821-7789-1044",
      allergies: "Tidak ada",
      status: PatientStatus.ACTIVE,
    },
  })

  const visit = await prisma.visit.upsert({
    where: { id: "visit-initial-001" },
    update: {
      patientId: patient.id,
      doctorId: doctor.id,
      status: VisitStatus.EXAMINATION,
    },
    create: {
      id: "visit-initial-001",
      patientId: patient.id,
      doctorId: doctor.id,
      visitDate: new Date("2026-06-14T09:15:00+07:00"),
      admissionDate: new Date("2026-06-14T09:15:00+07:00"),
      patientType: "UMUM",
      service: "Poli Umum",
      chiefComplaint: "Demam, nyeri tenggorokan, batuk kering",
      status: VisitStatus.EXAMINATION,
      createdById: admin.id,
    },
  })

  await prisma.vitalSign.upsert({
    where: { visitId: visit.id },
    update: {
      bloodPressure: "128/82",
      temperature: "37.8",
      weight: "58.20",
      height: "157.00",
      pulse: 92,
      respiration: 20,
      oxygenSaturation: 98,
      nurseNote: "Pasien tampak compos mentis, keluhan demam sejak 2 hari.",
    },
    create: {
      visitId: visit.id,
      bloodPressure: "128/82",
      temperature: "37.8",
      weight: "58.20",
      height: "157.00",
      pulse: 92,
      respiration: 20,
      oxygenSaturation: 98,
      nurseNote: "Pasien tampak compos mentis, keluhan demam sejak 2 hari.",
    },
  })

  const medicalRecord = await prisma.medicalRecord.upsert({
    where: { visitId: visit.id },
    update: {
      subjective: "Demam sejak dua hari, nyeri tenggorokan, batuk kering.",
      objective: "Faring hiperemis, tidak ada sesak, tanda vital relatif stabil.",
      assessment: "ISPA akut.",
      plan: "Terapi simptomatik, edukasi hidrasi, kontrol bila memburuk.",
      status: MedicalRecordStatus.DRAFT,
      doctorId: doctor.id,
    },
    create: {
      visitId: visit.id,
      subjective: "Demam sejak dua hari, nyeri tenggorokan, batuk kering.",
      objective: "Faring hiperemis, tidak ada sesak, tanda vital relatif stabil.",
      assessment: "ISPA akut.",
      plan: "Terapi simptomatik, edukasi hidrasi, kontrol bila memburuk.",
      physicalExam: "Tenggorokan hiperemis, paru vesikuler, abdomen supel.",
      doctorNote: "Tidak ada tanda kegawatan saat pemeriksaan.",
      status: MedicalRecordStatus.DRAFT,
      doctorId: doctor.id,
    },
  })

  await prisma.diagnosis.upsert({
    where: { id: "diagnosis-initial-001" },
    update: {
      medicalRecordId: medicalRecord.id,
      code: "J06.9",
      name: "Infeksi saluran pernapasan akut",
      type: DiagnosisType.PRIMARY,
    },
    create: {
      id: "diagnosis-initial-001",
      medicalRecordId: medicalRecord.id,
      code: "J06.9",
      name: "Infeksi saluran pernapasan akut",
      type: DiagnosisType.PRIMARY,
      note: "Diagnosis utama berdasarkan gejala dan pemeriksaan fisik.",
    },
  })

  await prisma.treatment.upsert({
    where: { id: "treatment-initial-001" },
    update: {
      medicalRecordId: medicalRecord.id,
      performerId: doctor.id,
      cost: "75000",
    },
    create: {
      id: "treatment-initial-001",
      medicalRecordId: medicalRecord.id,
      code: "CONS-GP",
      name: "Konsultasi dokter umum",
      cost: "75000",
      note: "Pemeriksaan umum dan edukasi pasien.",
      performerId: doctor.id,
    },
  })

  const paracetamol = await prisma.medicine.upsert({
    where: { code: "MED-001" },
    update: {
      name: "Paracetamol 500mg",
      stock: 240,
      minimumStock: 80,
      status: MedicineStatus.ACTIVE,
    },
    create: {
      code: "MED-001",
      name: "Paracetamol 500mg",
      category: "Analgesik",
      unit: "tablet",
      stock: 240,
      minimumStock: 80,
      price: "1500",
      expirationDate: new Date("2027-02-12"),
      status: MedicineStatus.ACTIVE,
    },
  })

  const cetirizine = await prisma.medicine.upsert({
    where: { code: "MED-014" },
    update: {
      name: "Cetirizine 10mg",
      stock: 74,
      minimumStock: 60,
      status: MedicineStatus.ACTIVE,
    },
    create: {
      code: "MED-014",
      name: "Cetirizine 10mg",
      category: "Antihistamin",
      unit: "tablet",
      stock: 74,
      minimumStock: 60,
      price: "2200",
      expirationDate: new Date("2026-12-18"),
      status: MedicineStatus.ACTIVE,
    },
  })

  await prisma.medicine.upsert({
    where: { code: "MED-021" },
    update: {
      stock: 18,
      minimumStock: 30,
      status: MedicineStatus.LOW_STOCK,
    },
    create: {
      code: "MED-021",
      name: "Zinc syrup",
      category: "Suplemen",
      unit: "botol",
      stock: 18,
      minimumStock: 30,
      price: "28000",
      expirationDate: new Date("2026-09-04"),
      status: MedicineStatus.LOW_STOCK,
    },
  })

  const prescription = await prisma.prescription.upsert({
    where: { medicalRecordId: medicalRecord.id },
    update: {
      status: PrescriptionStatus.PENDING,
      doctorId: doctor.id,
      pharmacistId: doctor.id,
    },
    create: {
      medicalRecordId: medicalRecord.id,
      status: PrescriptionStatus.PENDING,
      doctorId: doctor.id,
      pharmacistId: doctor.id,
    },
  })

  await prisma.prescriptionItem.upsert({
    where: { id: "prescription-item-initial-001" },
    update: {
      prescriptionId: prescription.id,
      medicineId: paracetamol.id,
      quantity: 10,
    },
    create: {
      id: "prescription-item-initial-001",
      prescriptionId: prescription.id,
      medicineId: paracetamol.id,
      dosage: "500mg",
      usageRule: "3x sehari setelah makan bila demam",
      quantity: 10,
      note: "Maksimal 4 gram per hari.",
    },
  })

  await prisma.prescriptionItem.upsert({
    where: { id: "prescription-item-initial-002" },
    update: {
      prescriptionId: prescription.id,
      medicineId: cetirizine.id,
      quantity: 5,
    },
    create: {
      id: "prescription-item-initial-002",
      prescriptionId: prescription.id,
      medicineId: cetirizine.id,
      dosage: "10mg",
      usageRule: "1x sehari malam hari",
      quantity: 5,
      note: "Hentikan bila mengantuk berat.",
    },
  })

  await prisma.medicalDocument.upsert({
    where: { id: "document-initial-001" },
    update: {
      patientId: patient.id,
      visitId: visit.id,
      uploadedById: doctor.id,
    },
    create: {
      id: "document-initial-001",
      patientId: patient.id,
      visitId: visit.id,
      type: DocumentType.SUPPORTING_DOCUMENT,
      fileName: "Ringkasan pemeriksaan awal Siti Aminah",
      fileUrl: "generated:medical-document",
      uploadedById: doctor.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: master.id,
      action: "SEED_INITIAL_DATA",
      entityName: "Database",
      afterData: {
        patients: 2,
        visits: 1,
        medicalRecords: 1,
        medicines: 3,
      },
    },
  })
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
