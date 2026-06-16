"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { writeAuditLog } from "@/lib/auth/audit-log"
import { getCurrentUser } from "@/lib/auth/current-user"
import { hashPassword } from "@/lib/auth/password"
import {
  isBloodPressureInputValid,
  isOptionalDecimalInputValid,
  isOptionalDigitsOnlyValid,
  isOptionalIntegerInputValid,
  isOptionalLettersOnlyValid,
  isOptionalNikValid,
  parseNonNegativeIntegerInput,
  parseOptionalDecimalInput,
  parseOptionalIntegerInput,
} from "@/lib/clinical-validation"
import { prisma } from "@/lib/prisma"

const UserRole = {
  ADMIN: "ADMIN",
  REGISTRATION: "REGISTRATION",
  DOCTOR: "DOCTOR",
  NURSE: "NURSE",
  PHARMACIST: "PHARMACIST",
} as const

type UserRole = (typeof UserRole)[keyof typeof UserRole]

const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const

const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const

const PatientStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  DECEASED: "DECEASED",
} as const

const VisitStatus = {
  WAITING: "WAITING",
  VITAL_SIGN: "VITAL_SIGN",
  EXAMINATION: "EXAMINATION",
  PHARMACY: "PHARMACY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const

const MedicalRecordStatus = {
  DRAFT: "DRAFT",
  FINAL: "FINAL",
} as const

const DiagnosisType = {
  PRIMARY: "PRIMARY",
  SECONDARY: "SECONDARY",
} as const

const PrescriptionStatus = {
  PENDING: "PENDING",
  VALIDATING_STOCK: "VALIDATING_STOCK",
  PROCESSED: "PROCESSED",
  CANCELLED: "CANCELLED",
} as const

const MedicineStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  LOW_STOCK: "LOW_STOCK",
  EXPIRED: "EXPIRED",
} as const

type MedicineStatus = (typeof MedicineStatus)[keyof typeof MedicineStatus]

const DocumentType = {
  LAB_RESULT: "LAB_RESULT",
  REFERRAL_LETTER: "REFERRAL_LETTER",
  CONTROL_LETTER: "CONTROL_LETTER",
  EXAMINATION_PHOTO: "EXAMINATION_PHOTO",
  SUPPORTING_DOCUMENT: "SUPPORTING_DOCUMENT",
  OTHER: "OTHER",
} as const

