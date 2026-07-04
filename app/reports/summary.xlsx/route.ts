import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { auditReportAccess, getAuthorizedReportContext, reportExportFileName } from "@/lib/reports/export"

function autoWidth(rows: (string | number)[][]) {
  return rows[0]?.map((_, columnIndex) => ({
    wch: Math.min(
      48,
      Math.max(
        12,
        ...rows.map((row) => String(row[columnIndex] ?? "").length + 2),
      ),
    ),
  })) ?? []
}

function addSheet(workbook: XLSX.WorkBook, name: string, rows: (string | number)[][]) {
  const worksheet = XLSX.utils.aoa_to_sheet(rows.length ? rows : [["Tidak ada data"]])
  worksheet["!cols"] = autoWidth(rows.length ? rows : [["Tidak ada data"]])
  XLSX.utils.book_append_sheet(workbook, worksheet, name)
}

export async function GET(request: Request) {
  const context = await getAuthorizedReportContext(request)

  if (!context.ok) {
    return context.response
  }

  await auditReportAccess(request, "excel", context)

  const details = context.bundle.details
  const topDiagnosis = details.diagnosisOptions[0]
  const topRegion = details.diagnosisMap.locations[0]
  const generatedAt = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date())
  const workbook = XLSX.utils.book_new()

  workbook.Props = {
    Title: "MedNote - Laporan Diagnosis",
    Subject: "Laporan diagnosis dan persebaran wilayah",
    Author: "MedNote",
    CreatedDate: new Date(),
  }

  addSheet(workbook, "Ringkasan", [
    ["MedNote - Laporan Diagnosis", ""],
    ["Periode", context.dateOptions.periodLabel],
    ["Dibuat", generatedAt],
    [],
    ["Metrik", "Nilai"],
    ["Total kasus diagnosis", details.diagnosisMap.totalCases],
    ["Diagnosis terbanyak", topDiagnosis ? `${topDiagnosis.name} (${topDiagnosis.count} kasus)` : "-"],
    ["Wilayah terdampak", details.diagnosisMap.totalRegions],
    ["Wilayah kasus tertinggi", topRegion ? `${topRegion.region} (${topRegion.caseCount} kasus)` : "-"],
  ])

  addSheet(workbook, "10 Diagnosa Teratas", [
    ["Ranking", "Diagnosa", "Kasus"],
    ...details.diagnoses.map((diagnosis, index) => [index + 1, diagnosis.name, diagnosis.count]),
  ])

  addSheet(workbook, "Tindakan Medis", [
    ["Tindakan", "Jumlah", "Total biaya"],
    ...details.treatments.map((treatment) => [treatment.name, treatment.count, Number(treatment.totalCost || 0)]),
  ])

  addSheet(workbook, "Wilayah Diagnosis", [
    ["Wilayah", "Kota/Kabupaten", "Provinsi", "Kasus", "Pasien", "Diagnosis teratas"],
    ...details.diagnosisMap.locations.map((location) => [
      location.region,
      location.city,
      location.province,
      location.caseCount,
      location.patientCount,
      location.topDiagnoses.map((diagnosis) => `${diagnosis.name} (${diagnosis.count})`).join("; ") || "-",
    ]),
  ])

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer
  const body = new Uint8Array(buffer)

  return new NextResponse(body, {
    headers: {
      "content-disposition": `attachment; filename="${reportExportFileName("excel", context.dateOptions.periodSlug)}"`,
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  })
}
