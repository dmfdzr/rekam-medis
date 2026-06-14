import { UserRole } from "@prisma/client"

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

export const permissions: Record<PermissionKey, UserRole[]> = {
  dashboard: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGISTRATION, UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST],
  users: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  patients: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGISTRATION, UserRole.DOCTOR, UserRole.NURSE],
  visits: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGISTRATION, UserRole.DOCTOR, UserRole.NURSE],
  vitals: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE],
  records: [UserRole.SUPER_ADMIN, UserRole.DOCTOR],
  prescriptions: [UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST],
  medicines: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST],
  documents: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE],
  reports: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST],
  audit: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
}

export function canAccess(role: UserRole, permission: PermissionKey) {
  return permissions[permission].includes(role)
}
