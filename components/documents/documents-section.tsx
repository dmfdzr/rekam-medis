"use client"

import { RoleKey } from "@/lib/medical-data"
import type { DocumentFormOptions, MedicalDocumentListItem } from "@/lib/data/clinic"
import * as React from "react"
import { CheckCircle2, Download, Eye } from "lucide-react"

import { useListControls, useRefreshOnSuccess } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { DownloadAction } from "@/components/shared/download-action"
import { EmptyState, StatusBadge, PermissionNotice } from "@/components/shared/feedback"
import { ModalDialog, Panel } from "@/components/shared/layout"
import { ListToolbar, PaginationControls } from "@/components/shared/list-controls"
import { verifyMedicalRecordAction } from "@/app/actions/clinic"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePickerField, TextAreaField, FieldError, FormMessage } from "@/components/shared/forms"

const dischargeConditionOptions = [
  { value: "ALLOWED_HOME", label: "Diijinkan Pulang" },
  { value: "REFERRED", label: "Dirujuk" },
  { value: "OWN_REQUEST", label: "Atas Permintaan Sendiri" },
  { value: "DIED", label: "Meninggal" },
  { value: "LEFT_WITHOUT_NOTICE", label: "Melarikan Diri" },
]

function VerifyForm({ recordId, canVerify }: { recordId: string; canVerify: boolean }) {
  const [state, formAction, pending] = React.useActionState(verifyMedicalRecordAction, {})
  const [open, setOpen] = React.useState(false)
  useRefreshOnSuccess(state)

  React.useEffect(() => {
    if (state.ok) {
      setOpen(false)
    }
  }, [state.ok])

  if (!canVerify) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-fit">
          <CheckCircle2 className="size-3 mr-1" aria-hidden="true" />
          Verifikasi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Verifikasi dokumen medis</DialogTitle>
          <DialogDescription>
            Lengkapi kondisi pulang dan instruksi pulang sebelum dokumen dinyatakan terverifikasi.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="recordId" value={recordId} />
          <div className="grid gap-2">
            <span className="text-sm font-medium">Kondisi pulang</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {dischargeConditionOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="dischargeCondition"
                    value={option.value}
                    className="size-4 accent-primary"
                    disabled={pending}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <FieldError message={state.errors?.dischargeCondition?.[0]} />
          </div>
          <TextAreaField
            name="dischargeInstruction"
            label="Instruksi pulang"
            placeholder="Isi instruksi pulang pasien"
            error={state.errors?.dischargeInstruction?.[0]}
          />
          <FormMessage state={state} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {pending ? "Memverifikasi..." : "Simpan verifikasi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DocumentsSection({
  role,
  documents,
  filtersOpen,
  onFiltersOpenChange,
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
  const [verificationFilter, setVerificationFilter] = React.useState("all")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  
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
  const filteredDocuments = React.useMemo(() => {
    return documents.filter((record) => {
      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" && record.isVerified) ||
        (verificationFilter === "unverified" && !record.isVerified)
      const matchesStartDate = !startDate || record.filterDate >= startDate
      const matchesEndDate = !endDate || record.filterDate <= endDate

      return matchesVerification && matchesStartDate && matchesEndDate
    })
  }, [documents, endDate, startDate, verificationFilter])

  const controls = useListControls({
    items: filteredDocuments,
    pageSize: 6,
    search: searchSelector,
  })
  const { setPage } = controls

  React.useEffect(() => {
    setPage(1)
  }, [endDate, setPage, startDate, verificationFilter])

  function resetFilters() {
    setVerificationFilter("all")
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="grid gap-5">
      <ModalDialog
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Filter dokumen medis"
        description="Saring dokumen berdasarkan status verifikasi dan tanggal perubahan data."
      >
        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Status verifikasi</span>
            <select
              value={verificationFilter}
              onChange={(event) => setVerificationFilter(event.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            >
              <option value="all">Semua dokumen</option>
              <option value="verified">Terverifikasi</option>
              <option value="unverified">Belum verifikasi</option>
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePickerField name="" label="Tanggal mulai" value={startDate} onValueChange={setStartDate} placeholder="Semua tanggal" />
            <DatePickerField name="" label="Tanggal akhir" value={endDate} onValueChange={setEndDate} placeholder="Semua tanggal" />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="lg" onClick={resetFilters}>
              Reset
            </Button>
            <Button type="button" size="lg" onClick={() => onFiltersOpenChange(false)}>
              Terapkan
            </Button>
          </div>
        </div>
      </ModalDialog>
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
                        <DownloadAction href={`${record.documentUrl}?download=1`} label="Download" icon={Download} size="sm" className="w-fit" loadingTitle="Menyiapkan dokumen medis" loadingDetail="Resume medis sedang dibuat dalam format PDF." />
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
                    <DownloadAction href={`${record.documentUrl}?download=1`} label="Download" icon={Download} size="sm" className="w-full sm:w-fit" loadingTitle="Menyiapkan dokumen medis" loadingDetail="Resume medis sedang dibuat dalam format PDF." />
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
