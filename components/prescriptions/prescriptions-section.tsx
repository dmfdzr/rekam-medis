"use client"

import { type PrescriptionListItem, type PrescriptionFormOptions } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"

import * as React from "react"

import { getUniqueOptions } from "@/lib/utils"
import { useListControls } from "@/lib/hooks"
import { EmptyState, StatusBadge } from "@/components/shared/feedback"
import { Panel, ModalDialog, ChoiceFormSwitch, type ChoiceFormOption } from "@/components/shared/layout"
import { ListToolbar, FilterModal, PaginationControls } from "@/components/shared/list-controls"
import { PrescriptionDetailDialog } from "./prescription-dialogs"
import { PrescriptionItemForm, ProcessPrescriptionForm, CancelPrescriptionForm } from "./prescription-forms"

export function PrescriptionsSection({
  role,
  prescriptions,
  prescriptionOptions,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  role: RoleKey
  prescriptions: PrescriptionListItem[]
  prescriptionOptions: PrescriptionFormOptions
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "master" || role === "doctor"
  const canProcess = role === "master" || role === "doctor"
  const prescriptionActions: ChoiceFormOption[] = [
    ...(canCreate
      ? [
          {
            id: "create-prescription",
            title: "Buat resep",
            description: "Tambahkan obat manual dari CPPT pasien setelah hasil laboratorium tersimpan.",
            content: <PrescriptionItemForm prescriptionOptions={prescriptionOptions} />,
          },
        ]
      : []),
    ...(canProcess
      ? [
          {
            id: "process-prescription",
            title: "Proses resep",
            description: "Proses resep agar kunjungan dapat lanjut ke tahap CPPT.",
            content: <ProcessPrescriptionForm prescriptions={prescriptions} />,
          },
        ]
      : []),
    ...(canCreate || canProcess
      ? [
          {
            id: "cancel-prescription",
            title: "Batalkan resep",
            description: "Batalkan resep yang belum diproses tanpa menghapus catatan klinisnya.",
            content: <CancelPrescriptionForm prescriptions={prescriptions} />,
          },
        ]
      : []),
  ]
  const prescriptionStatuses = React.useMemo(() => getUniqueOptions(prescriptions, (prescription) => prescription.status), [prescriptions])
  const searchSelector = React.useCallback(
    (prescription: PrescriptionListItem) => [
      prescription.medicalRecordNumber,
      prescription.patient,
      prescription.items,
      prescription.doctor,
      prescription.pharmacist,
      prescription.status,
    ],
    [],
  )
  const filterSelector = React.useCallback((prescription: PrescriptionListItem, value: string) => prescription.status === value, [])
  const controls = useListControls({
    items: prescriptions,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="Daftar resep" description="Dokter melihat status proses resep dan detail obat sebelum alur layanan selesai.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari pasien, RM, dokter, obat, status stok"
          resultCount={controls.totalItems}
          totalCount={prescriptions.length}
        />
        {controls.paginatedItems.length === 0 ? (
          <EmptyState
            title={prescriptions.length === 0 ? "Belum ada resep" : "Resep tidak ditemukan"}
            detail={prescriptions.length === 0 ? "Resep yang dibuat dokter dari rekam medis akan tampil di sini." : "Ubah kata kunci atau filter status resep."}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[215px] text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">No. RM</th>
                    <th className="py-3 pr-4 font-medium">Pasien</th>
                    <th className="py-3 pr-4 font-medium">Item obat</th>
                    <th className="py-3 pr-4 font-medium">Dokter</th>
                    
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {controls.paginatedItems.map((prescription) => (
                    <tr key={prescription.id} className="align-top">
                      <td className="py-4 pr-4 font-medium tabular-nums">{prescription.medicalRecordNumber}</td>
                      <td className="py-4 pr-4">{prescription.patient}</td>
                      <td className="max-w-[20rem] py-4 pr-4 leading-6">{prescription.items}</td>
                      <td className="py-4 pr-4 text-muted-foreground">{prescription.doctor}</td>
                      <td className="py-4 pr-4">
                        <StatusBadge label={prescription.status} />
                      </td>
                      <td className="py-4">
                        <PrescriptionDetailDialog prescription={prescription} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 lg:hidden">
              {controls.paginatedItems.map((prescription) => (
                <div key={prescription.id} className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{prescription.medicalRecordNumber}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{prescription.patient}</p>
                    </div>
                    <StatusBadge label={prescription.status} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Item obat: </span>
                      {prescription.items}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Dokter: </span>
                      {prescription.doctor}
                    </p>
                  </div>
                  <div className="mt-3">
                    <PrescriptionDetailDialog prescription={prescription} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
      </Panel>
      <FilterModal
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Filter resep"
        description="Batasi daftar resep berdasarkan status proses."
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={prescriptionStatuses}
      />
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola resep" description="Pilih aksi resep sesuai kewenangan role aktif.">
        <ChoiceFormSwitch
          key={composerOpen ? "prescriptions-open" : "prescriptions-closed"}
          options={prescriptionActions}
          emptyMessage="Pengelolaan resep dibatasi untuk master dan dokter sesuai kewenangan masing-masing."
        />
      </ModalDialog>
    </div>
  )
}
