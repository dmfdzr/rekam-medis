"use server"

import { revalidatePath } from "next/cache"
import { DiagnosisType, DocumentType, Gender, MedicalRecordStatus, MedicineStatus, PrescriptionStatus, Prisma, UserRole, VisitStatus } from "@prisma/client"
import { z } from "zod"

import { writeAuditLog } from "@/lib/auth/audit-log"
import { getCurrentUser } from "@/lib/auth/current-user"
import { prisma } from "@/lib/prisma"

export type ClinicFormState = {
  ok?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const createPatientSchema = z.object({
  fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter."),
  nik: z.string().trim().optional(),
  birthDate: z.string().trim().min(1, "Tanggal lahir wajib diisi."),
  gender: z.enum(Gender, "Jenis kelamin wajib dipilih."),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  bloodType: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional(),
})

const createVisitSchema = z.object({
  patientId: z.string().trim().min(1, "Pasien wajib dipilih."),
  doctorId: z.string().trim().optional(),
  service: z.string().trim().min(2, "Layanan wajib diisi."),
  chiefComplaint: z.string().trim().min(3, "Keluhan utama minimal 3 karakter."),
})

const upsertVitalSignSchema = z.object({
  visitId: z.string().trim().min(1, "Kunjungan wajib dipilih."),
  bloodPressure: z.string().trim().optional(),
  temperature: z.string().trim().optional(),
  weight: z.string().trim().optional(),
  height: z.string().trim().optional(),
  pulse: z.string().trim().optional(),
  respiration: z.string().trim().optional(),
  oxygenSaturation: z.string().trim().optional(),
  nurseNote: z.string().trim().optional(),
})

const saveMedicalRecordSchema = z.object({
  visitId: z.string().trim().min(1, "Kunjungan wajib dipilih."),
  subjective: z.string().trim().optional(),
  objective: z.string().trim().optional(),
  assessment: z.string().trim().optional(),
  plan: z.string().trim().optional(),
  physicalExam: z.string().trim().optional(),
  doctorNote: z.string().trim().optional(),
  followUpDate: z.string().trim().optional(),
  diagnosisCode: z.string().trim().optional(),
  diagnosisName: z.string().trim().optional(),
  diagnosisNote: z.string().trim().optional(),
  treatmentCode: z.string().trim().optional(),
  treatmentName: z.string().trim().optional(),
  treatmentCost: z.string().trim().optional(),
  treatmentNote: z.string().trim().optional(),
  intent: z.enum(["draft", "final"]),
})

const addPrescriptionItemSchema = z.object({
  medicalRecordId: z.string().trim().min(1, "Rekam medis wajib dipilih."),
  medicineId: z.string().trim().min(1, "Obat wajib dipilih."),
  dosage: z.string().trim().min(1, "Dosis wajib diisi."),
  usageRule: z.string().trim().min(1, "Aturan pakai wajib diisi."),
  quantity: z.string().trim().min(1, "Jumlah wajib diisi."),
  note: z.string().trim().optional(),
})

const processPrescriptionSchema = z.object({
  prescriptionId: z.string().trim().min(1, "Resep wajib dipilih."),
})

const createMedicineSchema = z.object({
  code: z.string().trim().min(2, "Kode obat wajib diisi."),
  name: z.string().trim().min(2, "Nama obat wajib diisi."),
  category: z.string().trim().min(2, "Kategori wajib diisi."),
  unit: z.string().trim().min(1, "Satuan wajib diisi."),
  stock: z.string().trim().min(1, "Stok wajib diisi."),
  minimumStock: z.string().trim().min(1, "Stok minimum wajib diisi."),
  price: z.string().trim().optional(),
  expirationDate: z.string().trim().optional(),
})

const createMedicalDocumentSchema = z.object({
  patientId: z.string().trim().min(1, "Pasien wajib dipilih."),
  visitId: z.string().trim().optional(),
  type: z.enum(DocumentType, "Tipe dokumen wajib dipilih."),
  fileName: z.string().trim().min(2, "Nama file wajib diisi."),
  fileUrl: z.string().trim().min(2, "URL file wajib diisi."),
})

const patientMutationRoles = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGISTRATION])
const visitMutationRoles = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGISTRATION])
const vitalSignMutationRoles = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.NURSE])
const medicalRecordMutationRoles = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.DOCTOR])
const prescriptionMutationRoles = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.DOCTOR])
const pharmacyMutationRoles = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.PHARMACIST])
const medicineMutationRoles = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST])
const documentMutationRoles = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE])

