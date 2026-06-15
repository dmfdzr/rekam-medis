"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { writeAuditLog } from "@/lib/auth/audit-log"
import { getCurrentUser } from "@/lib/auth/current-user"
import { loginWithPassword } from "@/lib/auth/login"
import { logoutCurrentUser } from "@/lib/auth/logout"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { getCurrentSessionToken, revokeOtherUserSessions } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export type LoginFormState = {
  message?: string
  errors?: {
    identifier?: string[]
    password?: string[]
  }
}

export type ChangePasswordFormState = {
  ok?: boolean
  message?: string
  errors?: {
    currentPassword?: string[]
    newPassword?: string[]
    confirmPassword?: string[]
  }
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  })

function getRequestContext(headerStore: Headers) {
  return {
    ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip"),
    userAgent: headerStore.get("user-agent"),
  }
}

export async function loginAction(_state: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const headerStore = await headers()
  const result = await loginWithPassword({
    identifier: String(formData.get("identifier") ?? ""),
    password: String(formData.get("password") ?? ""),
    ...getRequestContext(headerStore),
  })

  if (!result.ok) {
    return {
      message: result.message,
      errors: result.errors,
    }
  }

  redirect("/")
}

export async function logoutAction() {
  const headerStore = await headers()

  await logoutCurrentUser(getRequestContext(headerStore))

  redirect("/login")
}

export async function changePasswordAction(_state: ChangePasswordFormState, formData: FormData): Promise<ChangePasswordFormState> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      ok: false,
      message: "Session tidak valid. Silakan login ulang.",
    }
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data password belum valid.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      passwordHash: true,
    },
  })

  if (!account) {
    return {
      ok: false,
      message: "Akun tidak ditemukan.",
    }
  }

  const passwordValid = await verifyPassword(parsed.data.currentPassword, account.passwordHash)

  if (!passwordValid) {
    return {
      ok: false,
      message: "Password saat ini tidak sesuai.",
      errors: { currentPassword: ["Password saat ini tidak sesuai."] },
    }
  }

  await prisma.user.update({
    where: { id: account.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
    },
  })

  const headerStore = await headers()
  const currentSessionToken = await getCurrentSessionToken()
  const revokedSessions = await revokeOtherUserSessions(account.id, currentSessionToken)

  await writeAuditLog({
    userId: account.id,
    action: "CHANGE_PASSWORD",
    entityName: "User",
    entityId: account.id,
    afterData: {
      revokedOtherSessions: revokedSessions.count,
    },
    ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip"),
    userAgent: headerStore.get("user-agent"),
  })

  return {
    ok: true,
    message: "Password berhasil diperbarui.",
  }
}
