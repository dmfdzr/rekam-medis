import { NextResponse } from "next/server"

import { forbiddenReportResponse, getAuthorizedReportBundle } from "@/lib/reports/export"

export async function GET(request: Request) {
  const bundle = await getAuthorizedReportBundle(request)

  if (!bundle) {
    return forbiddenReportResponse()
  }

  return NextResponse.json(bundle)
}
