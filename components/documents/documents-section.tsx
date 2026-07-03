"use client"

import { RoleKey } from "@/lib/medical-data"
import type { DocumentFormOptions, MedicalDocumentListItem } from "@/lib/data/clinic"
import * as React from "react"
import { CheckCircle2, Download, Eye } from "lucide-react"

import { useListControls, useRefreshOnSuccess } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { EmptyState, StatusBadge, PermissionNotice } from "@/components/shared/feedback"
import { Panel } from "@/components/shared/layout"
import { ListToolbar, PaginationControls } from "@/components/shared/list-controls"
import { verifyMedicalRecordAction } from "@/app/actions/clinic"

function VerifyForm({ recordId, canVerify }: { recordId: string; canVerify: boolean }) {
  const [state, formAction, pending] = React.useActionState(verifyMedicalRecordAction, {})
  useRefreshOnSuccess(state)

  if (!canVerify) return null

  return (
    <form action={formAction} className="inline-block">
      <input type="hidden" name="recordId" value={recordId} />
      <Button type="submit" variant="outline" size="sm" className="w-fit" disabled={pending}>
        <CheckCircle2 className="size-3 mr-1" aria-hidden="true" />
        {pending ? "Memverifikasi..." : "Verifikasi"}
      </Button>
    </form>
  )
}

export function DocumentsSection({
  role,
  documents,
}: {
  role: RoleKey
  documents: MedicalDocumentListItem[]
  documentOptions: DocumentFormOptions
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canVerify = role === "master" || role === "doctor"
  
  const searchSelector = React.useCallback(
    (record: MedicalDocumentListItem) => [
      record.patient,
      record.medicalRecordNumber,
      record.visit,
      record.doctor,
      record.status,
    ],
    [],
  )

  const controls = useListControls({
    items: documents,
    pageSize: 6,
    search: searchSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="Rangkuman & Verifikasi Dokumen Medis" description="Daftar CPPT pasien yang dapat dilihat, diunduh, dan diverifikasi oleh dokter.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari pasien, RM, kunjungan, dokter"
          resultCount={controls.totalItems}
          totalCount={documents.length}
        />
        {controls.paginatedItems.length === 0 ? (
          <EmptyState
            title={documents.length === 0 ? "Belum ada dokumen medis" : "Dokumen tidak ditemukan"}
            detail={documents.length === 0 ? "Dokumen medis (CPPT) pasien akan muncul di sini." : "Ubah kata kunci pencarian."}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Pasien</th>
                    <th className="py-3 pr-4 font-medium">No. RM</th>
                    <th className="py-3 pr-4 font-medium">Kunjungan</th>
                    <th className="py-3 pr-4 font-medium">Dokter</th>
                    <th className="py-3 pr-4 font-medium">Status CPPT</th>
                    <th className="py-3 pr-4 font-medium">Verifikasi</th>
                    <th className="py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {controls.paginatedItems.map((record) => (
                    <tr key={record.id} className="align-top">
                      <td className="py-4 pr-4 font-medium leading-6">{record.patient}</td>
                      <td className="py-4 pr-4 tabular-nums">{record.medicalRecordNumber}</td>
                      <td className="max-w-[13rem] py-4 pr-4 text-muted-foreground">{record.visit}</td>
                      <td className="py-4 pr-4">{record.doctor}</td>
                      <td className="py-4 pr-4">
                        <StatusBadge label={record.status} />
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">
                        {record.isVerified ? (
                          <>
                            <span className="block text-green-600 dark:text-green-400 font-medium">Terverifikasi</span>
                            <span className="mt-1 block text-xs">Oleh: {record.verifiedBy}</span>
                            <span className="block text-xs">{record.verifiedAt}</span>
                          </>
                        ) : (
                          <span className="block text-amber-600 dark:text-amber-400">Belum Diverifikasi</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm" className="w-fit">
                          <a href={record.documentUrl} target="_blank" rel="noreferrer">
                            <Eye className="size-3 mr-1" aria-hidden="true" />
                            Lihat
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="w-fit">
                          <a href={`${record.documentUrl}?download=1`}>
                            <Download className="size-3 mr-1" aria-hidden="true" />
                            Download
                          </a>
                        </Button>
                        {!record.isVerified && record.status === "FINAL" && (
                          <VerifyForm recordId={record.id} canVerify={canVerify} />
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 xl:hidden">
              {controls.paginatedItems.map((record) => (
                <div key={record.id} className="rounded-md border border-border bg-card p-3 sm:p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div className="min-w-0">
                      <p className="font-medium">{record.patient}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {record.medicalRecordNumber}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      <StatusBadge label={record.status} />
                      {record.isVerified ? (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">Terverifikasi</span>
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400">Belum Verifikasi</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm leading-6">
                    <p>
                      <span className="text-muted-foreground">Kunjungan: </span>
                      {record.visit}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Dokter: </span>
                      {record.doctor}
                    </p>
                    {record.isVerified && (
                      <p>
                        <span className="text-muted-foreground">Diverifikasi oleh: </span>
                        {record.verifiedBy} ({record.verifiedAt})
                      </p>
                    )}
                  </div>
                  <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                    <Button asChild variant="outline" size="sm" className="w-full sm:w-fit">
                      <a href={record.documentUrl} target="_blank" rel="noreferrer">
                        <Eye className="size-3 mr-1" aria-hidden="true" />
                        Lihat
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full sm:w-fit">
                      <a href={`${record.documentUrl}?download=1`}>
                        <Download className="size-3 mr-1" aria-hidden="true" />
                        Download
                      </a>
                    </Button>
                    {!record.isVerified && record.status === "FINAL" && (
                      <VerifyForm recordId={record.id} canVerify={canVerify} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
      </Panel>
    </div>
  )
}
