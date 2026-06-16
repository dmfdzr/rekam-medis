"use client"

import { type VisitListItem, type VisitFormOptions } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"

import * as React from "react"

import { Panel, ModalDialog, ChoiceFormSwitch } from "@/components/shared/layout"
import { ResponsiveVisitsTable } from "./visits-table"
import { CreateVisitForm, UpdateVisitStatusForm, CancelVisitForm } from "./visit-forms"

export function VisitsSection({
  visits,
  visitOptions,
  role,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  visits: VisitListItem[]
  visitOptions: VisitFormOptions
  role: RoleKey
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "admin" || role === "registration"

  return (
    <div className="grid gap-5">
      <Panel title="Daftar kunjungan" description="Status kunjungan dibuat eksplisit agar handoff antar role tidak ambigu.">
        <ResponsiveVisitsTable visits={visits} filtersOpen={filtersOpen} onFiltersOpenChange={onFiltersOpenChange} />
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola kunjungan" description="Pilih aksi pengelolaan kunjungan yang ingin dikerjakan.">
        <ChoiceFormSwitch
          key={composerOpen ? "visits-open" : "visits-closed"}
          emptyMessage="Pengelolaan kunjungan dibatasi untuk admin dan petugas pendaftaran."
          options={
            canCreate
              ? [
                  {
                    id: "create-visit",
                    title: "Buat kunjungan",
                    description: "Daftarkan kunjungan pasien dengan layanan, dokter, keluhan, dan status awal.",
                    content: <CreateVisitForm visitOptions={visitOptions} />,
                  },
                  {
                    id: "update-visit",
                    title: "Update status kunjungan",
                    description: "Ubah status kunjungan untuk pembatalan, penyelesaian, atau koreksi handoff layanan.",
                    content: <UpdateVisitStatusForm visits={visits} />,
                  },
                  {
                    id: "cancel-visit",
                    title: "Batalkan kunjungan",
                    description: "Tandai kunjungan sebagai dibatalkan tanpa menghapus jejak pendaftaran dan audit layanan.",
                    content: <CancelVisitForm visits={visits} />,
                  },
                ]
              : []
          }
        />
      </ModalDialog>
    </div>
  )
}

