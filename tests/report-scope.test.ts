import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { canViewReportSection, getAllowedReportSections, scopeReportBundleForRole } from "@/lib/reports/scope"

const reportBundle: Parameters<typeof scopeReportBundleForRole>[1] = {
  reports: [
    { label: "Kunjungan", period: "Range", value: "10", trend: "Range" },
    { label: "Pasien baru", period: "Range", value: "4", trend: "Range" },
    { label: "Diagnosa terbanyak", period: "Range", value: "ISPA", trend: "3 kasus" },
  ],
  details: {
    diagnoses: [{ name: "ISPA", count: 3 }],
    treatments: [{ name: "Konsultasi", count: 3 }],
    diagnosisOptions: [{ name: "ISPA", count: 3 }],
    diagnosisMap: {
      level: "district",
      totalCases: 3,
      totalPatients: 2,
      totalRegions: 1,
      mappedLocations: 0,
      locations: [],
    },
  },
}

describe("report role scoping", () => {
  it("allows master to view every report section", () => {
    assert.deepEqual(getAllowedReportSections("MASTER"), ["diagnoses", "treatments"])
  })

  it("allows doctor to view every report section", () => {
    const scoped = scopeReportBundleForRole("DOCTOR", reportBundle)

    assert.deepEqual(scoped.reports.map((report) => report.label), ["Kunjungan", "Pasien baru", "Diagnosa terbanyak"])
    assert.equal(scoped.details.diagnoses.length, 1)
    assert.equal(scoped.details.treatments.length, 1)
    assert.equal(canViewReportSection("DOCTOR", "treatments"), true)
  })

  it("blocks admin from report sections", () => {
    const scoped = scopeReportBundleForRole("ADMIN", reportBundle)

    assert.deepEqual(scoped.reports, [])
    assert.deepEqual(scoped.details, {
      diagnoses: [],
      treatments: [],
      diagnosisOptions: [],
      diagnosisMap: {
        level: "district",
        totalCases: 0,
        totalPatients: 0,
        totalRegions: 0,
        mappedLocations: 0,
        locations: [],
      },
    })
    assert.equal(canViewReportSection("ADMIN", "diagnoses"), false)
  })

  it("blocks unknown roles from report sections", () => {
    const scoped = scopeReportBundleForRole("UNKNOWN_ROLE", reportBundle)

    assert.deepEqual(scoped.reports, [])
    assert.deepEqual(scoped.details, {
      diagnoses: [],
      treatments: [],
      diagnosisOptions: [],
      diagnosisMap: {
        level: "district",
        totalCases: 0,
        totalPatients: 0,
        totalRegions: 0,
        mappedLocations: 0,
        locations: [],
      },
    })
  })
})
