import "server-only"

import { cache } from "react"

import { getSessionFromCookie } from "@/lib/auth/session"

export const getCurrentUser = cache(async () => {
  const session = await getSessionFromCookie()

  if (!session?.user || session.user.status !== "ACTIVE") {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    username: session.user.username,
    role: session.user.role.key,
    roleName: session.user.role.name,
  }
})
