"use client"

import { type VisitListItem, type VisitFormOptions } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"

import * as React from "react"

import { Panel, ModalDialog, ChoiceFormSwitch } from "@/components/shared/layout"
import { ResponsiveVisitsTable } from "./visits-table"
import { CreateVisitForm, CancelVisitForm } from "./visit-forms"

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
  const canCreate = role === "master" || role === "admin"

  return (
    <div className="grid gap-5">
      <Panel title="Daftar kunjungan" description="Status kunjungan diperbarui otomatis sesuai alur: asesmen, laboratorium, resep, CPPT.">
        <ResponsiveVisitsTable visits={visits} filtersOpen={filtersOpen} onFiltersOpenChange={onFiltersOpenChange} />
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola kunjungan" description="Pilih aksi pengelolaan kunjungan yang ingin dikerjakan.">
        <ChoiceFormSwitch
          key={composerOpen ? "visits-open" : "visits-closed"}
          emptyMessage="Pengelolaan kunjungan dibatasi untuk master dan admin."
          options={
            canCreate
              ? [
                  {
                    id: "create-visit",
                    title: "Buat kunjungan",
                    description: "Daftarkan kunjungan pasien dengan ruang rawat, dokter, keluhan, dan status awal.",
                    content: <CreateVisitForm visitOptions={visitOptions} />,
                  },
                  {
                    id: "cancel-visit",
                    title: "Batalkan kunjungan",
                    description: "Tandai kunjungan sebagai dibatalkan tanpa menghapus jejak pendaftaran dan audit alur.",
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
