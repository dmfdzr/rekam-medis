import "server-only"

import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/auth/audit-log"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canAccess } from "@/lib/auth/permissions"
import { getReportDetails, getReportSummary } from "@/lib/data/clinic"
import { scopeReportBundleForRole } from "@/lib/reports/scope"

type ReportDateOptions = {
  startDate: string | null
  endDate: string | null
}

export type ReportFormat = "json" | "csv" | "excel"

function parseDateParam(value: string | null, label: string) {
  if (!value) {
    return { ok: true as const, value: null }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { ok: false as const, message: `${label} harus menggunakan format YYYY-MM-DD.` }
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return { ok: false as const, message: `${label} tidak valid.` }
  }

  return { ok: true as const, value }
}

function getReportDateOptions(request: Request): { ok: true; options: ReportDateOptions; periodSlug: string; periodLabel: string } | { ok: false; message: string } {
  const url = new URL(request.url)
  const parsedStartDate = parseDateParam(url.searchParams.get("startDate"), "Tanggal mulai")
  const parsedEndDate = parseDateParam(url.searchParams.get("endDate"), "Tanggal akhir")

  if (!parsedStartDate.ok) {
    return { ok: false, message: parsedStartDate.message }
  }

  if (!parsedEndDate.ok) {
    return { ok: false, message: parsedEndDate.message }
  }

  const startDate = parsedStartDate.value
  const endDate = parsedEndDate.value

  if (startDate && endDate && new Date(`${endDate}T00:00:00.000Z`) < new Date(`${startDate}T00:00:00.000Z`)) {
    return { ok: false, message: "Tanggal akhir tidak boleh lebih awal dari tanggal mulai." }
  }

  const periodLabel = startDate || endDate ? `${startDate ?? "awal"} sampai ${endDate ?? "hari ini"}` : "Periode default"
  const periodSlug = startDate || endDate ? `${startDate ?? "awal"}_${endDate ?? "hari-ini"}` : "default"

  return {
    ok: true,
    options: {
      startDate,
      endDate,
    },
    periodLabel,
    periodSlug,
  }
}

export async function getAuthorizedReportContext(request: Request) {
  const user = await getCurrentUser()

  if (!user || !canAccess(user.role, "reports")) {
    return { ok: false as const, response: forbiddenReportResponse() }
  }

  const dateOptions = getReportDateOptions(request)

  if (!dateOptions.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: dateOptions.message }, { status: 400 }),
    }
  }

  const [reports, details] = await Promise.all([getReportSummary(dateOptions.options), getReportDetails(dateOptions.options)])

  return {
    ok: true as const,
    user,
    bundle: scopeReportBundleForRole(user.role, { reports, details }),
    dateOptions,
  }
}

export async function getAuthorizedReportSummaryContext(request: Request) {
  const context = await getAuthorizedReportContext(request)

  if (!context.ok) {
    return context
  }

  return {
    ...context,
    reports: context.bundle.reports,
  }
}

export async function auditReportAccess(request: Request, format: ReportFormat, context: Awaited<ReturnType<typeof getAuthorizedReportContext>>) {
  if (!context.ok) {
    return
  }

  const user = await getCurrentUser()

  if (!user || !canAccess(user.role, "reports")) {
    return
  }

  const forwardedFor = request.headers.get("x-forwarded-for")

  await writeAuditLog({
    userId: user.id,
    action: format === "json" ? "VIEW_REPORT" : "EXPORT_REPORT",
    entityName: "Report",
    afterData: {
      format,
      role: context.user.role,
      roleName: context.user.roleName,
      period: context.dateOptions.periodLabel,
      startDate: context.dateOptions.options.startDate ?? "default",
      endDate: context.dateOptions.options.endDate ?? "default",
    },
    ipAddress: forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  })
}

export function reportExportFileName(format: Exclude<ReportFormat, "json">, periodSlug: string) {
  return `mednote-report-diagnosis-${periodSlug}.${format === "excel" ? "xlsx" : format}`
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
