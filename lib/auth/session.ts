import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"

import { prisma } from "@/lib/prisma"

export const sessionCookieName = "medrecord_session"

const sessionMaxAgeMs = 1000 * 60 * 60 * 8

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url")
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
