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
      <ComboboxField
        name="type"
        label="Tipe dokumen"
        items={[
          { value: "LAB_RESULT", label: "Hasil lab" },
          { value: "REFERRAL_LETTER", label: "Surat rujukan" },
          { value: "CONTROL_LETTER", label: "Surat kontrol" },
          { value: "EXAMINATION_PHOTO", label: "Foto pemeriksaan" },
          { value: "OTHER", label: "Lainnya" },
        ]}
        placeholder="Pilih tipe dokumen"
        defaultValue="LAB_RESULT"
      />
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
