import "server-only"

import { cookies } from "next/headers"

import { prisma } from "@/lib/prisma"
import { createSessionToken, hashSessionToken } from "@/lib/auth/session-token"

export const sessionCookieName = "medrecord_session"

const sessionMaxAgeMs = 1000 * 60 * 60 * 8
const sessionRetentionMs = 1000 * 60 * 60 * 24 * 30

export async function pruneExpiredSessions(userId?: string) {
  const retentionCutoff = new Date(Date.now() - sessionRetentionMs)

  return prisma.session.deleteMany({
    where: {
      ...(userId ? { userId } : {}),
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: retentionCutoff } }],
    },
  })
}

export async function revokeOtherUserSessions(userId: string, currentToken?: string | null) {
  return prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(currentToken ? { tokenHash: { not: hashSessionToken(currentToken) } } : {}),
    },
    data: {
      revokedAt: new Date(),
    },
  })
}

export async function createSession({
  userId,
  ipAddress,
  userAgent,
}: {
  userId: string
  ipAddress?: string | null
  userAgent?: string | null
}) {
  await pruneExpiredSessions(userId)

  const token = createSessionToken()
  const expiresAt = new Date(Date.now() + sessionMaxAgeMs)

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      ipAddress,
      userAgent,
    },
  })

  const cookieStore = await cookies()

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  })

  return { expiresAt }
}

export async function getSessionFromCookie() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionCookieName)?.value

  if (!token) {
    return null
  }

  return prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  })
}

export async function getCurrentSessionToken() {
  const cookieStore = await cookies()

  return cookieStore.get(sessionCookieName)?.value ?? null
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionCookieName)?.value

  if (token) {
    await prisma.session.updateMany({
      where: {
        tokenHash: hashSessionToken(token),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  cookieStore.delete(sessionCookieName)
}
