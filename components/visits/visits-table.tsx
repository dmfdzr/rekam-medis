"use client"

import { type VisitListItem } from "@/lib/data/clinic"

import * as React from "react"
import { FileText } from "lucide-react"
import { getUniqueOptions } from "@/lib/utils"
import { useListControls } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { EmptyState, StatusBadge } from "@/components/shared/feedback"
import { ListToolbar, FilterModal, PaginationControls } from "@/components/shared/list-controls"
import { ModalDialog } from "@/components/shared/layout"
import { PatientDetailItem } from "@/components/patients/patient-dialog"

export function VisitDetailDialog({ visit }: { visit: VisitListItem }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="mt-3 md:mt-0" onClick={() => setOpen(true)}>
        <FileText className="size-3" aria-hidden="true" />
        Detail
      </Button>
      <ModalDialog open={open} onOpenChange={setOpen} title={`Kunjungan ${visit.patient}`} description={`${visit.medicalRecordNumber} - ${visit.service}`}>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={visit.status} />
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">No. RM {visit.medicalRecordNumber}</span>
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Jam {visit.time}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PatientDetailItem label="Pasien" value={visit.patient} />
            <PatientDetailItem label="No. rekam medis" value={visit.medicalRecordNumber} />
            <PatientDetailItem label="DPJP" value={visit.doctor} />
            {visit.isJointCare && visit.companionDoctors?.length > 0 && (
              <PatientDetailItem label="DPJP Pendamping" value={visit.companionDoctors.join(", ")} />
            )}
            <PatientDetailItem label="Ruang Rawat" value={visit.service} />
            <PatientDetailItem label="Registrasi pasien" value={visit.patientType} />
            <PatientDetailItem label="Lama dirawat" value={visit.lengthOfStay} />
          </div>
        </div>
      </ModalDialog>
    </>
  )
}

const defaultPageSize = 10

export function ResponsiveVisitsTable({
  visits,
  compact = false,
  filtersOpen = false,
  onFiltersOpenChange,
}: {
  visits: VisitListItem[]
  compact?: boolean
  filtersOpen?: boolean
  onFiltersOpenChange?: (open: boolean) => void
}) {
  const visitStatuses = React.useMemo(() => getUniqueOptions(visits, (visit) => visit.status), [visits])
  const searchSelector = React.useCallback(
    (visit: VisitListItem) => [visit.id, visit.patient, visit.medicalRecordNumber, visit.service, visit.doctor, visit.status],
    [],
  )
  const filterSelector = React.useCallback((visit: VisitListItem, value: string) => visit.status === value, [])
  const controls = useListControls({
    items: visits,
    pageSize: compact ? 3 : defaultPageSize,
    search: searchSelector,
    filter: filterSelector,
  })
  const visibleVisits = compact ? visits.slice(0, 3) : controls.paginatedItems

  if (visibleVisits.length === 0) {
    return (
      <>
        {!compact ? (
          <ListToolbar
            query={controls.query}
            onQueryChange={controls.setQuery}
            searchPlaceholder="Cari pasien, RM, ruang rawat, dokter"
            resultCount={controls.totalItems}
            totalCount={visits.length}
          />
        ) : null}
        <EmptyState title="Belum ada kunjungan" detail="Buat kunjungan baru dari form di halaman Kunjungan agar pasien masuk antrean layanan." />
        {onFiltersOpenChange ? (
          <FilterModal
            open={filtersOpen}
            onOpenChange={onFiltersOpenChange}
            title="Filter kunjungan"
            description="Batasi daftar kunjungan berdasarkan status alur."
            filterValue={controls.filterValue}
            onFilterChange={controls.setFilterValue}
            filterOptions={visitStatuses}
          />
        ) : null}
      </>
    )
  }

  return (
    <div className="grid gap-3">
      {!compact ? (
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari pasien, RM, ruang rawat, dokter"
          resultCount={controls.totalItems}
          totalCount={visits.length}
        />
      ) : null}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[190px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="py-3 pr-4 font-medium">No. RM</th>
              <th className="py-3 pr-4 font-medium">Pasien</th>
              <th className="py-3 pr-4 font-medium">Ruang Rawat</th>
              <th className="py-3 pr-4 font-medium">Registrasi</th>
              <th className="py-3 pr-4 font-medium">Lama dirawat</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleVisits.map((visit) => (
              <tr key={visit.id} className="align-top">
                <td className="py-4 pr-4 font-medium tabular-nums">{visit.medicalRecordNumber}</td>
                <td className="py-4 pr-4">
                  <p className="font-medium">{visit.patient}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    DPJP: {visit.doctor}
                  </p>
                  {visit.isJointCare && visit.companionDoctors?.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      DPJP Pendamping: {visit.companionDoctors.join(", ")}
                    </p>
                  )}
                </td>
                <td className="py-4 pr-4">{visit.service}</td>
                <td className="py-4 pr-4">{visit.patientType}</td>
                <td className="py-4 pr-4">{visit.lengthOfStay}</td>
                <td className="py-4 pr-4">
                  <StatusBadge label={visit.status} />
                </td>
                <td className="py-4">
                  <VisitDetailDialog visit={visit} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {visibleVisits.map((visit) => (
          <div key={visit.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{visit.patient}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {visit.medicalRecordNumber} - {visit.service}
                </p>
              </div>
              <StatusBadge label={visit.status} />
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <p>
                <span className="text-muted-foreground">DPJP: </span>
                {visit.doctor}
              </p>
              {visit.isJointCare && visit.companionDoctors?.length > 0 && (
                <p>
                  <span className="text-muted-foreground">DPJP Pendamping: </span>
                  {visit.companionDoctors.join(", ")}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Registrasi: </span>
                {visit.patientType}
              </p>
              <p>
                <span className="text-muted-foreground">Lama dirawat: </span>
                {visit.lengthOfStay}
              </p>
            </div>
            <VisitDetailDialog visit={visit} />
          </div>
        ))}
      </div>
      {onFiltersOpenChange ? (
        <FilterModal
          open={filtersOpen}
          onOpenChange={onFiltersOpenChange}
          title="Filter kunjungan"
          description="Batasi daftar kunjungan berdasarkan status alur."
          filterValue={controls.filterValue}
          onFilterChange={controls.setFilterValue}
          filterOptions={visitStatuses}
        />
      ) : null}
      {!compact ? <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} /> : null}
    </div>
  )
}
