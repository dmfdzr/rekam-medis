"use client"

import { type MedicineListItem } from "@/lib/data/clinic"
import { createMedicineAction, updateMedicineAction, deactivateMedicineAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, FieldError, FormMessage, DatePickerField } from "@/components/shared/forms"
import { EmptyState, DestructiveActionNotice } from "@/components/shared/feedback"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { Button } from "@/components/ui/button"

const initialClinicFormState: ClinicFormState = {}

export function CreateMedicineForm() {
  const [state, formAction, pending] = React.useActionState(createMedicineAction, initialClinicFormState)
  useRefreshOnSuccess(state)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField name="code" label="Kode obat" error={state.errors?.code?.[0]} />
        <TextField name="name" label="Nama obat" error={state.errors?.name?.[0]} />
        <TextField name="category" label="Kategori" error={state.errors?.category?.[0]} />
        <TextField name="unit" label="Satuan" error={state.errors?.unit?.[0]} placeholder="tablet" />
        <TextField name="stock" label="Stok" inputMode="numeric" error={state.errors?.stock?.[0]} />
        <TextField name="minimumStock" label="Stok minimum" inputMode="numeric" error={state.errors?.minimumStock?.[0]} />
        <TextField name="price" label="Harga" inputMode="decimal" error={state.errors?.price?.[0]} />
        <DatePickerField name="expirationDate" label="Tanggal kedaluwarsa" error={state.errors?.expirationDate?.[0]} />
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Tambah obat"}
      </Button>
    </form>
  )
}

export function UpdateMedicineForm({ medicines }: { medicines: MedicineListItem[] }) {
  const [state, formAction, pending] = React.useActionState(updateMedicineAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const [selectedMedicineId, setSelectedMedicineId] = React.useState("")
  const selectedMedicine = medicines.find((medicine) => medicine.id === selectedMedicineId)

  if (medicines.length === 0) {
    return <EmptyState title="Belum ada obat" detail="Tambahkan master obat terlebih dahulu sebelum memperbarui inventori." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Obat</span>
          <select
            name="medicineId"
            value={selectedMedicineId}
            onChange={(event) => setSelectedMedicineId(event.target.value)}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.medicineId)}
          >
            <option value="">Pilih obat</option>
            {medicines.map((medicine) => (
              <option key={medicine.id} value={medicine.id}>
                {medicine.code} - {medicine.name} - stok {medicine.stock}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.medicineId?.[0]} />
        </label>
        {selectedMedicine ? (
          <div className="grid gap-2 rounded-md border border-border bg-card p-3 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Status: </span>
              {selectedMedicine.status} - {selectedMedicine.usageStatus}
            </p>
            <p>
              <span className="text-muted-foreground">Stok: </span>
              {selectedMedicine.stock} {selectedMedicine.unit} (Min. {selectedMedicine.min})
            </p>
            <p>
              <span className="text-muted-foreground">Sinyal: </span>
              {selectedMedicine.stockSignal}
            </p>
            <p>
              <span className="text-muted-foreground">Exp: </span>
              {selectedMedicine.expires}
            </p>
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField name="name" label="Nama obat" error={state.errors?.name?.[0]} />
          <TextField name="category" label="Kategori" error={state.errors?.category?.[0]} />
          <TextField name="unit" label="Satuan" error={state.errors?.unit?.[0]} placeholder="tablet" />
          <TextField name="stock" label="Stok" inputMode="numeric" error={state.errors?.stock?.[0]} />
          <TextField name="minimumStock" label="Stok minimum" inputMode="numeric" error={state.errors?.minimumStock?.[0]} />
          <TextField name="price" label="Harga" inputMode="decimal" error={state.errors?.price?.[0]} />
          <DatePickerField name="expirationDate" label="Tanggal kedaluwarsa" error={state.errors?.expirationDate?.[0]} />
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Status obat</span>
            <select
              name="status"
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
              aria-invalid={Boolean(state.errors?.status)}
            >
              <option value="">Otomatis dari stok</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
              <option value="LOW_STOCK">Stok rendah</option>
              <option value="EXPIRED">Kedaluwarsa</option>
            </select>
            <FieldError message={state.errors?.status?.[0]} />
          </label>
        </div>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Memperbarui..." : "Update obat"}
      </Button>
    </form>
  )
}

export function DeactivateMedicineForm({ medicines }: { medicines: MedicineListItem[] }) {
  const [state, formAction, pending] = React.useActionState(deactivateMedicineAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const activeMedicines = medicines.filter((medicine) => medicine.status !== "Nonaktif")

  if (activeMedicines.length === 0) {
    return <EmptyState title="Tidak ada obat aktif" detail="Obat yang masih aktif akan muncul di sini jika perlu dinonaktifkan." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Obat</span>
        <select
          name="medicineId"
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
          aria-invalid={Boolean(state.errors?.medicineId)}
        >
          <option value="">Pilih obat</option>
          {activeMedicines.map((medicine) => (
            <option key={medicine.id} value={medicine.id}>
              {medicine.code} - {medicine.name} - {medicine.status}
            </option>
          ))}
        </select>
        <FieldError message={state.errors?.medicineId?.[0]} />
      </label>
      <DestructiveActionNotice message="Obat tidak dihapus permanen. Status nonaktif membuat obat tidak dipakai untuk resep baru, tetapi histori penggunaan tetap tersimpan." />
      <FormMessage state={state} />
      <ConfirmSubmitButton
        message="Nonaktifkan obat ini? Histori penggunaan tetap tersimpan."
        confirmLabel="Nonaktifkan obat"
        pending={pending}
        pendingLabel="Menonaktifkan..."
        variant="destructive"
      >
        Nonaktifkan obat
      </ConfirmSubmitButton>
    </form>
  )
}
