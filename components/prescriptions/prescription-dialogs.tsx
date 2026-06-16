"use client"

import { type PrescriptionListItem } from "@/lib/data/clinic"

import * as React from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModalDialog } from "@/components/shared/layout"
import { StatusBadge } from "@/components/shared/feedback"
import { PatientDetailItem } from "@/components/patients/patient-dialog"

export function PrescriptionDetailDialog({ prescription }: { prescription: PrescriptionListItem }) {
  const [open, setOpen] = React.useState(false)
  const medicineItems = prescription.items === "-" ? [] : prescription.items.split(",").map((item) => item.trim())

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setOpen(true)}>
        <FileText className="size-3" aria-hidden="true" />
        Detail
      </Button>
      <ModalDialog open={open} onOpenChange={setOpen} title={`Resep ${prescription.patient}`} description={`${prescription.medicalRecordNumber} - dibuat ${prescription.createdAt}`}>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={prescription.status} />
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Stok {prescription.stock}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PatientDetailItem label="Pasien" value={prescription.patient} />
            <PatientDetailItem label="No. rekam medis" value={prescription.medicalRecordNumber} />
            <PatientDetailItem label="Dokter" value={prescription.doctor} />
            <PatientDetailItem label="Apoteker" value={prescription.pharmacist} />
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-sm font-semibold">Item obat</p>
            {medicineItems.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Belum ada item obat.</p>
            ) : (
              <div className="mt-3 grid gap-2">
                {medicineItems.map((item) => (
                  <div key={item} className="rounded-md bg-muted px-3 py-2 text-sm leading-6">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ModalDialog>
    </>
  )
}