function optionalString(value: string | undefined) {
  return value && value.length > 0 ? value : null
}

function toDate(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function optionalDecimal(value: string | undefined) {
  return value && value.length > 0 ? value : null
}

function optionalInt(value: string | undefined) {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)

  return Number.isNaN(parsed) ? null : parsed
}

function requiredPositiveInt(value: string) {
  const parsed = Number.parseInt(value, 10)

  return Number.isNaN(parsed) || parsed < 0 ? null : parsed
}

function getFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

async function generateMedicalRecordNumber() {
  const year = new Date().getFullYear()
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`)
  const nextYear = new Date(`${year + 1}-01-01T00:00:00.000Z`)
  const currentCount = await prisma.patient.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lt: nextYear,
      },
    },
  })

  return `RM-${year}-${String(currentCount + 1).padStart(5, "0")}`
}

export async function createPatientAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !patientMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk menambah pasien.",
    }
  }

  const parsed = createPatientSchema.safeParse({
    fullName: formData.get("fullName"),
    nik: formData.get("nik"),
    birthDate: formData.get("birthDate"),
    gender: formData.get("gender"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    bloodType: formData.get("bloodType"),
    allergies: formData.get("allergies"),
    emergencyContact: formData.get("emergencyContact"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data pasien belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const birthDate = toDate(parsed.data.birthDate)

  if (!birthDate) {
    return {
      ok: false,
      message: "Tanggal lahir tidak valid.",
      errors: { birthDate: ["Tanggal lahir tidak valid."] },
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const medicalRecordNumber = await generateMedicalRecordNumber()

    try {
      const patient = await prisma.patient.create({
        data: {
          medicalRecordNumber,
          nik: optionalString(parsed.data.nik),
          fullName: parsed.data.fullName,
          birthDate,
          gender: parsed.data.gender,
          address: optionalString(parsed.data.address),
          phone: optionalString(parsed.data.phone),
          bloodType: optionalString(parsed.data.bloodType),
          allergies: optionalString(parsed.data.allergies),
          emergencyContact: optionalString(parsed.data.emergencyContact),
        },
      })

      await writeAuditLog({
        userId: user.id,
        action: "CREATE_PATIENT",
        entityName: "Patient",
        entityId: patient.id,
        afterData: {
          medicalRecordNumber: patient.medicalRecordNumber,
          fullName: patient.fullName,
        },
      })

      revalidatePath("/")

      return {
        ok: true,
        message: `Pasien ${patient.fullName} berhasil dibuat dengan No. RM ${patient.medicalRecordNumber}.`,
      }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue
      }

      return {
        ok: false,
        message: "Pasien gagal dibuat. Periksa NIK atau nomor rekam medis yang mungkin sudah terdaftar.",
      }
    }
  }

  return {
    ok: false,
    message: "Nomor rekam medis gagal dibuat. Coba ulangi beberapa saat lagi.",
  }
}

export async function createVisitAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !visitMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk membuat kunjungan.",
    }
  }

  const parsed = createVisitSchema.safeParse({
    patientId: formData.get("patientId"),
    doctorId: formData.get("doctorId"),
    service: formData.get("service"),
    chiefComplaint: formData.get("chiefComplaint"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data kunjungan belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const patient = await prisma.patient.findUnique({
    where: { id: parsed.data.patientId },
    select: { id: true, fullName: true },
  })

  if (!patient) {
    return {
      ok: false,
      message: "Pasien tidak ditemukan.",
      errors: { patientId: ["Pasien tidak ditemukan."] },
    }
  }

  const visit = await prisma.visit.create({
    data: {
      patientId: parsed.data.patientId,
      doctorId: optionalString(parsed.data.doctorId),
      service: parsed.data.service,
      chiefComplaint: parsed.data.chiefComplaint,
      status: VisitStatus.WAITING,
      createdById: user.id,
    },
  })

  await writeAuditLog({
    userId: user.id,
    action: "CREATE_VISIT",
    entityName: "Visit",
    entityId: visit.id,
    afterData: {
      patientId: patient.id,
      patientName: patient.fullName,
      service: visit.service,
      status: visit.status,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Kunjungan untuk ${patient.fullName} berhasil dibuat.`,
  }
}

