export type PermissionKey =
  | "dashboard"
  | "users"
  | "patients"
  | "visits"
  | "laboratory"
  | "records"
  | "prescriptions"
  | "documents"
  | "reports"
  | "audit"

export type UserRoleKey = "MASTER" | "ADMIN" | "DOCTOR"

export const permissions: Record<PermissionKey, UserRoleKey[]> = {
  dashboard: ["MASTER", "ADMIN", "DOCTOR"],
  users: ["MASTER"],
  patients: ["MASTER", "ADMIN"],
  visits: ["MASTER", "ADMIN"],
  laboratory: ["MASTER", "DOCTOR"],
  records: ["MASTER", "DOCTOR"],
  prescriptions: ["MASTER", "DOCTOR"],
  documents: ["MASTER", "DOCTOR"],
  reports: ["MASTER", "DOCTOR"],
  audit: ["MASTER"],
}

export function canAccess(role: string, permission: PermissionKey) {
  return permissions[permission].includes(role as UserRoleKey)
}
