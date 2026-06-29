import type { ReportDetails, ReportSummaryItem } from "@/lib/data/clinic"

export type ReportSectionKey = "diagnoses" | "treatments"

type ReportBundle = {
  reports: ReportSummaryItem[]
  details: ReportDetails
}

const allReportSections: ReportSectionKey[] = ["diagnoses", "treatments"]
const clinicalReportSections: ReportSectionKey[] = ["diagnoses", "treatments"]

function normalizeRole(role: string) {
  return role.toUpperCase()
}

export function getAllowedReportSections(role: string) {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === "MASTER" || normalizedRole === "DOCTOR") {
    return allReportSections
  }

  return []
}

export function canViewReportSection(role: string, section: ReportSectionKey) {
  return getAllowedReportSections(role).includes(section)
}

export function scopeReportBundleForRole(role: string, bundle: ReportBundle): ReportBundle {
  const allowedSections = getAllowedReportSections(role)
  const canViewClinical = allowedSections.some((section) => clinicalReportSections.includes(section))
  const canViewAll = allowedSections.length === allReportSections.length
  const allowedSummaryLabels = new Set<string>([
    ...(canViewAll ? ["Kunjungan", "Pasien baru"] : []),
    ...(canViewClinical ? ["Diagnosa terbanyak"] : []),
  ])

  return {
    reports: bundle.reports.filter((report) => allowedSummaryLabels.has(report.label)),
    details: {
      diagnoses: allowedSections.includes("diagnoses") ? bundle.details.diagnoses : [],
      treatments: allowedSections.includes("treatments") ? bundle.details.treatments : [],
    },
  }
}
