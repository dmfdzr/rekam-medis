"use client"

import { type MedicineListItem } from "@/lib/data/clinic"

import * as React from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModalDialog } from "@/components/shared/layout"
import { StatusBadge } from "@/components/shared/feedback"
import { PatientDetailItem } from "@/components/patients/patient-dialog"

export function MedicineDetailDialog({ medicine }: { medicine: MedicineListItem }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setOpen(true)}>
        <FileText className="size-3" aria-hidden="true" />
        Detail
      </Button>
      <ModalDialog open={open} onOpenChange={setOpen} title={medicine.name} description={`${medicine.code} - ${medicine.category}`}>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={medicine.status} />
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Satuan {medicine.unit}</span>
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Kedaluwarsa {medicine.expires}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PatientDetailItem label="Kode obat" value={medicine.code} />
            <PatientDetailItem label="Kategori" value={medicine.category} />
            <PatientDetailItem label="Stok tersedia" value={`${medicine.stock} ${medicine.unit}`} />
            <PatientDetailItem label="Stok minimum" value={`${medicine.min} ${medicine.unit}`} />
            <PatientDetailItem label="Harga" value={medicine.price || "-"} />
            <PatientDetailItem label="Status" value={medicine.status} />
          </div>
        </div>
      </ModalDialog>
    </>
  )
}

