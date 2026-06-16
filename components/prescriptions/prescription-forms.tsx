"use client"

import { type PrescriptionFormOptions, type PrescriptionListItem } from "@/lib/data/clinic"
import { addPrescriptionItemAction, processPrescriptionAction, cancelPrescriptionAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, TextAreaField, FieldError, FormMessage } from "@/components/shared/forms"
import { EmptyState, DestructiveActionNotice } from "@/components/shared/feedback"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { Button } from "@/components/ui/button"

const initialClinicFormState: ClinicFormState = {}

export function PrescriptionItemForm({ prescriptionOptions }: { prescriptionOptions: PrescriptionFormOptions }) {
  const [state, formAction, pending] = React.useActionState(addPrescriptionItemAction, initialClinicFormState)
  useRefreshOnSuccess(state)

  if (prescriptionOptions.records.length === 0 || prescriptionOptions.medicines.length === 0) {
    return <EmptyState title="Belum siap membuat resep" detail="Pastikan ada rekam medis dan master obat aktif sebelum membuat resep." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Rekam medis</span>
        <select name="medicalRecordId" className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25">
          {prescriptionOptions.records.map((record) => (
            <option key={record.id} value={record.id}>
              {record.label}
            </option>
          ))}
        </select>
      </label>
      <TextField
        name="medicineQuery"
        label="Obat"
        placeholder="Ketik kode atau nama obat"
        error={state.errors?.medicineQuery?.[0] ?? state.errors?.medicineId?.[0]}
        list="medicine-options"
      />
      <datalist id="medicine-options">
        {prescriptionOptions.medicines.map((medicine) => (
          <option key={medicine.id} value={`${medicine.code} - ${medicine.name}`}>
            {medicine.stock} {medicine.unit}
          </option>
        ))}
      </datalist>
      <p className="-mt-2 text-xs leading-5 text-muted-foreground">Ketik kode atau nama obat, lalu pilih saran agar resep tetap tersambung ke stok farmasi.</p>
      <TextField name="dosage" label="Dosis" placeholder="500mg" error={state.errors?.dosage?.[0]} />
      <TextField name="usageRule" label="Aturan pakai" placeholder="3x sehari setelah makan" error={state.errors?.usageRule?.[0]} />
      <TextField name="quantity" label="Jumlah" inputMode="numeric" error={state.errors?.quantity?.[0]} />
      <TextAreaField name="note" label="Catatan penggunaan" error={state.errors?.note?.[0]} />
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Tambah item resep"}
      </Button>
    </form>
  )
}

export function ProcessPrescriptionForm({ prescriptions }: { prescriptions: PrescriptionListItem[] }) {
  const [state, formAction, pending] = React.useActionState(processPrescriptionAction, initialClinicFormState)
  const pendingPrescriptions = prescriptions.filter((prescription) => prescription.status === "Pending" || prescription.status === "Validasi stok")
  const [selectedPrescriptionId, setSelectedPrescriptionId] = React.useState(pendingPrescriptions[0]?.id ?? "")
  const selectedPrescription = pendingPrescriptions.find((prescription) => prescription.id === selectedPrescriptionId)

  if (pendingPrescriptions.length === 0) {
    return <EmptyState title="Tidak ada resep pending" detail="Resep yang belum diproses akan muncul untuk divalidasi stok oleh apoteker." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Resep</span>
        <select
          name="prescriptionId"
          value={selectedPrescriptionId}
          onChange={(event) => setSelectedPrescriptionId(event.target.value)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
        >
          {pendingPrescriptions.map((prescription) => (
            <option key={prescription.id} value={prescription.id}>
              {prescription.medicalRecordNumber} - {prescription.patient} - {prescription.items}
            </option>
          ))}
        </select>
      </label>
      {selectedPrescription ? (
        <div className="grid gap-3 rounded-md border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{selectedPrescription.patient}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedPrescription.medicalRecordNumber} - {selectedPrescription.doctor}
              </p>
            </div>
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Stok {selectedPrescription.stock}</span>
          </div>
          <div className="grid gap-2">
            {selectedPrescription.itemDetails.map((item) => (
              <div key={item.id} className="rounded-md bg-muted p-3 text-sm leading-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.medicine}</p>
                    <p className="text-muted-foreground">
                      {item.dosage} - {item.usageRule}
                    </p>
                  </div>
                  <span className="rounded-md bg-background px-2 py-1 text-xs text-muted-foreground">{item.status}</span>
                </div>
                <p className="mt-2 text-muted-foreground">
                  Diminta {item.requested}, stok {item.stock}, sisa setelah proses {item.remainingAfterProcess}.
                </p>
              </div>
            ))}
          </div>
          {!selectedPrescription.canProcess ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
              Resep ini belum bisa diproses. Periksa stok, status obat, atau tanggal kedaluwarsa sebelum melanjutkan.
            </div>
          ) : null}
        </div>
      ) : null}
      <FormMessage state={state} />
      <ConfirmSubmitButton
        message="Proses resep ini dan kurangi stok obat?"
        confirmLabel="Proses resep"
        pending={pending}
        pendingLabel="Memproses..."
        disabled={!selectedPrescription?.canProcess}
      >
        Proses resep
      </ConfirmSubmitButton>
    </form>
  )
}

export function CancelPrescriptionForm({ prescriptions }: { prescriptions: PrescriptionListItem[] }) {
  const [state, formAction, pending] = React.useActionState(cancelPrescriptionAction, initialClinicFormState)
  const cancellablePrescriptions = prescriptions.filter((prescription) => prescription.status === "Pending" || prescription.status === "Validasi stok")

  if (cancellablePrescriptions.length === 0) {
    return <EmptyState title="Tidak ada resep yang bisa dibatalkan" detail="Resep pending atau validasi stok akan muncul di sini." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Resep</span>
        <select
          name="prescriptionId"
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
          aria-invalid={Boolean(state.errors?.prescriptionId)}
        >
          <option value="">Pilih resep</option>
          {cancellablePrescriptions.map((prescription) => (
            <option key={prescription.id} value={prescription.id}>
              {prescription.medicalRecordNumber} - {prescription.patient} - {prescription.items}
            </option>
          ))}
        </select>
        <FieldError message={state.errors?.prescriptionId?.[0]} />
      </label>
      <DestructiveActionNotice message="Resep yang sudah diproses tidak bisa dibatalkan dari aksi ini karena stok sudah berubah. Resep pending akan ditandai dibatalkan." />
      <FormMessage state={state} />
      <ConfirmSubmitButton
        message="Batalkan resep ini? Catatan resep tetap tersimpan di riwayat pasien."
        confirmLabel="Batalkan resep"
        pending={pending}
        pendingLabel="Membatalkan..."
        variant="destructive"
      >
        Batalkan resep
      </ConfirmSubmitButton>
    </form>
  )
}
