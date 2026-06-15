import "server-only"

import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth/current-user"
import { canAccess } from "@/lib/auth/permissions"
import { getReportDetails, getReportSummary } from "@/lib/data/clinic"

function getReportDateOptions(request: Request) {
  const url = new URL(request.url)

  return {
    startDate: url.searchParams.get("startDate"),
    endDate: url.searchParams.get("endDate"),
  }
}

export async function getAuthorizedReportBundle(request: Request) {
  const user = await getCurrentUser()

  if (!user || !canAccess(user.role, "reports")) {
    return null
  }

  const options = getReportDateOptions(request)
  const [reports, details] = await Promise.all([getReportSummary(options), getReportDetails(options)])

  return { reports, details }
}

export async function getAuthorizedReportSummary(request: Request) {
  const bundle = await getAuthorizedReportBundle(request)

  return bundle?.reports ?? null
}

export function forbiddenReportResponse() {
  return new NextResponse("Forbidden", { status: 403 })
}

export function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
