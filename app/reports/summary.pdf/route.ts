import { NextResponse } from "next/server"

import { auditReportAccess, getAuthorizedReportContext, reportExportFileName } from "@/lib/reports/export"
import { buildReportPdf } from "@/lib/reports/pdf"

function sectionLines(title: string, headers: string[], rows: string[][]) {
  return [
    "",
    title,
    headers.join(" | "),
    ...(rows.length > 0 ? rows.map((row) => row.join(" | ")) : ["Tidak ada data"]),
  ]
}

export async function GET(request: Request) {
  const context = await getAuthorizedReportContext(request)

  if (!context.ok) {
    return context.response
  }

  await auditReportAccess(request, "pdf", context)

  const { reports, details } = context.bundle
  const lines = [
    "MedNote - Laporan",
    `Dibuat: ${new Date().toISOString().slice(0, 10)}`,
    `Periode: ${context.dateOptions.periodLabel}`,
    ...sectionLines(
      "Ringkasan",
      ["Laporan", "Periode", "Nilai", "Trend"],
      reports.map((report) => [report.label, report.period, report.value, report.trend]),
    ),
    ...sectionLines(
      "Diagnosa",
      ["Diagnosa", "Kasus"],
      details.diagnoses.map((diagnosis) => [diagnosis.name, String(diagnosis.count)]),
    ),
    ...sectionLines(
      "Tindakan",
      ["Tindakan", "Jumlah", "Total biaya"],
      details.treatments.map((treatment) => [treatment.name, String(treatment.count), treatment.totalCost]),
    ),
    ...sectionLines(
      "Penggunaan Obat",
      ["Kode", "Obat", "Jumlah"],
      details.medicineUsage.map((medicine) => [medicine.code, medicine.name, `${medicine.quantity} ${medicine.unit}`]),
    ),
    ...sectionLines(
      "Stok Perlu Perhatian",
      ["Kode", "Obat", "Stok", "Status"],
      details.stockReport.map((medicine) => [medicine.code, medicine.name, `${medicine.stock}/${medicine.minimumStock} ${medicine.unit}`, medicine.status]),
    ),
  ]
  const pdf = buildReportPdf(lines)

  return new NextResponse(pdf, {
    headers: {
      "content-disposition": `attachment; filename="${reportExportFileName("pdf", context.dateOptions.periodSlug)}"`,
      "content-type": "application/pdf",
      "x-content-type-options": "nosniff",
    },
  })
}
