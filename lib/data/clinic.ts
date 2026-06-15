import "server-only"

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

const userStatusLabels = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  SUSPENDED: "Ditangguhkan",
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

function startOfToday() {
  const now = new Date()

  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function getMedicineDisplayStatus(medicine: { status: keyof typeof medicineStatusLabels; stock: number; minimumStock: number; expirationDate: Date | null }) {
  if (medicine.status === "INACTIVE") {
    return medicineStatusLabels.INACTIVE
  }

  if (medicine.status === "EXPIRED" || (medicine.expirationDate && medicine.expirationDate < startOfToday())) {
    return medicineStatusLabels.EXPIRED
  }

  if (medicine.stock <= medicine.minimumStock) {
    return medicineStatusLabels.LOW_STOCK
  }

  return medicineStatusLabels[medicine.status]
}

function summarizeJson(value: unknown) {
  if (!value) {
    return "-"
  }

  const text = JSON.stringify(value)

  return text.length > 220 ? `${text.slice(0, 220)}...` : text
}

export async function getDashboardSummary() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const nextDay = new Date(startOfDay)
  nextDay.setDate(nextDay.getDate() + 1)

  const [todayVisits, activePatients, pendingPrescriptions, lowStockMedicines, visitStatusGroups] = await Promise.all([
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
        status: "ACTIVE",
      },
    }),
    prisma.prescription.count({
      where: {
        status: {
          in: ["PENDING", "VALIDATING_STOCK"],
        },
      },
    }),
    prisma.medicine.count({
      where: {
        OR: [{ status: "LOW_STOCK" }, { stock: { lte: prisma.medicine.fields.minimumStock } }],
      },
    }),
    prisma.visit.groupBy({
      by: ["status"],
      where: {
        status: {
          in: ["WAITING", "VITAL_SIGN", "EXAMINATION", "PHARMACY"],
        },
      },
      _count: { status: true },
    }),
  ])

  const queue = ["WAITING", "VITAL_SIGN", "EXAMINATION", "PHARMACY"].map((status) => ({
    status: visitStatusLabels[status as keyof typeof visitStatusLabels],
    count: String(visitStatusGroups.find((group) => group.status === status)?._count.status ?? 0),
  }))

  return {
    metrics: [
      { label: "Kunjungan hari ini", value: String(todayVisits), change: "Realtime", detail: "Hari berjalan", tone: "text-sky-700 dark:text-sky-300" },
      { label: "Pasien aktif", value: String(activePatients), change: "Total", detail: "Data pasien aktif", tone: "text-teal-700 dark:text-teal-300" },
      { label: "Resep pending", value: String(pendingPrescriptions), change: "Farmasi", detail: "Menunggu proses", tone: "text-violet-700 dark:text-violet-300" },
      { label: "Stok rendah", value: String(lowStockMedicines), change: "Inventori", detail: "Perlu dicek", tone: "text-amber-700 dark:text-amber-300" },
    ],
    queue,
  }
}

