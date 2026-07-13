"use client"

import { type AuditLogListItem } from "@/lib/data/clinic"

import * as React from "react"
import { FileText } from "lucide-react"
import { cn, getUniqueOptions } from "@/lib/utils"
import { useListControls } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { EmptyState, StatusBadge } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { ListToolbar, PaginationControls } from "@/components/shared/list-controls"
import { PatientDetailItem } from "@/components/patients/patient-dialog"
import { ComboboxField } from "@/components/shared/forms"

function parseAuditPayload(value: string) {
  if (!value || value === "-") {
    return null
  }

  try {
    const parsed = JSON.parse(value) as unknown

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null
    }

    return Object.entries(parsed as Record<string, unknown>)
  } catch {
    return null
  }
}

function formatAuditValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-"
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

export function AuditPayload({ title, value }: { title: string; value: string }) {
  const entries = parseAuditPayload(value)

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {entries ? (
        <div className="mt-3 grid gap-2">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada payload.</p>
          ) : (
            entries.map(([key, entryValue]) => (
              <div key={key} className="rounded-md bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">{key}</p>
                <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-foreground">{formatAuditValue(entryValue)}</pre>
              </div>
            ))
          )}
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{value || "-"}</p>
      )}
    </div>
  )
}

export function AuditLogDetailDialog({ log, className }: { log: AuditLogListItem; className?: string }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button type="button" variant="outline" size="sm" className={cn("w-fit", className)} onClick={() => setOpen(true)}>
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

          <div className="rounded-md border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-400/20 dark:bg-cyan-400/10">
            <p className="text-xs font-medium text-cyan-900 dark:text-cyan-100">Jejak akses</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[0.45fr_1fr]">
              <div>
                <p className="text-xs text-cyan-800 dark:text-cyan-200">IP address</p>
                <p className="mt-1 break-all font-mono text-sm text-cyan-950 dark:text-cyan-50">{log.ipAddress}</p>
              </div>
              <div>
                <p className="text-xs text-cyan-800 dark:text-cyan-200">User agent</p>
                <p className="mt-1 break-words font-mono text-xs leading-5 text-cyan-950 dark:text-cyan-50">{log.userAgent}</p>
              </div>
            </div>
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
  const auditEntities = React.useMemo(() => getUniqueOptions(auditLogs, (log) => log.entity), [auditLogs])
  const auditActions = React.useMemo(() => getUniqueOptions(auditLogs, (log) => log.action), [auditLogs])
  const [riskFilter, setRiskFilter] = React.useState("all")
  const [entityFilter, setEntityFilter] = React.useState("all")
  const [actionFilter, setActionFilter] = React.useState("all")
  const auditSummary = React.useMemo(
    () => ({
      total: auditLogs.length,
      sensitive: auditLogs.filter((log) => log.risk === "Sensitif").length,
      normal: auditLogs.filter((log) => log.risk === "Normal").length,
      loginFailed: auditLogs.filter((log) => log.action === "LOGIN_FAILED").length,
    }),
    [auditLogs],
  )
  const searchSelector = React.useCallback(
    (log: AuditLogListItem) => [log.actor, log.role, log.action, log.entity, log.entityId, log.time, log.risk, log.ipAddress, log.userAgent],
    [],
  )
  const filterSelector = React.useCallback(
    (log: AuditLogListItem) =>
      (riskFilter === "all" || log.risk === riskFilter) &&
      (entityFilter === "all" || log.entity === entityFilter) &&
      (actionFilter === "all" || log.action === actionFilter),
    [actionFilter, entityFilter, riskFilter],
  )
  const controls = useListControls({
    items: auditLogs,
    search: searchSelector,
    filter: filterSelector,
  })

  function resetFilters() {
    setRiskFilter("all")
    setEntityFilter("all")
    setActionFilter("all")
  }

  return (
    <Panel title="Aktivitas penting" description="Audit log membantu investigasi akses dan perubahan data sensitif.">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total aktivitas</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{auditSummary.total}</p>
        </div>
        <div className="rounded-md border border-amber-400/30 bg-amber-50 p-4 dark:bg-amber-400/10">
          <p className="text-xs text-amber-800 dark:text-amber-200">Sensitif</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-900 dark:text-amber-100">{auditSummary.sensitive}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Normal</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{auditSummary.normal}</p>
        </div>
        <div className="rounded-md border border-red-400/30 bg-red-50 p-4 dark:bg-red-400/10">
          <p className="text-xs text-red-800 dark:text-red-200">Login gagal</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-900 dark:text-red-100">{auditSummary.loginFailed}</p>
        </div>
      </div>
      <ListToolbar
        query={controls.query}
        onQueryChange={controls.setQuery}
        searchPlaceholder="Cari user, role, aksi, entity, IP, user agent"
        resultCount={controls.totalItems}
        totalCount={auditLogs.length}
      />
      {controls.paginatedItems.length === 0 ? (
        <EmptyState title={auditLogs.length === 0 ? "Belum ada audit log" : "Audit log tidak ditemukan"} detail="Ubah kata kunci, risiko, entity, atau action untuk melihat aktivitas lain." />
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4 font-medium">User</th>
                  <th className="py-3 pr-4 font-medium">Aksi</th>
                  <th className="py-3 pr-4 font-medium">Entity</th>
                  <th className="py-3 pr-4 font-medium">IP</th>
                  <th className="py-3 pr-4 font-medium">Waktu</th>
                  <th className="py-3 pr-4 font-medium">Risiko</th>
                  <th className="py-3 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {controls.paginatedItems.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="py-4 pr-4">
                      <p className="font-medium">{log.actor}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{log.role}</p>
                    </td>
                    <td className="max-w-[14rem] py-4 pr-4 font-medium">{log.action}</td>
                    <td className="py-4 pr-4">
                      <p className="tabular-nums">{log.entity}</p>
                      <p className="mt-1 text-xs text-muted-foreground">ID {log.entityId}</p>
                    </td>
                    <td className="max-w-[10rem] py-4 pr-4 break-all font-mono text-xs text-muted-foreground">{log.ipAddress}</td>
                    <td className="py-4 pr-4 tabular-nums text-muted-foreground">{log.time}</td>
                    <td className="py-4 pr-4">
                      <StatusBadge label={log.risk} />
                    </td>
                    <td className="py-4">
                      <AuditLogDetailDialog log={log} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 lg:hidden">
            {controls.paginatedItems.map((log) => (
              <div key={log.id} className="rounded-md border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{log.actor}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{log.role}</p>
                  </div>
                  <StatusBadge label={log.risk} />
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Aksi: </span>
                    {log.action}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Entity: </span>
                    {log.entity} - ID {log.entityId}
                  </p>
                  <p className="break-all font-mono">
                    <span className="font-sans text-muted-foreground">IP: </span>
                    {log.ipAddress}
                  </p>
                  <p className="tabular-nums">
                    <span className="text-muted-foreground">Waktu: </span>
                    {log.time}
                  </p>
                </div>
                <AuditLogDetailDialog log={log} className="mt-3" />
              </div>
            ))}
          </div>
        </>
      )}
      <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
      <ModalDialog open={filtersOpen} onOpenChange={onFiltersOpenChange} title="Filter audit log" description="Batasi aktivitas berdasarkan risiko, entity, dan action.">
        <div className="grid gap-3">
          <ComboboxField
            name="riskFilter"
            label="Risiko"
            items={[
              { value: "all", label: "Semua risiko" },
              ...auditRisks.map((risk) => ({ value: risk, label: risk })),
            ]}
            placeholder="Semua risiko"
            value={riskFilter}
            onValueChange={setRiskFilter}
          />
          <ComboboxField
            name="entityFilter"
            label="Entity"
            items={[
              { value: "all", label: "Semua entity" },
              ...auditEntities.map((entity) => ({ value: entity, label: entity })),
            ]}
            placeholder="Semua entity"
            value={entityFilter}
            onValueChange={setEntityFilter}
          />
          <ComboboxField
            name="actionFilter"
            label="Action"
            items={[
              { value: "all", label: "Semua action" },
              ...auditActions.map((action) => ({ value: action, label: action })),
            ]}
            placeholder="Semua action"
            value={actionFilter}
            onValueChange={setActionFilter}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" size="lg" onClick={resetFilters}>
            Reset
          </Button>
          <Button type="button" size="lg" onClick={() => onFiltersOpenChange(false)}>
            Terapkan
          </Button>
        </div>
      </ModalDialog>
    </Panel>
  )
}
