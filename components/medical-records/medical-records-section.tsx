"use client"

import { type ClinicalWorklistItem, type MedicalRecordHistoryItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"
import { saveMedicalRecordAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess, useListControls } from "@/lib/hooks"
import { DatePickerField, TextAreaField, TextField, FormMessage, ComboboxField } from "@/components/shared/forms"
import { EmptyState, StatusBadge, PermissionNotice } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { Button } from "@/components/ui/button"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { ListToolbar, PaginationControls } from "@/components/shared/list-controls"
import { FileText } from "lucide-react"

const initialClinicFormState: ClinicFormState = {}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm leading-6">{value}</p>
    </div>
  )
}

function DetailList({
  title,
  items,
  renderItem,
}: {
  title: string
  items: readonly unknown[]
  renderItem: (item: never) => React.ReactNode
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-sm font-semibold">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Tidak ada data.</p>
      ) : (
        <div className="mt-3 grid gap-2">{items.map((item, index) => <React.Fragment key={index}>{renderItem(item as never)}</React.Fragment>)}</div>
      )}
    </div>
  )
}

export function MedicalRecordDetailDialog({ record }: { record: MedicalRecordHistoryItem }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText className="size-3" aria-hidden="true" />
        Detail CPPT
      </Button>
      <ModalDialog open={open} onOpenChange={setOpen} title={`Detail CPPT - ${record.patient}`} description={`${record.medicalRecordNumber} - ${record.visitDate} ${record.visitTime}`}>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={record.status} />
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{record.service}</span>
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Finalisasi {record.finalizedAt}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Pasien" value={record.patient} />
            <DetailItem label="No. RM" value={record.medicalRecordNumber} />
            <DetailItem label="Profil pasien" value={record.patientMeta} />
            <DetailItem label="Alergi" value={record.allergies} />
            <DetailItem label="Telepon" value={record.patientPhone} />
            <DetailItem label="Alamat" value={record.patientAddress} />
            <DetailItem label="Dokter" value={record.doctor} />
          </div>

          {record.laboratoryDetail ? (
            <div className="grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2">
              <DetailItem label="Tanggal pemeriksaan" value={record.laboratoryDetail.examinationDate} />
              <DetailItem label="Hemoglobin" value={`${record.laboratoryDetail.hemoglobin} g/dl`} />
              <DetailItem label="Leukosit" value={`${record.laboratoryDetail.leukosit} micro/l`} />
              <DetailItem label="GDS/GDP" value={`${record.laboratoryDetail.gds} mg/dl`} />
              <DetailItem label="CRP" value={`${record.laboratoryDetail.crp} mg/dl`} />
            </div>
          ) : null}

          <div className="grid gap-3">
            <DetailItem label="Subjective" value={record.subjective} />
            <DetailItem label="Objective" value={record.objective} />
            <DetailItem label="Assessment" value={record.assessment} />
            <DetailItem label="Plan" value={record.plan} />
            <DetailItem label="Pemeriksaan fisik" value={record.physicalExam} />
            <DetailItem label="Instruksi dokter" value={record.doctorNote} />
          </div>

          <DetailList
            title="Diagnosa"
            items={record.diagnosisItems}
            renderItem={(diagnosis: MedicalRecordHistoryItem["diagnosisItems"][number]) => (
              <div className="rounded-md bg-muted p-3 text-sm leading-6">
                <p className="font-medium">
                  {diagnosis.type} - {diagnosis.code} - {diagnosis.name}
                </p>
                <p className="text-muted-foreground">{diagnosis.note}</p>
              </div>
            )}
          />

          <DetailList
            title="Tindakan"
            items={record.treatmentItems}
            renderItem={(treatment: MedicalRecordHistoryItem["treatmentItems"][number]) => (
              <div className="rounded-md bg-muted p-3 text-sm leading-6">
                <p className="font-medium">
                  {treatment.code} - {treatment.name}
                </p>
                <p className="text-muted-foreground">{treatment.note}</p>
              </div>
            )}
          />

          <DetailList
            title="Resep"
            items={record.prescriptionItems}
            renderItem={(prescription: MedicalRecordHistoryItem["prescriptionItems"][number]) => (
              <div className="rounded-md bg-muted p-3 text-sm leading-6">
                <p className="font-medium">
                  {prescription.medicine} - {prescription.quantity}
                </p>
                <p className="text-muted-foreground">
                  {prescription.dosage} - {prescription.usageRule} - {prescription.note}
                </p>
              </div>
            )}
          />

        </div>
      </ModalDialog>
    </>
  )
}

