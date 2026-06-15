import "server-only"

import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/auth/audit-log"
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

export async function auditReportAccess(request: Request, format: "json" | "csv" | "excel" | "pdf") {
  const user = await getCurrentUser()

  if (!user || !canAccess(user.role, "reports")) {
    return
  }

  const options = getReportDateOptions(request)
  const forwardedFor = request.headers.get("x-forwarded-for")

  await writeAuditLog({
    userId: user.id,
    action: format === "json" ? "VIEW_REPORT" : "EXPORT_REPORT",
    entityName: "Report",
    afterData: {
      format,
      startDate: options.startDate ?? "default",
      endDate: options.endDate ?? "default",
    },
    ipAddress: forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  })
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
