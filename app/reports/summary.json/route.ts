import { NextResponse } from "next/server"

import { auditReportAccess, getAuthorizedReportContext } from "@/lib/reports/export"

export async function GET(request: Request) {
  const context = await getAuthorizedReportContext(request)

  if (!context.ok) {
    return context.response
  }

  await auditReportAccess(request, "json", context)

  return NextResponse.json(context.bundle)
}
