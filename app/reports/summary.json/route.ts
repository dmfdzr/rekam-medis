import { NextResponse } from "next/server"

import { auditReportAccess, forbiddenReportResponse, getAuthorizedReportBundle } from "@/lib/reports/export"

export async function GET(request: Request) {
  const bundle = await getAuthorizedReportBundle(request)

  if (!bundle) {
    return forbiddenReportResponse()
  }

  await auditReportAccess(request, "json")

  return NextResponse.json(bundle)
}
