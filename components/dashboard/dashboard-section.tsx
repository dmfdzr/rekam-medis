"use client"

import { type DashboardSummary, type VisitListItem } from "@/lib/data/clinic"
import { RoleKey, workflowSteps, roles } from "@/lib/medical-data"

import * as React from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/shared/feedback"
import { Panel } from "@/components/shared/layout"
import { MetricCard } from "@/components/reports/reports-section"
import { ResponsiveVisitsTable } from "@/components/visits/visits-table"

export function DashboardSection({
  role,
  visits,
  dashboardSummary,
}: {
  role: RoleKey
  visits: VisitListItem[]
  dashboardSummary: DashboardSummary
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardSummary.metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

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
