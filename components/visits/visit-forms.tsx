"use client"

import { type VisitFormOptions, type VisitListItem } from "@/lib/data/clinic"
import { createVisitAction, cancelVisitAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, TextAreaField, FieldError, FormMessage, DatePickerField, ComboboxField } from "@/components/shared/forms"
import { EmptyState, DestructiveActionNotice } from "@/components/shared/feedback"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const initialClinicFormState: ClinicFormState = {}

export function CreateVisitForm({ visitOptions }: { visitOptions: VisitFormOptions }) {
  const [state, formAction, pending] = React.useActionState(createVisitAction, initialClinicFormState)
  useRefreshOnSuccess(state)

  const [isJointCare, setIsJointCare] = React.useState(false)
  const [companionCount, setCompanionCount] = React.useState(1)

  const doctorItems = [
    { value: "", label: "Belum ditentukan" },
    ...visitOptions.doctors.map(d => ({ value: d.id, label: d.name })),
  ]

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <ComboboxField
          name="patientId"
          label="Pasien"
          items={visitOptions.patients.map(p => ({ value: p.id, label: p.label }))}
          placeholder="Pilih pasien"
          error={state.errors?.patientId}
        />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Registrasi pasien</span>
          <select
            name="patientType"
            defaultValue="UMUM"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.patientType)}
          >
            <option value="">Pilih registrasi pasien</option>
            <option value="BPJS">BPJS</option>
            <option value="UMUM">Umum</option>
            <option value="ASURANSI">Asuransi</option>
          </select>
          <FieldError message={state.errors?.patientType?.[0]} />
        </label>

        <ComboboxField
          name="doctorId"
          label="DPJP"
          items={doctorItems}
          placeholder="Pilih DPJP"
          error={state.errors?.doctorId}
        />

        {/* Rawat Bersama Checkbox */}
        <div className="flex items-center gap-3">
          <Checkbox
            id="isJointCare"
            name="isJointCare"
            checked={isJointCare}
            onCheckedChange={(checked) => {
              setIsJointCare(Boolean(checked))
              setCompanionCount(1)
            }}
            value="on"
          />
          <Label htmlFor="isJointCare" className="cursor-pointer font-medium text-sm">
            Rawat Bersama
          </Label>
        </div>

        {/* DPJP Pendamping fields */}
        {isJointCare && (
          <div className="grid gap-3 rounded-md border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">DPJP Pendamping (maks. 3)</p>
            {Array.from({ length: companionCount }).map((_, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <ComboboxField
                    name="companionDoctorIds[]"
                    label={`DPJP Pendamping ${companionCount > 1 ? i + 1 : ""}`}
                    items={doctorItems.filter(d => d.value !== "")}
                    placeholder="Pilih DPJP pendamping"
                  />
                </div>
                {companionCount > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 mb-0.5"
                    onClick={() => setCompanionCount(c => c - 1)}
                    aria-label="Hapus DPJP pendamping"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {companionCount < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setCompanionCount(c => c + 1)}
              >
                <Plus className="size-3 mr-1" />
                Tambah DPJP pendamping
              </Button>
            )}
          </div>
        )}

        <ComboboxField
          name="service"
          label="Ruang Rawat"
          items={visitOptions.services.map(s => ({ value: s, label: s }))}
          placeholder="Pilih ruang rawat"
          error={state.errors?.service}
        />
        <TextAreaField name="chiefComplaint" label="Keluhan utama" error={state.errors?.chiefComplaint?.[0]} />
        <DatePickerField name="admissionDate" label="Tanggal masuk" error={state.errors?.admissionDate?.[0]} />
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Membuat kunjungan..." : "Buat kunjungan"}
      </Button>
    </form>
  )
}



export function CancelVisitForm({ visits }: { visits: VisitListItem[] }) {
  const [state, formAction, pending] = React.useActionState(cancelVisitAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const cancellableVisits = visits.filter((visit) => visit.status !== "Dibatalkan" && visit.status !== "Selesai")

  if (cancellableVisits.length === 0) {
    return <EmptyState title="Tidak ada kunjungan yang bisa dibatalkan" detail="Kunjungan yang belum selesai akan muncul di sini." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <ComboboxField
        name="visitId"
        label="Kunjungan"
        items={cancellableVisits.map(v => ({ value: v.id, label: `${v.medicalRecordNumber} - ${v.patient} - ${v.service} - ${v.status}` }))}
        placeholder="Pilih kunjungan"
        error={state.errors?.visitId}
      />
      <DestructiveActionNotice message="Kunjungan tidak dihapus permanen. Statusnya menjadi dibatalkan agar alur dan audit tetap bisa ditelusuri." />
      <FormMessage state={state} />
      <ConfirmSubmitButton
        message="Batalkan kunjungan ini? Perubahan akan tercatat di audit log."
        confirmLabel="Batalkan kunjungan"
        pending={pending}
        pendingLabel="Membatalkan..."
        variant="destructive"
      >
        Batalkan kunjungan
      </ConfirmSubmitButton>
    </form>
  )
}