export async function upsertVitalSignAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !vitalSignMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk menyimpan tanda vital.",
    }
  }

  const parsed = upsertVitalSignSchema.safeParse({
    visitId: formData.get("visitId"),
    bloodPressure: formData.get("bloodPressure"),
    temperature: formData.get("temperature"),
    weight: formData.get("weight"),
    height: formData.get("height"),
    pulse: formData.get("pulse"),
    respiration: formData.get("respiration"),
    oxygenSaturation: formData.get("oxygenSaturation"),
    nurseNote: formData.get("nurseNote"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data tanda vital belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const visit = await prisma.visit.findUnique({
    where: { id: parsed.data.visitId },
    select: {
      id: true,
      patient: {
        select: {
          fullName: true,
        },
      },
    },
  })

  if (!visit) {
    return {
      ok: false,
      message: "Kunjungan tidak ditemukan.",
      errors: { visitId: ["Kunjungan tidak ditemukan."] },
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.vitalSign.upsert({
      where: { visitId: parsed.data.visitId },
      update: {
        bloodPressure: optionalString(parsed.data.bloodPressure),
        temperature: optionalDecimal(parsed.data.temperature),
        weight: optionalDecimal(parsed.data.weight),
        height: optionalDecimal(parsed.data.height),
        pulse: optionalInt(parsed.data.pulse),
        respiration: optionalInt(parsed.data.respiration),
        oxygenSaturation: optionalInt(parsed.data.oxygenSaturation),
        nurseNote: optionalString(parsed.data.nurseNote),
      },
      create: {
        visitId: parsed.data.visitId,
        bloodPressure: optionalString(parsed.data.bloodPressure),
        temperature: optionalDecimal(parsed.data.temperature),
        weight: optionalDecimal(parsed.data.weight),
        height: optionalDecimal(parsed.data.height),
        pulse: optionalInt(parsed.data.pulse),
        respiration: optionalInt(parsed.data.respiration),
        oxygenSaturation: optionalInt(parsed.data.oxygenSaturation),
        nurseNote: optionalString(parsed.data.nurseNote),
      },
    })

    await tx.visit.update({
      where: { id: parsed.data.visitId },
      data: { status: VisitStatus.EXAMINATION },
    })
  })

  await writeAuditLog({
    userId: user.id,
    action: "UPSERT_VITAL_SIGN",
    entityName: "Visit",
    entityId: visit.id,
    afterData: {
      patientName: visit.patient.fullName,
      bloodPressure: parsed.data.bloodPressure,
      temperature: parsed.data.temperature,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Tanda vital ${visit.patient.fullName} berhasil disimpan.`,
  }
}

export async function saveMedicalRecordAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !medicalRecordMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk menyimpan rekam medis.",
    }
  }

  const parsed = saveMedicalRecordSchema.safeParse({
    visitId: formData.get("visitId"),
    subjective: formData.get("subjective"),
    objective: formData.get("objective"),
    assessment: formData.get("assessment"),
    plan: formData.get("plan"),
    physicalExam: formData.get("physicalExam"),
    doctorNote: formData.get("doctorNote"),
    followUpDate: formData.get("followUpDate"),
    diagnosisCode: formData.get("diagnosisCode"),
    diagnosisName: formData.get("diagnosisName"),
    diagnosisNote: formData.get("diagnosisNote"),
    treatmentCode: formData.get("treatmentCode"),
    treatmentName: formData.get("treatmentName"),
    treatmentCost: formData.get("treatmentCost"),
    treatmentNote: formData.get("treatmentNote"),
    intent: formData.get("intent"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data rekam medis belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  if (parsed.data.intent === "final" && !parsed.data.diagnosisName) {
    return {
      ok: false,
      message: "Rekam medis final wajib memiliki minimal satu diagnosa utama.",
      errors: { diagnosisName: ["Diagnosa utama wajib diisi sebelum finalisasi."] },
    }
  }

  const followUpDate = parsed.data.followUpDate ? toDate(parsed.data.followUpDate) : null

  const visit = await prisma.visit.findUnique({
    where: { id: parsed.data.visitId },
    select: {
      id: true,
      patient: {
        select: {
          fullName: true,
        },
      },
    },
  })

  if (!visit) {
    return {
      ok: false,
      message: "Kunjungan tidak ditemukan.",
      errors: { visitId: ["Kunjungan tidak ditemukan."] },
    }
  }

  const isFinal = parsed.data.intent === "final"

  await prisma.$transaction(async (tx) => {
    const medicalRecord = await tx.medicalRecord.upsert({
      where: { visitId: parsed.data.visitId },
      update: {
        subjective: optionalString(parsed.data.subjective),
        objective: optionalString(parsed.data.objective),
        assessment: optionalString(parsed.data.assessment),
        plan: optionalString(parsed.data.plan),
        physicalExam: optionalString(parsed.data.physicalExam),
        doctorNote: optionalString(parsed.data.doctorNote),
        followUpDate,
        status: isFinal ? MedicalRecordStatus.FINAL : MedicalRecordStatus.DRAFT,
        finalizedAt: isFinal ? new Date() : null,
        doctorId: user.id,
      },
      create: {
        visitId: parsed.data.visitId,
        subjective: optionalString(parsed.data.subjective),
        objective: optionalString(parsed.data.objective),
        assessment: optionalString(parsed.data.assessment),
        plan: optionalString(parsed.data.plan),
        physicalExam: optionalString(parsed.data.physicalExam),
        doctorNote: optionalString(parsed.data.doctorNote),
        followUpDate,
        status: isFinal ? MedicalRecordStatus.FINAL : MedicalRecordStatus.DRAFT,
        finalizedAt: isFinal ? new Date() : null,
        doctorId: user.id,
      },
    })

    if (parsed.data.diagnosisName) {
      await tx.diagnosis.deleteMany({
        where: {
          medicalRecordId: medicalRecord.id,
          type: DiagnosisType.PRIMARY,
        },
      })

      await tx.diagnosis.create({
        data: {
          medicalRecordId: medicalRecord.id,
          code: optionalString(parsed.data.diagnosisCode),
          name: parsed.data.diagnosisName,
          type: DiagnosisType.PRIMARY,
          note: optionalString(parsed.data.diagnosisNote),
        },
      })
    }

    if (parsed.data.treatmentName) {
      await tx.treatment.create({
        data: {
          medicalRecordId: medicalRecord.id,
          code: optionalString(parsed.data.treatmentCode),
          name: parsed.data.treatmentName,
          cost: optionalDecimal(parsed.data.treatmentCost),
          note: optionalString(parsed.data.treatmentNote),
          performerId: user.id,
        },
      })
    }

    if (isFinal) {
      await tx.visit.update({
        where: { id: parsed.data.visitId },
        data: { status: VisitStatus.PHARMACY },
      })
    }
  })

  await writeAuditLog({
    userId: user.id,
    action: isFinal ? "FINALIZE_MEDICAL_RECORD" : "SAVE_MEDICAL_RECORD_DRAFT",
    entityName: "Visit",
    entityId: visit.id,
    afterData: {
      patientName: visit.patient.fullName,
      diagnosisName: parsed.data.diagnosisName,
      status: isFinal ? "FINAL" : "DRAFT",
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: isFinal ? `Rekam medis ${visit.patient.fullName} berhasil difinalisasi.` : `Draft rekam medis ${visit.patient.fullName} berhasil disimpan.`,
  }
}

export async function addPrescriptionItemAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !prescriptionMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk membuat resep.",
    }
  }

  const parsed = addPrescriptionItemSchema.safeParse({
    medicalRecordId: formData.get("medicalRecordId"),
    medicineId: formData.get("medicineId"),
    dosage: formData.get("dosage"),
    usageRule: formData.get("usageRule"),
    quantity: formData.get("quantity"),
    note: formData.get("note"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data resep belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const quantity = requiredPositiveInt(parsed.data.quantity)

  if (!quantity || quantity < 1) {
    return {
      ok: false,
      message: "Jumlah obat harus lebih dari 0.",
      errors: { quantity: ["Jumlah obat harus lebih dari 0."] },
    }
  }

  const record = await prisma.medicalRecord.findUnique({
    where: { id: parsed.data.medicalRecordId },
    include: {
      visit: {
        include: {
          patient: {
            select: { fullName: true },
          },
        },
      },
    },
  })

  if (!record) {
    return {
      ok: false,
      message: "Rekam medis tidak ditemukan.",
      errors: { medicalRecordId: ["Rekam medis tidak ditemukan."] },
    }
  }

  const medicine = await prisma.medicine.findUnique({
    where: { id: parsed.data.medicineId },
    select: { id: true, name: true },
  })

  if (!medicine) {
    return {
      ok: false,
      message: "Obat tidak ditemukan.",
      errors: { medicineId: ["Obat tidak ditemukan."] },
    }
  }

  const prescription = await prisma.prescription.upsert({
    where: { medicalRecordId: record.id },
    update: {
      status: PrescriptionStatus.PENDING,
      doctorId: user.id,
    },
    create: {
      medicalRecordId: record.id,
      status: PrescriptionStatus.PENDING,
      doctorId: user.id,
    },
  })

  await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescription.id,
      medicineId: medicine.id,
      dosage: parsed.data.dosage,
      usageRule: parsed.data.usageRule,
      quantity,
      note: optionalString(parsed.data.note),
    },
  })

  await writeAuditLog({
    userId: user.id,
    action: "ADD_PRESCRIPTION_ITEM",
    entityName: "Prescription",
    entityId: prescription.id,
    afterData: {
      patientName: record.visit.patient.fullName,
      medicineName: medicine.name,
      quantity,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Resep ${medicine.name} untuk ${record.visit.patient.fullName} berhasil dibuat.`,
  }
}

export async function processPrescriptionAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !pharmacyMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk memproses resep.",
    }
  }

  const parsed = processPrescriptionSchema.safeParse({
    prescriptionId: formData.get("prescriptionId"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Resep belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.findUnique({
      where: { id: parsed.data.prescriptionId },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
        medicalRecord: {
          include: {
            visit: {
              include: {
                patient: { select: { fullName: true } },
              },
            },
          },
        },
      },
    })

    if (!prescription) {
      return { ok: false as const, message: "Resep tidak ditemukan." }
    }

    if (prescription.items.length === 0) {
      return { ok: false as const, message: "Resep belum memiliki item obat." }
    }

    const insufficient = prescription.items.find((item) => item.medicine.stock < item.quantity)

    if (insufficient) {
      await tx.prescription.update({
        where: { id: prescription.id },
        data: { status: PrescriptionStatus.VALIDATING_STOCK },
      })

      return {
        ok: false as const,
        message: `Stok ${insufficient.medicine.name} tidak cukup. Tersedia ${insufficient.medicine.stock}, dibutuhkan ${insufficient.quantity}.`,
      }
    }

    for (const item of prescription.items) {
      const nextStock = item.medicine.stock - item.quantity

      await tx.medicine.update({
        where: { id: item.medicineId },
        data: {
          stock: nextStock,
          status: nextStock <= item.medicine.minimumStock ? MedicineStatus.LOW_STOCK : MedicineStatus.ACTIVE,
        },
      })
    }

    await tx.prescription.update({
      where: { id: prescription.id },
      data: {
        status: PrescriptionStatus.PROCESSED,
        pharmacistId: user.id,
        processedAt: new Date(),
      },
    })

    await tx.visit.update({
      where: { id: prescription.medicalRecord.visitId },
      data: { status: VisitStatus.COMPLETED },
    })

    return {
      ok: true as const,
      prescriptionId: prescription.id,
      patientName: prescription.medicalRecord.visit.patient.fullName,
    }
  })

  if (!result.ok) {
    revalidatePath("/")

    return {
      ok: false,
      message: result.message,
    }
  }

  await writeAuditLog({
    userId: user.id,
    action: "PROCESS_PRESCRIPTION",
    entityName: "Prescription",
    entityId: result.prescriptionId,
    afterData: {
      patientName: result.patientName,
      status: "PROCESSED",
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Resep ${result.patientName} berhasil diproses dan stok obat diperbarui.`,
  }
}

export async function createMedicineAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !medicineMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk menambah obat.",
    }
  }

  const parsed = createMedicineSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    category: formData.get("category"),
    unit: formData.get("unit"),
    stock: formData.get("stock"),
    minimumStock: formData.get("minimumStock"),
    price: formData.get("price"),
    expirationDate: formData.get("expirationDate"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data obat belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const stock = requiredPositiveInt(parsed.data.stock)
  const minimumStock = requiredPositiveInt(parsed.data.minimumStock)

  if (stock === null || minimumStock === null) {
    return {
      ok: false,
      message: "Stok dan stok minimum harus berupa angka.",
    }
  }

  try {
    const medicine = await prisma.medicine.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        category: parsed.data.category,
        unit: parsed.data.unit,
        stock,
        minimumStock,
        price: optionalDecimal(parsed.data.price),
        expirationDate: parsed.data.expirationDate ? toDate(parsed.data.expirationDate) : null,
        status: stock <= minimumStock ? MedicineStatus.LOW_STOCK : MedicineStatus.ACTIVE,
      },
    })

    await writeAuditLog({
      userId: user.id,
      action: "CREATE_MEDICINE",
      entityName: "Medicine",
      entityId: medicine.id,
      afterData: {
        code: medicine.code,
        name: medicine.name,
        stock: medicine.stock,
      },
    })

    revalidatePath("/")

    return {
      ok: true,
      message: `Obat ${medicine.name} berhasil ditambahkan.`,
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Kode obat sudah terdaftar.",
        errors: { code: ["Kode obat sudah terdaftar."] },
      }
    }

    return {
      ok: false,
      message: "Obat gagal ditambahkan.",
    }
  }
}

export async function createMedicalDocumentAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !documentMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk menambahkan dokumen medis.",
    }
  }

  const parsed = createMedicalDocumentSchema.safeParse({
    patientId: formData.get("patientId"),
    visitId: formData.get("visitId"),
    type: formData.get("type"),
    fileName: formData.get("fileName"),
    fileUrl: formData.get("fileUrl"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data dokumen belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const patient = await prisma.patient.findUnique({
    where: { id: parsed.data.patientId },
    select: { id: true, fullName: true },
  })

  if (!patient) {
    return {
      ok: false,
      message: "Pasien tidak ditemukan.",
      errors: { patientId: ["Pasien tidak ditemukan."] },
    }
  }

  const document = await prisma.medicalDocument.create({
    data: {
      patientId: parsed.data.patientId,
      visitId: optionalString(parsed.data.visitId),
      type: parsed.data.type,
      fileName: parsed.data.fileName,
      fileUrl: parsed.data.fileUrl,
      uploadedById: user.id,
    },
  })

  await writeAuditLog({
    userId: user.id,
    action: "CREATE_MEDICAL_DOCUMENT",
    entityName: "MedicalDocument",
    entityId: document.id,
    afterData: {
      patientName: patient.fullName,
      type: document.type,
      fileName: document.fileName,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Dokumen ${document.fileName} untuk ${patient.fullName} berhasil disimpan.`,
  }
}
