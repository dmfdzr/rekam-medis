"use client"

import { type DocumentFormOptions } from "@/lib/data/clinic"
import { createMedicalDocumentAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { FieldError, FormMessage, TextAreaField, TextField, ComboboxField } from "@/components/shared/forms"
import { EmptyState } from "@/components/shared/feedback"
import { Button } from "@/components/ui/button"

const initialClinicFormState: ClinicFormState = {}

export function MedicalDocumentForm({ documentOptions }: { documentOptions: DocumentFormOptions }) {
  const [state, formAction, pending] = React.useActionState(createMedicalDocumentAction, initialClinicFormState)
  useRefreshOnSuccess(state)

  if (documentOptions.patients.length === 0) {
    return <EmptyState title="Belum ada pasien" detail="Tambahkan pasien terlebih dahulu sebelum menyimpan dokumen medis." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <ComboboxField
        name="patientId"
        label="Pasien"
        items={documentOptions.patients.map(p => ({ value: p.id, label: p.label }))}
        placeholder="Pilih pasien"
      />
      <ComboboxField
        name="visitId"
        label="Kunjungan terkait"
        items={[
          { value: "", label: "Tanpa kunjungan" },
          ...documentOptions.visits.map(v => ({ value: v.id, label: v.label }))
        ]}
        placeholder="Pilih kunjungan"
      />
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Tipe dokumen</span>
        <select name="type" className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25">
          <option value="LAB_RESULT">Hasil lab</option>
          <option value="REFERRAL_LETTER">Surat rujukan</option>
          <option value="CONTROL_LETTER">Surat kontrol</option>
          <option value="EXAMINATION_PHOTO">Foto pemeriksaan</option>
          <option value="SUPPORTING_DOCUMENT">Dokumen pendukung</option>
          <option value="OTHER">Lainnya</option>
        </select>
      </label>
      <TextField
        name="documentName"
        label="Nama dokumen"
        error={state.errors?.documentName?.[0]}
        placeholder="Contoh: Ringkasan kunjungan, hasil lab luar, surat kontrol"
      />
      <TextAreaField
        name="referenceNote"
        label="Catatan referensi"
        error={state.errors?.referenceNote?.[0]}
        placeholder="Isi nomor referensi, lokasi arsip fisik, atau catatan sumber dokumen eksternal."
      />
      <FieldError message={state.errors?.file?.[0]} />
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan dokumen"}
      </Button>
    </form>
  )
}
