import { NextResponse } from "next/server"

import { auditReportAccess, escapeHtml, getAuthorizedReportContext, reportExportFileName } from "@/lib/reports/export"

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
  const context = await getAuthorizedReportContext(request)

  if (!context.ok) {
    return context.response
  }

  await auditReportAccess(request, "excel", context)

  const { reports, details } = context.bundle
  const workbook = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <h1>MedNote - Laporan</h1>
    <p>Periode: ${escapeHtml(context.dateOptions.periodLabel)}</p>
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
  </body>
</html>`

  return new NextResponse(workbook, {
    headers: {
      "content-disposition": `attachment; filename="${reportExportFileName("excel", context.dateOptions.periodSlug)}"`,
      "content-type": "application/vnd.ms-excel; charset=utf-8",
    },
  })
}
