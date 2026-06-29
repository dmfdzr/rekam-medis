"use client"

import { type VisitFormOptions, type VisitListItem } from "@/lib/data/clinic"
import { createVisitAction, updateVisitStatusAction, cancelVisitAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, TextAreaField, FieldError, FormMessage, DatePickerField } from "@/components/shared/forms"
import { EmptyState, DestructiveActionNotice } from "@/components/shared/feedback"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { Button } from "@/components/ui/button"

const initialClinicFormState: ClinicFormState = {}

export function CreateVisitForm({ visitOptions }: { visitOptions: VisitFormOptions }) {
  const [state, formAction, pending] = React.useActionState(createVisitAction, initialClinicFormState)
  useRefreshOnSuccess(state)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Pasien</span>
          <select
            name="patientId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.patientId)}
          >
            <option value="">Pilih pasien</option>
            {visitOptions.patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.label}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.patientId?.[0]} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Registrasi pasien</span>
          <select
            name="patientType"
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
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Dokter</span>
          <select
            name="doctorId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.doctorId)}
          >
            <option value="">Belum ditentukan</option>
            {visitOptions.doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.doctorId?.[0]} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Layanan / poli</span>
          <select
            name="service"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.service)}
          >
            <option value="">Pilih layanan / poli</option>
            {visitOptions.services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.service?.[0]} />
        </label>
        <TextAreaField name="chiefComplaint" label="Keluhan utama" error={state.errors?.chiefComplaint?.[0]} />
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePickerField name="admissionDate" label="Tanggal masuk" error={state.errors?.admissionDate?.[0]} />
          <DatePickerField name="dischargeDate" label="Tanggal keluar" error={state.errors?.dischargeDate?.[0]} />
        </div>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Membuat kunjungan..." : "Buat kunjungan"}
      </Button>
    </form>
  )
}

export function UpdateVisitStatusForm({ visits }: { visits: VisitListItem[] }) {
  const [state, formAction, pending] = React.useActionState(updateVisitStatusAction, initialClinicFormState)
  useRefreshOnSuccess(state)

  if (visits.length === 0) {
    return <EmptyState title="Belum ada kunjungan" detail="Status kunjungan dapat diubah setelah ada kunjungan pasien." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Kunjungan</span>
          <select
            name="visitId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.visitId)}
          >
            <option value="">Pilih kunjungan</option>
            {visits.map((visit) => (
              <option key={visit.id} value={visit.id}>
                {visit.medicalRecordNumber} - {visit.patient} - {visit.service} - {visit.status}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.visitId?.[0]} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Status baru</span>
          <select
            name="status"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.status)}
          >
            <option value="">Pilih status</option>
            <option value="WAITING">Menunggu</option>
            <option value="VITAL_SIGN">Tanda vital</option>
            <option value="EXAMINATION">Pemeriksaan</option>
            <option value="PHARMACY">Farmasi</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
          <FieldError message={state.errors?.status?.[0]} />
        </label>
      </div>
      <FormMessage state={state} />
      <ConfirmSubmitButton message="Update status kunjungan ini? Perubahan akan tercatat di audit log." confirmLabel="Update status" pending={pending} pendingLabel="Memperbarui...">
        Update status
      </ConfirmSubmitButton>
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
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Kunjungan</span>
        <select
          name="visitId"
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
          aria-invalid={Boolean(state.errors?.visitId)}
        >
          <option value="">Pilih kunjungan</option>
          {cancellableVisits.map((visit) => (
            <option key={visit.id} value={visit.id}>
              {visit.medicalRecordNumber} - {visit.patient} - {visit.service} - {visit.status}
            </option>
          ))}
        </select>
        <FieldError message={state.errors?.visitId?.[0]} />
      </label>
      <DestructiveActionNotice message="Kunjungan tidak dihapus permanen. Statusnya menjadi dibatalkan agar alur layanan dan audit tetap bisa ditelusuri." />
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

