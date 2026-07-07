import { NextResponse } from "next/server"

import { getDiagnosisExportRows } from "@/lib/data/clinic"
import { auditReportAccess, escapeCsv, getAuthorizedReportContext, reportExportFileName } from "@/lib/reports/export"

export async function GET(request: Request) {
  const context = await getAuthorizedReportContext(request)

  if (!context.ok) {
    return context.response
  }

  await auditReportAccess(request, "csv", context)

  const rows = [
    ["Nama", "Alamat", "Diagnosa Utama", "Diagnosa Sekunder"],
    ...(await getDiagnosisExportRows(context.dateOptions.options)).map((row) => [
      row.patientName,
      row.address,
      row.primaryDiagnosis,
      row.secondaryDiagnosis,
    ]),
  ]
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n")

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${reportExportFileName("csv", context.dateOptions.periodSlug)}"`,
    },
  })
}
