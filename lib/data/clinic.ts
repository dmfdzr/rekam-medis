import "server-only"

import { UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
})

const genderLabels = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
  OTHER: "Lainnya",
} as const

const patientStatusLabels = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  DECEASED: "Meninggal",
} as const

const visitStatusLabels = {
  WAITING: "Menunggu",
  VITAL_SIGN: "Tanda vital",
  EXAMINATION: "Pemeriksaan",
  PHARMACY: "Farmasi",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
} as const

const medicalRecordStatusLabels = {
  DRAFT: "Draft",
  FINAL: "Final",
} as const

const prescriptionStatusLabels = {
  PENDING: "Pending",
  VALIDATING_STOCK: "Validasi stok",
  PROCESSED: "Diproses",
  CANCELLED: "Dibatalkan",
} as const

const medicineStatusLabels = {
  ACTIVE: "Aman",
  INACTIVE: "Nonaktif",
  LOW_STOCK: "Stok rendah",
  EXPIRED: "Kedaluwarsa",
} as const

const documentTypeLabels = {
  LAB_RESULT: "Hasil lab",
  REFERRAL_LETTER: "Surat rujukan",
  CONTROL_LETTER: "Surat kontrol",
  EXAMINATION_PHOTO: "Foto pemeriksaan",
  SUPPORTING_DOCUMENT: "Dokumen pendukung",
  OTHER: "Lainnya",
} as const

function maskNik(nik: string | null) {
  if (!nik) {
    return "-"
  }

  return `${nik.slice(0, 4)}********${nik.slice(-4)}`
}

function calculateAge(birthDate: Date) {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return `${age} th`
}

export async function getPatientList() {
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      visits: {
        orderBy: { visitDate: "desc" },
        take: 1,
        select: {
          visitDate: true,
        },
      },
    },
  })

  return patients.map((patient) => ({
    id: patient.id,
    medicalRecordNumber: patient.medicalRecordNumber,
    name: patient.fullName,
    nik: maskNik(patient.nik),
    gender: genderLabels[patient.gender],
    age: calculateAge(patient.birthDate),
    phone: patient.phone ?? "-",
    allergy: patient.allergies ?? "Tidak ada",
    status: patientStatusLabels[patient.status],
    lastVisit: patient.visits[0] ? dateFormatter.format(patient.visits[0].visitDate) : "-",
  }))
}

export async function getVisitList() {
  const visits = await prisma.visit.findMany({
    orderBy: { visitDate: "desc" },
    take: 30,
    include: {
      patient: {
        select: {
          fullName: true,
          medicalRecordNumber: true,
        },
      },
      doctor: {
        select: {
          name: true,
        },
      },
    },
  })

  return visits.map((visit) => ({
    id: visit.id,
    patient: visit.patient.fullName,
    medicalRecordNumber: visit.patient.medicalRecordNumber,
    service: visit.service,
    doctor: visit.doctor?.name ?? "Belum ditentukan",
    complaint: visit.chiefComplaint,
    status: visitStatusLabels[visit.status],
    time: timeFormatter.format(visit.visitDate),
  }))
}

