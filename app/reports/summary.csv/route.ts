import { NextResponse } from "next/server"

import { escapeCsv, forbiddenReportResponse, getAuthorizedReportSummary } from "@/lib/reports/export"

export async function GET(request: Request) {
  const reports = await getAuthorizedReportSummary(request)

  if (!reports) {
    return forbiddenReportResponse()
  }

  const rows = [["Laporan", "Periode", "Nilai", "Trend"], ...reports.map((report) => [report.label, report.period, report.value, report.trend])]
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n")

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="medrecord-report-summary.csv"',
    },
  })
}
