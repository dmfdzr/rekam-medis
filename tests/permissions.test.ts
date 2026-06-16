import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { canAccess, permissions, type PermissionKey, type UserRoleKey } from "@/lib/auth/permissions"
import { canAccessSection, type RoleKey, type SectionKey } from "@/lib/medical-data"

const roleMap: Record<RoleKey, UserRoleKey> = {
  admin: "ADMIN",
  registration: "REGISTRATION",
  doctor: "DOCTOR",
  nurse: "NURSE",
  pharmacist: "PHARMACIST",
}

const sectionPermissionMap: Partial<Record<SectionKey, PermissionKey>> = {
  audit: "audit",
  dashboard: "dashboard",
  documents: "documents",
  medicines: "medicines",
  patients: "patients",
  prescriptions: "prescriptions",
  records: "records",
  reports: "reports",
  users: "users",
  visits: "visits",
  vitals: "vitals",
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

  it("allows Admin to access every protected feature", () => {
    for (const permission of Object.keys(permissions) as PermissionKey[]) {
      assert.equal(canAccess("ADMIN", permission), true, `ADMIN must access ${permission}`)
    }
  })

  it("blocks unknown roles by default", () => {
    for (const permission of Object.keys(permissions) as PermissionKey[]) {
      assert.equal(canAccess("UNKNOWN_ROLE", permission), false, `unknown role must not access ${permission}`)
    }
  })
})
