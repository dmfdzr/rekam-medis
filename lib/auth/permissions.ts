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

export type UserRoleKey = "ADMIN" | "REGISTRATION" | "DOCTOR" | "NURSE" | "PHARMACIST"

export const permissions: Record<PermissionKey, UserRoleKey[]> = {
  dashboard: ["ADMIN", "REGISTRATION", "DOCTOR", "NURSE", "PHARMACIST"],
  users: ["ADMIN"],
  patients: ["ADMIN", "REGISTRATION", "DOCTOR", "NURSE"],
  visits: ["ADMIN", "REGISTRATION", "DOCTOR", "NURSE"],
  vitals: ["ADMIN", "DOCTOR", "NURSE"],
  records: ["ADMIN", "DOCTOR"],
  prescriptions: ["ADMIN", "DOCTOR", "PHARMACIST"],
  medicines: ["ADMIN", "DOCTOR", "PHARMACIST"],
  documents: ["ADMIN", "DOCTOR", "NURSE"],
  reports: ["ADMIN", "DOCTOR", "PHARMACIST"],
  audit: ["ADMIN"],
}

export function canAccess(role: string, permission: PermissionKey) {
  return permissions[permission].includes(role as UserRoleKey)
}
