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
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PatientDetailItem label="Pasien" value={prescription.patient} />
            <PatientDetailItem label="No. rekam medis" value={prescription.medicalRecordNumber} />
            <PatientDetailItem label="Dokter" value={prescription.doctor} />
            <PatientDetailItem label="Apoteker" value={prescription.pharmacist} />
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-sm font-semibold">Item obat</p>
            {prescription.itemDetails.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Belum ada item obat.</p>
            ) : (
              <div className="mt-3 grid gap-2">
                {prescription.itemDetails.map((item) => (
                  <div key={item.id} className="rounded-md bg-muted px-3 py-2 text-sm leading-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{item.medicine}</p>
                        <p className="text-muted-foreground">
                          {item.dosage} - {item.usageRule}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-1 text-muted-foreground">
                      <p>Jumlah: {item.quantity}</p>
                    </div>
                    {item.note !== "-" ? <p className="mt-1 text-muted-foreground">Catatan: {item.note}</p> : null}
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
