"use client"

import { type PatientListItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"

import * as React from "react"

import { getUniqueOptions } from "@/lib/utils"
import { useListControls } from "@/lib/hooks"
import { StatusBadge, EmptyState } from "@/components/shared/feedback"
import { Panel, ModalDialog, ChoiceFormSwitch } from "@/components/shared/layout"
import { ListToolbar, FilterModal, PaginationControls } from "@/components/shared/list-controls"
import { PatientDetailDialog } from "./patient-dialog"
import { CreatePatientForm, UpdatePatientForm, DeactivatePatientForm } from "./patient-forms"

export function PatientsSection({
  patients,
  role,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  patients: PatientListItem[]
  role: RoleKey
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "master" || role === "admin"
  const patientStatuses = React.useMemo(() => getUniqueOptions(patients, (patient) => patient.status), [patients])
  const searchSelector = React.useCallback(
    (patient: PatientListItem) => [patient.medicalRecordNumber, patient.name, patient.nik, patient.phone, patient.address, patient.allergy, patient.status],
    [],
  )
  const filterSelector = React.useCallback((patient: PatientListItem, value: string) => patient.status === value, [])
  const controls = useListControls({
    items: patients,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="Daftar pasien" description="Pencarian cepat berdasarkan nama, NIK tersamarkan, atau nomor rekam medis.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari nama, NIK, nomor RM, telepon, alergi"
          resultCount={controls.totalItems}
          totalCount={patients.length}
        />
        {controls.paginatedItems.length === 0 ? (
          <EmptyState title="Pasien tidak ditemukan" detail="Ubah kata kunci atau filter status untuk melihat data pasien lain." />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">No. RM</th>
                    <th className="py-3 pr-4 font-medium">Pasien</th>
                    <th className="py-3 pr-4 font-medium">Kontak</th>
                    <th className="py-3 pr-4 font-medium">Alergi</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Tanggal lahir & usia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {controls.paginatedItems.map((patient) => (
                    <tr key={patient.id} className="align-top">
                      <td className="py-4 pr-4 font-medium tabular-nums">{patient.medicalRecordNumber}</td>
                      <td className="py-4 pr-4">
                        <p className="font-medium">{patient.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {patient.gender} - {patient.nik}
                        </p>
                        <PatientDetailDialog patient={patient} />
                      </td>
                      <td className="py-4 pr-4 tabular-nums">{patient.phone}</td>
                      <td className="py-4 pr-4">{patient.allergy}</td>
                      <td className="py-4 pr-4">
                        <StatusBadge label={patient.status} />
                      </td>
                      <td className="py-4">
                        <p>{patient.birthDate}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{patient.age}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 xl:hidden">
              {controls.paginatedItems.map((patient) => (
                <div key={patient.id} className="rounded-md border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{patient.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {patient.medicalRecordNumber} - {patient.gender}
                      </p>
                    </div>
                    <StatusBadge label={patient.status} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm leading-6">
                    <p>
                      <span className="text-muted-foreground">NIK: </span>
                      {patient.nik}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Telepon: </span>
                      {patient.phone}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Alergi: </span>
                      {patient.allergy}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Tanggal lahir: </span>
                      {patient.birthDate} ({patient.age})
                    </p>
                  </div>
                  <PatientDetailDialog patient={patient} />
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
        title="Filter pasien"
        description="Batasi daftar pasien berdasarkan status akun pasien."
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={patientStatuses}
      />
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola pasien" description="Pilih aksi pengelolaan pasien yang ingin dikerjakan.">
        <ChoiceFormSwitch
          key={composerOpen ? "patients-open" : "patients-closed"}
          emptyMessage="Pengelolaan pasien dibatasi untuk master dan admin."
          options={
            canCreate
              ? [
                  {
                    id: "create-patient",
                    title: "Tambah pasien",
                    description: "Daftarkan pasien baru dengan data identitas, kontak, alergi, dan status awal.",
                    content: <CreatePatientForm />,
                  },
                  {
                    id: "update-patient",
                    title: "Update data dasar",
                    description: "Perbarui data kontak, alergi, status, dan informasi dasar pasien yang sudah terdaftar.",
                    content: <UpdatePatientForm patients={patients} />,
                  },
                  {
                    id: "deactivate-patient",
                    title: "Nonaktifkan pasien",
                    description: "Sembunyikan pasien dari alur operasional baru tanpa menghapus riwayat klinis dan audit.",
                    content: <DeactivatePatientForm patients={patients} />,
                  },
                ]
              : []
          }
        />
      </ModalDialog>
    </div>
  )
}
