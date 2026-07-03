import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { canAccess, permissions, type PermissionKey, type UserRoleKey } from "@/lib/auth/permissions"
import { canAccessSection, type RoleKey, type SectionKey } from "@/lib/medical-data"

const roleMap: Record<RoleKey, UserRoleKey> = {
  master: "MASTER",
  admin: "ADMIN",
  doctor: "DOCTOR",
}

const sectionPermissionMap: Partial<Record<SectionKey, PermissionKey>> = {
  audit: "audit",
  dashboard: "dashboard",
  documents: "documents",
  patients: "patients",
  prescriptions: "prescriptions",
  records: "records",
  reports: "reports",
  users: "users",
  visits: "visits",
  assessment: "assessment",
  laboratory: "laboratory",
}

describe("role access", () => {
  it("keeps the backend permission matrix aligned with visible navigation", () => {
    for (const [uiRole, backendRole] of Object.entries(roleMap) as Array<[RoleKey, UserRoleKey]>) {
      for (const [section, permission] of Object.entries(sectionPermissionMap) as Array<[SectionKey, PermissionKey]>) {
        assert.equal(
          canAccess(backendRole, permission),
          canAccessSection(uiRole, section),
          `${backendRole} permission ${permission} must match ${uiRole} navigation ${section}`,
        )
      }
    }
  })

  it("allows Master to access every protected feature", () => {
    for (const permission of Object.keys(permissions) as PermissionKey[]) {
      assert.equal(canAccess("MASTER", permission), true, `MASTER must access ${permission}`)
    }
  })

  it("limits Admin to dashboard, patients, and visits", () => {
    const adminAllowed: PermissionKey[] = ["dashboard", "patients", "visits"]
    const adminBlocked: PermissionKey[] = ["users", "assessment", "laboratory", "records", "prescriptions", "documents", "reports", "audit"]

    for (const permission of adminAllowed) {
      assert.equal(canAccess("ADMIN", permission), true, `ADMIN must access ${permission}`)
    }
    for (const permission of adminBlocked) {
      assert.equal(canAccess("ADMIN", permission), false, `ADMIN must not access ${permission}`)
    }
  })

  it("limits Doctor to clinical features", () => {
    const doctorAllowed: PermissionKey[] = ["dashboard", "assessment", "laboratory", "records", "prescriptions", "documents", "reports"]
    const doctorBlocked: PermissionKey[] = ["users", "patients", "visits", "audit"]

    for (const permission of doctorAllowed) {
      assert.equal(canAccess("DOCTOR", permission), true, `DOCTOR must access ${permission}`)
    }
    for (const permission of doctorBlocked) {
      assert.equal(canAccess("DOCTOR", permission), false, `DOCTOR must not access ${permission}`)
    }
  })

  it("blocks unknown roles by default", () => {
    for (const permission of Object.keys(permissions) as PermissionKey[]) {
      assert.equal(canAccess("UNKNOWN_ROLE", permission), false, `unknown role must not access ${permission}`)
    }
  })
})
