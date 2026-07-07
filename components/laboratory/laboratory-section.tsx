"use client"

import { type ClinicalWorklistItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"
import { upsertLaboratoryAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useListControls, useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, FormMessage, ComboboxField, DatePickerField } from "@/components/shared/forms"
import { EmptyState, PermissionNotice } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { ListToolbar, PaginationControls } from "@/components/shared/list-controls"
import { Button } from "@/components/ui/button"

const initialClinicFormState: ClinicFormState = {}

function todayISO() {
  const today = new Date()

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

export function VisitSummaryCard({ visit }: { visit: ClinicalWorklistItem }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{visit.patientName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {visit.medicalRecordNumber} - {visit.service} - {visit.time}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Alergi: {visit.allergies}</p>
    </div>
  )
}

export function LaboratoryGrid({ visit }: { visit: ClinicalWorklistItem }) {
  const items = [
    { label: "Hemoglobin", value: visit.laboratoryResult?.hemoglobin || "-", unit: "g/dl" },
    { label: "Leukosit", value: visit.laboratoryResult?.leukosit || "-", unit: "micro/l" },
    { label: "GDS/GDP", value: visit.laboratoryResult?.gds || "-", unit: "mg/dl" },
    { label: "CRP", value: visit.laboratoryResult?.crp || "-", unit: "mg/dl" },
  ]

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {item.value} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
          </p>
        </div>
      ))}
      {visit.laboratoryResult?.examinationDate && (
         <div className="col-span-2 mt-2">
            <p className="text-xs text-muted-foreground">Tanggal Pemeriksaan: {visit.laboratoryResult.examinationDate}</p>
         </div>
      )}
    </div>
  )
}

export function LaboratoryForm({ clinicalWorklist }: { clinicalWorklist: ClinicalWorklistItem[] }) {
  const [state, formAction, pending] = React.useActionState(upsertLaboratoryAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const [selectedVisitId, setSelectedVisitId] = React.useState(clinicalWorklist[0]?.id ?? "")
  const selectedVisit = clinicalWorklist.find((visit) => visit.id === selectedVisitId)

  if (clinicalWorklist.length === 0) {
    return <EmptyState title="Belum ada pasien siap laboratorium" detail="Pasien akan muncul setelah asesmen disimpan." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <ComboboxField
        name="visitId"
        label="Kunjungan"
        items={clinicalWorklist.map(v => ({ value: v.id, label: `${v.medicalRecordNumber} - ${v.patientName} - ${v.service}` }))}
        placeholder="Pilih kunjungan"
        value={selectedVisitId}
        onValueChange={setSelectedVisitId}
      />

      <div key={selectedVisitId} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
           <DatePickerField name="examinationDate" label="Tanggal pemeriksaan" defaultValue={selectedVisit?.laboratoryResult?.examinationDate ?? todayISO()} />
        </div>
        <TextField name="hemoglobin" label="Hemoglobin (g/dl)" type="number" defaultValue={selectedVisit?.laboratoryResult?.hemoglobin} inputMode="decimal" step="0.1" min={0} placeholder="14.0" />
        <TextField name="leukosit" label="Leukosit (micro/l)" type="number" defaultValue={selectedVisit?.laboratoryResult?.leukosit} inputMode="decimal" step="0.1" min={0} placeholder="10000" />
        <TextField name="gds" label="GDS/GDP (mg/dl)" type="number" defaultValue={selectedVisit?.laboratoryResult?.gds} inputMode="decimal" step="0.1" min={0} placeholder="100.0" />
        <TextField name="crp" label="CRP (mg/dl)" type="number" defaultValue={selectedVisit?.laboratoryResult?.crp} inputMode="decimal" step="0.1" min={0} placeholder="0.5" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan laboratorium"}
      </Button>
    </form>
  )
}

export function LaboratorySection({
  role,
  laboratoryList,
  laboratoryOptions,
  composerOpen,
  onComposerOpenChange,
}: {
  role: RoleKey
  laboratoryList: ClinicalWorklistItem[]
  laboratoryOptions: ClinicalWorklistItem[]
  composerOpen: boolean
  onComposerOpenChange: (open: boolean) => void
}) {
  const canInput = role === "master" || role === "doctor"
  const searchSelector = React.useCallback(
    (visit: ClinicalWorklistItem) => [
      visit.patientName,
      visit.medicalRecordNumber,
      visit.patientMeta,
      visit.allergies,
      visit.service,
      visit.doctor,
      visit.status,
      visit.laboratoryResult?.examinationDate ?? "",
      visit.laboratoryResult?.hemoglobin ?? "",
      visit.laboratoryResult?.leukosit ?? "",
      visit.laboratoryResult?.gds ?? "",
      visit.laboratoryResult?.crp ?? "",
      visit.medicalRecord?.assessment ?? "",
      ...(visit.medicalRecord?.diagnoses.map((diagnosis) => `${diagnosis.code} ${diagnosis.name}`) ?? []),
    ],
    [],
  )
  const controls = useListControls({
    items: laboratoryList,
    pageSize: 6,
    search: searchSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="Data laboratorium tersimpan" description="Hasil laboratorium yang sudah disimpan dari asesmen pasien.">
        {laboratoryList.length > 0 ? (
          <div className="grid gap-4">
            <ListToolbar
              query={controls.query}
              onQueryChange={controls.setQuery}
              searchPlaceholder="Cari pasien, RM, ruang rawat, dokter, hasil lab"
              resultCount={controls.totalItems}
              totalCount={laboratoryList.length}
            />
            {controls.totalItems === 0 ? (
              <EmptyState title="Hasil laboratorium tidak ditemukan" detail="Ubah kata kunci pencarian untuk melihat data laboratorium lain." />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {controls.paginatedItems.map((visit) => (
                  <div key={visit.id} className="rounded-md border border-border bg-background p-3">
                    <VisitSummaryCard visit={visit} />
                    <LaboratoryGrid visit={visit} />
                  </div>
                ))}
              </div>
            )}
            <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
          </div>
        ) : (
          <EmptyState title="Belum ada hasil laboratorium" detail="Hasil lab yang sudah disimpan akan tampil di sini." />
        )}
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Input laboratorium" description="Form hasil tes lab yang penting.">
        {canInput ? <LaboratoryForm clinicalWorklist={laboratoryOptions} /> : <PermissionNotice message="Role ini hanya dapat melihat hasil laboratorium. Input laboratorium dibatasi untuk master dan dokter." />}
      </ModalDialog>
    </div>
  )
}
