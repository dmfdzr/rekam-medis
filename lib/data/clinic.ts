import "server-only"

import type { Prisma } from "@prisma/client"

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

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

const genderLabels = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
  UNDETERMINED: "Tidak dapat ditentukan",
  UNKNOWN: "Tidak diketahui",
  NOT_FILLED: "Tidak mengisi",
} as const

const patientStatusLabels = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  DECEASED: "Meninggal",
} as const

const visitStatusLabels = {
  WAITING: "Proses Asesmen",
  VITAL_SIGN: "Proses Laboratorium",
  EXAMINATION: "Proses Resep",
  PHARMACY: "Proses CPPT",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
} as const

const medicalRecordStatusLabels = {
  DRAFT: "Draft",
  FINAL: "Final",
} as const

const prescriptionStatusLabels = {
  PENDING: "Pending",
  PROCESSED: "Diproses",
  CANCELLED: "Dibatalkan",
} as const

const documentTypeLabels = {
  LAB_RESULT: "Hasil lab",
  REFERRAL_LETTER: "Surat rujukan",
  CONTROL_LETTER: "Surat kontrol",
  EXAMINATION_PHOTO: "Foto pemeriksaan",
  OTHER: "Lainnya",
} as const

const patientTypeLabels = {
  BPJS: "BPJS",
  UMUM: "Umum",
  ASURANSI: "Asuransi",
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

  return `${age} tahun`
}

function formatStructuredAddress(patient: { address: string | null; province: string | null; city: string | null; district: string | null }) {
  const region = [patient.district, patient.city, patient.province].filter(Boolean).join(", ")
  const detail = patient.address?.trim()

  if (region && detail) {
    return `${region} - ${detail}`
  }

  return region || detail || "-"
}

function formatRegionAddress(patient: { province: string | null; city: string | null; district: string | null }) {
  return [patient.district, patient.city, patient.province].filter(Boolean).join(", ") || "Alamat belum terstruktur"
}

