import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/auth/audit-log"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canAccess } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const genderLabels = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
  UNDETERMINED: "Tidak dapat ditentukan",
  UNKNOWN: "Tidak diketahui",
  NOT_FILLED: "Tidak mengisi",
} as const

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function fileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120)
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

function listSection(title: string, rows: string[]) {
  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      ${
        rows.length
          ? `<ul>${rows.map((row) => `<li>${escapeHtml(row)}</li>`).join("")}</ul>`
          : `<p class="muted">Tidak ada data.</p>`
      }
    </section>
  `
}

export async function GET(request: Request, context: { params: Promise<{ recordId: string }> }) {
  const user = await getCurrentUser()

  if (!user || !canAccess(user.role, "records")) {
    return NextResponse.json({ message: "Akses rekam medis ditolak." }, { status: 403 })
  }

  const { recordId } = await context.params
  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId },
    include: {
      doctor: {
        select: {
          name: true,
        },
      },
      visit: {
        include: {
          patient: true,
          vitalSign: true,
          documents: {
            orderBy: { uploadedAt: "desc" },
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

  if (!record) {
    return NextResponse.json({ message: "Rekam medis tidak ditemukan." }, { status: 404 })
  }

  const patient = record.visit.patient
  const vitalSign = record.visit.vitalSign
  const html = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Rekam Medis ${escapeHtml(patient.medicalRecordNumber)} - MedNote</title>
    <style>
      :root { color-scheme: light; font-family: Arial, sans-serif; color: #172033; background: #f7fafc; }
      body { margin: 0; padding: 32px; }
      main { max-width: 960px; margin: 0 auto; background: white; border: 1px solid #d9e2ec; border-radius: 12px; padding: 32px; }
      header { border-bottom: 2px solid #0f766e; padding-bottom: 18px; margin-bottom: 24px; }
      h1 { margin: 0; font-size: 24px; color: #0f172a; }
      .meta, .muted { color: #526070; font-size: 13px; line-height: 1.6; }
      section { margin-top: 22px; }
      h2 { font-size: 15px; color: #0f766e; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .04em; }
      dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; }
      dt { font-size: 12px; color: #64748b; margin-bottom: 3px; }
      dd { margin: 0; font-size: 14px; line-height: 1.5; color: #172033; overflow-wrap: anywhere; }
      ul { margin: 0; padding-left: 20px; line-height: 1.7; }
      footer { margin-top: 28px; border-top: 1px solid #d9e2ec; padding-top: 14px; font-size: 12px; color: #64748b; }
      @media print { body { background: white; padding: 0; } main { border: 0; border-radius: 0; } }
      @media (max-width: 640px) { body { padding: 14px; } main { padding: 18px; } dl { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Rekam Medis Pasien</h1>
        <p class="meta">MedNote - dibuat saat dibuka pada ${escapeHtml(dateTimeFormatter.format(new Date()))}</p>
      </header>
      ${section("Data Pasien", [
        ["No. Rekam Medis", patient.medicalRecordNumber],
        ["Nama", patient.fullName],
        ["NIK", patient.nik],
        ["Tanggal Lahir", dateFormatter.format(patient.birthDate)],
        ["Jenis Kelamin", genderLabels[patient.gender]],
        ["Telepon", patient.phone],
        ["Alamat", patient.address],
        ["Alergi", patient.allergies],
      ])}
      ${section("Kunjungan", [
        ["Tanggal", dateTimeFormatter.format(record.visit.visitDate)],
        ["Layanan", record.visit.service],
        ["Keluhan Utama", record.visit.chiefComplaint],
        ["Dokter", record.doctor?.name],
        ["Status Rekam Medis", record.status],
        ["Finalisasi", record.finalizedAt ? dateTimeFormatter.format(record.finalizedAt) : "-"],
      ])}
      ${vitalSign ? section("Tanda Vital", [
        ["Tekanan Darah", vitalSign.bloodPressure],
        ["Suhu", vitalSign.temperature ? `${vitalSign.temperature.toString()} C` : "-"],
        ["Berat", vitalSign.weight ? `${vitalSign.weight.toString()} kg` : "-"],
        ["Tinggi", vitalSign.height ? `${vitalSign.height.toString()} cm` : "-"],
        ["Nadi", vitalSign.pulse ? `${vitalSign.pulse} x/menit` : "-"],
        ["Respirasi", vitalSign.respiration ? `${vitalSign.respiration} x/menit` : "-"],
        ["SpO2", vitalSign.oxygenSaturation ? `${vitalSign.oxygenSaturation}%` : "-"],
        ["Catatan", vitalSign.nurseNote],
      ]) : ""}
      ${section("SOAP", [
        ["Subjective", record.subjective],
        ["Objective", record.objective],
        ["Assessment", record.assessment],
        ["Plan", record.plan],
        ["Pemeriksaan Fisik", record.physicalExam],
        ["Catatan Dokter", record.doctorNote],
        ["Rencana Kontrol", record.followUpDate ? dateFormatter.format(record.followUpDate) : "-"],
      ])}
      ${listSection("Diagnosa", record.diagnoses.map((diagnosis) => `${diagnosis.type === "PRIMARY" ? "Utama" : "Tambahan"} - ${diagnosis.code ? `${diagnosis.code} - ` : ""}${diagnosis.name}${diagnosis.note ? ` (${diagnosis.note})` : ""}`))}
      ${listSection("Tindakan", record.treatments.map((treatment) => `${treatment.code ? `${treatment.code} - ` : ""}${treatment.name}${treatment.cost ? ` - Rp${treatment.cost.toString()}` : ""}${treatment.note ? ` (${treatment.note})` : ""}`))}
      ${listSection("Resep", record.prescription?.items.map((item) => `${item.medicineName} - ${item.quantity} ${""} - ${item.dosage} - ${item.usageRule}${item.note ? ` (${item.note})` : ""}`) ?? [])}
      ${listSection("Dokumen Pendukung", record.visit.documents.map((document) => `${document.fileName} - ${document.type}`))}
      <footer>
        Dokumen ini dibuat otomatis dari data rekam medis yang tersimpan di MedNote.
      </footer>
    </main>
  </body>
</html>`

  const forwardedFor = request.headers.get("x-forwarded-for")

  await writeAuditLog({
    userId: user.id,
    action: "GENERATE_MEDICAL_RECORD_DOCUMENT",
    entityName: "MedicalRecord",
    entityId: record.id,
    afterData: {
      medicalRecordNumber: patient.medicalRecordNumber,
      patientName: patient.fullName,
      status: record.status,
    },
    ipAddress: forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  })

  return new Response(html, {
    headers: {
      "Content-Disposition": `inline; filename="${fileName(`rekam-medis-${patient.medicalRecordNumber}-${record.id}`)}.html"`,
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
