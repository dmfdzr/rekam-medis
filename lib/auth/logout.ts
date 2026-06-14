import "server-only"

import { writeAuditLog } from "@/lib/auth/audit-log"
import { getCurrentUser } from "@/lib/auth/current-user"
import { revokeCurrentSession } from "@/lib/auth/session"

export async function logoutCurrentUser({
  ipAddress,
  userAgent,
}: {
  ipAddress?: string | null
  userAgent?: string | null
} = {}) {
  const user = await getCurrentUser()

  await revokeCurrentSession()

  if (user) {
    await writeAuditLog({
      userId: user.id,
      action: "LOGOUT",
      entityName: "User",
      entityId: user.id,
      ipAddress,
      userAgent,
    })
  }
}
