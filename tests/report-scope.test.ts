import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { canViewReportSection, getAllowedReportSections, scopeReportBundleForRole } from "@/lib/reports/scope"

const reportBundle: Parameters<typeof scopeReportBundleForRole>[1] = {
  reports: [
    { label: "Kunjungan", period: "Range", value: "10", trend: "Range" },
    { label: "Pasien baru", period: "Range", value: "4", trend: "Range" },
    { label: "Diagnosa terbanyak", period: "Range", value: "ISPA", trend: "3 kasus" },
    { label: "Penggunaan obat", period: "Range", value: "Paracetamol", trend: "Paracetamol" },
    { label: "Obat stok rendah", period: "Inventori", value: "2", trend: "Butuh cek" },
  ],
  details: {
    diagnoses: [{ name: "ISPA", count: 3 }],
    treatments: [{ name: "Konsultasi", count: 3, totalCost: "150000" }],
    medicineUsage: [{ code: "OBT-001", name: "Paracetamol", quantity: 10, unit: "tablet" }],
    stockReport: [{ code: "OBT-002", name: "Amoxicillin", stock: 1, minimumStock: 10, unit: "strip", expires: "-", status: "Stok rendah" }],
  },
}

describe("report role scoping", () => {
  it("allows master to view every report section", () => {
    assert.deepEqual(getAllowedReportSections("MASTER"), ["diagnoses", "treatments", "medicineUsage", "stockReport"])
  })

  it("allows doctor to view every report section", () => {
    const scoped = scopeReportBundleForRole("DOCTOR", reportBundle)

    assert.deepEqual(scoped.reports.map((report) => report.label), ["Kunjungan", "Pasien baru", "Diagnosa terbanyak", "Penggunaan obat", "Obat stok rendah"])
    assert.equal(scoped.details.diagnoses.length, 1)
    assert.equal(scoped.details.treatments.length, 1)
    assert.equal(scoped.details.medicineUsage.length, 1)
    assert.equal(scoped.details.stockReport.length, 1)
    assert.equal(canViewReportSection("DOCTOR", "stockReport"), true)
  })

  it("blocks admin from report sections", () => {
    const scoped = scopeReportBundleForRole("ADMIN", reportBundle)

    assert.deepEqual(scoped.reports, [])
    assert.deepEqual(scoped.details, {
      diagnoses: [],
      treatments: [],
      medicineUsage: [],
      stockReport: [],
    })
    assert.equal(canViewReportSection("ADMIN", "diagnoses"), false)
  })

  it("blocks unknown roles from report sections", () => {
    const scoped = scopeReportBundleForRole("UNKNOWN_ROLE", reportBundle)

    assert.deepEqual(scoped.reports, [])
    assert.deepEqual(scoped.details, {
      diagnoses: [],
      treatments: [],
      medicineUsage: [],
      stockReport: [],
    })
  })
})
