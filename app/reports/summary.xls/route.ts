import { NextResponse } from "next/server"

import { escapeHtml, forbiddenReportResponse, getAuthorizedReportBundle } from "@/lib/reports/export"

function buildRows(rows: string[][]) {
  return rows
    .map(
      (row) => `
        <tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("")
}

function buildSection(title: string, headers: string[], rows: string[][]) {
  return `
    <h2>${escapeHtml(title)}</h2>
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>${buildRows(rows.length ? rows : [["Tidak ada data"]])}</tbody>
    </table>`
}

export async function GET(request: Request) {
  const bundle = await getAuthorizedReportBundle(request)

  if (!bundle) {
    return forbiddenReportResponse()
  }

  const { reports, details } = bundle
  const workbook = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    ${buildSection(
      "Ringkasan",
      ["Laporan", "Periode", "Nilai", "Trend"],
      reports.map((report) => [report.label, report.period, report.value, report.trend]),
    )}
    ${buildSection(
      "Diagnosa",
      ["Diagnosa", "Kasus"],
      details.diagnoses.map((diagnosis) => [diagnosis.name, String(diagnosis.count)]),
    )}
    ${buildSection(
      "Tindakan",
      ["Tindakan", "Jumlah", "Total biaya"],
      details.treatments.map((treatment) => [treatment.name, String(treatment.count), treatment.totalCost]),
    )}
    ${buildSection(
      "Penggunaan Obat",
      ["Kode", "Obat", "Jumlah"],
      details.medicineUsage.map((medicine) => [medicine.code, medicine.name, `${medicine.quantity} ${medicine.unit}`]),
    )}
    ${buildSection(
      "Stok Perlu Perhatian",
      ["Kode", "Obat", "Stok", "Status"],
      details.stockReport.map((medicine) => [medicine.code, medicine.name, `${medicine.stock}/${medicine.minimumStock} ${medicine.unit}`, medicine.status]),
    )}
  </body>
</html>`

  return new NextResponse(workbook, {
    headers: {
      "content-disposition": 'attachment; filename="medrecord-report-summary.xls"',
      "content-type": "application/vnd.ms-excel; charset=utf-8",
    },
  })
}
