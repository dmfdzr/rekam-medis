"use client"

import { type ReportSummaryItem, type ReportDetails } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"
import { scopeReportBundleForRole, canViewReportSection } from "@/lib/reports/scope"

import * as React from "react"
import dynamic from "next/dynamic"
import { Download } from "lucide-react"

import { cn } from "@/lib/utils"
import { TextField, DatePickerField } from "@/components/shared/forms"
import { EmptyState, InlineErrorState, LoadingState } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { DownloadAction } from "@/components/shared/download-action"
import { Button } from "@/components/ui/button"

const DiagnosisMap = dynamic(() => import("@/components/reports/diagnosis-map").then((mod) => mod.DiagnosisMap), {
  ssr: false,
  loading: () => <LoadingState title="Memuat peta" detail="Peta persebaran diagnosis sedang disiapkan." />,
})

export function MetricCard({ label, value, change, detail, tone }: { label: string; value: string; change: string; detail: string; tone: string }) {
  return (
    <div className="flex min-h-36 flex-col rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm text-muted-foreground">{label}</p>
        <span className={cn("max-w-28 shrink-0 truncate rounded-md bg-muted px-2 py-1 text-xs font-medium", tone)} title={change}>{change}</span>
      </div>
      <p className="mt-4 line-clamp-2 min-h-16 text-2xl font-semibold leading-tight tabular-nums" title={value}>{value}</p>
      <p className="mt-auto line-clamp-1 pt-2 text-sm text-muted-foreground" title={detail}>{detail}</p>
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

function ExportReportPanel({
  dateRangeError,
  startDate,
  endDate,
  csvExportHref,
  spreadsheetExportHref,
}: {
  dateRangeError: string
  startDate: string
  endDate: string
  csvExportHref: string
  spreadsheetExportHref: string
}) {
  return (
    <Panel title="Export laporan" description="Filter tanggal wajib untuk menjaga query laporan tetap cepat saat database membesar.">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
        {dateRangeError ? (
          <>
            <Button size="lg" className="w-full sm:w-fit" disabled>
              <Download className="size-4" aria-hidden="true" />
              Export CSV
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-fit" disabled>
              <Download className="size-4" aria-hidden="true" />
              Export Excel
            </Button>
          </>
        ) : (
          <>
            <DownloadAction href={csvExportHref} label="Export CSV" icon={Download} variant="default" className="w-full sm:w-fit" loadingTitle="Menyiapkan export CSV" loadingDetail="Laporan diagnosis sedang disiapkan dalam format CSV." />
            <DownloadAction href={spreadsheetExportHref} label="Export Excel" icon={Download} className="w-full sm:w-fit" loadingTitle="Menyiapkan export Excel" loadingDetail="Workbook Excel modern sedang dibuat dari data laporan." />
          </>
        )}
        <div className="min-w-0 rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm leading-6 text-cyan-950 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-100 xl:flex-1">
          {dateRangeError ? dateRangeError : startDate || endDate ? `Filter aktif: ${startDate || "awal"} sampai ${endDate || "hari ini"}.` : "Gunakan tombol Filter untuk membatasi laporan berdasarkan tanggal."}
        </div>
      </div>
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
  const [diagnosis, setDiagnosis] = React.useState("")
  const [diagnosisType, setDiagnosisType] = React.useState("ALL")
  const [mapLevel, setMapLevel] = React.useState("district")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const exportQuery = new URLSearchParams()
  const diagnosisMapQuery = new URLSearchParams(exportQuery)

  if (startDate) {
    exportQuery.set("startDate", startDate)
  }

  if (endDate) {
    exportQuery.set("endDate", endDate)
  }

  if (startDate) {
    diagnosisMapQuery.set("startDate", startDate)
  }

  if (endDate) {
    diagnosisMapQuery.set("endDate", endDate)
  }

  if (diagnosis) {
    diagnosisMapQuery.set("diagnosis", diagnosis)
  }

  diagnosisMapQuery.set("diagnosisType", diagnosisType)
  diagnosisMapQuery.set("level", mapLevel)

  const exportSuffix = exportQuery.size > 0 ? `?${exportQuery.toString()}` : ""
  const csvExportHref = `/reports/summary.csv${exportSuffix}`
  const spreadsheetExportHref = `/reports/summary.xlsx${exportSuffix}`
  const dateRangeError = startDate && endDate && endDate < startDate ? "Tanggal akhir tidak boleh lebih awal dari tanggal mulai." : ""
  const topDiagnosis = details.diagnosisOptions[0]
  const topRegion = details.diagnosisMap.locations[0]
  const diagnosisFocusedCards = [
    {
      label: "Total kasus diagnosis",
      value: String(details.diagnosisMap.totalCases),
      change: "Kasus",
      detail: startDate || endDate ? `${startDate || "awal"} sampai ${endDate || "hari ini"}` : "Periode default",
      tone: "text-teal-700 dark:text-teal-300",
    },
    {
      label: "Diagnosis terbanyak",
      value: topDiagnosis?.name ?? "-",
      change: topDiagnosis ? `${topDiagnosis.count} kasus` : "-",
      detail: "Diagnosis dominan",
      tone: "text-rose-700 dark:text-rose-300",
    },
    {
      label: "Wilayah terdampak",
      value: String(details.diagnosisMap.totalRegions),
      change: details.diagnosisMap.level === "city" ? "Kota/Kabupaten" : "Kecamatan",
      detail: "Berdasarkan alamat pasien",
      tone: "text-indigo-700 dark:text-indigo-300",
    },
    {
      label: "Wilayah kasus tertinggi",
      value: topRegion?.region ?? "-",
      change: topRegion ? `${topRegion.caseCount} kasus` : "-",
      detail: topRegion && topRegion.region !== "Alamat belum terstruktur" ? `${topRegion.city}, ${topRegion.province}` : "Belum tersedia",
      tone: "text-amber-700 dark:text-amber-300",
    },
  ]

  async function applyReportFilter() {
    if (dateRangeError) {
      setError(dateRangeError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const [response, diagnosisMapResponse] = await Promise.all([
        fetch(`/reports/summary.json${exportQuery.size > 0 ? `?${exportQuery.toString()}` : ""}`),
        fetch(`/reports/diagnosis-map.json?${diagnosisMapQuery.toString()}`),
      ])

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        setError(payload?.message ?? "Laporan gagal dimuat. Periksa akses atau coba ulangi.")
        return
      }

      if (!diagnosisMapResponse.ok) {
        const payload = (await diagnosisMapResponse.json().catch(() => null)) as { message?: string } | null
        setError(payload?.message ?? "Laporan persebaran diagnosis gagal dimuat.")
        return
      }

      const payload = (await response.json()) as { reports: ReportSummaryItem[]; details: ReportDetails }
      const diagnosisMapPayload = (await diagnosisMapResponse.json()) as { report: ReportDetails["diagnosisMap"] }
      const scopedPayload = scopeReportBundleForRole(role, payload)
      const nextDetails = {
        ...scopedPayload.details,
        diagnosisMap: diagnosisMapPayload.report,
      }
      setReports(scopedPayload.reports)
      setDetails(nextDetails)
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
    setDiagnosis("")
    setDiagnosisType("ALL")
    setMapLevel("district")
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
          {diagnosisFocusedCards.map((report) => (
            <MetricCard key={report.label} label={report.label} value={report.value} change={report.change} detail={report.detail} tone={report.tone} />
          ))}
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-2">
        {canViewReportSection(role, "diagnoses") ? (
          <ReportDetailTable
            title="Diagnosa terbanyak"
            description="10 ranking teratas diagnosa dari rekam medis dalam rentang tanggal."
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
      </div>
      {canViewReportSection(role, "diagnoses") ? (
        <Panel
          title="Persebaran diagnosis"
          description="Agregasi diagnosis berdasarkan wilayah pasien. Peta hanya menampilkan wilayah yang sudah memiliki centroid."
        >
          <div className="grid gap-4">
            {details.diagnosisMap.locations.length > 0 && details.diagnosisMap.mappedLocations < details.diagnosisMap.totalRegions ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                {details.diagnosisMap.mappedLocations} dari {details.diagnosisMap.totalRegions} wilayah sudah memiliki titik peta. Wilayah lain akan dipetakan setelah centroid berhasil dilengkapi.
              </div>
            ) : null}
            {details.diagnosisMap.locations.length === 0 ? (
              <EmptyState title="Belum ada persebaran diagnosis" detail="Tidak ada diagnosis sesuai filter aktif atau data pasien belum memiliki wilayah terstruktur." />
            ) : details.diagnosisMap.mappedLocations === 0 ? (
              <InlineErrorState title="Koordinat wilayah belum tersedia" detail="Data laporan sudah tersedia pada tabel, tetapi peta memerlukan centroid kecamatan/kabupaten agar marker dapat ditampilkan." />
            ) : (
              <DiagnosisMap report={details.diagnosisMap} />
            )}
            <ReportDetailTable
              title="Wilayah diagnosis"
              description="Tabel agregat yang sama dengan data peta."
              columns={["Wilayah", "Kasus", "Pasien", "Diagnosis teratas"]}
              rows={details.diagnosisMap.locations.map((location) => [
                location.region === "Alamat belum terstruktur" ? location.region : `${location.region}, ${location.city !== "-" ? location.city : location.province}`,
                String(location.caseCount),
                String(location.patientCount),
                location.topDiagnoses.map((item) => `${item.name} (${item.count})`).join(", ") || "-",
              ])}
              emptyDetail="Belum ada data wilayah sesuai filter aktif."
            />
          </div>
        </Panel>
      ) : null}
      <ExportReportPanel
        dateRangeError={dateRangeError}
        startDate={startDate}
        endDate={endDate}
        csvExportHref={csvExportHref}
        spreadsheetExportHref={spreadsheetExportHref}
      />
      <ModalDialog open={filtersOpen} onOpenChange={onFiltersOpenChange} title="Filter laporan" description="Batasi laporan berdasarkan rentang tanggal agar query tetap ringan.">
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePickerField name="startDate" label="Tanggal mulai" value={startDate} onValueChange={setStartDate} />
          <DatePickerField name="endDate" label="Tanggal akhir" value={endDate} onValueChange={setEndDate} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <TextField name="diagnosis" label="Diagnosis/penyakit" value={diagnosis} onValueChange={setDiagnosis} list="diagnosis-options" placeholder="Semua diagnosis" />
          <datalist id="diagnosis-options">
            {details.diagnosisOptions.map((item) => (
              <option key={item.name} value={item.name}>
                {item.count} kasus
              </option>
            ))}
          </datalist>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Jenis diagnosis</span>
            <select
              value={diagnosisType}
              onChange={(event) => setDiagnosisType(event.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            >
              <option value="ALL">Semua</option>
              <option value="PRIMARY">Utama</option>
              <option value="SECONDARY">Sekunder</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Level wilayah</span>
            <select
              value={mapLevel}
              onChange={(event) => setMapLevel(event.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            >
              <option value="district">Kecamatan</option>
              <option value="city">Kabupaten/Kota</option>
            </select>
          </label>
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
