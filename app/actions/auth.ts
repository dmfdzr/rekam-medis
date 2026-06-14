"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { loginWithPassword } from "@/lib/auth/login"
import { logoutCurrentUser } from "@/lib/auth/logout"

export type LoginFormState = {
  message?: string
  errors?: {
    identifier?: string[]
    password?: string[]
  }
}

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
