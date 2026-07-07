import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { getDiagnosisExportRows } from "@/lib/data/clinic"
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

  const workbook = XLSX.utils.book_new()
  const rows = await getDiagnosisExportRows(context.dateOptions.options)

  workbook.Props = {
    Title: "MedNote - Laporan Diagnosis",
    Subject: "Laporan diagnosis pasien",
    Author: "MedNote",
    CreatedDate: new Date(),
  }

  addSheet(workbook, "Laporan Diagnosis", [
    ["Nama", "Alamat", "Diagnosa Utama", "Diagnosa Sekunder"],
    ...rows.map((row) => [row.patientName, row.address, row.primaryDiagnosis, row.secondaryDiagnosis]),
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