export type ClinicFormState = {
  ok?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const createPatientSchema = z.object({
  fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter."),
  nik: z
    .string()
    .trim()
    .refine(isOptionalNikValid, "NIK harus tepat 16 digit angka.")
    .optional(),
  birthDate: z.string().trim().min(1, "Tanggal lahir wajib diisi."),
  gender: z.enum(Gender, "Jenis kelamin wajib dipilih."),
  phone: z.string().trim().refine(isOptionalDigitsOnlyValid, "Nomor telepon hanya boleh berisi angka.").optional(),
  address: z.string().trim().optional(),
  bloodType: z.string().trim().refine(isOptionalLettersOnlyValid, "Golongan darah hanya boleh berisi huruf.").optional(),
  allergies: z.string().trim().optional(),
  emergencyContact: z.string().trim().refine(isOptionalDigitsOnlyValid, "Kontak darurat hanya boleh berisi angka.").optional(),
})

const updatePatientSchema = z.object({
  patientId: z.string().trim().min(1, "Pasien wajib dipilih."),
  fullName: z.string().trim().optional(),
  phone: z.string().trim().refine(isOptionalDigitsOnlyValid, "Nomor telepon hanya boleh berisi angka.").optional(),
  address: z.string().trim().optional(),
  bloodType: z.string().trim().refine(isOptionalLettersOnlyValid, "Golongan darah hanya boleh berisi huruf.").optional(),
  allergies: z.string().trim().optional(),
  emergencyContact: z.string().trim().refine(isOptionalDigitsOnlyValid, "Kontak darurat hanya boleh berisi angka.").optional(),
  status: z.enum(PatientStatus, "Status pasien wajib dipilih.").optional().or(z.literal("")),
})

const deactivatePatientSchema = z.object({
  patientId: z.string().trim().min(1, "Pasien wajib dipilih."),
})

const createVisitSchema = z.object({
  patientId: z.string().trim().min(1, "Pasien wajib dipilih."),
  doctorId: z.string().trim().optional(),
  service: z.string().trim().min(2, "Layanan wajib diisi."),
  chiefComplaint: z.string().trim().min(3, "Keluhan utama minimal 3 karakter."),
})

const updateVisitStatusSchema = z.object({
  visitId: z.string().trim().min(1, "Kunjungan wajib dipilih."),
  status: z.enum(VisitStatus, "Status kunjungan wajib dipilih."),
})

const cancelVisitSchema = z.object({
  visitId: z.string().trim().min(1, "Kunjungan wajib dipilih."),
})

const optionalDecimalSchema = (message: string) =>
  z
    .string()
    .trim()
    .refine(isOptionalDecimalInputValid, message)
    .optional()

const optionalIntegerSchema = (message: string) =>
  z
    .string()
    .trim()
    .refine(isOptionalIntegerInputValid, message)
    .optional()

const upsertVitalSignSchema = z.object({
  visitId: z.string().trim().min(1, "Kunjungan wajib dipilih."),
  bloodPressure: z
    .string()
    .trim()
    .refine(isBloodPressureInputValid, "Tekanan darah harus berupa angka dengan format 120/80.")
    .optional(),
  temperature: optionalDecimalSchema("Suhu tubuh harus berupa angka."),
  weight: optionalDecimalSchema("Berat badan harus berupa angka."),
  height: optionalDecimalSchema("Tinggi badan harus berupa angka."),
  pulse: optionalIntegerSchema("Nadi harus berupa angka."),
  respiration: optionalIntegerSchema("Respirasi harus berupa angka."),
  oxygenSaturation: optionalIntegerSchema("Saturasi oksigen harus berupa angka."),
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
  medicineId: z.string().trim().optional(),
  medicineQuery: z.string().trim().optional(),
  dosage: z.string().trim().min(1, "Dosis wajib diisi."),
  usageRule: z.string().trim().min(1, "Aturan pakai wajib diisi."),
  quantity: z.string().trim().min(1, "Jumlah wajib diisi."),
  note: z.string().trim().optional(),
})

const processPrescriptionSchema = z.object({
  prescriptionId: z.string().trim().min(1, "Resep wajib dipilih."),
})

const cancelPrescriptionSchema = z.object({
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

const updateMedicineSchema = z.object({
  medicineId: z.string().trim().min(1, "Obat wajib dipilih."),
  name: z.string().trim().optional(),
  category: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  stock: z.string().trim().optional(),
  minimumStock: z.string().trim().optional(),
  price: z.string().trim().optional(),
  expirationDate: z.string().trim().optional(),
  status: z.enum(MedicineStatus, "Status obat wajib dipilih.").optional().or(z.literal("")),
})

const deactivateMedicineSchema = z.object({
  medicineId: z.string().trim().min(1, "Obat wajib dipilih."),
})

const createMedicalDocumentSchema = z.object({
  patientId: z.string().trim().min(1, "Pasien wajib dipilih."),
  visitId: z.string().trim().optional(),
  type: z.enum(DocumentType, "Tipe dokumen wajib dipilih."),
})

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nama user minimal 2 karakter."),
  email: z.email("Email tidak valid.").trim().toLowerCase(),
  username: z.string().trim().min(3, "Username minimal 3 karakter.").toLowerCase(),
  password: z.string().min(8, "Password minimal 8 karakter."),
  roleId: z.string().trim().min(1, "Role wajib dipilih."),
})

const updateUserSchema = z.object({
  userId: z.string().trim().min(1, "User wajib dipilih."),
  name: z.string().trim().optional(),
  email: z.string().trim().optional(),
  username: z.string().trim().optional(),
  password: z.string().optional(),
  roleId: z.string().trim().optional(),
  status: z.enum(UserStatus, "Status user wajib dipilih.").optional().or(z.literal("")),
})

const deactivateUserSchema = z.object({
  userId: z.string().trim().min(1, "User wajib dipilih."),
})

const patientMutationRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.REGISTRATION])
const visitMutationRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.REGISTRATION])
const vitalSignMutationRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.NURSE])
const medicalRecordMutationRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.DOCTOR])
const prescriptionMutationRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.DOCTOR])
const pharmacyMutationRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.PHARMACIST])
const prescriptionCancelRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST])
const medicineMutationRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.PHARMACIST])
const documentMutationRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE])
const userMutationRoles = new Set<UserRole>([UserRole.ADMIN])

function optionalString(value: string | undefined) {
  return value && value.length > 0 ? value : null
}

const maxMedicalDocumentSize = 2 * 1024 * 1024
const allowedMedicalDocumentTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"])

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120)
}

