"use client"

import { type MedicineListItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"

import * as React from "react"

import { getUniqueOptions } from "@/lib/utils"
import { useListControls } from "@/lib/hooks"
import { EmptyState, StatusBadge } from "@/components/shared/feedback"
import { Panel, ModalDialog, ChoiceFormSwitch, type ChoiceFormOption } from "@/components/shared/layout"
import { ListToolbar, FilterModal, PaginationControls } from "@/components/shared/list-controls"
import { MedicineDetailDialog } from "./medicine-dialog"
import { CreateMedicineForm, UpdateMedicineForm, DeactivateMedicineForm } from "./medicine-forms"

export function MedicinesSection({
  role,
  medicines,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  role: RoleKey
  medicines: MedicineListItem[]
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "master" || role === "doctor"
  const medicineActions: ChoiceFormOption[] = canCreate
    ? [
        {
          id: "create-medicine",
          title: "Tambah obat",
          description: "Tambahkan master obat yang dipakai saat dokter membuat resep dan apoteker memproses stok.",
          content: <CreateMedicineForm />,
        },
        {
          id: "update-medicine",
          title: "Update inventori",
          description: "Perbarui stok, batas minimum, status, harga, atau tanggal kedaluwarsa obat.",
          content: <UpdateMedicineForm medicines={medicines} />,
        },
        {
          id: "deactivate-medicine",
          title: "Nonaktifkan obat",
          description: "Keluarkan obat dari pilihan resep aktif tanpa menghapus histori penggunaan.",
          content: <DeactivateMedicineForm medicines={medicines} />,
        },
      ]
    : []
  const medicineStatuses = React.useMemo(() => getUniqueOptions(medicines, (medicine) => medicine.status), [medicines])
  const medicineInsights = React.useMemo(() => {
    return {
      total: medicines.length,
      lowStock: medicines.filter((medicine) => medicine.status === "Stok rendah").length,
      expired: medicines.filter((medicine) => medicine.status === "Kedaluwarsa").length,
      expiringSoon: medicines.filter((medicine) => medicine.expiringSoon).length,
      blockedForPrescription: medicines.filter((medicine) => !medicine.canUseForPrescription).length,
    }
  }, [medicines])
  const searchSelector = React.useCallback(
    (medicine: MedicineListItem) => [medicine.code, medicine.name, medicine.category, medicine.status, medicine.expires],
    [],
  )
  const filterSelector = React.useCallback((medicine: MedicineListItem, value: string) => medicine.status === value, [])
  const controls = useListControls({
    items: medicines,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total obat</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{medicineInsights.total}</p>
        </div>
        <div className="rounded-md border border-red-400/30 bg-red-50 p-4 dark:bg-red-400/10">
          <p className="text-xs text-red-800 dark:text-red-200">Stok rendah</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-900 dark:text-red-100">{medicineInsights.lowStock}</p>
        </div>
        <div className="rounded-md border border-red-400/30 bg-red-50 p-4 dark:bg-red-400/10">
          <p className="text-xs text-red-800 dark:text-red-200">Kedaluwarsa</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-900 dark:text-red-100">{medicineInsights.expired}</p>
        </div>
        <div className="rounded-md border border-amber-400/30 bg-amber-50 p-4 dark:bg-amber-400/10">
          <p className="text-xs text-amber-800 dark:text-amber-200">Hampir kedaluwarsa</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-900 dark:text-amber-100">{medicineInsights.expiringSoon}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Tidak bisa diresepkan</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{medicineInsights.blockedForPrescription}</p>
        </div>
      </div>
      <Panel title="Daftar obat dan inventori" description="Manajemen stok dan harga obat. Obat aktif bisa dipilih dokter untuk resep.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari obat, kategori, kode, status"
          resultCount={controls.totalItems}
          totalCount={medicines.length}
        />
        {controls.paginatedItems.length === 0 ? (
          <EmptyState title="Obat tidak ditemukan" detail="Ubah kata kunci pencarian atau filter status obat." />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[215px] text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Obat</th>
                    <th className="py-3 pr-4 font-medium">Kategori</th>
                    <th className="py-3 pr-4 font-medium">Stok</th>
                    <th className="py-3 pr-4 font-medium">Harga</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {controls.paginatedItems.map((medicine) => (
                    <tr key={medicine.id} className="align-top">
                      <td className="py-4 pr-4">
                        <p className="font-medium">{medicine.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{medicine.code}</p>
                      </td>
                      <td className="py-4 pr-4">{medicine.category}</td>
                      <td className="py-4 pr-4">
                        <p className="font-medium">
                          {medicine.stock} <span className="text-muted-foreground">{medicine.unit}</span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Min. {medicine.min}</p>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground tabular-nums">{medicine.price || "-"}</td>
                      <td className="py-4 pr-4">
                        <div className="grid gap-2">
                          <StatusBadge label={medicine.status} />
                          <span className="text-xs text-muted-foreground">{medicine.usageStatus}</span>
                          {medicine.expires !== "-" ? <span className="text-xs text-muted-foreground">Exp. {medicine.expires}</span> : null}
                        </div>
                      </td>
                      <td className="py-4">
                        <MedicineDetailDialog medicine={medicine} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 lg:hidden">
              {controls.paginatedItems.map((medicine) => (
                <div key={medicine.id} className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{medicine.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{medicine.code}</p>
                    </div>
                    <StatusBadge label={medicine.status} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Kategori: </span>
                      {medicine.category}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Stok: </span>
                      {medicine.stock} {medicine.unit} (Min. {medicine.min})
                    </p>
                    <p>
                      <span className="text-muted-foreground">Resep: </span>
                      {medicine.usageStatus}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Harga: </span>
                      {medicine.price || "-"}
                    </p>
                    {medicine.expires !== "-" ? (
                      <p>
                        <span className="text-muted-foreground">Exp: </span>
                        {medicine.expires}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <MedicineDetailDialog medicine={medicine} />
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
        title="Filter obat"
        description="Batasi daftar obat berdasarkan status."
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={medicineStatuses}
      />
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola obat" description="Pilih aksi inventori obat sesuai kewenangan role aktif.">
        <ChoiceFormSwitch
          key={composerOpen ? "medicines-open" : "medicines-closed"}
          options={medicineActions}
          emptyMessage="Pengelolaan master obat dan inventori dibatasi untuk master dan dokter."
        />
      </ModalDialog>
    </div>
  )
}
