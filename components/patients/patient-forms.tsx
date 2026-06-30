"use client"

import { type PatientListItem } from "@/lib/data/clinic"
import { createPatientAction, updatePatientAction, deactivatePatientAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, TextAreaField, FieldError, FormMessage, DatePickerField, ComboboxField } from "@/components/shared/forms"
import { EmptyState, DestructiveActionNotice } from "@/components/shared/feedback"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { Button } from "@/components/ui/button"

const initialClinicFormState: ClinicFormState = {}

export function CreatePatientForm() {
  const [state, formAction, pending] = React.useActionState(createPatientAction, initialClinicFormState)
  useRefreshOnSuccess(state)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <TextField name="fullName" label="Nama lengkap" error={state.errors?.fullName?.[0]} autoComplete="name" />
        <TextField name="nik" label="NIK" error={state.errors?.nik?.[0]} inputMode="numeric" maxLength={16} pattern="\d{16}" numbersOnly />
        <DatePickerField name="birthDate" label="Tanggal lahir" error={state.errors?.birthDate?.[0]} />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Jenis kelamin</span>
          <select
            name="gender"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.gender)}
          >
            <option value="">Pilih jenis kelamin</option>
            <option value="FEMALE">Perempuan</option>
            <option value="MALE">Laki-laki</option>
            <option value="UNDETERMINED">Tidak dapat ditentukan</option>
            <option value="UNKNOWN">Tidak diketahui</option>
            <option value="NOT_FILLED">Tidak mengisi</option>
          </select>
          <FieldError message={state.errors?.gender?.[0]} />
        </label>
        <TextField name="phone" label="Nomor telepon" error={state.errors?.phone?.[0]} inputMode="numeric" pattern="\d*" autoComplete="tel" numbersOnly />
        <TextField name="bloodType" label="Golongan darah" error={state.errors?.bloodType?.[0]} pattern="[A-Za-z]*" autoCapitalize="characters" lettersOnly />
        <TextAreaField name="address" label="Alamat" error={state.errors?.address?.[0]} />
        <TextAreaField name="allergies" label="Alergi" error={state.errors?.allergies?.[0]} placeholder="Contoh: Amoxicillin" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan pasien"}
      </Button>
    </form>
  )
}

export function UpdatePatientForm({ patients }: { patients: PatientListItem[] }) {
  const [state, formAction, pending] = React.useActionState(updatePatientAction, initialClinicFormState)
  useRefreshOnSuccess(state)

  if (patients.length === 0) {
    return <EmptyState title="Belum ada pasien" detail="Tambahkan pasien terlebih dahulu sebelum mengubah data dasar." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <ComboboxField
          name="patientId"
          label="Pasien"
          items={patients.map(p => ({ value: p.id, label: `${p.medicalRecordNumber} - ${p.name}` }))}
          placeholder="Pilih pasien"
          error={state.errors?.patientId}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField name="fullName" label="Nama lengkap" error={state.errors?.fullName?.[0]} />
          <TextField name="phone" label="Nomor telepon" error={state.errors?.phone?.[0]} inputMode="numeric" pattern="\d*" autoComplete="tel" numbersOnly />
          <TextField name="bloodType" label="Golongan darah" error={state.errors?.bloodType?.[0]} pattern="[A-Za-z]*" autoCapitalize="characters" lettersOnly />
        </div>
        <TextAreaField name="address" label="Alamat" error={state.errors?.address?.[0]} />
        <TextAreaField name="allergies" label="Alergi" error={state.errors?.allergies?.[0]} />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Status pasien</span>
          <select
            name="status"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.status)}
          >
            <option value="">Tidak diubah</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
            <option value="DECEASED">Meninggal</option>
          </select>
          <FieldError message={state.errors?.status?.[0]} />
        </label>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Memperbarui..." : "Update pasien"}
      </Button>
    </form>
  )
}

export function DeactivatePatientForm({ patients }: { patients: PatientListItem[] }) {
  const [state, formAction, pending] = React.useActionState(deactivatePatientAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const activePatients = patients.filter((patient) => patient.status !== "Nonaktif")

  if (activePatients.length === 0) {
    return <EmptyState title="Tidak ada pasien aktif" detail="Pasien aktif akan muncul di sini jika perlu dinonaktifkan." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <ComboboxField
        name="patientId"
        label="Pasien"
        items={activePatients.map(p => ({ value: p.id, label: `${p.medicalRecordNumber} - ${p.name} - ${p.status}` }))}
        placeholder="Pilih pasien"
        error={state.errors?.patientId}
      />
      <DestructiveActionNotice message="Pasien tidak dihapus permanen. Statusnya menjadi nonaktif agar riwayat klinis, dokumen, dan audit tetap tersimpan." />
      <FormMessage state={state} />
      <ConfirmSubmitButton
        message="Nonaktifkan pasien ini? Riwayat klinis tetap tersimpan."
        confirmLabel="Nonaktifkan pasien"
        pending={pending}
        pendingLabel="Menonaktifkan..."
        variant="destructive"
      >
        Nonaktifkan pasien
      </ConfirmSubmitButton>
    </form>
  )
}

