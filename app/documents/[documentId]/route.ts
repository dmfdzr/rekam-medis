import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/auth/audit-log"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canAccess } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const documentTypeLabels = {
  LAB_RESULT: "Hasil lab",
  REFERRAL_LETTER: "Surat rujukan",
  CONTROL_LETTER: "Surat kontrol",
  EXAMINATION_PHOTO: "Foto pemeriksaan",
  SUPPORTING_DOCUMENT: "Dokumen pendukung",
  OTHER: "Lainnya",
} as const

const genderLabels = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
  UNDETERMINED: "Tidak dapat ditentukan",
  UNKNOWN: "Tidak diketahui",
  NOT_FILLED: "Tidak mengisi",
} as const

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function decodeReferenceNote(value: string) {
  if (!value.startsWith("reference:")) {
    return null
  }

  try {
    return decodeURIComponent(value.replace(/^reference:/, ""))
  } catch {
    return value.replace(/^reference:/, "")
  }
}

function contentDispositionFileName(fileName: string) {
  return fileName.replace(/["\\\r\n]/g, "_")
}

function section(title: string, rows: Array<[string, string | number | null | undefined]>) {
  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      <dl>
        ${rows
          .map(
            ([label, value]) => `
              <div>
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(value)}</dd>
              </div>
            `,
          )
          .join("")}
      </dl>
    </section>
  `
}

export async function GET(request: Request, context: { params: Promise<{ documentId: string }> }) {
  const user = await getCurrentUser()

  if (!user || !canAccess(user.role, "documents")) {
    return NextResponse.json({ message: "Akses dokumen ditolak." }, { status: 403 })
  }

  const { documentId } = await context.params
  const document = await prisma.medicalDocument.findUnique({
    where: { id: documentId },
    include: {
      patient: true,
      uploadedBy: {
        select: {
          name: true,
        },
      },
      visit: {
        include: {
          doctor: {
            select: {
              name: true,
            },
          },
          vitalSign: true,
          medicalRecord: {
            include: {
              doctor: {
                select: {
                  name: true,
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
                          unit: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!document) {
    return NextResponse.json({ message: "Dokumen tidak ditemukan." }, { status: 404 })
  }

  const referenceNote = decodeReferenceNote(document.fileUrl)
  const record = document.visit?.medicalRecord
  const vitalSign = document.visit?.vitalSign
  const prescriptionItems =
    record?.prescription?.items.map((item) => `${item.medicine.name} ${item.quantity} ${item.medicine.unit} - ${item.dosage} - ${item.usageRule}`).join("; ") ?? "-"

  const html = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(document.fileName)} - MedNote</title>
    <style>
      :root { color-scheme: light; font-family: Arial, sans-serif; color: #172033; background: #f7fafc; }
      body { margin: 0; padding: 32px; }
      main { max-width: 920px; margin: 0 auto; background: white; border: 1px solid #d9e2ec; border-radius: 12px; padding: 32px; }
      header { border-bottom: 2px solid #0f766e; padding-bottom: 18px; margin-bottom: 24px; }
      h1 { margin: 0; font-size: 24px; color: #0f172a; }
      .meta { margin-top: 8px; color: #526070; font-size: 13px; }
      section { margin-top: 22px; }
      h2 { font-size: 15px; color: #0f766e; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .04em; }
      dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; }
      div { min-width: 0; }
      dt { font-size: 12px; color: #64748b; margin-bottom: 3px; }
      dd { margin: 0; font-size: 14px; line-height: 1.5; color: #172033; overflow-wrap: anywhere; }
      .note { border-left: 4px solid #0f766e; background: #f0fdfa; padding: 12px 14px; line-height: 1.6; }
      footer { margin-top: 28px; border-top: 1px solid #d9e2ec; padding-top: 14px; font-size: 12px; color: #64748b; }
      @media print { body { background: white; padding: 0; } main { border: 0; border-radius: 0; } }
      @media (max-width: 640px) { body { padding: 14px; } main { padding: 18px; } dl { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>${escapeHtml(document.fileName)}</h1>
        <p class="meta">MedNote - ${escapeHtml(documentTypeLabels[document.type])} - dibuat saat dibuka pada ${escapeHtml(dateTimeFormatter.format(new Date()))}</p>
      </header>
      ${section("Data Pasien", [
        ["No. Rekam Medis", document.patient.medicalRecordNumber],
        ["Nama", document.patient.fullName],
        ["NIK", document.patient.nik ?? "-"],
        ["Tanggal Lahir", dateFormatter.format(document.patient.birthDate)],
        ["Jenis Kelamin", genderLabels[document.patient.gender]],
        ["Telepon", document.patient.phone],
        ["Golongan Darah", document.patient.bloodType],
        ["Alergi", document.patient.allergies],
        ["Alamat", document.patient.address],
      ])}
      ${document.visit ? section("Data Kunjungan", [
        ["Tanggal Kunjungan", dateTimeFormatter.format(document.visit.visitDate)],
        ["Layanan", document.visit.service],
        ["Keluhan Utama", document.visit.chiefComplaint],
        ["Dokter", document.visit.doctor?.name],
        ["Status", document.visit.status],
      ]) : ""}
      ${vitalSign ? section("Tanda Vital", [
        ["Tekanan Darah", vitalSign.bloodPressure],
        ["Suhu Tubuh", vitalSign.temperature ? `${vitalSign.temperature.toString()} C` : "-"],
        ["Berat Badan", vitalSign.weight ? `${vitalSign.weight.toString()} kg` : "-"],
        ["Tinggi Badan", vitalSign.height ? `${vitalSign.height.toString()} cm` : "-"],
        ["Nadi", vitalSign.pulse ? `${vitalSign.pulse} x/menit` : "-"],
        ["Respirasi", vitalSign.respiration ? `${vitalSign.respiration} x/menit` : "-"],
        ["Saturasi Oksigen", vitalSign.oxygenSaturation ? `${vitalSign.oxygenSaturation}%` : "-"],
        ["Catatan Perawat", vitalSign.nurseNote],
      ]) : ""}
      ${record ? section("Rekam Medis", [
        ["Dokter Pemeriksa", record.doctor?.name],
        ["Subjective", record.subjective],
        ["Objective", record.objective],
        ["Assessment", record.assessment],
        ["Plan", record.plan],
        ["Pemeriksaan Fisik", record.physicalExam],
        ["Catatan Dokter", record.doctorNote],
        ["Status", record.status],
        ["Finalisasi", record.finalizedAt ? dateTimeFormatter.format(record.finalizedAt) : "-"],
      ]) : ""}
      ${record?.diagnoses.length ? section("Diagnosa", record.diagnoses.map((diagnosis) => [diagnosis.type === "PRIMARY" ? "Diagnosa Utama" : "Diagnosa Tambahan", `${diagnosis.code ? `${diagnosis.code} - ` : ""}${diagnosis.name}${diagnosis.note ? ` (${diagnosis.note})` : ""}`])) : ""}
      ${record?.treatments.length ? section("Tindakan", record.treatments.map((treatment) => [treatment.code ?? "Tindakan", `${treatment.name}${treatment.note ? ` (${treatment.note})` : ""}`])) : ""}
      ${record?.prescription ? section("Resep", [
        ["Status", record.prescription.status],
        ["Item Obat", prescriptionItems],
      ]) : ""}
      ${referenceNote ? `<section><h2>Referensi Dokumen Eksternal</h2><p class="note">${escapeHtml(referenceNote)}</p></section>` : ""}
      <footer>
        Dicatat oleh ${escapeHtml(document.uploadedBy?.name ?? "System")} pada ${escapeHtml(dateTimeFormatter.format(document.uploadedAt))}. Dokumen ini dibuat otomatis dari data yang tersimpan di MedNote.
      </footer>
    </main>
  </body>
</html>`

  const forwardedFor = request.headers.get("x-forwarded-for")
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip")

  await writeAuditLog({
    userId: user.id,
    action: "GENERATE_MEDICAL_DOCUMENT",
    entityName: "MedicalDocument",
    entityId: documentId,
    afterData: {
      fileName: document.fileName,
      type: document.type,
      patientName: document.patient.fullName,
      medicalRecordNumber: document.patient.medicalRecordNumber,
      generatedOnDemand: true,
    },
    ipAddress,
    userAgent: request.headers.get("user-agent"),
  })

  return new Response(html, {
    headers: {
      "Content-Disposition": `inline; filename="${contentDispositionFileName(document.fileName)}.html"`,
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
