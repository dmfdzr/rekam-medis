export type PermissionKey =
  | "dashboard"
  | "users"
  | "patients"
  | "visits"
  | "vitals"
  | "records"
  | "prescriptions"
  | "medicines"
  | "documents"
  | "reports"
  | "audit"

export type UserRoleKey = "SUPER_ADMIN" | "ADMIN" | "REGISTRATION" | "DOCTOR" | "NURSE" | "PHARMACIST"

export const permissions: Record<PermissionKey, UserRoleKey[]> = {
  dashboard: ["SUPER_ADMIN", "ADMIN", "REGISTRATION", "DOCTOR", "NURSE", "PHARMACIST"],
  users: ["SUPER_ADMIN", "ADMIN"],
  patients: ["SUPER_ADMIN", "ADMIN", "REGISTRATION", "DOCTOR", "NURSE"],
  visits: ["SUPER_ADMIN", "ADMIN", "REGISTRATION", "DOCTOR", "NURSE"],
  vitals: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE"],
  records: ["SUPER_ADMIN", "DOCTOR"],
  prescriptions: ["SUPER_ADMIN", "DOCTOR", "PHARMACIST"],
  medicines: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "PHARMACIST"],
  documents: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE"],
  reports: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "PHARMACIST"],
  audit: ["SUPER_ADMIN", "ADMIN"],
}

export function canAccess(role: string, permission: PermissionKey) {
  return permissions[permission].includes(role as UserRoleKey)
}
