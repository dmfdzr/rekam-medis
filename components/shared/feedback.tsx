"use client"

import { cn } from "@/lib/utils"

export const statusTone: Record<string, string> = {
  Aktif: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  Nonaktif: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  Ditangguhkan: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200",
  Meninggal: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  Observasi: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  Menunggu: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  "Tanda vital": "bg-cyan-100 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-200",
  Pemeriksaan: "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-200",
  Farmasi: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200",
  Selesai: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  Dibatalkan: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  Draft: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  Final: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  "Validasi stok": "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200",
  Diproses: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  Aman: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  "Stok rendah": "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  Kritis: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200",
  Kedaluwarsa: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200",
  Normal: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
}

export function DestructiveActionNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive" role="note">
      {message}
    </div>
  )
}

export function PermissionNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
      {message}
    </div>
  )
}

export function StatusBadge({ label }: { label: string }) {
  return <span className={cn("inline-flex w-fit rounded-md px-2 py-1 text-xs font-medium", statusTone[label] ?? statusTone.Normal)}>{label}</span>
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card p-8 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

