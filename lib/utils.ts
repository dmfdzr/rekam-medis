import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { type RoleKey } from "@/lib/medical-data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSearchValue(value: unknown) {
  return String(value ?? "").toLowerCase()
}

export function getUniqueOptions<T>(items: T[], selector: (item: T) => string) {
  return Array.from(new Set(items.map(selector).filter(Boolean)))
}

export function mapUserRoleToAppRole(role: string): RoleKey {
  const roleMap: Record<string, RoleKey> = {
    MASTER: "master",
    ADMIN: "admin",
    DOCTOR: "doctor",
  }

  return roleMap[role] ?? "doctor"
}
