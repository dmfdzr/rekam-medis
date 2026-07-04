"use client"

import { type PatientListItem } from "@/lib/data/clinic"

import * as React from "react"
import { FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModalDialog } from "@/components/shared/layout"
import { StatusBadge } from "@/components/shared/feedback"

export function PatientDetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6">{value}</p>
    </div>
  )
}

export function PatientDetailDialog({ patient }: { patient: PatientListItem }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        <FileText className="size-3" aria-hidden="true" />
        Detail
      </Button>
      <ModalDialog open={open} onOpenChange={setOpen} title={patient.name} description={`${patient.medicalRecordNumber} - ${patient.gender}, ${patient.age}`}>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={patient.status} />
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">NIK {patient.nik}</span>
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Kunjungan terakhir {patient.lastVisit}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PatientDetailItem label="Telepon" value={patient.phone} />
            <PatientDetailItem label="Golongan darah" value={patient.bloodType} />
            <PatientDetailItem label="Alergi" value={patient.allergy} />
            <PatientDetailItem label="Wilayah" value={patient.regionAddress} />
            <div className="sm:col-span-2">
              <PatientDetailItem label="Detail alamat" value={patient.addressDetail} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total kunjungan</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{patient.visitCount}</p>
            </div>
            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Dokumen medis</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{patient.documentCount}</p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-sm font-semibold">Riwayat kunjungan terakhir</p>
            {patient.recentVisits.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Belum ada kunjungan.</p>
            ) : (
              <div className="mt-3 grid gap-2">
                {patient.recentVisits.map((visit) => (
                  <div key={visit.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                    <span>
                      {visit.date} - {visit.service}
                    </span>
                    <StatusBadge label={visit.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-semibold">Riwayat rekam medis</p>
              {patient.recentMedicalRecords.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Belum ada rekam medis.</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {patient.recentMedicalRecords.map((record) => (
                    <div key={record.id} className="rounded-md bg-muted px-3 py-2 text-sm leading-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">
                          {record.date} - {record.service}
                        </span>
                        <StatusBadge label={record.status} />
                      </div>
                      <p className="mt-1 text-muted-foreground">Assessment: {record.assessment}</p>
                      <p className="text-muted-foreground">Tindakan: {record.treatments}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-semibold">Dokumen pasien</p>
              {patient.recentDocuments.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Belum ada dokumen.</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {patient.recentDocuments.map((document) => (
                    <div key={document.id} className="rounded-md bg-muted px-3 py-2 text-sm leading-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{document.fileName}</p>
                          <p className="text-muted-foreground">
                            {document.type} - {document.uploadedAt}
                          </p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <a href={document.fileUrl} target="_blank" rel="noreferrer">
                            <Download className="size-3" aria-hidden="true" />
                            Buka
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalDialog>
    </>
  )
}