function toDate(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function startOfToday() {
  const now = new Date()

  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function isExpiredDate(date: Date | null) {
  return Boolean(date && date < startOfToday())
}

function deriveMedicineStatus({
  stock,
  minimumStock,
  expirationDate,
  explicitStatus,
}: {
  stock: number
  minimumStock: number
  expirationDate: Date | null
  explicitStatus?: MedicineStatus | null
}) {
  if (explicitStatus === MedicineStatus.INACTIVE) {
    return MedicineStatus.INACTIVE
  }

  if (explicitStatus === MedicineStatus.EXPIRED || isExpiredDate(expirationDate)) {
    return MedicineStatus.EXPIRED
  }

  if (stock <= minimumStock) {
    return MedicineStatus.LOW_STOCK
  }

  return MedicineStatus.ACTIVE
}

function isInvalidOptionalDecimal(value: string | undefined) {
  return Boolean(value) && parseOptionalDecimalInput(value) === null
}

function getFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

function uniqueConstraintTargets(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return []
  }

  return Array.isArray(error.meta?.target) ? error.meta.target.map(String) : []
}

async function generateMedicalRecordNumber() {
  const year = new Date().getFullYear()
  const prefix = `RM-${year}-`
  const latestPatient = await prisma.patient.findFirst({
    where: {
      medicalRecordNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      medicalRecordNumber: "desc",
    },
    select: {
      medicalRecordNumber: true,
    },
  })
  const latestSequence = latestPatient?.medicalRecordNumber.split("-").at(-1)
  const nextSequence = latestSequence ? Number.parseInt(latestSequence, 10) + 1 : 1

  return `${prefix}${String(Number.isNaN(nextSequence) ? 1 : nextSequence).padStart(5, "0")}`
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
        const targets = uniqueConstraintTargets(error)

        if (targets.includes("nik")) {
          return {
            ok: false,
            message: "NIK sudah terdaftar pada pasien lain.",
            errors: { nik: ["NIK sudah terdaftar. Cari pasien terlebih dahulu sebelum membuat data baru."] },
          }
        }

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

export async function updatePatientAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !patientMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk mengubah data pasien.",
    }
  }

  const parsed = updatePatientSchema.safeParse({
    patientId: formData.get("patientId"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    bloodType: formData.get("bloodType"),
    allergies: formData.get("allergies"),
    emergencyContact: formData.get("emergencyContact"),
    status: formData.get("status"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data pasien belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const patient = await prisma.patient.findUnique({
    where: { id: parsed.data.patientId },
  })

  if (!patient) {
    return {
      ok: false,
      message: "Pasien tidak ditemukan.",
      errors: { patientId: ["Pasien tidak ditemukan."] },
    }
  }

  const updateData = {
    ...(parsed.data.fullName ? { fullName: parsed.data.fullName } : {}),
    ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
    ...(parsed.data.address ? { address: parsed.data.address } : {}),
    ...(parsed.data.bloodType ? { bloodType: parsed.data.bloodType } : {}),
    ...(parsed.data.allergies ? { allergies: parsed.data.allergies } : {}),
    ...(parsed.data.emergencyContact ? { emergencyContact: parsed.data.emergencyContact } : {}),
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
  }

  if (Object.keys(updateData).length === 0) {
    return {
      ok: false,
      message: "Isi minimal satu field yang ingin diubah.",
    }
  }

  const updatedPatient = await prisma.patient.update({
    where: { id: patient.id },
    data: updateData,
  })

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE_PATIENT",
    entityName: "Patient",
    entityId: patient.id,
    beforeData: {
      fullName: patient.fullName,
      phone: patient.phone,
      status: patient.status,
    },
    afterData: {
      fullName: updatedPatient.fullName,
      phone: updatedPatient.phone,
      status: updatedPatient.status,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Data pasien ${updatedPatient.fullName} berhasil diperbarui.`,
  }
}

export async function deactivatePatientAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !patientMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk menonaktifkan pasien.",
    }
  }

  const parsed = deactivatePatientSchema.safeParse({
    patientId: formData.get("patientId"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data pasien belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const patient = await prisma.patient.findUnique({
    where: { id: parsed.data.patientId },
    select: {
      id: true,
      fullName: true,
      medicalRecordNumber: true,
      status: true,
    },
  })

  if (!patient) {
    return {
      ok: false,
      message: "Pasien tidak ditemukan.",
      errors: { patientId: ["Pasien tidak ditemukan."] },
    }
  }

  if (patient.status === PatientStatus.INACTIVE) {
    return {
      ok: true,
      message: `Pasien ${patient.fullName} sudah nonaktif.`,
    }
  }

  const updatedPatient = await prisma.patient.update({
    where: { id: patient.id },
    data: { status: PatientStatus.INACTIVE },
  })

  await writeAuditLog({
    userId: user.id,
    action: "DEACTIVATE_PATIENT",
    entityName: "Patient",
    entityId: patient.id,
    beforeData: {
      fullName: patient.fullName,
      medicalRecordNumber: patient.medicalRecordNumber,
      status: patient.status,
    },
    afterData: {
      fullName: updatedPatient.fullName,
      medicalRecordNumber: updatedPatient.medicalRecordNumber,
      status: updatedPatient.status,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Pasien ${updatedPatient.fullName} berhasil dinonaktifkan.`,
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

export async function updateVisitStatusAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !visitMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk mengubah status kunjungan.",
    }
  }

  const parsed = updateVisitStatusSchema.safeParse({
    visitId: formData.get("visitId"),
    status: formData.get("status"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data status kunjungan belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const visit = await prisma.visit.findUnique({
    where: { id: parsed.data.visitId },
    include: {
      patient: {
        select: {
          fullName: true,
          medicalRecordNumber: true,
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

  const updatedVisit = await prisma.visit.update({
    where: { id: visit.id },
    data: { status: parsed.data.status },
  })

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE_VISIT_STATUS",
    entityName: "Visit",
    entityId: visit.id,
    beforeData: {
      status: visit.status,
      patientName: visit.patient.fullName,
    },
    afterData: {
      status: updatedVisit.status,
      patientName: visit.patient.fullName,
      medicalRecordNumber: visit.patient.medicalRecordNumber,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Status kunjungan ${visit.patient.fullName} berhasil diperbarui.`,
  }
}

export async function cancelVisitAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !visitMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk membatalkan kunjungan.",
    }
  }

  const parsed = cancelVisitSchema.safeParse({
    visitId: formData.get("visitId"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data kunjungan belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const visit = await prisma.visit.findUnique({
    where: { id: parsed.data.visitId },
    include: {
      patient: {
        select: {
          fullName: true,
          medicalRecordNumber: true,
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

  if (visit.status === VisitStatus.COMPLETED) {
    return {
      ok: false,
      message: "Kunjungan yang sudah selesai tidak dapat dibatalkan.",
    }
  }

  if (visit.status === VisitStatus.CANCELLED) {
    return {
      ok: true,
      message: `Kunjungan ${visit.patient.fullName} sudah dibatalkan.`,
    }
  }

  const updatedVisit = await prisma.visit.update({
    where: { id: visit.id },
    data: { status: VisitStatus.CANCELLED },
  })

  await writeAuditLog({
    userId: user.id,
    action: "CANCEL_VISIT",
    entityName: "Visit",
    entityId: visit.id,
    beforeData: {
      status: visit.status,
      patientName: visit.patient.fullName,
      medicalRecordNumber: visit.patient.medicalRecordNumber,
    },
    afterData: {
      status: updatedVisit.status,
      patientName: visit.patient.fullName,
      medicalRecordNumber: visit.patient.medicalRecordNumber,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Kunjungan ${visit.patient.fullName} berhasil dibatalkan.`,
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
        temperature: parseOptionalDecimalInput(parsed.data.temperature),
        weight: parseOptionalDecimalInput(parsed.data.weight),
        height: parseOptionalDecimalInput(parsed.data.height),
        pulse: parseOptionalIntegerInput(parsed.data.pulse),
        respiration: parseOptionalIntegerInput(parsed.data.respiration),
        oxygenSaturation: parseOptionalIntegerInput(parsed.data.oxygenSaturation),
        nurseNote: optionalString(parsed.data.nurseNote),
      },
      create: {
        visitId: parsed.data.visitId,
        bloodPressure: optionalString(parsed.data.bloodPressure),
        temperature: parseOptionalDecimalInput(parsed.data.temperature),
        weight: parseOptionalDecimalInput(parsed.data.weight),
        height: parseOptionalDecimalInput(parsed.data.height),
        pulse: parseOptionalIntegerInput(parsed.data.pulse),
        respiration: parseOptionalIntegerInput(parsed.data.respiration),
        oxygenSaturation: parseOptionalIntegerInput(parsed.data.oxygenSaturation),
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
  const treatmentCost = parseOptionalDecimalInput(parsed.data.treatmentCost)

  if (parsed.data.followUpDate && !followUpDate) {
    return {
      ok: false,
      message: "Tanggal kontrol tidak valid.",
      errors: { followUpDate: ["Tanggal kontrol tidak valid."] },
    }
  }

  if (isInvalidOptionalDecimal(parsed.data.treatmentCost)) {
    return {
      ok: false,
      message: "Biaya tindakan harus berupa angka valid.",
      errors: { treatmentCost: ["Biaya tindakan harus berupa angka positif atau nol."] },
    }
  }

  const visit = await prisma.visit.findUnique({
    where: { id: parsed.data.visitId },
    select: {
      id: true,
      medicalRecord: {
        select: {
          id: true,
          status: true,
          finalizedAt: true,
        },
      },
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

  if (visit.medicalRecord?.status === MedicalRecordStatus.FINAL) {
    return {
      ok: false,
      message: "Rekam medis sudah final dan tidak dapat diubah. Buat alur amandemen terpisah jika koreksi final diperlukan.",
      errors: { visitId: ["Rekam medis final terkunci."] },
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
          cost: treatmentCost,
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
    medicineQuery: formData.get("medicineQuery"),
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

  const quantity = parseNonNegativeIntegerInput(parsed.data.quantity)

  if (!quantity || quantity < 1) {
    return {
      ok: false,
      message: "Jumlah obat harus lebih dari 0.",
      errors: { quantity: ["Jumlah obat harus lebih dari 0."] },
    }
  }

  const medicineId = optionalString(parsed.data.medicineId)
  const medicineQuery = optionalString(parsed.data.medicineQuery)

  if (!medicineId && !medicineQuery) {
    return {
      ok: false,
      message: "Obat wajib diisi.",
      errors: { medicineQuery: ["Ketik kode atau nama obat."] },
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

  const medicineSearchText = medicineQuery?.trim()
  const medicineCode = medicineSearchText?.split(" - ")[0]?.trim()
  const medicineSearchFilters: Prisma.MedicineWhereInput[] = []

  if (medicineCode) {
    medicineSearchFilters.push({ code: { equals: medicineCode, mode: "insensitive" } })
  }

  if (medicineSearchText) {
    medicineSearchFilters.push(
      { name: { equals: medicineSearchText, mode: "insensitive" } },
      { name: { contains: medicineSearchText, mode: "insensitive" } },
      { code: { contains: medicineSearchText, mode: "insensitive" } },
    )
  }

  const medicine = medicineId
    ? await prisma.medicine.findUnique({
        where: { id: medicineId },
        select: { id: true, name: true },
      })
    : await prisma.medicine.findFirst({
        where: {
          status: {
            notIn: [MedicineStatus.INACTIVE, MedicineStatus.EXPIRED],
          },
          stock: {
            gt: 0,
          },
          OR: medicineSearchFilters,
        },
        select: { id: true, name: true },
      })

  if (!medicine) {
    return {
      ok: false,
      message: "Obat tidak ditemukan.",
      errors: { medicineQuery: ["Obat tidak ditemukan. Pilih dari saran atau periksa master obat."] },
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

    const expired = prescription.items.find((item) => item.medicine.status === MedicineStatus.EXPIRED || isExpiredDate(item.medicine.expirationDate))

    if (expired) {
      await tx.prescription.update({
        where: { id: prescription.id },
        data: { status: PrescriptionStatus.VALIDATING_STOCK },
      })

      return {
        ok: false as const,
        message: `${expired.medicine.name} sudah kedaluwarsa dan tidak dapat diproses.`,
      }
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
          status: deriveMedicineStatus({
            stock: nextStock,
            minimumStock: item.medicine.minimumStock,
            expirationDate: item.medicine.expirationDate,
          }),
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

export async function cancelPrescriptionAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !prescriptionCancelRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk membatalkan resep.",
    }
  }

  const parsed = cancelPrescriptionSchema.safeParse({
    prescriptionId: formData.get("prescriptionId"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data resep belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const prescription = await prisma.prescription.findUnique({
    where: { id: parsed.data.prescriptionId },
    include: {
      medicalRecord: {
        include: {
          visit: {
            include: {
              patient: {
                select: {
                  fullName: true,
                  medicalRecordNumber: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!prescription) {
    return {
      ok: false,
      message: "Resep tidak ditemukan.",
      errors: { prescriptionId: ["Resep tidak ditemukan."] },
    }
  }

  if (prescription.status === PrescriptionStatus.PROCESSED) {
    return {
      ok: false,
      message: "Resep yang sudah diproses tidak dapat dibatalkan lewat aksi ini.",
    }
  }

  if (prescription.status === PrescriptionStatus.CANCELLED) {
    return {
      ok: true,
      message: `Resep ${prescription.medicalRecord.visit.patient.fullName} sudah dibatalkan.`,
    }
  }

  const updatedPrescription = await prisma.prescription.update({
    where: { id: prescription.id },
    data: { status: PrescriptionStatus.CANCELLED },
  })

  await writeAuditLog({
    userId: user.id,
    action: "CANCEL_PRESCRIPTION",
    entityName: "Prescription",
    entityId: prescription.id,
    beforeData: {
      status: prescription.status,
      patientName: prescription.medicalRecord.visit.patient.fullName,
      medicalRecordNumber: prescription.medicalRecord.visit.patient.medicalRecordNumber,
    },
    afterData: {
      status: updatedPrescription.status,
      patientName: prescription.medicalRecord.visit.patient.fullName,
      medicalRecordNumber: prescription.medicalRecord.visit.patient.medicalRecordNumber,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Resep ${prescription.medicalRecord.visit.patient.fullName} berhasil dibatalkan.`,
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

  const stock = parseNonNegativeIntegerInput(parsed.data.stock)
  const minimumStock = parseNonNegativeIntegerInput(parsed.data.minimumStock)
  const expirationDate = parsed.data.expirationDate ? toDate(parsed.data.expirationDate) : null
  const price = parseOptionalDecimalInput(parsed.data.price)

  if (stock === null || minimumStock === null) {
    return {
      ok: false,
      message: "Stok dan stok minimum harus berupa angka.",
    }
  }

  if (isInvalidOptionalDecimal(parsed.data.price)) {
    return {
      ok: false,
      message: "Harga obat harus berupa angka valid.",
      errors: { price: ["Harga obat harus berupa angka positif atau nol."] },
    }
  }

  if (parsed.data.expirationDate && !expirationDate) {
    return {
      ok: false,
      message: "Tanggal kedaluwarsa tidak valid.",
      errors: { expirationDate: ["Tanggal kedaluwarsa tidak valid."] },
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
        price,
        expirationDate,
        status: deriveMedicineStatus({
          stock,
          minimumStock,
          expirationDate,
        }),
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

export async function updateMedicineAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !medicineMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk mengubah obat.",
    }
  }

  const parsed = updateMedicineSchema.safeParse({
    medicineId: formData.get("medicineId"),
    name: formData.get("name"),
    category: formData.get("category"),
    unit: formData.get("unit"),
    stock: formData.get("stock"),
    minimumStock: formData.get("minimumStock"),
    price: formData.get("price"),
    expirationDate: formData.get("expirationDate"),
    status: formData.get("status"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data obat belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const medicine = await prisma.medicine.findUnique({
    where: { id: parsed.data.medicineId },
  })

  if (!medicine) {
    return {
      ok: false,
      message: "Obat tidak ditemukan.",
      errors: { medicineId: ["Obat tidak ditemukan."] },
    }
  }

  const stock = parseOptionalIntegerInput(parsed.data.stock)
  const minimumStock = parseOptionalIntegerInput(parsed.data.minimumStock)

  if (parsed.data.stock && stock === null) {
    return {
      ok: false,
      message: "Stok harus berupa angka.",
      errors: { stock: ["Stok harus berupa angka."] },
    }
  }

  if (parsed.data.minimumStock && minimumStock === null) {
    return {
      ok: false,
      message: "Stok minimum harus berupa angka.",
      errors: { minimumStock: ["Stok minimum harus berupa angka."] },
    }
  }

  const nextStock = stock ?? medicine.stock
  const nextMinimumStock = minimumStock ?? medicine.minimumStock
  const explicitStatus = parsed.data.status || null
  const expirationDate = parsed.data.expirationDate ? toDate(parsed.data.expirationDate) : undefined
  const price = parseOptionalDecimalInput(parsed.data.price)

  if (parsed.data.expirationDate && !expirationDate) {
    return {
      ok: false,
      message: "Tanggal kedaluwarsa tidak valid.",
      errors: { expirationDate: ["Tanggal kedaluwarsa tidak valid."] },
    }
  }

  if (isInvalidOptionalDecimal(parsed.data.price)) {
    return {
      ok: false,
      message: "Harga obat harus berupa angka valid.",
      errors: { price: ["Harga obat harus berupa angka positif atau nol."] },
    }
  }

  const updateData = {
    ...(parsed.data.name ? { name: parsed.data.name } : {}),
    ...(parsed.data.category ? { category: parsed.data.category } : {}),
    ...(parsed.data.unit ? { unit: parsed.data.unit } : {}),
    ...(stock !== null ? { stock } : {}),
    ...(minimumStock !== null ? { minimumStock } : {}),
    ...(parsed.data.price ? { price } : {}),
    ...(expirationDate !== undefined ? { expirationDate } : {}),
    status: deriveMedicineStatus({
      stock: nextStock,
      minimumStock: nextMinimumStock,
      expirationDate: expirationDate ?? medicine.expirationDate,
      explicitStatus,
    }),
  }

  const updatedMedicine = await prisma.medicine.update({
    where: { id: medicine.id },
    data: updateData,
  })

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE_MEDICINE",
    entityName: "Medicine",
    entityId: medicine.id,
    beforeData: {
      code: medicine.code,
      name: medicine.name,
      stock: medicine.stock,
      minimumStock: medicine.minimumStock,
      status: medicine.status,
    },
    afterData: {
      code: updatedMedicine.code,
      name: updatedMedicine.name,
      stock: updatedMedicine.stock,
      minimumStock: updatedMedicine.minimumStock,
      status: updatedMedicine.status,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Obat ${updatedMedicine.name} berhasil diperbarui.`,
  }
}

export async function deactivateMedicineAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const user = await getCurrentUser()

  if (!user || !medicineMutationRoles.has(user.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk menonaktifkan obat.",
    }
  }

  const parsed = deactivateMedicineSchema.safeParse({
    medicineId: formData.get("medicineId"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data obat belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const medicine = await prisma.medicine.findUnique({
    where: { id: parsed.data.medicineId },
  })

  if (!medicine) {
    return {
      ok: false,
      message: "Obat tidak ditemukan.",
      errors: { medicineId: ["Obat tidak ditemukan."] },
    }
  }

  if (medicine.status === MedicineStatus.INACTIVE) {
    return {
      ok: true,
      message: `Obat ${medicine.name} sudah nonaktif.`,
    }
  }

  const updatedMedicine = await prisma.medicine.update({
    where: { id: medicine.id },
    data: { status: MedicineStatus.INACTIVE },
  })

  await writeAuditLog({
    userId: user.id,
    action: "DEACTIVATE_MEDICINE",
    entityName: "Medicine",
    entityId: medicine.id,
    beforeData: {
      code: medicine.code,
      name: medicine.name,
      status: medicine.status,
    },
    afterData: {
      code: updatedMedicine.code,
      name: updatedMedicine.name,
      status: updatedMedicine.status,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `Obat ${updatedMedicine.name} berhasil dinonaktifkan.`,
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
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data dokumen belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const uploadedFile = formData.get("file")

  if (!(uploadedFile instanceof File) || uploadedFile.size === 0) {
    return {
      ok: false,
      message: "File dokumen wajib dipilih.",
      errors: { file: ["File dokumen wajib dipilih."] },
    }
  }

  if (!allowedMedicalDocumentTypes.has(uploadedFile.type)) {
    return {
      ok: false,
      message: "Format file belum didukung.",
      errors: { file: ["Gunakan PDF, JPG, PNG, atau WebP."] },
    }
  }

  if (uploadedFile.size > maxMedicalDocumentSize) {
    return {
      ok: false,
      message: "Ukuran file terlalu besar.",
      errors: { file: ["Maksimal ukuran file adalah 2 MB."] },
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

  const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer())
  const fileName = sanitizeFileName(uploadedFile.name || `dokumen-${Date.now()}`)
  const fileUrl = `data:${uploadedFile.type};base64,${fileBuffer.toString("base64")}`

  const document = await prisma.medicalDocument.create({
    data: {
      patientId: parsed.data.patientId,
      visitId: optionalString(parsed.data.visitId),
      type: parsed.data.type,
      fileName,
      fileUrl,
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

export async function createUserAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const actor = await getCurrentUser()

  if (!actor || !userMutationRoles.has(actor.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk menambah user.",
    }
  }

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data user belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const role = await prisma.role.findUnique({
    where: { id: parsed.data.roleId },
    select: { id: true, key: true, name: true },
  })

  if (!role) {
    return {
      ok: false,
      message: "Role tidak ditemukan.",
      errors: { roleId: ["Role tidak ditemukan."] },
    }
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        username: parsed.data.username,
        passwordHash: await hashPassword(parsed.data.password),
        roleId: role.id,
      },
    })

    await writeAuditLog({
      userId: actor.id,
      action: "CREATE_USER",
      entityName: "User",
      entityId: user.id,
      afterData: {
        name: user.name,
        email: user.email,
        username: user.username,
        role: role.key,
      },
    })

    revalidatePath("/")

    return {
      ok: true,
      message: `User ${user.name} berhasil dibuat sebagai ${role.name}.`,
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Email atau username sudah terdaftar.",
        errors: {
          email: ["Periksa email, mungkin sudah digunakan."],
          username: ["Periksa username, mungkin sudah digunakan."],
        },
      }
    }

    return {
      ok: false,
      message: "User gagal dibuat.",
    }
  }
}

export async function updateUserAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const actor = await getCurrentUser()

  if (!actor || !userMutationRoles.has(actor.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk mengubah user.",
    }
  }

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
    status: formData.get("status"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data user belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  const nextName = optionalString(parsed.data.name)
  const nextEmail = optionalString(parsed.data.email)?.toLowerCase() ?? null
  const nextUsername = optionalString(parsed.data.username)?.toLowerCase() ?? null
  const nextPassword = optionalString(parsed.data.password)

  if (nextName && nextName.length < 2) {
    return {
      ok: false,
      message: "Nama user minimal 2 karakter.",
      errors: { name: ["Nama user minimal 2 karakter."] },
    }
  }

  if (nextEmail && !z.email().safeParse(nextEmail).success) {
    return {
      ok: false,
      message: "Email tidak valid.",
      errors: { email: ["Email tidak valid."] },
    }
  }

  if (nextUsername && nextUsername.length < 3) {
    return {
      ok: false,
      message: "Username minimal 3 karakter.",
      errors: { username: ["Username minimal 3 karakter."] },
    }
  }

  if (nextPassword && nextPassword.length < 8) {
    return {
      ok: false,
      message: "Password baru minimal 8 karakter.",
      errors: { password: ["Password baru minimal 8 karakter."] },
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: {
      role: {
        select: {
          id: true,
          key: true,
          name: true,
        },
      },
    },
  })

  if (!user) {
    return {
      ok: false,
      message: "User tidak ditemukan.",
      errors: { userId: ["User tidak ditemukan."] },
    }
  }

  if (nextEmail && nextEmail !== user.email.toLowerCase()) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    })

    if (existingEmail && existingEmail.id !== user.id) {
      return {
        ok: false,
        message: "Email sudah digunakan user lain.",
        errors: { email: ["Email sudah digunakan user lain."] },
      }
    }
  }

  if (nextUsername && nextUsername !== user.username.toLowerCase()) {
    const existingUsername = await prisma.user.findUnique({
      where: { username: nextUsername },
      select: { id: true },
    })

    if (existingUsername && existingUsername.id !== user.id) {
      return {
        ok: false,
        message: "Username sudah digunakan user lain.",
        errors: { username: ["Username sudah digunakan user lain."] },
      }
    }
  }

  if (user.id === actor.id && parsed.data.status && parsed.data.status !== UserStatus.ACTIVE) {
    return {
      ok: false,
      message: "Anda tidak dapat menonaktifkan atau menangguhkan akun yang sedang digunakan.",
      errors: { status: ["Pilih user lain untuk perubahan status ini."] },
    }
  }

  const nextRole = parsed.data.roleId
    ? await prisma.role.findUnique({
        where: { id: parsed.data.roleId },
        select: { id: true, key: true, name: true },
      })
    : null

  if (parsed.data.roleId && !nextRole) {
    return {
      ok: false,
      message: "Role tidak ditemukan.",
      errors: { roleId: ["Role tidak ditemukan."] },
    }
  }

  const updateData: Prisma.UserUpdateInput = {
    ...(nextName ? { name: nextName } : {}),
    ...(nextEmail ? { email: nextEmail } : {}),
    ...(nextUsername ? { username: nextUsername } : {}),
    ...(nextPassword ? { passwordHash: await hashPassword(nextPassword) } : {}),
    ...(nextRole ? { roleId: nextRole.id } : {}),
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
  }

  if (Object.keys(updateData).length === 0) {
    return {
      ok: false,
      message: "Isi minimal satu field yang ingin diubah.",
    }
  }

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: updateData,
        include: {
          role: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      })

      if (nextPassword && user.id !== actor.id) {
        await tx.session.updateMany({
          where: {
            userId: user.id,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        })
      }

      return updated
    })

    await writeAuditLog({
      userId: actor.id,
      action: "UPDATE_USER",
      entityName: "User",
      entityId: user.id,
      beforeData: {
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role.key,
        status: user.status,
      },
      afterData: {
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role.key,
        status: updatedUser.status,
        passwordChanged: Boolean(nextPassword),
        revokedSessions: Boolean(nextPassword && user.id !== actor.id),
      },
    })

    revalidatePath("/")

    return {
      ok: true,
      message: `User ${updatedUser.name} berhasil diperbarui.`,
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Email atau username sudah digunakan user lain.",
        errors: {
          email: ["Periksa email, mungkin sudah digunakan."],
          username: ["Periksa username, mungkin sudah digunakan."],
        },
      }
    }

    return {
      ok: false,
      message: "User gagal diperbarui.",
    }
  }
}

export async function deactivateUserAction(_state: ClinicFormState, formData: FormData): Promise<ClinicFormState> {
  const actor = await getCurrentUser()

  if (!actor || !userMutationRoles.has(actor.role)) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk menonaktifkan user.",
    }
  }

  const parsed = deactivateUserSchema.safeParse({
    userId: formData.get("userId"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data user belum valid.",
      errors: getFieldErrors(parsed.error),
    }
  }

  if (parsed.data.userId === actor.id) {
    return {
      ok: false,
      message: "Anda tidak dapat menonaktifkan akun yang sedang digunakan.",
      errors: { userId: ["Pilih user lain untuk dinonaktifkan."] },
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: {
      role: {
        select: {
          key: true,
          name: true,
        },
      },
    },
  })

  if (!user) {
    return {
      ok: false,
      message: "User tidak ditemukan.",
      errors: { userId: ["User tidak ditemukan."] },
    }
  }

  if (user.status === UserStatus.INACTIVE) {
    return {
      ok: true,
      message: `User ${user.name} sudah nonaktif.`,
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { status: UserStatus.INACTIVE },
      include: {
        role: {
          select: {
            key: true,
            name: true,
          },
        },
      },
    })

    await tx.session.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })

    return updatedUser
  })

  await writeAuditLog({
    userId: actor.id,
    action: "DEACTIVATE_USER",
    entityName: "User",
    entityId: user.id,
    beforeData: {
      username: user.username,
      role: user.role.key,
      status: user.status,
    },
    afterData: {
      username: result.username,
      role: result.role.key,
      status: result.status,
    },
  })

  revalidatePath("/")

  return {
    ok: true,
    message: `User ${result.name} berhasil dinonaktifkan dan sesi aktifnya dicabut.`,
  }
}



