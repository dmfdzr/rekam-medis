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

function daysBetween(start: Date, end: Date | null) {
  if (!end) {
    return "-"
  }

  const dayMs = 1000 * 60 * 60 * 24
  const diff = Math.ceil((end.getTime() - start.getTime()) / dayMs)

  return `${Math.max(1, diff)} hari`
}

function checkbox(checked: boolean, label: string) {
  return `<span class="check ${checked ? "checked" : ""}"></span>${escapeHtml(label)}`
}

function escapePdfText(value: string | number | null | undefined) {
  return String(value ?? "-").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function wrapPdfText(value: string | number | null | undefined, maxChars: number) {
  const text = String(value ?? "-")
  const result: string[] = []

  for (const rawLine of text.split("\n")) {
    const words = rawLine.split(/\s+/).filter(Boolean)
    let line = ""

    for (const word of words) {
      const nextLine = line ? `${line} ${word}` : word
      if (nextLine.length > maxChars && line) {
        result.push(line)
        line = word
      } else {
        line = nextLine
      }
    }

    result.push(line || "-")
  }

  return result
}

type ResumePdfData = {
  documentCode: string
  patient: {
    medicalRecordNumber: string
    name: string
    birthDate: string
    gender: string
  }
  visit: {
    admissionDate: string
    dischargeDate: string
    lengthOfStay: string
    room: string
    primaryDoctor: string
    jointCare: boolean
    companionDoctors: string[]
  }
  assessment: {
    admissionDiagnosis: string
    historySummary: string
    support: string
    primaryDiagnosis: string
    primaryDiagnosisCode: string
    secondaryDiagnoses: string
    secondaryDiagnosisCodes: string[]
    procedures: string
    procedureCodes: string[]
  }
  laboratory: string
  prescription: string
  cppt: {
    physicalExam: string
    bloodPressure: string
    pulse: string
    temperature: string
    respiration: string
    oxygenSaturation: string
  }
  discharge: {
    conditionFinal: boolean
    instruction: string
  }
  signatureDoctor: string
}

function buildResumeMedicalPdf(data: ResumePdfData) {
  const width = 595
  const height = 842
  const marginX = 40
  let y = 812
  const tableWidth = 515
  const col1 = 184
  const col2 = 155
  const col3 = tableWidth - col1 - col2
  const x1 = marginX
  const x2 = x1 + col1
  const x3 = x2 + col2
  const x4 = x1 + tableWidth
  const commands: string[] = []

  function line(xa: number, ya: number, xb: number, yb: number) {
    commands.push(`${xa} ${ya} m ${xb} ${yb} l S`)
  }

  function rect(x: number, yBottom: number, w: number, h: number) {
    commands.push(`${x} ${yBottom} ${w} ${h} re S`)
  }

  function text(x: number, yText: number, value: string | number | null | undefined, size = 9, font = "F1") {
    commands.push(`BT /${font} ${size} Tf ${x} ${yText} Td (${escapePdfText(value)}) Tj ET`)
  }

  function wrappedText(x: number, yText: number, value: string | number | null | undefined, maxChars: number, size = 9, lineHeight = 12, maxLines = 4, font = "F1") {
    wrapPdfText(value, maxChars).slice(0, maxLines).forEach((lineText, index) => {
      text(x, yText - index * lineHeight, lineText, size, font)
    })
  }

  function cell(x: number, yTop: number, w: number, h: number, value: string | number | null | undefined, options?: { bold?: boolean; center?: boolean; maxChars?: number; maxLines?: number }) {
    rect(x, yTop - h, w, h)
    const font = options?.bold ? "F2" : "F1"
    const maxChars = options?.maxChars ?? Math.max(12, Math.floor(w / 4.6))
    const textX = options?.center ? x + 8 : x + 6
    const textY = options?.center ? yTop - h / 2 - 3 : yTop - 13

    if (options?.center) {
      const label = String(value ?? "-")
      text(x + Math.max(6, (w - label.length * 5.2) / 2), textY, label, 11, font)
    } else {
      wrappedText(textX, textY, value, maxChars, 9, 12, options?.maxLines ?? Math.max(1, Math.floor((h - 6) / 12)), font)
    }
  }

  function fullRow(label: string, value: string, rowHeight: number) {
    cell(x1, y, col1, rowHeight, label, { bold: true })
    cell(x2, y, col2 + col3, rowHeight, value, { maxChars: 78, maxLines: Math.max(1, Math.floor((rowHeight - 6) / 12)) })
    y -= rowHeight
  }

  function tripleRow(label: string, middle: string, code: string, rowHeight: number) {
    cell(x1, y, col1, rowHeight, label, { bold: true })
    cell(x2, y, col2, rowHeight, middle, { maxChars: 34, maxLines: Math.max(1, Math.floor((rowHeight - 6) / 12)) })
    cell(x3, y, col3, rowHeight, code, { maxChars: 32, maxLines: Math.max(1, Math.floor((rowHeight - 6) / 12)) })
    y -= rowHeight
  }

  function drawCheck(x: number, yTop: number, checked: boolean, label: string) {
    rect(x, yTop - 9, 8, 8)
    if (checked) {
      line(x + 2, yTop - 5, x + 4, yTop - 8)
      line(x + 4, yTop - 8, x + 8, yTop - 1)
    }
    text(x + 11, yTop - 8, label, 9)
  }

  text(480, 824, data.documentCode, 10, "F2")

  const headerTop = y
  rect(x1, headerTop - 80, col1, 80)
  text(x1 + 66, headerTop - 31, "MedNote", 16, "F2")
  text(x1 + 61, headerTop - 45, "Electronic Health Record", 7)
  cell(x2, y, col2, 20, "Nomor RM", { bold: true })
  cell(x3, y, col3, 20, data.patient.medicalRecordNumber)
  y -= 20
  cell(x2, y, col2, 20, "Nama Pasien", { bold: true })
  cell(x3, y, col3, 20, data.patient.name)
  y -= 20
  cell(x2, y, col2, 20, "Tanggal Lahir", { bold: true })
  cell(x3, y, col3, 20, data.patient.birthDate)
  y -= 20
  cell(x2, y, col2, 20, "Jenis Kelamin", { bold: true })
  rect(x3, y - 20, col3, 20)
  drawCheck(x3 + 6, y - 5, data.patient.gender === "MALE", "L")
  drawCheck(x3 + 42, y - 5, data.patient.gender === "FEMALE", "P")
  y -= 20
  cell(x1, y, col1, 24, "RESUME MEDIS", { bold: true, center: true })
  cell(x2, y, col2 + col3, 24, "")
  y -= 24

  rect(x1, y - 116, tableWidth, 116)
  text(x1 + 6, y - 13, `Tanggal Masuk : ${data.visit.admissionDate}`, 9)
  text(x2 + 6, y - 13, `Tanggal Keluar: ${data.visit.dischargeDate}`, 9)
  text(x3 + 6, y - 13, `Lama Dirawat: ${data.visit.lengthOfStay}`, 9)
  text(x1 + 6, y - 31, "Ruang Rawat", 9)
  text(x1 + 78, y - 31, ":", 9)
  text(x1 + 88, y - 31, data.visit.room, 9)
  text(x1 + 6, y - 47, "DPJP Utama", 9)
  text(x1 + 78, y - 47, ":", 9)
  text(x1 + 88, y - 47, data.visit.primaryDoctor, 9)
  text(x1 + 6, y - 63, "Rawat Bersama", 9)
  drawCheck(x1 + 88, y - 58, data.visit.jointCare, "Ya")
  drawCheck(x1 + 128, y - 58, !data.visit.jointCare, "Tidak")
  const companions = data.visit.companionDoctors.length ? data.visit.companionDoctors : ["", "", ""]
  companions.slice(0, 3).forEach((doctor, index) => text(x1 + 110, y - 77 - index * 14, `${index + 1}. ${doctor}`, 9))
  y -= 116

  fullRow("Diagnosa Masuk", data.assessment.admissionDiagnosis, 28)
  fullRow("Ringkasan Riwayat Penyakit", data.assessment.historySummary, 58)
  fullRow("Pemeriksaan Fisik", `TD: ${data.cppt.bloodPressure}    N: ${data.cppt.pulse}    S: ${data.cppt.temperature}    P: ${data.cppt.respiration}    Sat O2: ${data.cppt.oxygenSaturation}\n${data.cppt.physicalExam}`, 46)
  fullRow("Laboratorium", data.laboratory, 48)
  fullRow("Penunjang Lain", data.assessment.support, 48)
  tripleRow("Diagnosa Utama", data.assessment.primaryDiagnosis, `Kode ICD: ${data.assessment.primaryDiagnosisCode}`, 30)
  tripleRow("Diagnosa Sekunder", data.assessment.secondaryDiagnoses, data.assessment.secondaryDiagnosisCodes.map((code) => `Kode ICD: ${code}`).join("\n") || "Kode ICD: -", 58)
  tripleRow("Prosedur/Operasi", data.assessment.procedures, data.assessment.procedureCodes.map((code) => `Kode ICD: ${code}`).join("\n") || "Kode ICD: -", 44)
  fullRow("Pengobatan Selama Dirawat", data.prescription, 56)

  rect(x1, y - 34, col1, 34)
  text(x1 + 6, y - 13, "Kondisi Pulang", 9, "F2")
  rect(x2, y - 34, col2 + col3, 34)
  drawCheck(x2 + 6, y - 7, data.discharge.conditionFinal, "Diijinkan Pulang")
  drawCheck(x2 + 120, y - 7, false, "Dirujuk")
  drawCheck(x2 + 184, y - 7, false, "Atas Permintaan Sendiri")
  drawCheck(x2 + 6, y - 22, false, "Meninggal")
  drawCheck(x2 + 84, y - 22, false, "Melarikan Diri")
  y -= 34

  fullRow("Instruksi Pulang", data.discharge.instruction, 34)

  text(388, 94, "........................,........................", 9)
  text(420, 32, `(${data.signatureDoctor || "Nama DPJP"})`, 9, "F2")

  const content = ["q", "0.8 w", ...commands, "Q"].join("\n")
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [4 0 R] /Count 1 >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R /F2 6 0 R >> >> /Contents 5 0 R >>`,
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ]
  const chunks = ["%PDF-1.4\n"]
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join(""), "utf8"))
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`)
  })

  const xrefOffset = Buffer.byteLength(chunks.join(""), "utf8")
  chunks.push(`xref\n0 ${objects.length + 1}\n`)
  chunks.push("0000000000 65535 f \n")
  offsets.slice(1).forEach((offset) => chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`))
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

  return Buffer.from(chunks.join(""), "utf8")
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
          doctor: {
            select: {
              name: true,
            },
          },
          laboratoryResult: true,
          vitalSign: true,
          companionDoctors: {
            orderBy: { order: "asc" },
            include: {
              doctor: {
                select: {
                  name: true,
                },
              },
            },
          },
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
  const primaryDiagnosis = record.diagnoses.find((diagnosis) => diagnosis.type === "PRIMARY")
  const secondaryDiagnoses = record.diagnoses.filter((diagnosis) => diagnosis.type === "SECONDARY")
  const treatmentNames = record.treatments.map((treatment) => treatment.name)
  const prescriptionItems = record.prescription?.items.map((item) => `${item.medicineName} ${item.quantity} - ${item.dosage} - ${item.usageRule}${item.note ? ` (${item.note})` : ""}`) ?? []
  const lab = record.visit.laboratoryResult
  const vital = record.visit.vitalSign
  const rawatBersama = record.visit.isJointCare
    ? record.visit.companionDoctors.map((companion) => companion.doctor.name).join(", ") || "Ya"
    : "Tidak"
  const primaryDiagnosisCode = primaryDiagnosis?.code || "-"
  const secondaryDiagnosisCodes = secondaryDiagnoses.map((diagnosis) => diagnosis.code || "-")
  const treatmentCodes = record.treatments.map((treatment) => treatment.code || "-")
  const physicalExam = [
    vital?.bloodPressure ? `Tekanan darah ${vital.bloodPressure} mmHg` : null,
    vital?.temperature ? `Suhu ${vital.temperature.toString()} C` : null,
    vital?.weight ? `Berat badan ${vital.weight.toString()} Kg` : null,
    vital?.height ? `Tinggi badan ${vital.height.toString()} Cm` : null,
    vital?.pulse ? `Nadi ${vital.pulse} /menit` : null,
    vital?.respiration ? `Respirasi ${vital.respiration} /menit` : null,
    vital?.oxygenSaturation ? `Saturasi oksigen ${vital.oxygenSaturation}%` : null,
  ].filter(Boolean).join("; ")
  const html = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Resume Medis ${escapeHtml(patient.medicalRecordNumber)} - MedNote</title>
    <style>
      :root { color-scheme: light; font-family: Arial, sans-serif; color: #111827; background: #f8fafc; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 18px 22px; background: #f3f4f6; }
      main { width: 210mm; margin: 0 auto; background: white; }
      .page { position: relative; width: 210mm; min-height: 297mm; background: white; padding: 10mm 12mm; }
      .doc-code { text-align: right; font-size: 12px; font-weight: 700; margin-bottom: 14px; padding-right: 76px; }
      .resume-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #111827; }
      .resume-table td, .resume-table th { border: 1px solid #111827; vertical-align: top; padding: 6px 8px; font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }
      .resume-table th { text-align: left; font-weight: 700; width: 34%; }
      .logo-cell { height: 76px; text-align: center; vertical-align: middle !important; }
      .logo-mark { display: inline-grid; width: 42px; height: 42px; place-items: center; border: 3px solid #0ea5e9; border-radius: 999px; color: #0f766e; font-weight: 800; font-size: 18px; margin-right: 8px; }
      .brand { display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-align: left; }
      .brand strong { display: block; font-size: 15px; color: #2563eb; line-height: 1; }
      .brand small { display: block; font-size: 8px; color: #111827; line-height: 1.2; margin-top: 2px; }
      .title-cell { text-align: center; font-size: 18px !important; font-weight: 800; vertical-align: middle !important; }
      .field-label { font-weight: 700; width: 30%; }
      .gender-box { display: flex; gap: 10px; align-items: center; }
      .check { display: inline-block; width: 14px; height: 14px; border: 1px solid #111827; margin: 0 3px 0 0; vertical-align: -2px; position: relative; }
      .check.checked::after { content: ""; position: absolute; left: 3px; top: 0px; width: 5px; height: 9px; border: solid #111827; border-width: 0 2px 2px 0; transform: rotate(45deg); }
      .inline-row { display: grid; grid-template-columns: 1.1fr 1.1fr .9fr; gap: 16px; }
      .visit-lines { font-size: 12px; line-height: 1.7; }
      .label-line { display: grid; grid-template-columns: 110px 10px 1fr; }
      .companion-list { margin-left: 120px; min-height: 64px; white-space: pre-line; }
      .wide-cell { padding: 6px 8px !important; }
      .fill { min-height: 58px; }
      .fill-lg { min-height: 72px; }
      .physical { display: grid; grid-template-columns: 42px 42px 42px 42px 1fr; gap: 20px; }
      .codes { width: 35%; }
      .signature { position: absolute; right: 22mm; bottom: 18mm; width: 58mm; text-align: center; font-size: 12px; }
      .signature .line { margin-bottom: 62px; }
      @media print {
        @page { size: A4; margin: 0; }
        body { background: white; padding: 0; }
        main, .page { width: 210mm; }
        .page { height: 297mm; min-height: 297mm; padding: 10mm 12mm; overflow: hidden; }
        .doc-code { margin-top: 0; }
      }
      @media (max-width: 700px) {
        body { padding: 10px; }
        .inline-row { grid-template-columns: 1fr; gap: 2px; }
        .resume-table td, .resume-table th { font-size: 12px; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="page">
      <div class="doc-code">RI 02/2020/I</div>
      <table class="resume-table">
        <colgroup>
          <col style="width:35%" />
          <col style="width:30%" />
          <col style="width:35%" />
        </colgroup>
        <tr>
          <td rowspan="4" class="logo-cell">
            <div class="brand">
              <span class="logo-mark">M</span>
              <span><strong>MedNote</strong><small>Electronic Health Record</small></span>
            </div>
          </td>
          <th class="field-label">Nomor RM</th>
          <td>${escapeHtml(patient.medicalRecordNumber)}</td>
        </tr>
        <tr>
          <th class="field-label">Nama Pasien</th>
          <td>${escapeHtml(patient.fullName)}</td>
        </tr>
        <tr>
          <th class="field-label">Tanggal Lahir</th>
          <td>${escapeHtml(dateFormatter.format(patient.birthDate))}</td>
        </tr>
        <tr>
          <th class="field-label">Jenis Kelamin</th>
          <td class="gender-box">${checkbox(patient.gender === "MALE", "L")} ${checkbox(patient.gender === "FEMALE", "P")}</td>
        </tr>
        <tr>
          <td class="title-cell">RESUME MEDIS</td>
          <td colspan="2"></td>
        </tr>
        <tr>
          <td colspan="3" class="wide-cell">
            <div class="inline-row">
              <span>Tanggal Masuk : ${escapeHtml(dateFormatter.format(record.visit.admissionDate))}</span>
              <span>Tanggal Keluar: ${escapeHtml(record.finalizedAt ? dateFormatter.format(record.finalizedAt) : record.visit.dischargeDate ? dateFormatter.format(record.visit.dischargeDate) : "-")}</span>
              <span>Lama Dirawat: ${escapeHtml(daysBetween(record.visit.admissionDate, record.visit.dischargeDate ?? record.finalizedAt))}</span>
            </div>
            <div class="visit-lines">
              <div class="label-line"><span>Ruang Rawat</span><span>:</span><span>${escapeHtml(record.visit.service)}</span></div>
              <div class="label-line"><span>DPJP Utama</span><span>:</span><span>${escapeHtml(record.visit.doctor?.name ?? record.doctor?.name)}</span></div>
              <div>Rawat Bersama&nbsp;&nbsp;&nbsp; ${checkbox(record.visit.isJointCare, "Ya")} ${checkbox(!record.visit.isJointCare, "Tidak")}</div>
              <div class="companion-list">${escapeHtml(record.visit.companionDoctors.map((companion, index) => `${index + 1}. ${companion.doctor.name}`).join("\n") || "1.\n2.\n3.")}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="3" class="wide-cell">Diagnosa Masuk : ${escapeHtml(record.assessment)}</td>
        </tr>
        <tr>
          <th>Ringkasan Riwayat Penyakit</th>
          <td colspan="2" class="fill">${escapeHtml(record.subjective)}</td>
        </tr>
        <tr>
          <th>Pemeriksaan Fisik</th>
          <td colspan="2">
            <div class="physical">
              <span>TD: ${escapeHtml(vital?.bloodPressure)}</span>
              <span>N: ${escapeHtml(vital?.pulse)}</span>
              <span>S: ${escapeHtml(vital?.temperature?.toString())}</span>
              <span>P: ${escapeHtml(vital?.respiration)}</span>
              <span>Sat O2: ${escapeHtml(vital?.oxygenSaturation)}</span>
            </div>
            <div>${escapeHtml(record.physicalExam)}</div>
          </td>
        </tr>
        <tr>
          <th>Laboratorium</th>
          <td colspan="2" class="fill">${escapeHtml(lab ? `Hb ${lab.hemoglobin?.toString() ?? "-"} g/dl; Leukosit ${lab.leukosit?.toString() ?? "-"} micro/l; GDS/GDP ${lab.gds?.toString() ?? "-"} mg/dl; CRP ${lab.crp?.toString() ?? "-"} mg/dl` : "-")}</td>
        </tr>
        <tr>
          <th>Penunjang Lain</th>
          <td colspan="2" class="fill">${escapeHtml(treatmentNames.join(", ") || "-")}</td>
        </tr>
        <tr>
          <th>Diagnosa Utama</th>
          <td>${escapeHtml(primaryDiagnosis?.name)}</td>
          <td class="codes">Kode ICD: ${escapeHtml(primaryDiagnosisCode)}</td>
        </tr>
        <tr>
          <th>Diagnosa Sekunder</th>
          <td class="fill">${escapeHtml(secondaryDiagnoses.map((diagnosis) => diagnosis.name).join("; ") || "-")}</td>
          <td class="codes">${escapeHtml(secondaryDiagnosisCodes.map((code) => `Kode ICD: ${code}`).join("\n") || "Kode ICD: -")}</td>
        </tr>
        <tr>
          <th>Prosedur/Operasi</th>
          <td>${escapeHtml(treatmentNames.join("; ") || "-")}</td>
          <td class="codes">${escapeHtml(treatmentCodes.map((code) => `Kode ICD: ${code}`).join("\n") || "Kode ICD: -")}</td>
        </tr>
        <tr>
          <th>Pengobatan Selama Dirawat</th>
          <td colspan="2" class="fill-lg">${escapeHtml(prescriptionItems.join("; ") || "-")}</td>
        </tr>
        <tr>
          <th>Kondisi Pulang</th>
          <td colspan="2">
            ${checkbox(record.status === "FINAL", "Diijinkan Pulang")}
            ${checkbox(false, "Dirujuk")}
            ${checkbox(false, "Atas Permintaan Sendiri")}
            <br />
            ${checkbox(false, "Meninggal")}
            ${checkbox(false, "Melarikan Diri")}
          </td>
        </tr>
        <tr>
          <th>Instruksi Pulang</th>
          <td colspan="2">${escapeHtml(record.doctorNote)}</td>
        </tr>
      </table>
        <div class="signature">
          <div class="line">........................,........................</div>
          <div>(${escapeHtml(record.visit.doctor?.name ?? record.doctor?.name ?? "Nama DPJP")})</div>
        </div>
      </div>
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

  const isDownload = new URL(request.url).searchParams.get("download") === "1"
  const downloadFileName = fileName(`resume-medis-${patient.medicalRecordNumber}-${record.id}`)

  if (isDownload) {
    const pdf = buildResumeMedicalPdf({
      documentCode: "RI 02/2020/I",
      patient: {
        medicalRecordNumber: patient.medicalRecordNumber,
        name: patient.fullName,
        birthDate: dateFormatter.format(patient.birthDate),
        gender: patient.gender,
      },
      visit: {
        admissionDate: dateFormatter.format(record.visit.admissionDate),
        dischargeDate: record.finalizedAt ? dateFormatter.format(record.finalizedAt) : record.visit.dischargeDate ? dateFormatter.format(record.visit.dischargeDate) : "-",
        lengthOfStay: daysBetween(record.visit.admissionDate, record.visit.dischargeDate ?? record.finalizedAt),
        room: record.visit.service,
        primaryDoctor: record.visit.doctor?.name ?? record.doctor?.name ?? "-",
        jointCare: record.visit.isJointCare,
        companionDoctors: record.visit.companionDoctors.map((companion) => companion.doctor.name),
      },
      assessment: {
        admissionDiagnosis: record.assessment ?? "-",
        historySummary: record.subjective ?? "-",
        support: treatmentNames.join(", ") || "-",
        primaryDiagnosis: primaryDiagnosis?.name ?? "-",
        primaryDiagnosisCode,
        secondaryDiagnoses: secondaryDiagnoses.map((diagnosis) => diagnosis.name).join("; ") || "-",
        secondaryDiagnosisCodes,
        procedures: treatmentNames.join("; ") || "-",
        procedureCodes: treatmentCodes,
      },
      laboratory: lab ? `Hb ${lab.hemoglobin?.toString() ?? "-"} g/dl; Leukosit ${lab.leukosit?.toString() ?? "-"} micro/l; GDS/GDP ${lab.gds?.toString() ?? "-"} mg/dl; CRP ${lab.crp?.toString() ?? "-"} mg/dl` : "-",
      prescription: prescriptionItems.join("; ") || "-",
      cppt: {
        physicalExam: record.physicalExam ?? "-",
        bloodPressure: vital?.bloodPressure ?? "-",
        pulse: vital?.pulse?.toString() ?? "-",
        temperature: vital?.temperature?.toString() ?? "-",
        respiration: vital?.respiration?.toString() ?? "-",
        oxygenSaturation: vital?.oxygenSaturation?.toString() ?? "-",
      },
      discharge: {
        conditionFinal: record.status === "FINAL",
        instruction: record.doctorNote ?? "-",
      },
      signatureDoctor: record.visit.doctor?.name ?? record.doctor?.name ?? "Nama DPJP",
    })

    return new Response(pdf, {
      headers: {
        "Content-Disposition": `attachment; filename="${downloadFileName}.pdf"`,
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    })
  }

  return new Response(html, {
    headers: {
      "Content-Disposition": `inline; filename="${downloadFileName}.html"`,
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
