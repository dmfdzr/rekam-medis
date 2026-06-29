"use client"

import { type ClinicalWorklistItem, type MedicalRecordHistoryItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"
import { saveMedicalRecordAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess, useListControls } from "@/lib/hooks"
import { TextField, TextAreaField, FormMessage, DatePickerField } from "@/components/shared/forms"
import { EmptyState, StatusBadge, PermissionNotice } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { Button } from "@/components/ui/button"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { ListToolbar } from "@/components/shared/list-controls"
import { Download, FileText } from "lucide-react"

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
        Detail rekam medis
      </Button>
      <ModalDialog open={open} onOpenChange={setOpen} title={`Rekam medis ${record.patient}`} description={`${record.medicalRecordNumber} - ${record.visitDate} ${record.visitTime}`}>
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
            <DetailItem label="Keluhan utama" value={record.chiefComplaint} />
          </div>

          {record.vitalSignDetail ? (
            <div className="grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2">
              <DetailItem label="Tekanan darah" value={`${record.vitalSignDetail.bloodPressure} mmHg`} />
              <DetailItem label="Suhu tubuh" value={`${record.vitalSignDetail.temperature} C`} />
              <DetailItem label="Berat badan" value={`${record.vitalSignDetail.weight} kg`} />
              <DetailItem label="Tinggi badan" value={`${record.vitalSignDetail.height} cm`} />
              <DetailItem label="Nadi" value={`${record.vitalSignDetail.pulse} x/menit`} />
              <DetailItem label="Respirasi" value={`${record.vitalSignDetail.respiration} x/menit`} />
              <DetailItem label="Saturasi oksigen" value={`${record.vitalSignDetail.oxygenSaturation}%`} />
              <DetailItem label="Catatan perawat" value={record.vitalSignDetail.nurseNote} />
            </div>
          ) : null}

          <div className="grid gap-3">
            <DetailItem label="Subjective" value={record.subjective} />
            <DetailItem label="Objective" value={record.objective} />
            <DetailItem label="Assessment" value={record.assessment} />
            <DetailItem label="Plan" value={record.plan} />
            <DetailItem label="Pemeriksaan fisik" value={record.physicalExam} />
            <DetailItem label="Catatan dokter" value={record.doctorNote} />
            <DetailItem label="Rencana kontrol" value={record.followUpDate} />
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
                <p className="text-muted-foreground">
                  Biaya {treatment.cost} - {treatment.note}
                </p>
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

          <DetailList
            title="Dokumen pendukung"
            items={record.documentItems}
            renderItem={(document: MedicalRecordHistoryItem["documentItems"][number]) => (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted p-3 text-sm">
                <div>
                  <p className="font-medium">{document.fileName}</p>
                  <p className="text-muted-foreground">
                    {document.type} - {document.uploadedAt}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={document.fileUrl} target="_blank" rel="noreferrer">
                    <Download className="size-3" aria-hidden="true" />
                    Buka
                  </a>
                </Button>
              </div>
            )}
          />

          <Button asChild size="lg" className="w-full sm:w-fit">
            <a href={record.documentUrl} target="_blank" rel="noreferrer">
              <Download className="size-4" aria-hidden="true" />
              Generate dokumen rekam medis
            </a>
          </Button>
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
        <DatePickerField name="followUpDate" label="Rencana kontrol" defaultValue={selectedVisit?.medicalRecord?.followUpDate} />

        <div className="grid gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-2">
          <TextField name="diagnosisCode" label="Kode diagnosa" defaultValue={primaryDiagnosis?.code} placeholder="J06.9" />
          <TextField name="diagnosisName" label="Diagnosa utama" defaultValue={primaryDiagnosis?.name} />
          <div className="sm:col-span-2">
            <TextAreaField name="diagnosisNote" label="Catatan diagnosa" defaultValue={primaryDiagnosis?.note} />
          </div>
        </div>

        <div className="grid gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-2">
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
                {record.documentItems.length > 0 ? (
                  <div className="sm:col-span-2">
                    <p className="font-medium">Dokumen Pendukung</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={record.documentItems[0]?.fileUrl ?? record.documentUrl} target="_blank" rel="noreferrer">
                          <FileText className="size-3" aria-hidden="true" />
                          {record.documents}
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a href={record.documentUrl} target="_blank" rel="noreferrer">
                          <Download className="size-3" aria-hidden="true" />
                          Generate rekam medis
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={record.documentUrl} target="_blank" rel="noreferrer">
                        <FileText className="size-3" aria-hidden="true" />
                        Generate dokumen rekam medis
                      </a>
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <MedicalRecordDetailDialog record={record} />
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
  const canInput = role === "master" || role === "doctor"

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
