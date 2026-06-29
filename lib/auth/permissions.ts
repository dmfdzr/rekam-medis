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

export type UserRoleKey = "MASTER" | "ADMIN" | "DOCTOR"

export const permissions: Record<PermissionKey, UserRoleKey[]> = {
  dashboard: ["MASTER", "ADMIN", "DOCTOR"],
  users: ["MASTER"],
  patients: ["MASTER", "ADMIN"],
  visits: ["MASTER", "ADMIN"],
  vitals: ["MASTER", "DOCTOR"],
  records: ["MASTER", "DOCTOR"],
  prescriptions: ["MASTER", "DOCTOR"],
  medicines: ["MASTER", "DOCTOR"],
  documents: ["MASTER", "DOCTOR"],
  reports: ["MASTER", "DOCTOR"],
  audit: ["MASTER"],
}

export function canAccess(role: string, permission: PermissionKey) {
  return permissions[permission].includes(role as UserRoleKey)
}
