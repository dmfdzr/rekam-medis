"use client"

import { type DashboardSummary, type MedicineListItem, type VisitListItem } from "@/lib/data/clinic"
import { RoleKey, workflowSteps, roles } from "@/lib/medical-data"

import * as React from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/shared/feedback"
import { Panel } from "@/components/shared/layout"
import { MetricCard } from "@/components/reports/reports-section"
import { ResponsiveVisitsTable } from "@/components/visits/visits-table"

export function MedicineStockAlertPanel({ medicines }: { medicines: MedicineListItem[] }) {
  const alerts = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextThirtyDays = new Date(today)
    nextThirtyDays.setDate(today.getDate() + 30)

    return medicines
      .map((medicine) => {
        if (medicine.status === "Kedaluwarsa") {
          return {
            id: `${medicine.id}-expired`,
            severity: "critical" as const,
            title: `${medicine.name} kedaluwarsa`,
            detail: `${medicine.code} - stok ${medicine.stock} ${medicine.unit}, tanggal ${medicine.expires}`,
          }
        }

        if (medicine.status === "Stok rendah") {
          return {
            id: `${medicine.id}-low-stock`,
            severity: "warning" as const,
            title: `${medicine.name} stok rendah`,
            detail: `${medicine.code} - tersedia ${medicine.stock} ${medicine.unit}, minimum ${medicine.min} ${medicine.unit}`,
          }
        }

        if (medicine.expires !== "-") {
          const expiresAt = new Date(medicine.expires)

          if (!Number.isNaN(expiresAt.getTime()) && expiresAt >= today && expiresAt <= nextThirtyDays) {
            return {
              id: `${medicine.id}-expiring-soon`,
              severity: "notice" as const,
              title: `${medicine.name} akan kedaluwarsa`,
              detail: `${medicine.code} - tanggal ${medicine.expires}, stok ${medicine.stock} ${medicine.unit}`,
            }
          }
        }

        return null
      })
      .filter((alert): alert is NonNullable<typeof alert> => Boolean(alert))
      .sort((first, second) => {
        const priority = { critical: 0, warning: 1, notice: 2 }
        return priority[first.severity] - priority[second.severity]
      })
      .slice(0, 6)
  }, [medicines])

  return (
    <Panel title="Notifikasi stok obat" description="Pantau stok rendah dan obat yang tidak aman diproses dalam resep.">
      {alerts.length === 0 ? (
        <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">Tidak ada notifikasi stok</p>
            <p className="mt-1 text-sm leading-6 text-emerald-800/80 dark:text-emerald-100/75">Semua obat aktif berada di atas batas minimum dan tidak masuk periode kedaluwarsa 30 hari.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-3 rounded-md border p-4",
                alert.severity === "critical"
                  ? "border-red-200 bg-red-50 text-red-950 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-100"
                  : alert.severity === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
                    : "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100",
              )}
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="mt-1 text-sm leading-6 opacity-80">{alert.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

export function DashboardSection({
  role,
  visits,
  medicines,
  dashboardSummary,
}: {
  role: RoleKey
  visits: VisitListItem[]
  medicines: MedicineListItem[]
  dashboardSummary: DashboardSummary
}) {
  const canSeeMedicineAlerts = role === "master" || role === "doctor"

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardSummary.metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {canSeeMedicineAlerts ? <MedicineStockAlertPanel medicines={medicines} /> : null}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <Panel title="Antrean layanan" description="Status pasien berjalan hari ini.">
          <div className="grid gap-3 sm:grid-cols-2">
            {dashboardSummary.queue.map((item) => (
              <div key={item.status} className="rounded-md border border-border bg-card p-4">
                <StatusBadge label={item.status} />
                <p className="mt-4 text-3xl font-semibold tabular-nums">{item.count}</p>
                <p className="mt-1 text-sm text-muted-foreground">pasien</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Alur Layanan" description="Tahapan operasional yang digunakan antar role klinik.">
          <div className="grid gap-3">
            {workflowSteps.map((step) => {
              const Icon = step.icon

              return (
                <div key={step.title} className="flex gap-3 rounded-md border border-border bg-card p-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <Panel title={`Antrian relevan untuk ${roles[role].label}`} description="Data ditampilkan sesuai role dan permission akun.">
        <ResponsiveVisitsTable visits={visits} compact />
      </Panel>
    </div>
  )
}
