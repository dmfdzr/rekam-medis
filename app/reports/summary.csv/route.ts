import { NextResponse } from "next/server"

import { auditReportAccess, escapeCsv, getAuthorizedReportContext, reportExportFileName } from "@/lib/reports/export"

function sectionRows(title: string, headers: string[], rows: string[][]) {
  return [
    [title],
    headers,
    ...(rows.length > 0 ? rows : [["Tidak ada data"]]),
    [],
  ]
}

export async function GET(request: Request) {
  const context = await getAuthorizedReportContext(request)

  if (!context.ok) {
    return context.response
  }

  await auditReportAccess(request, "csv", context)

  const details = context.bundle.details
  const rows = [
    ["MedNote - Laporan Diagnosis"],
    ["Periode", context.dateOptions.periodLabel],
    [],
    ...sectionRows("Ringkasan", ["Metrik", "Nilai"], [
      ["Total kasus diagnosis", String(details.diagnosisMap.totalCases)],
      ["Diagnosis terbanyak", details.diagnosisOptions[0] ? `${details.diagnosisOptions[0].name} (${details.diagnosisOptions[0].count} kasus)` : "-"],
      ["Wilayah terdampak", String(details.diagnosisMap.totalRegions)],
      ["Wilayah kasus tertinggi", details.diagnosisMap.locations[0] ? `${details.diagnosisMap.locations[0].region} (${details.diagnosisMap.locations[0].caseCount} kasus)` : "-"],
    ]),
    ...sectionRows(
      "10 Diagnosa Teratas",
      ["Ranking", "Diagnosa", "Kasus"],
      details.diagnoses.map((diagnosis, index) => [String(index + 1), diagnosis.name, String(diagnosis.count)]),
    ),
    ...sectionRows(
      "Tindakan Medis",
      ["Tindakan", "Jumlah"],
      details.treatments.map((treatment) => [treatment.name, String(treatment.count)]),
    ),
    ...sectionRows(
      "Wilayah Diagnosis",
      ["Wilayah", "Kota/Kabupaten", "Provinsi", "Kasus", "Pasien", "Diagnosis teratas"],
      details.diagnosisMap.locations.map((location) => [
        location.region,
        location.city,
        location.province,
        String(location.caseCount),
        String(location.patientCount),
        location.topDiagnoses.map((diagnosis) => `${diagnosis.name} (${diagnosis.count})`).join("; ") || "-",
      ]),
    ),
  ]
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n")

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${reportExportFileName("csv", context.dateOptions.periodSlug)}"`,
    },
  })
}