export async function getVisitFormOptions() {
  const [patients, doctors] = await Promise.all([
    prisma.patient.findMany({
      orderBy: { fullName: "asc" },
      take: 100,
      select: {
        id: true,
        fullName: true,
        medicalRecordNumber: true,
      },
    }),
    prisma.user.findMany({
      where: {
        role: {
          key: UserRole.DOCTOR,
        },
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ])

  return {
    patients: patients.map((patient) => ({
      id: patient.id,
      label: `${patient.medicalRecordNumber} - ${patient.fullName}`,
    })),
    doctors,
  }
}

export async function getClinicalWorklist() {
  const visits = await prisma.visit.findMany({
    where: {
      status: {
        in: ["WAITING", "VITAL_SIGN", "EXAMINATION"],
      },
    },
    orderBy: { visitDate: "desc" },
    take: 30,
    include: {
      patient: {
        select: {
          fullName: true,
          medicalRecordNumber: true,
          birthDate: true,
          gender: true,
          allergies: true,
        },
      },
      doctor: {
        select: {
          name: true,
        },
      },
      vitalSign: true,
      medicalRecord: {
        include: {
          diagnoses: {
            orderBy: { createdAt: "asc" },
          },
          treatments: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })

  return visits.map((visit) => ({
    id: visit.id,
    patientName: visit.patient.fullName,
    medicalRecordNumber: visit.patient.medicalRecordNumber,
    patientMeta: `${genderLabels[visit.patient.gender]}, ${calculateAge(visit.patient.birthDate)}`,
    allergies: visit.patient.allergies ?? "Tidak ada",
    service: visit.service,
    doctor: visit.doctor?.name ?? "Belum ditentukan",
    chiefComplaint: visit.chiefComplaint,
    status: visitStatusLabels[visit.status],
    time: timeFormatter.format(visit.visitDate),
    vitalSign: visit.vitalSign
      ? {
          bloodPressure: visit.vitalSign.bloodPressure ?? "",
          temperature: visit.vitalSign.temperature?.toString() ?? "",
          weight: visit.vitalSign.weight?.toString() ?? "",
          height: visit.vitalSign.height?.toString() ?? "",
          pulse: visit.vitalSign.pulse?.toString() ?? "",
          respiration: visit.vitalSign.respiration?.toString() ?? "",
          oxygenSaturation: visit.vitalSign.oxygenSaturation?.toString() ?? "",
          nurseNote: visit.vitalSign.nurseNote ?? "",
        }
      : null,
    medicalRecord: visit.medicalRecord
      ? {
          id: visit.medicalRecord.id,
          subjective: visit.medicalRecord.subjective ?? "",
          objective: visit.medicalRecord.objective ?? "",
          assessment: visit.medicalRecord.assessment ?? "",
          plan: visit.medicalRecord.plan ?? "",
          physicalExam: visit.medicalRecord.physicalExam ?? "",
          doctorNote: visit.medicalRecord.doctorNote ?? "",
          followUpDate: visit.medicalRecord.followUpDate ? visit.medicalRecord.followUpDate.toISOString().slice(0, 10) : "",
          status: medicalRecordStatusLabels[visit.medicalRecord.status],
          diagnoses: visit.medicalRecord.diagnoses.map((diagnosis) => ({
            id: diagnosis.id,
            code: diagnosis.code ?? "",
            name: diagnosis.name,
            type: diagnosis.type,
            note: diagnosis.note ?? "",
          })),
          treatments: visit.medicalRecord.treatments.map((treatment) => ({
            id: treatment.id,
            code: treatment.code ?? "",
            name: treatment.name,
            cost: treatment.cost?.toString() ?? "",
            note: treatment.note ?? "",
          })),
        }
      : null,
  }))
}

export async function getPrescriptionList() {
  const prescriptions = await prisma.prescription.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
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
      doctor: {
        select: {
          name: true,
        },
      },
      pharmacist: {
        select: {
          name: true,
        },
      },
      items: {
        include: {
          medicine: {
            select: {
              name: true,
              stock: true,
            },
          },
        },
      },
    },
  })

  return prescriptions.map((prescription) => ({
    id: prescription.id,
    patient: prescription.medicalRecord.visit.patient.fullName,
    medicalRecordNumber: prescription.medicalRecord.visit.patient.medicalRecordNumber,
    doctor: prescription.doctor?.name ?? "Belum ditentukan",
    pharmacist: prescription.pharmacist?.name ?? "-",
    items: prescription.items.map((item) => `${item.medicine.name} (${item.quantity})`).join(", ") || "-",
    status: prescriptionStatusLabels[prescription.status],
    stock: prescription.items.some((item) => item.medicine.stock < item.quantity) ? "Stok kurang" : "Cukup",
    createdAt: dateFormatter.format(prescription.createdAt),
  }))
}

export async function getMedicineList() {
  const medicines = await prisma.medicine.findMany({
    orderBy: { name: "asc" },
    take: 100,
  })

  return medicines.map((medicine) => ({
    id: medicine.id,
    code: medicine.code,
    name: medicine.name,
    category: medicine.category,
    unit: medicine.unit,
    stock: medicine.stock,
    min: medicine.minimumStock,
    price: medicine.price?.toString() ?? "",
    expires: medicine.expirationDate ? medicine.expirationDate.toISOString().slice(0, 10) : "-",
    status: medicine.stock <= medicine.minimumStock ? "Stok rendah" : medicineStatusLabels[medicine.status],
  }))
}

export async function getPrescriptionFormOptions() {
  const [records, medicines] = await Promise.all([
    prisma.medicalRecord.findMany({
      where: {
        status: {
          in: ["DRAFT", "FINAL"],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
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
    }),
    prisma.medicine.findMany({
      where: {
        status: {
          not: "INACTIVE",
        },
      },
      orderBy: { name: "asc" },
      take: 100,
      select: {
        id: true,
        code: true,
        name: true,
        stock: true,
        unit: true,
      },
    }),
  ])

  return {
    records: records.map((record) => ({
      id: record.id,
      label: `${record.visit.patient.medicalRecordNumber} - ${record.visit.patient.fullName} - ${record.visit.service}`,
    })),
    medicines: medicines.map((medicine) => ({
      id: medicine.id,
      label: `${medicine.code} - ${medicine.name} (${medicine.stock} ${medicine.unit})`,
    })),
  }
}

export async function getMedicalDocumentList() {
  const documents = await prisma.medicalDocument.findMany({
    orderBy: { uploadedAt: "desc" },
    take: 30,
    include: {
      patient: {
        select: {
          fullName: true,
          medicalRecordNumber: true,
        },
      },
      visit: {
        select: {
          service: true,
          visitDate: true,
        },
      },
      uploadedBy: {
        select: {
          name: true,
        },
      },
    },
  })

  return documents.map((document) => ({
    id: document.id,
    patient: document.patient.fullName,
    medicalRecordNumber: document.patient.medicalRecordNumber,
    visit: document.visit ? `${document.visit.service} - ${dateFormatter.format(document.visit.visitDate)}` : "-",
    type: documentTypeLabels[document.type],
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    uploadedBy: document.uploadedBy?.name ?? "-",
    uploadedAt: dateFormatter.format(document.uploadedAt),
  }))
}

export async function getDocumentFormOptions() {
  const [patients, visits] = await Promise.all([
    prisma.patient.findMany({
      orderBy: { fullName: "asc" },
      take: 100,
      select: {
        id: true,
        fullName: true,
        medicalRecordNumber: true,
      },
    }),
    prisma.visit.findMany({
      orderBy: { visitDate: "desc" },
      take: 100,
      include: {
        patient: {
          select: {
            fullName: true,
            medicalRecordNumber: true,
          },
        },
      },
    }),
  ])

  return {
    patients: patients.map((patient) => ({
      id: patient.id,
      label: `${patient.medicalRecordNumber} - ${patient.fullName}`,
    })),
    visits: visits.map((visit) => ({
      id: visit.id,
      patientId: visit.patientId,
      label: `${visit.patient.medicalRecordNumber} - ${visit.patient.fullName} - ${visit.service}`,
    })),
  }
}

export async function getReportSummary() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const nextDay = new Date(startOfDay)
  nextDay.setDate(nextDay.getDate() + 1)

  const [todayVisits, newPatients, diagnosisGroup, medicineUsage, lowStock] = await Promise.all([
    prisma.visit.count({
      where: {
        visitDate: {
          gte: startOfDay,
          lt: nextDay,
        },
      },
    }),
    prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    }),
    prisma.diagnosis.groupBy({
      by: ["name"],
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
      take: 1,
    }),
    prisma.prescriptionItem.groupBy({
      by: ["medicineId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 1,
    }),
    prisma.medicine.count({
      where: {
        OR: [{ status: "LOW_STOCK" }, { stock: { lte: prisma.medicine.fields.minimumStock } }],
      },
    }),
  ])

  const topMedicine = medicineUsage[0]
    ? await prisma.medicine.findUnique({
        where: { id: medicineUsage[0].medicineId },
        select: { name: true },
      })
    : null

  return [
    { label: "Kunjungan hari ini", period: "Hari berjalan", value: String(todayVisits), trend: "Realtime" },
    { label: "Pasien baru", period: "Bulan berjalan", value: String(newPatients), trend: "Prisma" },
    { label: "Diagnosa terbanyak", period: "Data tersedia", value: diagnosisGroup[0]?.name ?? "-", trend: diagnosisGroup[0]?._count.name ? `${diagnosisGroup[0]._count.name} kasus` : "-" },
    {
      label: "Penggunaan obat",
      period: "Resep diproses",
      value: topMedicine?.name ?? "-",
      trend: topMedicine ? `${topMedicine.name}` : "-",
    },
    { label: "Obat stok rendah", period: "Inventori", value: String(lowStock), trend: "Butuh cek" },
  ]
}

export async function getAuditLogList() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          name: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  return logs.map((log) => ({
    id: log.id,
    actor: log.user?.name ?? "System",
    role: log.user?.role.name ?? "-",
    action: log.action,
    entity: log.entityName,
    entityId: log.entityId ?? "-",
    time: `${dateFormatter.format(log.createdAt)} ${timeFormatter.format(log.createdAt)}`,
    risk: log.action.includes("MEDICAL_RECORD") || log.action.includes("PRESCRIPTION") ? "Sensitif" : "Normal",
  }))
}

export type PatientListItem = Awaited<ReturnType<typeof getPatientList>>[number]
export type VisitListItem = Awaited<ReturnType<typeof getVisitList>>[number]
export type VisitFormOptions = Awaited<ReturnType<typeof getVisitFormOptions>>
export type ClinicalWorklistItem = Awaited<ReturnType<typeof getClinicalWorklist>>[number]
export type PrescriptionListItem = Awaited<ReturnType<typeof getPrescriptionList>>[number]
export type MedicineListItem = Awaited<ReturnType<typeof getMedicineList>>[number]
export type PrescriptionFormOptions = Awaited<ReturnType<typeof getPrescriptionFormOptions>>
export type MedicalDocumentListItem = Awaited<ReturnType<typeof getMedicalDocumentList>>[number]
export type DocumentFormOptions = Awaited<ReturnType<typeof getDocumentFormOptions>>
export type ReportSummaryItem = Awaited<ReturnType<typeof getReportSummary>>[number]
export type AuditLogListItem = Awaited<ReturnType<typeof getAuditLogList>>[number]
