"use client"

import { type ReportSummaryItem, type ReportDetails } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"
import { scopeReportBundleForRole, canViewReportSection } from "@/lib/reports/scope"

import * as React from "react"
import { Download } from "lucide-react"

import { cn } from "@/lib/utils"
import { TextField, DatePickerField } from "@/components/shared/forms"
import { EmptyState, InlineErrorState, LoadingState } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { Button } from "@/components/ui/button"

export function MetricCard({ label, value, change, detail, tone }: { label: string; value: string; change: string; detail: string; tone: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("rounded-md bg-muted px-2 py-1 text-xs font-medium", tone)}>{change}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

export function ReportDetailTable({
  title,
  description,
  columns,
  rows,
  emptyDetail,
}: {
  title: string
  description: string
  columns: string[]
  rows: string[][]
  emptyDetail: string
}) {
  const tableMinWidth = columns.length >= 4 ? "min-w-[640px]" : columns.length === 3 ? "min-w-[520px]" : "min-w-[360px]"

  return (
    <Panel title={title} description={description}>
      {rows.length === 0 ? (
        <EmptyState title="Data kosong" detail={emptyDetail} />
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className={cn("w-full text-left text-sm", tableMinWidth)}>
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="py-3 pr-4 font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, index) => (
                  <tr key={`${row.join("-")}-${index}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${cell}-${cellIndex}`} className={cn("py-3 pr-4", cellIndex === 0 ? "font-medium" : "text-muted-foreground")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 lg:hidden">
            {rows.map((row, index) => (
              <div key={`${row.join("-")}-${index}`} className="rounded-md border border-border bg-background p-3 text-sm">
                <p className="font-medium">{row[0]}</p>
                <div className="mt-2 grid gap-1 text-muted-foreground">
                  {row.slice(1).map((cell, cellIndex) => (
                    <p key={`${cell}-${cellIndex}`}>
                      {columns[cellIndex + 1]}: {cell}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  )
}

export function ReportsSection({
  role,
  reportSummary,
  reportDetails,
  filtersOpen,
  onFiltersOpenChange,
}: {
  role: RoleKey
  reportSummary: ReportSummaryItem[]
  reportDetails: ReportDetails
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
}) {
  const scopedInitialReports = React.useMemo(() => scopeReportBundleForRole(role, { reports: reportSummary, details: reportDetails }), [role, reportDetails, reportSummary])
  const [reports, setReports] = React.useState(scopedInitialReports.reports)
  const [details, setDetails] = React.useState(scopedInitialReports.details)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const exportQuery = new URLSearchParams()

  if (startDate) {
    exportQuery.set("startDate", startDate)
  }

  if (endDate) {
    exportQuery.set("endDate", endDate)
  }

  const exportSuffix = exportQuery.size > 0 ? `?${exportQuery.toString()}` : ""
  const csvExportHref = `/reports/summary.csv${exportSuffix}`
  const spreadsheetExportHref = `/reports/summary.xls${exportSuffix}`
  const pdfExportHref = `/reports/summary.pdf${exportSuffix}`
  const dateRangeError = startDate && endDate && endDate < startDate ? "Tanggal akhir tidak boleh lebih awal dari tanggal mulai." : ""

  async function applyReportFilter() {
    if (dateRangeError) {
      setError(dateRangeError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/reports/summary.json${exportQuery.size > 0 ? `?${exportQuery.toString()}` : ""}`)

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        setError(payload?.message ?? "Laporan gagal dimuat. Periksa akses atau coba ulangi.")
        return
      }

      const payload = (await response.json()) as { reports: ReportSummaryItem[]; details: ReportDetails }
      const scopedPayload = scopeReportBundleForRole(role, payload)
      setReports(scopedPayload.reports)
      setDetails(scopedPayload.details)
      onFiltersOpenChange(false)
    } catch {
      setError("Laporan gagal dimuat karena koneksi bermasalah.")
    } finally {
      setIsLoading(false)
    }
  }

  function resetReportFilter() {
    setStartDate("")
    setEndDate("")
    setReports(scopedInitialReports.reports)
    setDetails(scopedInitialReports.details)
    setError("")
  }

  return (
    <div className="grid gap-5">
      {reports.length === 0 ? (
        <EmptyState title="Laporan tidak tersedia" detail="Role aktif tidak memiliki akses ke ringkasan laporan pada halaman ini." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {reports.map((report) => (
            <MetricCard key={report.label} label={report.label} value={report.value} change={report.trend} detail={report.period} tone="text-primary" />
          ))}
        </div>
      )}
      <Panel title="Export laporan" description="Filter tanggal wajib untuk menjaga query laporan tetap cepat saat database membesar.">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
          {dateRangeError ? (
            <>
              <Button size="lg" className="w-full sm:w-fit" disabled>
                <Download className="size-4" aria-hidden="true" />
                Export PDF
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-fit" disabled>
                <Download className="size-4" aria-hidden="true" />
                Export CSV ringkasan
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-fit" disabled>
                <Download className="size-4" aria-hidden="true" />
                Export Excel
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="w-full sm:w-fit">
                <a href={pdfExportHref}>
                  <Download className="size-4" aria-hidden="true" />
                  Export PDF
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-fit">
                <a href={csvExportHref}>
                  <Download className="size-4" aria-hidden="true" />
                  Export CSV ringkasan
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-fit">
                <a href={spreadsheetExportHref}>
                  <Download className="size-4" aria-hidden="true" />
                  Export Excel
                </a>
              </Button>
            </>
          )}
          <div className="min-w-0 rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm leading-6 text-cyan-950 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-100 xl:flex-1">
            {dateRangeError ? dateRangeError : startDate || endDate ? `Filter aktif: ${startDate || "awal"} sampai ${endDate || "hari ini"}.` : "Gunakan tombol Filter untuk membatasi laporan berdasarkan tanggal."}
          </div>
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        {canViewReportSection(role, "diagnoses") ? (
          <ReportDetailTable
            title="Diagnosa terbanyak"
            description="Agregasi diagnosa dari rekam medis dalam rentang tanggal."
            columns={["Diagnosa", "Kasus"]}
            rows={details.diagnoses.map((diagnosis) => [diagnosis.name, String(diagnosis.count)])}
            emptyDetail="Belum ada diagnosa pada rentang laporan ini."
          />
        ) : null}
        {canViewReportSection(role, "treatments") ? (
          <ReportDetailTable
            title="Tindakan medis"
            description="Frekuensi tindakan dan total biaya tercatat."
            columns={["Tindakan", "Jumlah", "Total biaya"]}
            rows={details.treatments.map((treatment) => [treatment.name, String(treatment.count), treatment.totalCost])}
            emptyDetail="Belum ada tindakan pada rentang laporan ini."
          />
        ) : null}
        {canViewReportSection(role, "medicineUsage") ? (
          <ReportDetailTable
            title="Penggunaan obat"
            description="Obat yang sudah diproses oleh farmasi."
            columns={["Kode", "Obat", "Jumlah"]}
            rows={details.medicineUsage.map((medicine) => [medicine.code, medicine.name, `${medicine.quantity} ${medicine.unit}`])}
            emptyDetail="Belum ada penggunaan obat pada rentang laporan ini."
          />
        ) : null}
        {canViewReportSection(role, "stockReport") ? (
          <ReportDetailTable
            title="Stok perlu perhatian"
            description="Obat stok rendah atau kedaluwarsa."
            columns={["Kode", "Obat", "Stok", "Status"]}
            rows={details.stockReport.map((medicine) => [medicine.code, medicine.name, `${medicine.stock}/${medicine.minimumStock} ${medicine.unit}`, medicine.status])}
            emptyDetail="Tidak ada stok rendah atau kedaluwarsa."
          />
        ) : null}
      </div>
      <ModalDialog open={filtersOpen} onOpenChange={onFiltersOpenChange} title="Filter laporan" description="Batasi laporan berdasarkan rentang tanggal agar query tetap ringan.">
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePickerField name="startDate" label="Tanggal mulai" value={startDate} onValueChange={setStartDate} />
          <DatePickerField name="endDate" label="Tanggal akhir" value={endDate} onValueChange={setEndDate} />
        </div>
        {isLoading ? <LoadingState title="Memuat laporan" detail="Filter tanggal sedang diterapkan ke ringkasan dan detail laporan." /> : null}
        {error || dateRangeError ? (
          <InlineErrorState title="Laporan tidak dapat dimuat" detail={error || dateRangeError} />
        ) : null}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" size="lg" onClick={resetReportFilter}>
            Reset
          </Button>
          <Button type="button" size="lg" onClick={applyReportFilter} disabled={isLoading}>
            {isLoading ? "Memuat..." : "Terapkan"}
          </Button>
        </div>
      </ModalDialog>
    </div>
  )
}
