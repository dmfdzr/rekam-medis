import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/auth/audit-log"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canAccess } from "@/lib/auth/permissions"
import { getDiagnosisMapReport, type DiagnosisMapOptions } from "@/lib/data/clinic"

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

function normalizeDiagnosisType(value: string | null): DiagnosisMapOptions["diagnosisType"] {
  if (value === "PRIMARY" || value === "SECONDARY" || value === "ALL") {
    return value
  }

  return "ALL"
}

function normalizeLevel(value: string | null): DiagnosisMapOptions["level"] {
  return value === "city" ? "city" : "district"
}

export async function GET(request: Request) {
  const user = await getCurrentUser()

  if (!user || !canAccess(user.role, "reports")) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const url = new URL(request.url)
  const parsedStartDate = parseDateParam(url.searchParams.get("startDate"), "Tanggal mulai")
  const parsedEndDate = parseDateParam(url.searchParams.get("endDate"), "Tanggal akhir")

  if (!parsedStartDate.ok) {
    return NextResponse.json({ message: parsedStartDate.message }, { status: 400 })
  }

  if (!parsedEndDate.ok) {
    return NextResponse.json({ message: parsedEndDate.message }, { status: 400 })
  }

  if (parsedStartDate.value && parsedEndDate.value && new Date(`${parsedEndDate.value}T00:00:00.000Z`) < new Date(`${parsedStartDate.value}T00:00:00.000Z`)) {
    return NextResponse.json({ message: "Tanggal akhir tidak boleh lebih awal dari tanggal mulai." }, { status: 400 })
  }

  const options: DiagnosisMapOptions = {
    startDate: parsedStartDate.value,
    endDate: parsedEndDate.value,
    diagnosis: url.searchParams.get("diagnosis"),
    diagnosisType: normalizeDiagnosisType(url.searchParams.get("diagnosisType")),
    level: normalizeLevel(url.searchParams.get("level")),
  }
  const report = await getDiagnosisMapReport(options)
  const forwardedFor = request.headers.get("x-forwarded-for")

  await writeAuditLog({
    userId: user.id,
    action: "VIEW_DIAGNOSIS_MAP_REPORT",
    entityName: "Report",
    afterData: {
      level: options.level,
      diagnosis: options.diagnosis || "all",
      diagnosisType: options.diagnosisType || "ALL",
      startDate: options.startDate ?? "default",
      endDate: options.endDate ?? "default",
    },
    ipAddress: forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ report })
}