export async function getPatientList() {
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      visits: {
        orderBy: { visitDate: "desc" },
        take: 3,
        select: {
          id: true,
          service: true,
          status: true,
          visitDate: true,
        },
      },
      _count: {
        select: {
          visits: true,
          documents: true,
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
    address: patient.address ?? "-",
    bloodType: patient.bloodType ?? "-",
    allergy: patient.allergies ?? "Tidak ada",
    emergencyContact: patient.emergencyContact ?? "-",
    status: patientStatusLabels[patient.status],
    lastVisit: patient.visits[0] ? dateFormatter.format(patient.visits[0].visitDate) : "-",
    visitCount: patient._count.visits,
    documentCount: patient._count.documents,
    recentVisits: patient.visits.map((visit) => ({
      id: visit.id,
      service: visit.service,
      status: visitStatusLabels[visit.status],
      date: dateFormatter.format(visit.visitDate),
    })),
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
          key: "DOCTOR",
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

export async function getMedicalRecordHistory() {
  const records = await prisma.medicalRecord.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      doctor: {
        select: {
          name: true,
        },
      },
      visit: {
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
          vitalSign: true,
          documents: {
            orderBy: { uploadedAt: "desc" },
            take: 3,
            select: {
              fileName: true,
              type: true,
            },
          },
        },
      },
      diagnoses: {
        orderBy: { createdAt: "asc" },
      },
      treatments: {
        orderBy: { createdAt: "asc" },
      },
      prescription: {
        include: {
          items: {
            include: {
              medicine: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return records.map((record) => {
    const primaryDiagnosis = record.diagnoses.find((diagnosis) => diagnosis.type === "PRIMARY")

    return {
      id: record.id,
      patient: record.visit.patient.fullName,
      medicalRecordNumber: record.visit.patient.medicalRecordNumber,
      patientMeta: `${genderLabels[record.visit.patient.gender]}, ${calculateAge(record.visit.patient.birthDate)}`,
      allergies: record.visit.patient.allergies ?? "Tidak ada",
      visitDate: dateFormatter.format(record.visit.visitDate),
      service: record.visit.service,
      doctor: record.doctor?.name ?? "Belum ditentukan",
      status: medicalRecordStatusLabels[record.status],
      chiefComplaint: record.visit.chiefComplaint,
      subjective: record.subjective ?? "-",
      objective: record.objective ?? "-",
      assessment: record.assessment ?? primaryDiagnosis?.name ?? "-",
      plan: record.plan ?? "-",
      diagnosis: primaryDiagnosis?.name ?? record.diagnoses[0]?.name ?? "-",
      treatments: record.treatments.map((treatment) => treatment.name).join(", ") || "-",
      prescriptions: record.prescription?.items.map((item) => `${item.medicine.name} (${item.quantity})`).join(", ") ?? "-",
      vitalSign: record.visit.vitalSign
        ? `${record.visit.vitalSign.bloodPressure ?? "-"} mmHg, ${record.visit.vitalSign.temperature?.toString() ?? "-"} C`
        : "-",
      documents: record.visit.documents.map((document) => `${documentTypeLabels[document.type]}: ${document.fileName}`).join(", ") || "-",
      finalizedAt: record.finalizedAt ? dateFormatter.format(record.finalizedAt) : "-",
    }
  })
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
    status: getMedicineDisplayStatus(medicine),
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
          notIn: ["INACTIVE", "EXPIRED"],
        },
        stock: {
          gt: 0,
        },
        OR: [{ expirationDate: null }, { expirationDate: { gte: startOfToday() } }],
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
    fileUrl: `/documents/${document.id}`,
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

function buildDateRangeFilter(startDate?: string | null, endDate?: string | null) {
  const now = new Date()
  const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : new Date(now.getFullYear(), now.getMonth(), 1)
  const end = endDate ? new Date(`${endDate}T00:00:00.000Z`) : now
  const exclusiveEnd = new Date(end)
  exclusiveEnd.setDate(exclusiveEnd.getDate() + 1)

  return {
    start: Number.isNaN(start.getTime()) ? new Date(now.getFullYear(), now.getMonth(), 1) : start,
    end: Number.isNaN(exclusiveEnd.getTime()) ? now : exclusiveEnd,
  }
}

export async function getReportSummary(options: { startDate?: string | null; endDate?: string | null } = {}) {
  const { start, end } = buildDateRangeFilter(options.startDate, options.endDate)
  const period = `${dateFormatter.format(start)} - ${dateFormatter.format(new Date(end.getTime() - 1))}`

  const [visitsInRange, newPatients, diagnosisGroup, medicineUsage, lowStock] = await Promise.all([
    prisma.visit.count({
      where: {
        visitDate: {
          gte: start,
          lt: end,
        },
      },
    }),
    prisma.patient.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    }),
    prisma.diagnosis.groupBy({
      by: ["name"],
      where: {
        medicalRecord: {
          visit: {
            visitDate: {
              gte: start,
              lt: end,
            },
          },
        },
      },
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
      take: 1,
    }),
    prisma.prescriptionItem.groupBy({
      by: ["medicineId"],
      where: {
        prescription: {
          status: "PROCESSED",
          processedAt: {
            gte: start,
            lt: end,
          },
        },
      },
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
    { label: "Kunjungan", period, value: String(visitsInRange), trend: "Range" },
    { label: "Pasien baru", period, value: String(newPatients), trend: "Range" },
    { label: "Diagnosa terbanyak", period, value: diagnosisGroup[0]?.name ?? "-", trend: diagnosisGroup[0]?._count.name ? `${diagnosisGroup[0]._count.name} kasus` : "-" },
    {
      label: "Penggunaan obat",
      period,
      value: topMedicine?.name ?? "-",
      trend: topMedicine ? `${topMedicine.name}` : "-",
    },
    { label: "Obat stok rendah", period: "Inventori", value: String(lowStock), trend: "Butuh cek" },
  ]
}

export async function getReportDetails(options: { startDate?: string | null; endDate?: string | null } = {}) {
  const { start, end } = buildDateRangeFilter(options.startDate, options.endDate)
  const [diagnoses, treatments, medicineUsage, stockReport] = await Promise.all([
    prisma.diagnosis.groupBy({
      by: ["name"],
      where: {
        medicalRecord: {
          visit: {
            visitDate: {
              gte: start,
              lt: end,
            },
          },
        },
      },
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
      take: 8,
    }),
    prisma.treatment.groupBy({
      by: ["name"],
      where: {
        medicalRecord: {
          visit: {
            visitDate: {
              gte: start,
              lt: end,
            },
          },
        },
      },
      _count: { name: true },
      _sum: { cost: true },
      orderBy: { _count: { name: "desc" } },
      take: 8,
    }),
    prisma.prescriptionItem.groupBy({
      by: ["medicineId"],
      where: {
        prescription: {
          status: "PROCESSED",
          processedAt: {
            gte: start,
            lt: end,
          },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.medicine.findMany({
      where: {
        OR: [{ status: { in: ["LOW_STOCK", "EXPIRED"] } }, { stock: { lte: prisma.medicine.fields.minimumStock } }, { expirationDate: { lt: startOfToday() } }],
      },
      orderBy: [{ status: "desc" }, { stock: "asc" }, { name: "asc" }],
      take: 12,
      select: {
        id: true,
        code: true,
        name: true,
        stock: true,
        minimumStock: true,
        unit: true,
        status: true,
        expirationDate: true,
      },
    }),
  ])

  const medicineIds = medicineUsage.map((item) => item.medicineId)
  const medicines = medicineIds.length
    ? await prisma.medicine.findMany({
        where: { id: { in: medicineIds } },
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
        },
      })
    : []
  const medicineById = new Map(medicines.map((medicine) => [medicine.id, medicine]))

  return {
    diagnoses: diagnoses.map((diagnosis) => ({
      name: diagnosis.name,
      count: diagnosis._count.name,
    })),
    treatments: treatments.map((treatment) => ({
      name: treatment.name,
      count: treatment._count.name,
      totalCost: treatment._sum.cost?.toString() ?? "0",
    })),
    medicineUsage: medicineUsage.map((item) => {
      const medicine = medicineById.get(item.medicineId)

      return {
        code: medicine?.code ?? "-",
        name: medicine?.name ?? "Obat tidak ditemukan",
        quantity: item._sum.quantity ?? 0,
        unit: medicine?.unit ?? "-",
      }
    }),
    stockReport: stockReport.map((medicine) => ({
      code: medicine.code,
      name: medicine.name,
      stock: medicine.stock,
      minimumStock: medicine.minimumStock,
      unit: medicine.unit,
      expires: medicine.expirationDate ? medicine.expirationDate.toISOString().slice(0, 10) : "-",
      status: getMedicineDisplayStatus(medicine),
    })),
  }
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
    risk: log.action.includes("MEDICAL_RECORD") || log.action.includes("PRESCRIPTION") || log.action.includes("MEDICAL_DOCUMENT") || log.action === "LOGIN_FAILED" ? "Sensitif" : "Normal",
    beforeData: summarizeJson(log.beforeData),
    afterData: summarizeJson(log.afterData),
  }))
}

export async function getUserList() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      role: {
        select: {
          key: true,
          name: true,
        },
      },
    },
  })

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role.name,
    roleKey: user.role.key,
    status: userStatusLabels[user.status],
    lastLogin: user.lastLoginAt ? `${dateFormatter.format(user.lastLoginAt)} ${timeFormatter.format(user.lastLoginAt)}` : "-",
    createdAt: dateFormatter.format(user.createdAt),
  }))
}

