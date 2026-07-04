import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { getRegionOptions } from "@/lib/data/clinic"

function normalizeRegionType(value: string | null) {
  if (value === "PROVINCE" || value === "CITY" || value === "DISTRICT") {
    return value
  }

  return null
}

export async function GET(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const url = new URL(request.url)
  const parentCode = url.searchParams.get("parentCode")
  const type = normalizeRegionType(url.searchParams.get("type"))
  const regions = await getRegionOptions({ parentCode, type })

  return NextResponse.json({ regions })
}
