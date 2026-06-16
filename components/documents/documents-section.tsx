"use client"

import { type MedicalDocumentListItem, type DocumentFormOptions } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"

import * as React from "react"
import { Download } from "lucide-react"

import { getUniqueOptions } from "@/lib/utils"
import { useListControls } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { EmptyState, StatusBadge, PermissionNotice } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { ListToolbar, FilterModal, PaginationControls } from "@/components/shared/list-controls"
import { MedicalDocumentForm } from "./document-forms"

export function DocumentsSection({
  role,
  documents,
  documentOptions,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  role: RoleKey
  documents: MedicalDocumentListItem[]
  documentOptions: DocumentFormOptions
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "admin" || role === "doctor" || role === "nurse"
  const documentTypes = React.useMemo(() => getUniqueOptions(documents, (document) => document.type), [documents])
  const searchSelector = React.useCallback(
    (document: MedicalDocumentListItem) => [
      document.fileName,
      document.fileUrl,
      document.medicalRecordNumber,
      document.patient,
      document.visit,
      document.type,
      document.uploadedBy,
    ],
    [],
  )
  const filterSelector = React.useCallback((document: MedicalDocumentListItem, value: string) => document.type === value, [])
  const controls = useListControls({
    items: documents,
    pageSize: 6,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="Dokumen terbaru" description="Dokumen sistem dibuat saat dibuka, sedangkan dokumen eksternal dicatat sebagai referensi.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari pasien, RM, nama dokumen, tipe, pencatat"
          resultCount={controls.totalItems}
          totalCount={documents.length}
        />
        {controls.paginatedItems.length === 0 ? (
          <EmptyState
            title={documents.length === 0 ? "Belum ada dokumen" : "Dokumen tidak ditemukan"}
            detail={documents.length === 0 ? "Dokumen medis akan tampil dengan pasien, tipe, pencatat, dan akses generate." : "Ubah kata kunci atau filter tipe dokumen."}
          />
        ) : (
          <>
            <div className="grid gap-3">
              {controls.paginatedItems.map((document) => (
                <div key={document.id} className="rounded-md border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{document.fileName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {document.medicalRecordNumber} - {document.patient}
                      </p>
                    </div>
                    <StatusBadge label={document.type} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{document.visit}</p>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
                    <a href={document.fileUrl} target="_blank" rel="noreferrer">
                      <Download className="size-3" aria-hidden="true" />
                      Buka / generate
                    </a>
                  </Button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {document.uploadedBy} - {document.uploadedAt}
                  </p>
                </div>
              ))}
            </div>
            <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
          </>
        )}
      </Panel>
      <FilterModal
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Filter dokumen"
        description="Batasi dokumen medis berdasarkan tipe dokumen."
        filterLabel="Tipe"
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={documentTypes}
      />
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola dokumen" description="Simpan metadata dokumen; isi dokumen sistem dibuat otomatis saat dibuka.">
        {canCreate ? <MedicalDocumentForm documentOptions={documentOptions} /> : <PermissionNotice message="Kelola dokumen dibatasi untuk admin, dokter, dan perawat." />}
      </ModalDialog>
    </div>
  )
}
