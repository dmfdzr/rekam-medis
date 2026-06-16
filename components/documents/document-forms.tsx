"use client"

import { type DocumentFormOptions } from "@/lib/data/clinic"
import { createMedicalDocumentAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { FieldError, FormMessage } from "@/components/shared/forms"
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
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Pasien</span>
        <select name="patientId" className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25">
          {documentOptions.patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Kunjungan terkait</span>
        <select name="visitId" className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25">
          <option value="">Tanpa kunjungan</option>
          {documentOptions.visits.map((visit) => (
            <option key={visit.id} value={visit.id}>
              {visit.label}
            </option>
          ))}
        </select>
      </label>
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
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">File dokumen</span>
        <input
          name="file"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium focus:border-ring focus:ring-2 focus:ring-ring/25 focus:outline-none"
          aria-invalid={Boolean(state.errors?.file)}
        />
        <p className="text-xs text-muted-foreground">PDF, JPG, PNG, atau WebP. Maksimal 2 MB.</p>
        <FieldError message={state.errors?.file?.[0]} />
      </label>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Mengunggah..." : "Upload dokumen"}
      </Button>
    </form>
  )
}