export async function getRoleOptions() {
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
    },
  })

  return roles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
  }))
}

export type PatientListItem = Awaited<ReturnType<typeof getPatientList>>[number]
export type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>
export type VisitListItem = Awaited<ReturnType<typeof getVisitList>>[number]
export type VisitFormOptions = Awaited<ReturnType<typeof getVisitFormOptions>>
export type ClinicalWorklistItem = Awaited<ReturnType<typeof getClinicalWorklist>>[number]
export type MedicalRecordHistoryItem = Awaited<ReturnType<typeof getMedicalRecordHistory>>[number]
export type PrescriptionListItem = Awaited<ReturnType<typeof getPrescriptionList>>[number]
export type MedicineListItem = Awaited<ReturnType<typeof getMedicineList>>[number]
export type PrescriptionFormOptions = Awaited<ReturnType<typeof getPrescriptionFormOptions>>
export type MedicalDocumentListItem = Awaited<ReturnType<typeof getMedicalDocumentList>>[number]
export type DocumentFormOptions = Awaited<ReturnType<typeof getDocumentFormOptions>>
export type ReportSummaryItem = Awaited<ReturnType<typeof getReportSummary>>[number]
export type ReportDetails = Awaited<ReturnType<typeof getReportDetails>>
export type AuditLogListItem = Awaited<ReturnType<typeof getAuditLogList>>[number]
export type UserListItem = Awaited<ReturnType<typeof getUserList>>[number]
export type RoleOptionItem = Awaited<ReturnType<typeof getRoleOptions>>[number]
