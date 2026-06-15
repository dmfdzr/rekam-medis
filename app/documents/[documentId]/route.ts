import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/auth/audit-log"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canAccess } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;,]+);base64,([\s\S]+)$/)

  if (!match) {
    return null
  }

  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], "base64"),
  }
}

function contentDispositionFileName(fileName: string) {
  return fileName.replace(/["\\\r\n]/g, "_")
}

export async function GET(request: Request, context: { params: Promise<{ documentId: string }> }) {
  const user = await getCurrentUser()

  if (!user || !canAccess(user.role, "documents")) {
    return NextResponse.json({ message: "Akses dokumen ditolak." }, { status: 403 })
  }

  const { documentId } = await context.params
  const document = await prisma.medicalDocument.findUnique({
    where: { id: documentId },
    select: {
      fileName: true,
      fileUrl: true,
      type: true,
      patient: {
        select: {
          fullName: true,
          medicalRecordNumber: true,
        },
      },
    },
  })

  if (!document) {
    return NextResponse.json({ message: "Dokumen tidak ditemukan." }, { status: 404 })
  }

  const parsedFile = parseDataUrl(document.fileUrl)

  if (!parsedFile) {
    return NextResponse.json({ message: "File dokumen belum tersedia di storage internal." }, { status: 404 })
  }

  const forwardedFor = request.headers.get("x-forwarded-for")
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip")

  await writeAuditLog({
    userId: user.id,
    action: "VIEW_MEDICAL_DOCUMENT",
    entityName: "MedicalDocument",
    entityId: documentId,
    afterData: {
      fileName: document.fileName,
      type: document.type,
      patientName: document.patient.fullName,
      medicalRecordNumber: document.patient.medicalRecordNumber,
    },
    ipAddress,
    userAgent: request.headers.get("user-agent"),
  })

  return new Response(parsedFile.bytes, {
    headers: {
      "Content-Disposition": `inline; filename="${contentDispositionFileName(document.fileName)}"`,
      "Content-Length": String(parsedFile.bytes.byteLength),
      "Content-Type": parsedFile.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  })
}
