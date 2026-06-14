import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { canAccess } from "@/lib/auth/permissions"
import { getReportSummary } from "@/lib/data/clinic"

export async function GET(request: Request) {
  const user = await getCurrentUser()

  if (!user || !canAccess(user.role, "reports")) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const url = new URL(request.url)
  const reports = await getReportSummary({
    startDate: url.searchParams.get("startDate"),
    endDate: url.searchParams.get("endDate"),
  })

  return NextResponse.json({ reports })
}
