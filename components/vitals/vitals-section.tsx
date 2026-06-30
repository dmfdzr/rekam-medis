"use client"

import { type ClinicalWorklistItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"
import { upsertVitalSignAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, TextAreaField, FormMessage, ComboboxField } from "@/components/shared/forms"
import { EmptyState, StatusBadge, PermissionNotice } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { Button } from "@/components/ui/button"

const initialClinicFormState: ClinicFormState = {}

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
        <StatusBadge label={visit.status} />
      </div>
      <p className="mt-4 text-sm leading-6">{visit.chiefComplaint}</p>
      <p className="mt-2 text-xs text-muted-foreground">Alergi: {visit.allergies}</p>
    </div>
  )
}

export function VitalSignGrid({ visit }: { visit: ClinicalWorklistItem }) {
  const items = [
    { label: "Tekanan darah", value: visit.vitalSign?.bloodPressure || "-", unit: "mmHg" },
    { label: "Suhu", value: visit.vitalSign?.temperature || "-", unit: "C" },
    { label: "Nadi", value: visit.vitalSign?.pulse || "-", unit: "x/menit" },
    { label: "Respirasi", value: visit.vitalSign?.respiration || "-", unit: "x/menit" },
    { label: "SpO2", value: visit.vitalSign?.oxygenSaturation || "-", unit: "%" },
    { label: "Berat", value: visit.vitalSign?.weight || "-", unit: "kg" },
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
    </div>
  )
}

export function VitalSignForm({ clinicalWorklist }: { clinicalWorklist: ClinicalWorklistItem[] }) {
  const [state, formAction, pending] = React.useActionState(upsertVitalSignAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const [selectedVisitId, setSelectedVisitId] = React.useState(clinicalWorklist[0]?.id ?? "")
  const selectedVisit = clinicalWorklist.find((visit) => visit.id === selectedVisitId)

  if (clinicalWorklist.length === 0) {
    return <EmptyState title="Belum ada kunjungan untuk tanda vital" detail="Buat kunjungan terlebih dahulu agar perawat dapat mengisi pemeriksaan awal." />
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
        <TextField
          name="bloodPressure"
          label="Tekanan darah"
          defaultValue={selectedVisit?.vitalSign?.bloodPressure}
          inputMode="numeric"
          pattern="\d{2,3}/\d{2,3}"
          placeholder="120/80"
        />
        <TextField name="temperature" label="Suhu tubuh" type="number" defaultValue={selectedVisit?.vitalSign?.temperature} inputMode="decimal" step="0.1" min={0} placeholder="37.0" />
        <TextField name="weight" label="Berat badan" type="number" defaultValue={selectedVisit?.vitalSign?.weight} inputMode="decimal" step="0.1" min={0} placeholder="58.5" />
        <TextField name="height" label="Tinggi badan" type="number" defaultValue={selectedVisit?.vitalSign?.height} inputMode="decimal" step="0.1" min={0} placeholder="160" />
        <TextField name="pulse" label="Nadi" type="number" defaultValue={selectedVisit?.vitalSign?.pulse} inputMode="numeric" step="1" min={0} />
        <TextField name="respiration" label="Respirasi" type="number" defaultValue={selectedVisit?.vitalSign?.respiration} inputMode="numeric" step="1" min={0} />
        <TextField name="oxygenSaturation" label="Saturasi oksigen" type="number" defaultValue={selectedVisit?.vitalSign?.oxygenSaturation} inputMode="numeric" step="1" min={0} max={100} />
        <div className="sm:col-span-2">
          <TextAreaField name="nurseNote" label="Catatan perawat" defaultValue={selectedVisit?.vitalSign?.nurseNote} />
        </div>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan tanda vital"}
      </Button>
    </form>
  )
}

export function VitalsSection({
  role,
  clinicalWorklist,
  composerOpen,
  onComposerOpenChange,
}: {
  role: RoleKey
  clinicalWorklist: ClinicalWorklistItem[]
  composerOpen: boolean
  onComposerOpenChange: (open: boolean) => void
}) {
  const canInput = role === "master" || role === "doctor"

  return (
    <div className="grid gap-5">
      <Panel title="Daftar pasien aktif" description="Ringkasan kunjungan dan tanda vital pasien yang masih berada dalam alur layanan.">
        {clinicalWorklist.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {clinicalWorklist.map((visit) => (
              <div key={visit.id} className="rounded-md border border-border bg-background p-3">
                <VisitSummaryCard visit={visit} />
                <VitalSignGrid visit={visit} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Tidak ada kunjungan aktif" detail="Kunjungan dengan status menunggu, tanda vital, atau pemeriksaan akan muncul di sini." />
        )}
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Input tanda vital" description="Form dibuat satu kolom di mobile dan dua kolom di desktop untuk entry cepat.">
        {canInput ? <VitalSignForm clinicalWorklist={clinicalWorklist} /> : <PermissionNotice message="Role ini hanya dapat melihat tanda vital. Input tanda vital dibatasi untuk master dan dokter." />}
      </ModalDialog>
    </div>
  )
}
