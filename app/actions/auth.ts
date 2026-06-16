"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Prisma } from "@prisma/client"
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

export type UpdateAccountFormState = {
  ok?: boolean
  message?: string
  errors?: {
    name?: string[]
    email?: string[]
    username?: string[]
  }
}

const updateAccountSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
  email: z.email("Email tidak valid.").trim().toLowerCase(),
  username: z.string().trim().min(3, "Username minimal 3 karakter.").toLowerCase(),
})

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

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
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

  redirect("/app")
}

export async function logoutAction() {
  const headerStore = await headers()

  await logoutCurrentUser(getRequestContext(headerStore))

  redirect("/login")
}

export async function updateAccountAction(_state: UpdateAccountFormState, formData: FormData): Promise<UpdateAccountFormState> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      ok: false,
      message: "Session tidak valid. Silakan login ulang.",
    }
  }

  const parsed = updateAccountSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    username: formData.get("username"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "Data akun belum valid.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
    },
  })

  if (!account) {
    return {
      ok: false,
      message: "Akun tidak ditemukan.",
    }
  }

  const updateData = {
    name: parsed.data.name,
    email: parsed.data.email,
    username: parsed.data.username,
  }

  const hasChanges = account.name !== updateData.name || account.email.toLowerCase() !== updateData.email || account.username.toLowerCase() !== updateData.username

  if (!hasChanges) {
    return {
      ok: false,
      message: "Tidak ada perubahan data akun.",
    }
  }

  try {
    const updatedAccount = await prisma.user.update({
      where: { id: account.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    })

    const headerStore = await headers()

    await writeAuditLog({
      userId: account.id,
      action: "UPDATE_OWN_ACCOUNT",
      entityName: "User",
      entityId: account.id,
      beforeData: {
        name: account.name,
        email: account.email,
        username: account.username,
      },
      afterData: {
        name: updatedAccount.name,
        email: updatedAccount.email,
        username: updatedAccount.username,
      },
      ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip"),
      userAgent: headerStore.get("user-agent"),
    })

    revalidatePath("/")

    return {
      ok: true,
      message: "Profil akun berhasil diperbarui.",
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Email atau username sudah digunakan user lain.",
        errors: {
          email: ["Periksa email, mungkin sudah digunakan."],
          username: ["Periksa username, mungkin sudah digunakan."],
        },
      }
    }

    return {
      ok: false,
      message: "Profil akun gagal diperbarui.",
    }
  }
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
