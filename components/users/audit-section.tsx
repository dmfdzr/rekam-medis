"use client"

import { type AuditLogListItem } from "@/lib/data/clinic"

import * as React from "react"
import { FileText } from "lucide-react"
import { getUniqueOptions } from "@/lib/utils"
import { useListControls } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { EmptyState, StatusBadge } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { ListToolbar, FilterModal, PaginationControls } from "@/components/shared/list-controls"
import { PatientDetailItem } from "@/components/patients/patient-dialog"

export function AuditPayload({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{value}</p>
    </div>
  )
}

export function AuditLogDetailDialog({ log }: { log: AuditLogListItem }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="mt-3 w-fit" onClick={() => setOpen(true)}>
        <FileText className="size-3" aria-hidden="true" />
        Detail audit
      </Button>
      <ModalDialog open={open} onOpenChange={setOpen} title={`Audit ${log.action}`} description={`${log.actor} - ${log.time}`}>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={log.risk} />
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{log.entity}</span>
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">ID {log.entityId}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PatientDetailItem label="User" value={log.actor} />
            <PatientDetailItem label="Role" value={log.role} />
            <PatientDetailItem label="Aksi" value={log.action} />
            <PatientDetailItem label="Waktu" value={log.time} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AuditPayload title="Data sebelum" value={log.beforeData} />
            <AuditPayload title="Data sesudah" value={log.afterData} />
          </div>
        </div>
      </ModalDialog>
    </>
  )
}

export function AuditSection({
  auditLogs,
  filtersOpen,
  onFiltersOpenChange,
}: {
  auditLogs: AuditLogListItem[]
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
}) {
  const auditRisks = React.useMemo(() => getUniqueOptions(auditLogs, (log) => log.risk), [auditLogs])
  const searchSelector = React.useCallback(
    (log: AuditLogListItem) => [log.actor, log.role, log.action, log.entity, log.entityId, log.time, log.risk],
    [],
  )
  const filterSelector = React.useCallback((log: AuditLogListItem, value: string) => log.risk === value, [])
  const controls = useListControls({
    items: auditLogs,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <Panel title="Aktivitas penting" description="Audit log membantu investigasi akses dan perubahan data sensitif.">
      <ListToolbar
        query={controls.query}
        onQueryChange={controls.setQuery}
        searchPlaceholder="Cari user, role, aksi, entity, waktu"
        resultCount={controls.totalItems}
        totalCount={auditLogs.length}
      />
      <div className="grid gap-3">
        {controls.paginatedItems.length === 0 ? (
          <EmptyState title={auditLogs.length === 0 ? "Belum ada audit log" : "Audit log tidak ditemukan"} detail="Ubah kata kunci atau filter risiko untuk melihat aktivitas lain." />
        ) : (
          controls.paginatedItems.map((log) => (
            <div key={log.id} className="rounded-md border border-border bg-card p-4">
              <div className="grid gap-3 md:grid-cols-[0.8fr_1fr_0.45fr_0.45fr_0.35fr] md:items-center">
                <div>
                  <p className="font-medium">{log.actor}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{log.role}</p>
                </div>
                <p className="text-sm text-muted-foreground">{log.action}</p>
                <p className="text-sm tabular-nums">{log.entity}</p>
                <p className="text-sm tabular-nums text-muted-foreground">{log.time}</p>
                <StatusBadge label={log.risk} />
              </div>
              <AuditLogDetailDialog log={log} />
            </div>
          ))
        )}
      </div>
      <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
      <FilterModal
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Filter audit log"
        description="Batasi aktivitas berdasarkan tingkat risiko."
        filterLabel="Risiko"
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={auditRisks}
      />
    </Panel>
  )
}

