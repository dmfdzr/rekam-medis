import "server-only"

import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

type AuditLogInput = {
  userId?: string | null
  action: string
  entityName: string
  entityId?: string | null
  beforeData?: Prisma.InputJsonValue
  afterData?: Prisma.InputJsonValue
  ipAddress?: string | null
  userAgent?: string | null
}

export function writeAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityName: input.entityName,
      entityId: input.entityId,
      beforeData: input.beforeData,
      afterData: input.afterData,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  })
}