function startOfToday() {
  const now = new Date()

  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function summarizeJson(value: unknown) {
  if (!value) {
    return "-"
  }

  const text = JSON.stringify(value, null, 2)

  return text.length > 1200 ? `${text.slice(0, 1200)}...` : text
}

export async function getDashboardSummary() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const nextDay = new Date(startOfDay)
  nextDay.setDate(nextDay.getDate() + 1)

  const [todayVisits, activePatients, activeVisits, documentSummary, visitStatusGroups] = await Promise.all([
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
    prisma.visit.count({
      where: {
        status: {
          in: ["WAITING", "VITAL_SIGN", "EXAMINATION", "PHARMACY"],
        },
      },
    }),
    prisma.medicalRecord.groupBy({
      by: ["isVerified"],
      where: {
        status: "FINAL",
        visit: {
          status: "COMPLETED",
        },
      },
      _count: { isVerified: true },
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

  const verifiedDocuments = documentSummary.find((group) => group.isVerified)?._count.isVerified ?? 0
  const unverifiedDocuments = documentSummary.find((group) => !group.isVerified)?._count.isVerified ?? 0
  const totalDocuments = verifiedDocuments + unverifiedDocuments
  const queue = [
    ...["WAITING", "VITAL_SIGN", "EXAMINATION", "PHARMACY"].map((status) => ({
      status: visitStatusLabels[status as keyof typeof visitStatusLabels],
      count: String(visitStatusGroups.find((group) => group.status === status)?._count.status ?? 0),
      unit: "pasien",
    })),
    {
      status: "Proses Verifikasi",
      count: String(unverifiedDocuments),
      unit: "dokumen",
    },
  ]

  return {
    metrics: [
      { label: "Pasien aktif", value: String(activePatients), change: "Total", detail: "Data pasien aktif", tone: "text-teal-700 dark:text-teal-300" },
      { label: "Kunjungan hari ini", value: String(todayVisits), change: "Realtime", detail: "Hari berjalan", tone: "text-sky-700 dark:text-sky-300" },
      { label: "Kunjungan Aktif", value: String(activeVisits), change: "Berjalan", detail: "Belum selesai atau dibatalkan", tone: "text-indigo-700 dark:text-indigo-300" },
      { label: "Dokumen Medis", value: String(totalDocuments), change: "Total", detail: "Seluruh dokumen medis", tone: "text-amber-700 dark:text-amber-300" },
    ],
    queue,
  }
}

export async function getPatientList() {
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      visits: {
        orderBy: { visitDate: "desc" },
        take: 3,
        select: {
          id: true,
          service: true,
          status: true,
          visitDate: true,
          medicalRecord: {
            select: {
              id: true,
              status: true,
              assessment: true,
              updatedAt: true,
              diagnoses: {
                orderBy: { createdAt: "asc" },
                take: 1,
                select: {
                  name: true,
                },
              },
              treatments: {
                orderBy: { createdAt: "asc" },
                take: 2,
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
        take: 3,
        select: {
          id: true,
          type: true,
          fileName: true,
          uploadedAt: true,
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
    birthDate: dateFormatter.format(patient.birthDate),
    age: calculateAge(patient.birthDate),
    phone: patient.phone ?? "-",
    address: formatStructuredAddress(patient),
    addressDetail: patient.address ?? "-",
    province: patient.province ?? "-",
    city: patient.city ?? "-",
    district: patient.district ?? "-",
    regionAddress: formatRegionAddress(patient),
    bloodType: patient.bloodType ?? "-",
    allergy: patient.allergies ?? "Tidak ada",
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
    recentMedicalRecords: patient.visits
      .filter((visit) => visit.medicalRecord)
      .map((visit) => ({
        id: visit.medicalRecord?.id ?? visit.id,
        service: visit.service,
        date: dateFormatter.format(visit.visitDate),
        status: medicalRecordStatusLabels[visit.medicalRecord?.status ?? "DRAFT"],
        assessment: visit.medicalRecord?.assessment ?? visit.medicalRecord?.diagnoses[0]?.name ?? "-",
        treatments: visit.medicalRecord?.treatments.map((treatment) => treatment.name).join(", ") || "-",
      })),
    recentDocuments: patient.documents.map((document) => ({
      id: document.id,
      type: documentTypeLabels[document.type],
      fileName: document.fileName,
      uploadedAt: dateFormatter.format(document.uploadedAt),
      fileUrl: `/documents/${document.id}`,
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
      companionDoctors: {
        orderBy: { order: "asc" },
        include: {
          doctor: {
            select: { name: true },
          },
        },
      },
    },
  })

  return visits.map((visit) => {
    const lengthOfStayDays = visit.dischargeDate
      ? Math.ceil((visit.dischargeDate.getTime() - visit.admissionDate.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      id: visit.id,
      patient: visit.patient.fullName,
      medicalRecordNumber: visit.patient.medicalRecordNumber,
      service: visit.service,
      doctor: visit.doctor?.name ?? "Belum ditentukan",
      complaint: visit.chiefComplaint,
      status: visitStatusLabels[visit.status],
      time: timeFormatter.format(visit.visitDate),
      admissionDate: dateFormatter.format(visit.admissionDate),
      dischargeDate: visit.dischargeDate ? dateFormatter.format(visit.dischargeDate) : "-",
      lengthOfStay: lengthOfStayDays !== null ? `${lengthOfStayDays} hari` : "Masih dirawat",
      patientType: patientTypeLabels[visit.patientType],
      isJointCare: visit.isJointCare,
      companionDoctors: visit.companionDoctors.map((c) => c.doctor.name),
    }
  })
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

  const predefinedServices = [
    "IGD (Instalasi Gawat Darurat)",
    "Poli Umum",
    "Poli Penyakit Dalam",
    "Poli Anak",
    "Poli Bedah",
    "Poli Kandungan & Kebidanan",
    "Poli Saraf",
    "Poli Jantung",
    "Poli Paru",
    "Poli Mata",
    "Poli THT",
    "Poli Gigi",
    "Poli Kulit & Kelamin",
    "Poli Orthopedi",
    "Poli Urologi",
    "Poli Jiwa/Psikiatri",
    "ICU/NICU/PICU",
    "Kamar Operasi (post operasi)",
    "Rujukan dari Puskesmas/Klinik",
    "Pasien datang lewat Ambulans",
    "MCU/check up lalu perlu dirawat",
    "Hemodialisa/cuci darah lalu kondisi memburuk",
    "Ruang bersalin/melahirkan lalu rawat inap"
  ]

  return {
    patients: patients.map((patient) => ({
      id: patient.id,
      label: `${patient.medicalRecordNumber} - ${patient.fullName}`,
    })),
    doctors,
    services: predefinedServices,
  }
}

export async function getClinicalWorklist(
  scope:
    | "active"
    | "assessmentList"
    | "assessmentOptions"
    | "laboratoryList"
    | "laboratoryOptions"
    | "recordable" = "active",
) {
  const where: Prisma.VisitWhereInput =
    scope === "recordable"
      ? {
          status: "PHARMACY" as const,
          medicalRecord: {
            prescription: {
              status: "PROCESSED" as const,
            },
          },
        }
      : scope === "assessmentList"
        ? {
            medicalRecord: {
              isNot: null,
            },
          }
      : scope === "assessmentOptions"
        ? {
            status: "WAITING" as const,
            medicalRecord: {
              is: null,
            },
          }
      : scope === "laboratoryList"
        ? {
            laboratoryResult: {
              isNot: null,
            },
          }
      : scope === "laboratoryOptions"
        ? {
            status: {
              in: ["VITAL_SIGN", "EXAMINATION"],
            },
            medicalRecord: {
              isNot: null,
            },
          }
      : {
          status: {
            in: ["WAITING", "VITAL_SIGN", "EXAMINATION", "PHARMACY"],
          },
        }

  const visits = await prisma.visit.findMany({
    where,
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
      laboratoryResult: true,
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
    workflowStatus: visit.status,
    status: visitStatusLabels[visit.status],
    time: timeFormatter.format(visit.visitDate),
    laboratoryResult: visit.laboratoryResult
      ? {
        examinationDate: visit.laboratoryResult.examinationDate.toISOString().slice(0, 10),
        hemoglobin: visit.laboratoryResult.hemoglobin?.toString() ?? "",
        leukosit: visit.laboratoryResult.leukosit?.toString() ?? "",
        gds: visit.laboratoryResult.gds?.toString() ?? "",
        crp: visit.laboratoryResult.crp?.toString() ?? "",
      }
      : null,
    vitalSign: visit.vitalSign
      ? {
        bloodPressure: visit.vitalSign.bloodPressure ?? "",
        temperature: visit.vitalSign.temperature?.toString() ?? "",
        weight: visit.vitalSign.weight?.toString() ?? "",
        height: visit.vitalSign.height?.toString() ?? "",
        pulse: visit.vitalSign.pulse?.toString() ?? "",
        respiration: visit.vitalSign.respiration?.toString() ?? "",
        oxygenSaturation: visit.vitalSign.oxygenSaturation?.toString() ?? "",
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
    where: {
      visit: {
        status: {
          in: ["PHARMACY", "COMPLETED"],
        },
      },
      prescription: {
        is: {
          status: "PROCESSED",
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
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
              address: true,
              phone: true,
              allergies: true,
            },
          },
          laboratoryResult: true,
          documents: {
            orderBy: { uploadedAt: "desc" },
            take: 3,
            select: {
              id: true,
              fileName: true,
              type: true,
              uploadedAt: true,
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
          items: true,
        },
      },
    },
  })

  const cpptRecords = records
    .filter((record) => {
      if (record.status === "FINAL") {
        return true
      }

      const prescriptionProcessedAt = record.prescription?.processedAt

      return Boolean(prescriptionProcessedAt && record.updatedAt.getTime() >= prescriptionProcessedAt.getTime())
    })
    .slice(0, 50)

  return cpptRecords.map((record) => {
    const primaryDiagnosis = record.diagnoses.find((diagnosis) => diagnosis.type === "PRIMARY")

    return {
      id: record.id,
      patient: record.visit.patient.fullName,
      medicalRecordNumber: record.visit.patient.medicalRecordNumber,
      patientMeta: `${genderLabels[record.visit.patient.gender]}, ${calculateAge(record.visit.patient.birthDate)}`,
      patientAddress: record.visit.patient.address ?? "-",
      patientPhone: record.visit.patient.phone ?? "-",
      allergies: record.visit.patient.allergies ?? "Tidak ada",
      visitDate: dateFormatter.format(record.visit.visitDate),
      visitTime: timeFormatter.format(record.visit.visitDate),
      service: record.visit.service,
      doctor: record.doctor?.name ?? "Belum ditentukan",
      status: medicalRecordStatusLabels[record.status],
      chiefComplaint: record.visit.chiefComplaint,
      subjective: record.subjective ?? "-",
      objective: record.objective ?? "-",
      assessment: record.assessment ?? primaryDiagnosis?.name ?? "-",
      plan: record.plan ?? "-",
      physicalExam: record.physicalExam ?? "-",
      doctorNote: record.doctorNote ?? "-",
      followUpDate: record.followUpDate ? dateFormatter.format(record.followUpDate) : "-",
      diagnosis: primaryDiagnosis?.name ?? record.diagnoses[0]?.name ?? "-",
      diagnosisItems: record.diagnoses.map((diagnosis) => ({
        id: diagnosis.id,
        code: diagnosis.code ?? "-",
        name: diagnosis.name,
        type: diagnosis.type === "PRIMARY" ? "Utama" : "Tambahan",
        note: diagnosis.note ?? "-",
      })),
      treatments: record.treatments.map((treatment) => treatment.name).join(", ") || "-",
      treatmentItems: record.treatments.map((treatment) => ({
        id: treatment.id,
        code: treatment.code ?? "-",
        name: treatment.name,
        cost: treatment.cost?.toString() ?? "-",
        note: treatment.note ?? "-",
      })),
      prescriptions: record.prescription?.items.map((item) => `${item.medicineName} (${item.quantity})`).join(", ") ?? "-",
      prescriptionItems:
        record.prescription?.items.map((item) => ({
          id: item.id,
          medicine: item.medicineName,
          dosage: item.dosage,
          usageRule: item.usageRule,
          quantity: String(item.quantity),
          note: item.note ?? "-",
        })) ?? [],
      laboratoryResult: record.visit.laboratoryResult
        ? `Hb: ${record.visit.laboratoryResult.hemoglobin?.toString() ?? "-"} g/dl, Leu: ${record.visit.laboratoryResult.leukosit?.toString() ?? "-"} micro/l`
        : "-",
      laboratoryDetail: record.visit.laboratoryResult
        ? {
          examinationDate: record.visit.laboratoryResult.examinationDate.toISOString().slice(0, 10),
          hemoglobin: record.visit.laboratoryResult.hemoglobin?.toString() ?? "-",
          leukosit: record.visit.laboratoryResult.leukosit?.toString() ?? "-",
          gds: record.visit.laboratoryResult.gds?.toString() ?? "-",
          crp: record.visit.laboratoryResult.crp?.toString() ?? "-",
        }
        : null,
      documents: record.visit.documents.map((document) => `${documentTypeLabels[document.type]}: ${document.fileName}`).join(", ") || "-",
      documentItems: record.visit.documents.map((document) => ({
        id: document.id,
        type: documentTypeLabels[document.type],
        fileName: document.fileName,
        uploadedAt: dateFormatter.format(document.uploadedAt),
        fileUrl: `/documents/${document.id}`,
      })),
      documentUrl: `/medical-records/${record.id}/document`,
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
      items: true,
    },
  })

  return prescriptions.map((prescription) => ({
    id: prescription.id,
    patient: prescription.medicalRecord.visit.patient.fullName,
    medicalRecordNumber: prescription.medicalRecord.visit.patient.medicalRecordNumber,
    doctor: prescription.doctor?.name ?? "Belum ditentukan",
    pharmacist: prescription.pharmacist?.name ?? "-",
    items: prescription.items.map((item) => `${item.medicineName} (${item.quantity})`).join(", ") || "-",
    itemDetails: prescription.items.map((item) => ({
      id: item.id,
      medicine: item.medicineName,
      dosage: item.dosage,
      usageRule: item.usageRule,
      quantity: item.quantity,
      note: item.note ?? "-",
    })),
    status: prescriptionStatusLabels[prescription.status],
    canProcess:
      prescription.status === "PENDING" &&
      prescription.items.length > 0,
    createdAt: dateFormatter.format(prescription.createdAt),
  }))
}

export async function getPrescriptionFormOptions() {
  const records = await prisma.medicalRecord.findMany({
    where: {
      status: "DRAFT",
      visit: {
        status: "EXAMINATION",
        laboratoryResult: {
          isNot: null,
        },
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
  })

  return {
    records: records.map((record) => ({
      id: record.id,
      label: `${record.visit.patient.medicalRecordNumber} - ${record.visit.patient.fullName} - ${record.visit.service}`,
    })),
  }
}

export async function getMedicalDocumentList() {
  const records = await prisma.medicalRecord.findMany({
    where: {
      status: "FINAL",
      visit: {
        status: "COMPLETED",
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
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
      doctor: {
        select: {
          name: true,
        },
      },
      verifiedBy: {
        select: {
          name: true,
        },
      },
    },
  })

  return records.map((record) => ({
    id: record.id,
    patient: record.visit.patient.fullName,
    medicalRecordNumber: record.visit.patient.medicalRecordNumber,
    visit: `${record.visit.service} - ${dateFormatter.format(record.visit.visitDate)}`,
    doctor: record.doctor?.name ?? "-",
    status: record.status,
    isVerified: record.isVerified,
    verifiedBy: record.verifiedBy?.name ?? "-",
    verifiedAt: record.verifiedAt ? dateTimeFormatter.format(record.verifiedAt) : "-",
    documentUrl: `/medical-records/${record.id}/document`,
    updatedAt: dateFormatter.format(record.updatedAt),
    filterDate: toDateInputValue(record.updatedAt),
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

  const [visitsInRange, newPatients, diagnosisGroup] = await Promise.all([
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
  ])

  return [
    { label: "Kunjungan", period, value: String(visitsInRange), trend: "Range" },
    { label: "Pasien baru", period, value: String(newPatients), trend: "Range" },
    { label: "Diagnosa terbanyak", period, value: diagnosisGroup[0]?.name ?? "-", trend: diagnosisGroup[0]?._count.name ? `${diagnosisGroup[0]._count.name} kasus` : "-" },
  ]
}

export async function getReportDetails(options: { startDate?: string | null; endDate?: string | null } = {}) {
  const { start, end } = buildDateRangeFilter(options.startDate, options.endDate)
  const [diagnoses, treatments, diagnosisOptions, diagnosisMap] = await Promise.all([
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
      take: 10,
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
      take: 100,
    }),
    getDiagnosisMapReport({ startDate: options.startDate, endDate: options.endDate }),
  ])

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
    diagnosisOptions: diagnosisOptions.map((diagnosis) => ({
      name: diagnosis.name,
      count: diagnosis._count.name,
    })),
    diagnosisMap,
  }
}

export type DiagnosisMapOptions = {
  startDate?: string | null
  endDate?: string | null
  diagnosis?: string | null
  diagnosisType?: "PRIMARY" | "SECONDARY" | "ALL" | null
  level?: "district" | "city" | null
}

type DiagnosisMapLocation = {
  region: string
  province: string
  city: string
  district: string
  caseCount: number
  patientCount: number
  latitude: number | null
  longitude: number | null
  topDiagnoses: { name: string; count: number }[]
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function geocodeRegionCentroid(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", query)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "1")
  url.searchParams.set("countrycodes", "id")

  const response = await fetch(url, {
    headers: {
      "User-Agent": "MedNote-Rekam-Medis/0.0.1",
      "Accept-Language": "id",
    },
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as { lat?: string; lon?: string }[]
  const first = payload[0]
  const latitude = first?.lat ? Number(first.lat) : Number.NaN
  const longitude = first?.lon ? Number(first.lon) : Number.NaN

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null
  }

  return { latitude, longitude }
}

async function cacheMissingRegionCentroids(locations: DiagnosisMapLocation[], level: "district" | "city") {
  const missingLocations = locations
    .filter((location) => location.region !== "Alamat belum terstruktur" && (location.latitude === null || location.longitude === null))
    .slice(0, 5)

  for (const [index, location] of missingLocations.entries()) {
    if (index > 0) {
      await wait(1100)
    }

    const query = level === "city"
      ? `${location.city}, ${location.province}, Indonesia`
      : `${location.district}, ${location.city}, ${location.province}, Indonesia`
    const centroid = await geocodeRegionCentroid(query).catch(() => null)

    if (!centroid) {
      continue
    }

    const region = await prisma.region.findFirst({
      where: {
        name: level === "city" ? location.city : location.district,
        type: level === "city" ? "CITY" : "DISTRICT",
        parent: {
          name: level === "city" ? location.province : location.city,
        },
      },
      select: {
        id: true,
      },
    })

    if (!region) {
      continue
    }

    await prisma.region.update({
      where: { id: region.id },
      data: {
        latitude: centroid.latitude.toFixed(7),
        longitude: centroid.longitude.toFixed(7),
      },
    })

    location.latitude = centroid.latitude
    location.longitude = centroid.longitude
  }
}

export async function getRegionOptions(options: { parentCode?: string | null; type?: "PROVINCE" | "CITY" | "DISTRICT" | null } = {}) {
  const regions = await prisma.region.findMany({
    where: {
      ...(options.parentCode
        ? {
            parent: {
              code: options.parentCode,
            },
          }
        : {}),
      ...(options.type ? { type: options.type } : {}),
    },
    orderBy: [{ name: "asc" }],
    select: {
      code: true,
      name: true,
      type: true,
      parent: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  })

  return regions.map((region) => ({
    code: region.code,
    name: region.name,
    type: region.type,
    parentCode: region.parent?.code ?? null,
    parentName: region.parent?.name ?? null,
  }))
}

export async function getDiagnosisMapReport(options: DiagnosisMapOptions = {}) {
  const { start, end } = buildDateRangeFilter(options.startDate, options.endDate)
  const level = options.level === "city" ? "city" : "district"
  const diagnosisType = options.diagnosisType && options.diagnosisType !== "ALL" ? options.diagnosisType : undefined
  const diagnosisFilter = options.diagnosis?.trim()
  const diagnoses = await prisma.diagnosis.findMany({
    where: {
      ...(diagnosisType ? { type: diagnosisType } : {}),
      ...(diagnosisFilter
        ? {
            name: {
              contains: diagnosisFilter,
              mode: "insensitive",
            },
          }
        : {}),
      medicalRecord: {
        visit: {
          visitDate: {
            gte: start,
            lt: end,
          },
        },
      },
    },
    take: 5000,
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      medicalRecord: {
        select: {
          visit: {
            select: {
              patientId: true,
              patient: {
                select: {
                  province: true,
                  city: true,
                  district: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const regions = await prisma.region.findMany({
    where: {
      type: {
        in: level === "city" ? ["CITY"] : ["CITY", "DISTRICT"],
      },
    },
    include: {
      parent: {
        include: {
          parent: true,
        },
      },
    },
  })
  const regionLookup = new Map<string, { latitude: number | null; longitude: number | null }>()

  for (const region of regions) {
    const parentName = region.parent?.name ?? ""
    const grandParentName = region.parent?.parent?.name ?? ""
    const cityKey = `${region.name}|${parentName}`
    const districtKey = `${region.name}|${parentName}|${grandParentName}`

    if (region.type === "CITY") {
      regionLookup.set(cityKey, {
        latitude: region.latitude ? Number(region.latitude) : null,
        longitude: region.longitude ? Number(region.longitude) : null,
      })
    }

    if (region.type === "DISTRICT") {
      regionLookup.set(districtKey, {
        latitude: region.latitude ? Number(region.latitude) : null,
        longitude: region.longitude ? Number(region.longitude) : null,
      })
    }
  }

  const grouped = new Map<
    string,
    {
      region: string
      province: string
      city: string
      district: string
      caseCount: number
      patientIds: Set<string>
      diagnoses: Map<string, number>
      latitude: number | null
      longitude: number | null
    }
  >()

  for (const diagnosis of diagnoses) {
    const patient = diagnosis.medicalRecord.visit.patient
    const province = patient.province ?? ""
    const city = patient.city ?? ""
    const district = patient.district ?? ""
    const hasDistrictLocation = Boolean(province && city && district)
    const hasCityLocation = Boolean(province && city)
    const region = level === "district" && hasDistrictLocation ? district : hasCityLocation ? city : "Alamat belum terstruktur"
    const groupKey = level === "district" && hasDistrictLocation ? `${district}|${city}|${province}` : hasCityLocation ? `${city}|${province}` : "unstructured"
    const coordinates = regionLookup.get(groupKey) ?? { latitude: null, longitude: null }
    const current = grouped.get(groupKey) ?? {
      region,
      province: province || "-",
      city: city || "-",
      district: district || "-",
      caseCount: 0,
      patientIds: new Set<string>(),
      diagnoses: new Map<string, number>(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    }

    current.caseCount += 1
    current.patientIds.add(diagnosis.medicalRecord.visit.patientId)
    current.diagnoses.set(diagnosis.name, (current.diagnoses.get(diagnosis.name) ?? 0) + 1)
    grouped.set(groupKey, current)
  }

  const locations = Array.from(grouped.values())
    .map((item) => {
      const topDiagnoses = Array.from(item.diagnoses.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      return {
        region: item.region,
        province: item.province,
        city: item.city,
        district: item.district,
        caseCount: item.caseCount,
        patientCount: item.patientIds.size,
        latitude: item.latitude,
        longitude: item.longitude,
        topDiagnoses,
      }
    })
    .sort((a, b) => b.caseCount - a.caseCount)

  await cacheMissingRegionCentroids(locations, level)

  const mappedLocations = locations.filter((location) => location.latitude !== null && location.longitude !== null).length

  return {
    level,
    totalCases: diagnoses.length,
    totalPatients: new Set(diagnoses.map((diagnosis) => diagnosis.medicalRecord.visit.patientId)).size,
    totalRegions: locations.filter((location) => location.region !== "Alamat belum terstruktur").length,
    mappedLocations,
    locations,
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
    ipAddress: log.ipAddress ?? "-",
    userAgent: log.userAgent ?? "-",
    risk:
      log.action.includes("MEDICAL_RECORD") ||
        log.action.includes("PRESCRIPTION") ||
        log.action.includes("MEDICAL_DOCUMENT") ||
        log.action.includes("REPORT") ||
        log.action === "LOGIN_FAILED"
        ? "Sensitif"
        : "Normal",
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
export type PrescriptionFormOptions = Awaited<ReturnType<typeof getPrescriptionFormOptions>>
export type MedicalDocumentListItem = Awaited<ReturnType<typeof getMedicalDocumentList>>[number]
export type DocumentFormOptions = Awaited<ReturnType<typeof getDocumentFormOptions>>
export type ReportSummaryItem = Awaited<ReturnType<typeof getReportSummary>>[number]
export type ReportDetails = Awaited<ReturnType<typeof getReportDetails>>
export type RegionOptionItem = Awaited<ReturnType<typeof getRegionOptions>>[number]
export type DiagnosisMapReport = Awaited<ReturnType<typeof getDiagnosisMapReport>>
export type AuditLogListItem = Awaited<ReturnType<typeof getAuditLogList>>[number]
export type UserListItem = Awaited<ReturnType<typeof getUserList>>[number]
export type RoleOptionItem = Awaited<ReturnType<typeof getRoleOptions>>[number]

export type AppUser = { id: string; name: string; email: string; username: string; role: string; roleName: string; };
