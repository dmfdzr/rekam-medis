"use client"

import { type ClinicalWorklistItem, type MedicalRecordHistoryItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"
import { saveMedicalRecordAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess, useListControls } from "@/lib/hooks"
import { TextField, TextAreaField, FormMessage } from "@/components/shared/forms"
import { EmptyState, StatusBadge, PermissionNotice } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { Button } from "@/components/ui/button"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { ListToolbar } from "@/components/shared/list-controls"
import { FileText, Download } from "lucide-react"

const initialClinicFormState: ClinicFormState = {}

export function MedicalRecordForm({ clinicalWorklist }: { clinicalWorklist: ClinicalWorklistItem[] }) {
  const [state, formAction, pending] = React.useActionState(saveMedicalRecordAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const [selectedVisitId, setSelectedVisitId] = React.useState(clinicalWorklist[0]?.id ?? "")
  const selectedVisit = clinicalWorklist.find((visit) => visit.id === selectedVisitId)
  const primaryDiagnosis = selectedVisit?.medicalRecord?.diagnoses.find((diagnosis) => diagnosis.type === "PRIMARY")
  const latestTreatment = selectedVisit?.medicalRecord?.treatments.at(-1)
  const isSelectedRecordFinal = selectedVisit?.medicalRecord?.status === "Final"

  if (clinicalWorklist.length === 0) {
    return <EmptyState title="Belum ada pasien untuk pemeriksaan" detail="Kunjungan aktif akan muncul setelah pasien didaftarkan dan tanda vital diisi." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Kunjungan</span>
        <select
          name="visitId"
          value={selectedVisitId}
          onChange={(event) => setSelectedVisitId(event.target.value)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
        >
          {clinicalWorklist.map((visit) => (
            <option key={visit.id} value={visit.id}>
              {visit.medicalRecordNumber} - {visit.patientName} - {visit.status}
            </option>
          ))}
        </select>
      </label>

      <div key={selectedVisitId} className="grid gap-3">
        {isSelectedRecordFinal ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            Rekam medis ini sudah final. Data ditampilkan untuk referensi dan tidak dapat disimpan ulang dari form pemeriksaan.
          </div>
        ) : null}
        <TextAreaField name="subjective" label="Subjective" defaultValue={selectedVisit?.medicalRecord?.subjective} />
        <TextAreaField name="objective" label="Objective" defaultValue={selectedVisit?.medicalRecord?.objective} />
        <TextAreaField name="assessment" label="Assessment" defaultValue={selectedVisit?.medicalRecord?.assessment} />
        <TextAreaField name="plan" label="Plan" defaultValue={selectedVisit?.medicalRecord?.plan} />
        <TextAreaField name="physicalExam" label="Pemeriksaan fisik" defaultValue={selectedVisit?.medicalRecord?.physicalExam} />
        <TextAreaField name="doctorNote" label="Catatan dokter" defaultValue={selectedVisit?.medicalRecord?.doctorNote} />
        <TextField name="followUpDate" label="Rencana kontrol" type="date" defaultValue={selectedVisit?.medicalRecord?.followUpDate} />

        <div className="grid gap-3 rounded-md border border-border bg-card p-3 md:grid-cols-2">
          <TextField name="diagnosisCode" label="Kode diagnosa" defaultValue={primaryDiagnosis?.code} placeholder="J06.9" />
          <TextField name="diagnosisName" label="Diagnosa utama" defaultValue={primaryDiagnosis?.name} />
          <div className="md:col-span-2">
            <TextAreaField name="diagnosisNote" label="Catatan diagnosa" defaultValue={primaryDiagnosis?.note} />
          </div>
        </div>

        <div className="grid gap-3 rounded-md border border-border bg-card p-3 md:grid-cols-2">
          <TextField name="treatmentCode" label="Kode tindakan" defaultValue={latestTreatment?.code} placeholder="CONS-GP" />
          <TextField name="treatmentName" label="Tindakan medis" defaultValue={latestTreatment?.name} />
          <TextField name="treatmentCost" label="Biaya tindakan" defaultValue={latestTreatment?.cost} inputMode="decimal" />
          <TextField name="treatmentNote" label="Catatan tindakan" defaultValue={latestTreatment?.note} />
        </div>
      </div>
      <FormMessage state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" name="intent" value="draft" variant="outline" size="lg" disabled={pending || isSelectedRecordFinal}>
          {pending ? "Menyimpan..." : "Simpan draft"}
        </Button>
        <ConfirmSubmitButton
          message="Finalisasi rekam medis ini? Data final digunakan sebagai riwayat klinis pasien."
          confirmLabel="Finalisasi"
          pending={pending}
          pendingLabel="Memfinalisasi..."
          disabled={isSelectedRecordFinal}
          name="intent"
          value="final"
        >
          Finalisasi rekam medis
        </ConfirmSubmitButton>
      </div>
    </form>
  )
}

export function MedicalRecordTimeline({ medicalRecordHistory }: { medicalRecordHistory: MedicalRecordHistoryItem[] }) {
  const searchSelector = React.useCallback(
    (record: MedicalRecordHistoryItem) => [
      record.patient,
      record.medicalRecordNumber,
      record.service,
      record.doctor,
      record.status,
      record.chiefComplaint,
      record.diagnosis,
      record.treatments,
      record.prescriptions,
      record.documents,
    ],
    [],
  )
  const controls = useListControls({
    items: medicalRecordHistory,
    pageSize: 6,
    search: searchSelector,
  })

  if (medicalRecordHistory.length === 0) {
    return <EmptyState title="Belum ada rekam medis" detail="Draft dan finalisasi rekam medis dari dokter akan tampil sebagai timeline di sini." />
  }

  return (
    <div className="grid gap-4">
      <ListToolbar
        query={controls.query}
        onQueryChange={controls.setQuery}
        searchPlaceholder="Cari riwayat, diagnosa, tindakan..."
        resultCount={controls.totalItems}
        totalCount={medicalRecordHistory.length}
      />
      <div className="grid gap-4">
        {controls.paginatedItems.map((record) => (
          <div key={record.id} className="relative pl-6 sm:pl-8">
            <div className="absolute left-0 top-1.5 grid size-4 place-items-center rounded-full bg-primary/20 sm:size-5">
              <div className="size-2 rounded-full bg-primary sm:size-2.5" />
            </div>
            <div className="absolute bottom-0 left-[7px] top-6 w-px bg-border sm:left-[9px]" aria-hidden="true" />

            <div className="rounded-md border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {record.visitDate} - {record.patient}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {record.medicalRecordNumber} - {record.doctor} - {record.service}
                  </p>
                </div>
                <StatusBadge label={record.status} />
              </div>

              <div className="mt-4 grid gap-4 text-sm leading-6 sm:grid-cols-2">
                <div>
                  <p className="font-medium">Keluhan & Diagnosa</p>
                  <p className="mt-1 text-muted-foreground">{record.chiefComplaint}</p>
                  <p className="mt-1 font-medium text-foreground">{record.diagnosis}</p>
                </div>
                <div>
                  <p className="font-medium">Tindakan</p>
                  <p className="mt-1 text-muted-foreground">{record.treatments || "-"}</p>
                </div>
                {record.prescriptions ? (
                  <div className="sm:col-span-2">
                    <p className="font-medium">Resep & Edukasi</p>
                    <p className="mt-1 text-muted-foreground">{record.prescriptions}</p>
                  </div>
                ) : null}
                {record.documents ? (
                  <div className="sm:col-span-2">
                    <p className="font-medium">Dokumen Pendukung</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm">
                        <FileText className="size-3" aria-hidden="true" />
                        {record.documents}
                      </Button>
                      <Button type="button" variant="outline" size="sm">
                        <Download className="size-3" aria-hidden="true" />
                        Unduh
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      {controls.totalPages > 1 ? (
        <div className="mt-2 text-center">
          <Button type="button" variant="outline" onClick={() => controls.setPage(controls.page + 1)} disabled={controls.page >= controls.totalPages}>
            Muat lebih banyak
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function MedicalRecordsSection({
  role,
  clinicalWorklist,
  medicalRecordHistory,
  composerOpen,
  onComposerOpenChange,
}: {
  role: RoleKey
  clinicalWorklist: ClinicalWorklistItem[]
  medicalRecordHistory: MedicalRecordHistoryItem[]
  composerOpen: boolean
  onComposerOpenChange: (open: boolean) => void
}) {
  const canInput = role === "admin" || role === "doctor"

  return (
    <div className="grid gap-5">
      <Panel title="Riwayat rekam medis pasien" description="Timeline membantu dokter membaca konteks tanpa membuka banyak halaman.">
        <MedicalRecordTimeline medicalRecordHistory={medicalRecordHistory} />
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Pemeriksaan dokter" description="Struktur SOAP menjaga catatan tetap konsisten dan mudah diaudit.">
        {canInput ? <MedicalRecordForm clinicalWorklist={clinicalWorklist} /> : <PermissionNotice message="Role ini tidak memiliki akses untuk mengisi rekam medis dokter." />}
      </ModalDialog>
    </div>
  )
}

