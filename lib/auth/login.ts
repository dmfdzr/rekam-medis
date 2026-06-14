import "server-only"

import { z } from "zod"

import { writeAuditLog } from "@/lib/auth/audit-log"
import { verifyPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email atau username wajib diisi."),
  password: z.string().min(1, "Password wajib diisi."),
})

export async function loginWithPassword({
  identifier,
  password,
  ipAddress,
  userAgent,
}: {
  identifier: string
  password: string
  ipAddress?: string | null
  userAgent?: string | null
}) {
  const parsed = loginSchema.safeParse({ identifier, password })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Input login belum lengkap.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const normalizedIdentifier = parsed.data.identifier.toLowerCase()
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    },
    include: {
      role: true,
    },
  })

  if (!user || user.status !== "ACTIVE") {
    return {
      ok: false,
      message: "Akun tidak ditemukan atau tidak aktif.",
    }
  }

  const passwordValid = await verifyPassword(parsed.data.password, user.passwordHash)

  if (!passwordValid) {
    await writeAuditLog({
      userId: user.id,
      action: "LOGIN_FAILED",
      entityName: "User",
      entityId: user.id,
      ipAddress,
      userAgent,
    })

    return {
      ok: false,
      message: "Email, username, atau password tidak sesuai.",
    }
  }

  await createSession({
    userId: user.id,
    ipAddress,
    userAgent,
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  await writeAuditLog({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    entityName: "User",
    entityId: user.id,
    ipAddress,
    userAgent,
  })

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role.key,
    },
  }
}