export function MedicalRecordForm({ clinicalWorklist }: { clinicalWorklist: ClinicalWorklistItem[] }) {
  const [state, formAction, pending] = React.useActionState(saveMedicalRecordAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const [selectedVisitId, setSelectedVisitId] = React.useState(clinicalWorklist[0]?.id ?? "")
  const selectedVisit = clinicalWorklist.find((visit) => visit.id === selectedVisitId)
  const primaryDiagnosis = selectedVisit?.medicalRecord?.diagnoses.find((diagnosis) => diagnosis.type === "PRIMARY")
  const latestTreatment = selectedVisit?.medicalRecord?.treatments.at(-1)
  const isSelectedRecordFinal = selectedVisit?.medicalRecord?.status === "Final"

  if (clinicalWorklist.length === 0) {
    return <EmptyState title="Belum ada pasien untuk pemeriksaan" detail="Kunjungan aktif akan muncul setelah pasien didaftarkan dan asesmen klinis diisi." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <ComboboxField
        name="visitId"
        label="Kunjungan"
        items={clinicalWorklist.map(v => ({ value: v.id, label: `${v.medicalRecordNumber} - ${v.patientName} - ${v.status}` }))}
        placeholder="Pilih kunjungan"
        value={selectedVisitId}
        onValueChange={setSelectedVisitId}
      />

      <div key={selectedVisitId} className="grid gap-3">
        {isSelectedRecordFinal ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            CPPT ini sudah final. Data ditampilkan untuk referensi dan tidak dapat disimpan ulang dari form CPPT.
          </div>
        ) : null}
        <TextAreaField name="subjective" label="Subjective" defaultValue={selectedVisit?.medicalRecord?.subjective} error={state.errors?.subjective?.[0]} />
        <TextAreaField name="objective" label="Objective" defaultValue={selectedVisit?.medicalRecord?.objective} error={state.errors?.objective?.[0]} />
        <TextAreaField name="assessment" label="Assessment" defaultValue={selectedVisit?.medicalRecord?.assessment} error={state.errors?.assessment?.[0]} />
        <TextAreaField name="plan" label="Plan" defaultValue={selectedVisit?.medicalRecord?.plan} error={state.errors?.plan?.[0]} />

        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-sm font-semibold mb-3">Pemeriksaan Fisik</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid grid-cols-2 gap-2">
              <TextField name="bloodPressureSystolic" label="Sistolik (mmHg)" placeholder="120" type="number" inputMode="numeric" step="1" min={0} defaultValue={selectedVisit?.vitalSign?.bloodPressure?.split('/')[0] || (selectedVisit?.medicalRecord?.physicalExam?.includes('/') ? selectedVisit?.medicalRecord?.physicalExam?.split('/')[0] : "")} error={state.errors?.bloodPressureSystolic?.[0]} />
              <TextField name="bloodPressureDiastolic" label="Diastolik (mmHg)" placeholder="80" type="number" inputMode="numeric" step="1" min={0} defaultValue={selectedVisit?.vitalSign?.bloodPressure?.split('/')[1] || (selectedVisit?.medicalRecord?.physicalExam?.includes('/') ? selectedVisit?.medicalRecord?.physicalExam?.split('/')[1] : "")} error={state.errors?.bloodPressureDiastolic?.[0]} />
            </div>
            <TextField name="temperature" label="Suhu Tubuh (°C)" placeholder="36.5" type="number" inputMode="decimal" step="0.1" min={30} max={45} defaultValue={selectedVisit?.vitalSign?.temperature} />
            <TextField name="weight" label="Berat Badan (Kg)" placeholder="60.5" type="number" inputMode="decimal" step="0.1" min={0} defaultValue={selectedVisit?.vitalSign?.weight} />
            <TextField name="height" label="Tinggi Badan (Cm)" placeholder="165" type="number" inputMode="decimal" step="0.1" min={0} defaultValue={selectedVisit?.vitalSign?.height} />
            <TextField name="pulse" label="Nadi (/menit)" placeholder="80" type="number" inputMode="numeric" step="1" min={0} defaultValue={selectedVisit?.vitalSign?.pulse} />
            <TextField name="respiration" label="Respirasi (/menit)" placeholder="20" type="number" inputMode="numeric" step="1" min={0} defaultValue={selectedVisit?.vitalSign?.respiration} />
            <TextField name="oxygenSaturation" label="Saturasi Oksigen (%)" placeholder="98" type="number" inputMode="numeric" step="1" min={0} max={100} defaultValue={selectedVisit?.vitalSign?.oxygenSaturation} />
          </div>
        </div>

        <TextAreaField name="doctorNote" label="Instruksi dokter" defaultValue={selectedVisit?.medicalRecord?.doctorNote} error={state.errors?.doctorNote?.[0]} />
      </div>
      <FormMessage state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" name="intent" value="draft" variant="outline" size="lg" disabled={pending || isSelectedRecordFinal}>
          {pending ? "Menyimpan..." : "Simpan draft"}
        </Button>
        <ConfirmSubmitButton
          message="Finalisasi CPPT ini? Data final digunakan sebagai riwayat klinis pasien."
          confirmLabel="Finalisasi"
          pending={pending}
          pendingLabel="Memfinalisasi..."
          disabled={isSelectedRecordFinal}
          name="intent"
          value="final"
        >
          Finalisasi CPPT
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
    return <EmptyState title="Belum ada CPPT" detail="Draft dan finalisasi CPPT dari dokter akan tampil sebagai timeline di sini." />
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
      {controls.totalItems === 0 ? (
        <EmptyState title="CPPT tidak ditemukan" detail="Ubah kata kunci pencarian untuk melihat riwayat CPPT lain." />
      ) : (
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


                <div className="mt-4 flex flex-wrap gap-2">
                  <MedicalRecordDetailDialog record={record} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
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
  const canInput = role === "master" || role === "doctor"

  return (
    <div className="grid gap-5">
      <Panel title="Riwayat CPPT pasien" description="Timeline membantu dokter membaca konteks tanpa membuka banyak halaman.">
        <MedicalRecordTimeline medicalRecordHistory={medicalRecordHistory} />
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola CPPT" description="Simpan draft atau finalisasi catatan perkembangan pasien setelah resep diproses.">
        {canInput ? <MedicalRecordForm clinicalWorklist={clinicalWorklist} /> : <PermissionNotice message="Role ini tidak memiliki akses untuk mengisi CPPT." />}
      </ModalDialog>
    </div>
  )
}
