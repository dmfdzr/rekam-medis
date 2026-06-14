import { NextResponse } from "next/server"

import { canAccess } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getReportSummary } from "@/lib/data/clinic"

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

export async function GET() {
  const user = await getCurrentUser()

  if (!user || !canAccess(user.role, "reports")) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const reports = await getReportSummary()
  const rows = [["Laporan", "Periode", "Nilai", "Trend"], ...reports.map((report) => [report.label, report.period, report.value, report.trend])]
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n")

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="medrecord-report-summary.csv"',
    },
  })
}
