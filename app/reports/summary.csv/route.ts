import { NextResponse } from "next/server"

import { auditReportAccess, escapeCsv, getAuthorizedReportSummaryContext, reportExportFileName } from "@/lib/reports/export"

export async function GET(request: Request) {
  const context = await getAuthorizedReportSummaryContext(request)

  if (!context.ok) {
    return context.response
  }

  await auditReportAccess(request, "csv", context)

  const rows = [["Laporan", "Periode", "Nilai", "Trend"], ...context.reports.map((report) => [report.label, report.period, report.value, report.trend])]
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n")

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${reportExportFileName("csv", context.dateOptions.periodSlug)}"`,
    },
  })
}
