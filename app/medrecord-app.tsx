"use client"

import * as React from "react"
import { Dialog } from "radix-ui"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Filter,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react"

import { logoutAction } from "@/app/actions/auth"
import {
  addPrescriptionItemAction,
  createMedicalDocumentAction,
  createMedicineAction,
  createPatientAction,
  createUserAction,
  createVisitAction,
  processPrescriptionAction,
  saveMedicalRecordAction,
  type ClinicFormState,
  updateMedicineAction,
  updatePatientAction,
  updateUserAction,
  updateVisitStatusAction,
  upsertVitalSignAction,
} from "@/app/actions/clinic"
import { Button } from "@/components/ui/button"
import type {
  ClinicalWorklistItem,
  AuditLogListItem,
  DocumentFormOptions,
  MedicineListItem,
  MedicalDocumentListItem,
  MedicalRecordHistoryItem,
  PatientListItem,
  PrescriptionFormOptions,
  PrescriptionListItem,
  RoleOptionItem,
  ReportSummaryItem,
  UserListItem,
  VisitFormOptions,
  VisitListItem,
} from "@/lib/data/clinic"
import { cn } from "@/lib/utils"
import {
  dashboardMetrics,
  getNavigationForRole,
  queueSummary,
  roles,
  type RoleKey,
  type SectionKey,
  workflowSteps,
} from "@/lib/medical-data"

type AppUser = {
  id: string
  name: string
  email: string
  username: string
  role: string
  roleName: string
}

const initialClinicFormState: ClinicFormState = {}
const defaultPageSize = 8
const filterableSections = new Set<SectionKey>(["patients", "visits", "prescriptions", "medicines", "documents", "reports", "users", "audit"])
const composerSections = new Set<SectionKey>(["patients", "visits", "vitals", "records", "prescriptions", "medicines", "documents", "users"])

function normalizeSearchValue(value: unknown) {
  return String(value ?? "").toLowerCase()
}

function getUniqueOptions<T>(items: T[], selector: (item: T) => string) {
  return Array.from(new Set(items.map(selector).filter(Boolean)))
}

function useListControls<T>({
  items,
  pageSize = defaultPageSize,
  search,
  filter,
}: {
  items: T[]
  pageSize?: number
  search: (item: T) => string[]
  filter?: (item: T, value: string) => boolean
}) {
  const [query, setQuery] = React.useState("")
  const [filterValue, setFilterValue] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const filteredItems = React.useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query).trim()

    return items.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        search(item).some((value) => normalizeSearchValue(value).includes(normalizedQuery))
      const matchesFilter = !filter || filterValue === "all" || filter(item, filterValue)

      return matchesQuery && matchesFilter
    })
  }, [filter, filterValue, items, query, search])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize)

  const updateQuery = React.useCallback((value: string) => {
    setQuery(value)
    setPage(1)
  }, [])

  const updateFilterValue = React.useCallback((value: string) => {
    setFilterValue(value)
    setPage(1)
  }, [])

  return {
    query,
    setQuery: updateQuery,
    filterValue,
    setFilterValue: updateFilterValue,
    page: safePage,
    setPage,
    filteredItems,
    paginatedItems,
    totalPages,
  }
}

function mapUserRoleToAppRole(role: string): RoleKey {
  const roleMap: Record<string, RoleKey> = {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    REGISTRATION: "registration",
    DOCTOR: "doctor",
    NURSE: "nurse",
    PHARMACIST: "pharmacist",
  }

  return roleMap[role] ?? "admin"
}

const sectionMeta: Record<SectionKey, { title: string; description: string; action?: string }> = {
  dashboard: {
    title: "Dashboard Operasional",
    description: "Pantau antrean, status pemeriksaan, resep, dan risiko stok dari satu layar.",
  },
  patients: {
    title: "Data Pasien",
    description: "Kelola identitas pasien, alergi, kontak, dan riwayat kunjungan.",
    action: "Tambah pasien",
  },
  visits: {
    title: "Kunjungan",
    description: "Buat kunjungan baru, cek status layanan, dan arahkan pasien ke role berikutnya.",
    action: "Buat kunjungan",
  },
  vitals: {
    title: "Tanda Vital",
    description: "Input pemeriksaan awal dengan struktur cepat dan mudah dicek ulang.",
    action: "Simpan tanda vital",
  },
  records: {
    title: "Rekam Medis",
    description: "Catat SOAP, pemeriksaan fisik, diagnosa, tindakan, resep, dan finalisasi.",
    action: "Finalisasi rekam medis",
  },
  prescriptions: {
    title: "Resep",
    description: "Kelola resep dari dokter, validasi stok, dan proses obat ke pasien.",
    action: "Proses resep",
  },
  medicines: {
    title: "Obat",
    description: "Pantau stok, batas minimum, kategori, dan obat yang mendekati kedaluwarsa.",
    action: "Tambah obat",
  },
  documents: {
    title: "Dokumen Medis",
    description: "Kelola dokumen pendukung pasien dengan akses terbatas sesuai role.",
    action: "Upload dokumen",
  },
  reports: {
    title: "Laporan",
    description: "Ringkasan kunjungan, pasien baru, diagnosa, tindakan, dan penggunaan obat.",
    action: "Export laporan",
  },
  users: {
    title: "Manajemen User",
    description: "Kelola akun, role, status user, dan akses modul aplikasi.",
    action: "Tambah user",
  },
  audit: {
    title: "Audit Log",
    description: "Lacak aktivitas penting untuk keamanan dan akuntabilitas data medis.",
  },
}

const statusTone: Record<string, string> = {
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
  "Hasil lab": "bg-cyan-100 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-200",
  "Surat rujukan": "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200",
  "Surat kontrol": "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200",
  "Foto pemeriksaan": "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-200",
  "Dokumen pendukung": "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  Lainnya: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  Sensitif: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200",
  Normal: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
}

export function MedRecordApp({
  user,
  patients,
  visits,
  visitOptions,
  clinicalWorklist,
  medicalRecordHistory,
  prescriptions,
  medicines,
  prescriptionOptions,
  documents,
  documentOptions,
  reportSummary,
  auditLogs,
  userList,
  roleOptions,
}: {
  user: AppUser
  patients: PatientListItem[]
  visits: VisitListItem[]
  visitOptions: VisitFormOptions
  clinicalWorklist: ClinicalWorklistItem[]
  medicalRecordHistory: MedicalRecordHistoryItem[]
  prescriptions: PrescriptionListItem[]
  medicines: MedicineListItem[]
  prescriptionOptions: PrescriptionFormOptions
  documents: MedicalDocumentListItem[]
  documentOptions: DocumentFormOptions
  reportSummary: ReportSummaryItem[]
  auditLogs: AuditLogListItem[]
  userList: UserListItem[]
  roleOptions: RoleOptionItem[]
}) {
  const activeRole = mapUserRoleToAppRole(user.role)
  const [activeSection, setActiveSection] = React.useState<SectionKey>("dashboard")
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [composerOpen, setComposerOpen] = React.useState(false)
  const navigation = getNavigationForRole(activeRole)
  const currentRole = roles[activeRole]
  const meta = sectionMeta[activeSection]
  const canShowFilterButton = filterableSections.has(activeSection)
  const canShowComposerButton = Boolean(meta.action) && composerSections.has(activeSection)

  function navigate(section: SectionKey) {
    setActiveSection(section)
    setMobileOpen(false)
    setFiltersOpen(false)
    setComposerOpen(false)
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_28rem),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--muted),var(--background)_60%))] text-foreground">
      <div className="flex min-h-dvh">
        <aside
          className={cn(
            "hidden shrink-0 border-r border-border/80 bg-sidebar/90 p-4 text-sidebar-foreground backdrop-blur transition-[width] duration-200 lg:block",
            sidebarCollapsed ? "w-20" : "w-72",
          )}
        >
          <SidebarContent
            activeSection={activeSection}
            collapsed={sidebarCollapsed}
            navigation={navigation}
            onNavigate={navigate}
          />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Tutup menu"
              className="absolute inset-0 bg-slate-950/50"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative h-full w-[min(22rem,88vw)] border-r border-border bg-sidebar p-4 shadow-2xl">
              <SidebarContent
                activeSection={activeSection}
                collapsed={false}
                navigation={navigation}
                onNavigate={navigate}
                onClose={() => setMobileOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-border/80 bg-background/88 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="lg:hidden"
                aria-label="Buka menu"
                onClick={() => setMobileOpen(true)}
              >
                {sidebarCollapsed ? <Menu /> : <X />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="hidden lg:inline-flex"
                aria-label={sidebarCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
                onClick={() => setSidebarCollapsed((current) => !current)}
              >
                <Menu />
              </Button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>MedRecord App</span>
                  <ChevronRight className="size-3" aria-hidden="true" />
                  <span>{currentRole.label}</span>
                </div>
                <h1 className="mt-1 truncate text-xl font-semibold tracking-normal md:text-2xl">{meta.title}</h1>
              </div>

              <div className="hidden min-w-0 items-center gap-3 rounded-md border border-border bg-card px-3 py-2 md:flex">
                <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 text-right">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.roleName}</p>
                </div>
                <form action={logoutAction}>
                  <Button type="submit" variant="outline" size="sm">
                    <LogOut className="size-3" aria-hidden="true" />
                    Logout
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 md:px-6 lg:px-8">
            <PageHeader
              meta={meta}
              filtersOpen={filtersOpen}
              canShowFilterButton={canShowFilterButton}
              canShowComposerButton={canShowComposerButton}
              onOpenFilters={() => setFiltersOpen(true)}
              onOpenComposer={() => setComposerOpen(true)}
            />
            <SectionRenderer
              section={activeSection}
              role={activeRole}
              filtersOpen={filtersOpen}
              composerOpen={composerOpen}
              onFiltersOpenChange={setFiltersOpen}
              onComposerOpenChange={setComposerOpen}
              patients={patients}
              visits={visits}
              visitOptions={visitOptions}
              clinicalWorklist={clinicalWorklist}
              medicalRecordHistory={medicalRecordHistory}
              prescriptions={prescriptions}
              medicines={medicines}
              prescriptionOptions={prescriptionOptions}
              documents={documents}
            documentOptions={documentOptions}
            reportSummary={reportSummary}
            auditLogs={auditLogs}
            userList={userList}
            roleOptions={roleOptions}
          />
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({
  activeSection,
  collapsed,
  navigation,
  onNavigate,
  onClose,
}: {
  activeSection: SectionKey
  collapsed: boolean
  navigation: ReturnType<typeof getNavigationForRole>
  onNavigate: (section: SectionKey) => void
  onClose?: () => void
}) {
  return (
    <div className={cn("flex h-full flex-col", collapsed ? "items-center gap-4" : "gap-5")}>
      <div className={cn("flex w-full items-start justify-between gap-3", collapsed ? "justify-center" : "")}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div className={cn("min-w-0", collapsed ? "sr-only" : "")}>
            <p className="truncate text-sm font-semibold">MedRecord</p>
            <p className="truncate text-xs text-muted-foreground">Standalone EHR</p>
          </div>
        </div>
        {onClose ? (
          <Button type="button" variant="ghost" size="icon" aria-label="Tutup menu" onClick={onClose}>
            <X />
          </Button>
        ) : null}
      </div>

      <nav aria-label="Navigasi utama" className={cn("grid w-full gap-1", collapsed ? "justify-items-center" : "")}>
        {navigation.map((item) => {
          const Icon = item.icon
          const selected = activeSection === item.id

          return (
            <button
              key={item.id}
              type="button"
              title={collapsed ? item.label : undefined}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex min-h-11 items-center rounded-md text-left text-sm transition",
                collapsed ? "w-11 justify-center px-0" : "w-full gap-3 px-3 py-2",
                selected
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className={cn("truncate", collapsed ? "sr-only" : "")}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto" />
    </div>
  )
}

function PageHeader({
  meta,
  filtersOpen,
  canShowFilterButton,
  canShowComposerButton,
  onOpenFilters,
  onOpenComposer,
}: {
  meta: { title: string; description: string; action?: string }
  filtersOpen: boolean
  canShowFilterButton: boolean
  canShowComposerButton: boolean
  onOpenFilters: () => void
  onOpenComposer: () => void
}) {
  return (
    <section className="mb-5 flex flex-col gap-3 border-b border-border/70 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm leading-6 text-muted-foreground">{meta.description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {canShowFilterButton ? (
          <Button type="button" variant={filtersOpen ? "secondary" : "outline"} size="lg" onClick={onOpenFilters}>
            <Filter className="size-4" aria-hidden="true" />
            Filter
          </Button>
        ) : null}
        {canShowComposerButton && meta.action ? (
          <Button type="button" size="lg" onClick={onOpenComposer}>
            {meta.action.includes("Export") ? <Download className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            {meta.action}
          </Button>
        ) : null}
      </div>
    </section>
  )
}

function SectionRenderer({
  section,
  role,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
  patients,
  visits,
  visitOptions,
  clinicalWorklist,
  medicalRecordHistory,
  prescriptions,
  medicines,
  prescriptionOptions,
  documents,
  documentOptions,
  reportSummary,
  auditLogs,
  userList,
  roleOptions,
}: {
  section: SectionKey
  role: RoleKey
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
  patients: PatientListItem[]
  visits: VisitListItem[]
  visitOptions: VisitFormOptions
  clinicalWorklist: ClinicalWorklistItem[]
  medicalRecordHistory: MedicalRecordHistoryItem[]
  prescriptions: PrescriptionListItem[]
  medicines: MedicineListItem[]
  prescriptionOptions: PrescriptionFormOptions
  documents: MedicalDocumentListItem[]
  documentOptions: DocumentFormOptions
  reportSummary: ReportSummaryItem[]
  auditLogs: AuditLogListItem[]
  userList: UserListItem[]
  roleOptions: RoleOptionItem[]
}) {
  switch (section) {
    case "dashboard":
      return <DashboardSection role={role} visits={visits} />
    case "patients":
      return <PatientsSection patients={patients} role={role} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "visits":
      return <VisitsSection visits={visits} visitOptions={visitOptions} role={role} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "vitals":
      return <VitalsSection role={role} clinicalWorklist={clinicalWorklist} composerOpen={composerOpen} onComposerOpenChange={onComposerOpenChange} />
    case "records":
      return <MedicalRecordsSection role={role} clinicalWorklist={clinicalWorklist} medicalRecordHistory={medicalRecordHistory} composerOpen={composerOpen} onComposerOpenChange={onComposerOpenChange} />
    case "prescriptions":
      return <PrescriptionsSection role={role} prescriptions={prescriptions} prescriptionOptions={prescriptionOptions} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "medicines":
      return <MedicinesSection role={role} medicines={medicines} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "documents":
      return <DocumentsSection role={role} documents={documents} documentOptions={documentOptions} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "reports":
      return <ReportsSection reportSummary={reportSummary} filtersOpen={filtersOpen} onFiltersOpenChange={onFiltersOpenChange} />
    case "users":
      return <UsersSection role={role} userList={userList} roleOptions={roleOptions} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "audit":
      return <AuditSection auditLogs={auditLogs} filtersOpen={filtersOpen} onFiltersOpenChange={onFiltersOpenChange} />
  }
}

function DashboardSection({ role, visits }: { role: RoleKey; visits: VisitListItem[] }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <Panel title="Antrean layanan" description="Status pasien berjalan hari ini.">
          <div className="grid gap-3 sm:grid-cols-2">
            {queueSummary.map((item) => (
              <div key={item.status} className="rounded-md border border-border bg-card p-4">
                <span className={cn("inline-flex rounded-md px-2 py-1 text-xs font-medium", item.className)}>{item.status}</span>
                <p className="mt-4 text-3xl font-semibold tabular-nums">{item.count}</p>
                <p className="mt-1 text-sm text-muted-foreground">pasien</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Alur MVP" description="Tahapan operasional yang sudah direpresentasikan di UI.">
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

      <Panel title={`Antrian relevan untuk ${roles[role].label}`} description="Data ini nanti difilter dari DAL berdasarkan role dan permission.">
        <ResponsiveVisitsTable visits={visits} compact />
      </Panel>
    </div>
  )
}

function PatientsSection({
  patients,
  role,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  patients: PatientListItem[]
  role: RoleKey
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "admin" || role === "registration"
  const patientStatuses = React.useMemo(() => getUniqueOptions(patients, (patient) => patient.status), [patients])
  const searchSelector = React.useCallback(
    (patient: PatientListItem) => [patient.medicalRecordNumber, patient.name, patient.nik, patient.phone, patient.allergy, patient.status],
    [],
  )
  const filterSelector = React.useCallback((patient: PatientListItem, value: string) => patient.status === value, [])
  const controls = useListControls({
    items: patients,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="Daftar pasien" description="Pencarian cepat berdasarkan nama, NIK tersamarkan, atau nomor rekam medis.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari nama, NIK, nomor RM, telepon, alergi"
          resultCount={controls.filteredItems.length}
          totalCount={patients.length}
        />
        {controls.paginatedItems.length === 0 ? (
          <EmptyState title="Pasien tidak ditemukan" detail="Ubah kata kunci atau filter status untuk melihat data pasien lain." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">No. RM</th>
                    <th className="py-3 pr-4 font-medium">Pasien</th>
                    <th className="py-3 pr-4 font-medium">Kontak</th>
                    <th className="py-3 pr-4 font-medium">Alergi</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Kunjungan terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {controls.paginatedItems.map((patient) => (
                    <tr key={patient.id} className="align-top">
                      <td className="py-4 pr-4 font-medium tabular-nums">{patient.medicalRecordNumber}</td>
                      <td className="py-4 pr-4">
                        <p className="font-medium">{patient.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {patient.gender}, {patient.age} - {patient.nik}
                        </p>
                      </td>
                      <td className="py-4 pr-4 tabular-nums">{patient.phone}</td>
                      <td className="py-4 pr-4">{patient.allergy}</td>
                      <td className="py-4 pr-4">
                        <StatusBadge label={patient.status} />
                      </td>
                      <td className="py-4">{patient.lastVisit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
          </>
        )}
      </Panel>
      <FilterModal
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Filter pasien"
        description="Batasi daftar pasien berdasarkan status akun pasien."
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={patientStatuses}
      />
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola pasien" description="Tambah pasien baru atau ubah data dasar pasien yang sudah terdaftar.">
        <div className="grid gap-5">
          <Panel title="Tambah pasien" description="Field prioritas untuk mengurangi waktu input pendaftaran.">
            {canCreate ? <CreatePatientForm /> : <PermissionNotice message="Role ini hanya dapat melihat data pasien. Pembuatan pasien dibatasi untuk admin dan petugas pendaftaran." />}
          </Panel>
          <Panel title="Update data dasar" description="Perbarui data kontak, alergi, status, dan informasi dasar pasien.">
            {canCreate ? <UpdatePatientForm patients={patients} /> : <PermissionNotice message="Perubahan data pasien dibatasi untuk admin dan petugas pendaftaran." />}
          </Panel>
        </div>
      </ModalDialog>
    </div>
  )
}

function VisitsSection({
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
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola kunjungan" description="Buat kunjungan baru atau ubah status kunjungan sesuai alur operasional.">
        <div className="grid gap-5">
          <Panel title="Buat kunjungan" description="Payload kunjungan dibuat ramping: pasien, layanan, dokter, keluhan, dan status awal.">
            {canCreate ? <CreateVisitForm visitOptions={visitOptions} /> : <PermissionNotice message="Role ini hanya dapat melihat kunjungan. Pembuatan kunjungan dibatasi untuk admin dan petugas pendaftaran." />}
          </Panel>
          <Panel title="Update status kunjungan" description="Gunakan untuk membatalkan, menyelesaikan, atau mengoreksi status handoff layanan.">
            {canCreate ? <UpdateVisitStatusForm visits={visits} /> : <PermissionNotice message="Perubahan status kunjungan dibatasi untuk admin dan petugas pendaftaran." />}
          </Panel>
        </div>
      </ModalDialog>
    </div>
  )
}

function CreatePatientForm() {
  const [state, formAction, pending] = React.useActionState(createPatientAction, initialClinicFormState)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <TextField name="fullName" label="Nama lengkap" error={state.errors?.fullName?.[0]} autoComplete="name" />
        <TextField name="nik" label="NIK" error={state.errors?.nik?.[0]} inputMode="numeric" />
        <TextField name="birthDate" label="Tanggal lahir" type="date" error={state.errors?.birthDate?.[0]} />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Jenis kelamin</span>
          <select
            name="gender"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.gender)}
          >
            <option value="">Pilih jenis kelamin</option>
            <option value="FEMALE">Perempuan</option>
            <option value="MALE">Laki-laki</option>
            <option value="OTHER">Lainnya</option>
          </select>
          <FieldError message={state.errors?.gender?.[0]} />
        </label>
        <TextField name="phone" label="Nomor telepon" error={state.errors?.phone?.[0]} inputMode="tel" autoComplete="tel" />
        <TextField name="bloodType" label="Golongan darah" error={state.errors?.bloodType?.[0]} />
        <TextAreaField name="address" label="Alamat" error={state.errors?.address?.[0]} />
        <TextAreaField name="allergies" label="Alergi" error={state.errors?.allergies?.[0]} placeholder="Contoh: Amoxicillin" />
        <TextField name="emergencyContact" label="Kontak darurat" error={state.errors?.emergencyContact?.[0]} />
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan pasien"}
      </Button>
    </form>
  )
}

function UpdatePatientForm({ patients }: { patients: PatientListItem[] }) {
  const [state, formAction, pending] = React.useActionState(updatePatientAction, initialClinicFormState)

  if (patients.length === 0) {
    return <EmptyState title="Belum ada pasien" detail="Tambahkan pasien terlebih dahulu sebelum mengubah data dasar." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Pasien</span>
          <select
            name="patientId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.patientId)}
          >
            <option value="">Pilih pasien</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.medicalRecordNumber} - {patient.name}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.patientId?.[0]} />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField name="fullName" label="Nama lengkap" error={state.errors?.fullName?.[0]} />
          <TextField name="phone" label="Nomor telepon" error={state.errors?.phone?.[0]} inputMode="tel" />
          <TextField name="bloodType" label="Golongan darah" error={state.errors?.bloodType?.[0]} />
          <TextField name="emergencyContact" label="Kontak darurat" error={state.errors?.emergencyContact?.[0]} />
        </div>
        <TextAreaField name="address" label="Alamat" error={state.errors?.address?.[0]} />
        <TextAreaField name="allergies" label="Alergi" error={state.errors?.allergies?.[0]} />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Status pasien</span>
          <select
            name="status"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.status)}
          >
            <option value="">Tidak diubah</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
            <option value="DECEASED">Meninggal</option>
          </select>
          <FieldError message={state.errors?.status?.[0]} />
        </label>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Memperbarui..." : "Update pasien"}
      </Button>
    </form>
  )
}

function CreateVisitForm({ visitOptions }: { visitOptions: VisitFormOptions }) {
  const [state, formAction, pending] = React.useActionState(createVisitAction, initialClinicFormState)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Pasien</span>
          <select
            name="patientId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.patientId)}
          >
            <option value="">Pilih pasien</option>
            {visitOptions.patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.label}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.patientId?.[0]} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Dokter</span>
          <select
            name="doctorId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.doctorId)}
          >
            <option value="">Belum ditentukan</option>
            {visitOptions.doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.doctorId?.[0]} />
        </label>
        <TextField name="service" label="Layanan / poli" error={state.errors?.service?.[0]} placeholder="Contoh: Poli Umum" />
        <TextAreaField name="chiefComplaint" label="Keluhan utama" error={state.errors?.chiefComplaint?.[0]} />
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Membuat kunjungan..." : "Buat kunjungan"}
      </Button>
    </form>
  )
}

function UpdateVisitStatusForm({ visits }: { visits: VisitListItem[] }) {
  const [state, formAction, pending] = React.useActionState(updateVisitStatusAction, initialClinicFormState)

  if (visits.length === 0) {
    return <EmptyState title="Belum ada kunjungan" detail="Status kunjungan dapat diubah setelah ada kunjungan pasien." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Kunjungan</span>
          <select
            name="visitId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.visitId)}
          >
            <option value="">Pilih kunjungan</option>
            {visits.map((visit) => (
              <option key={visit.id} value={visit.id}>
                {visit.medicalRecordNumber} - {visit.patient} - {visit.service} - {visit.status}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.visitId?.[0]} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Status baru</span>
          <select
            name="status"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.status)}
          >
            <option value="">Pilih status</option>
            <option value="WAITING">Menunggu</option>
            <option value="VITAL_SIGN">Tanda vital</option>
            <option value="EXAMINATION">Pemeriksaan</option>
            <option value="PHARMACY">Farmasi</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
          <FieldError message={state.errors?.status?.[0]} />
        </label>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Memperbarui..." : "Update status"}
      </Button>
    </form>
  )
}

function VitalsSection({
  role,
  clinicalWorklist,
  composerOpen,
  onComposerOpenChange,
}: {
  role: RoleKey
  clinicalWorklist: ClinicalWorklistItem[]
  composerOpen: boolean
  onComposerOpenChange: (open: boolean) => void
}) {
  const activeVisit = clinicalWorklist[0]
  const canInput = role === "admin" || role === "nurse"

  return (
    <div className="grid gap-5">
      <Panel title="Pasien aktif" description="Ringkasan pasien sebelum input tanda vital.">
        {activeVisit ? (
          <>
            <VisitSummaryCard visit={activeVisit} />
            <VitalSignGrid visit={activeVisit} />
          </>
        ) : (
          <EmptyState title="Tidak ada kunjungan aktif" detail="Kunjungan dengan status menunggu, tanda vital, atau pemeriksaan akan muncul di sini." />
        )}
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Input tanda vital" description="Form dibuat satu kolom di mobile dan dua kolom di desktop untuk entry cepat.">
        {canInput ? <VitalSignForm clinicalWorklist={clinicalWorklist} /> : <PermissionNotice message="Role ini hanya dapat melihat tanda vital. Input tanda vital dibatasi untuk admin dan perawat." />}
      </ModalDialog>
    </div>
  )
}

function MedicalRecordsSection({
  role,
  clinicalWorklist,
  medicalRecordHistory,
  composerOpen,
  onComposerOpenChange,
}: {
  role: RoleKey
  clinicalWorklist: ClinicalWorklistItem[]
  medicalRecordHistory: MedicalRecordHistoryItem[]
  composerOpen: boolean
  onComposerOpenChange: (open: boolean) => void
}) {
  const canInput = role === "admin" || role === "doctor"

  return (
    <div className="grid gap-5">
      <Panel title="Riwayat rekam medis pasien" description="Timeline membantu dokter membaca konteks tanpa membuka banyak halaman.">
        <MedicalRecordTimeline medicalRecordHistory={medicalRecordHistory} />
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Pemeriksaan dokter" description="Struktur SOAP menjaga catatan tetap konsisten dan mudah diaudit.">
        {canInput ? <MedicalRecordForm clinicalWorklist={clinicalWorklist} /> : <PermissionNotice message="Role ini tidak memiliki akses untuk mengisi rekam medis dokter." />}
      </ModalDialog>
    </div>
  )
}

function VisitSummaryCard({ visit }: { visit: ClinicalWorklistItem }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{visit.patientName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {visit.medicalRecordNumber} - {visit.service} - {visit.time}
          </p>
        </div>
        <StatusBadge label={visit.status} />
      </div>
      <p className="mt-4 text-sm leading-6">{visit.chiefComplaint}</p>
      <p className="mt-2 text-xs text-muted-foreground">Alergi: {visit.allergies}</p>
    </div>
  )
}

function VitalSignGrid({ visit }: { visit: ClinicalWorklistItem }) {
  const items = [
    { label: "Tekanan darah", value: visit.vitalSign?.bloodPressure || "-", unit: "mmHg" },
    { label: "Suhu", value: visit.vitalSign?.temperature || "-", unit: "C" },
    { label: "Nadi", value: visit.vitalSign?.pulse || "-", unit: "x/menit" },
    { label: "Respirasi", value: visit.vitalSign?.respiration || "-", unit: "x/menit" },
    { label: "SpO2", value: visit.vitalSign?.oxygenSaturation || "-", unit: "%" },
    { label: "Berat", value: visit.vitalSign?.weight || "-", unit: "kg" },
  ]

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {item.value} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

function VitalSignForm({ clinicalWorklist }: { clinicalWorklist: ClinicalWorklistItem[] }) {
  const [state, formAction, pending] = React.useActionState(upsertVitalSignAction, initialClinicFormState)
  const [selectedVisitId, setSelectedVisitId] = React.useState(clinicalWorklist[0]?.id ?? "")
  const selectedVisit = clinicalWorklist.find((visit) => visit.id === selectedVisitId)

  if (clinicalWorklist.length === 0) {
    return <EmptyState title="Belum ada kunjungan untuk tanda vital" detail="Buat kunjungan terlebih dahulu agar perawat dapat mengisi pemeriksaan awal." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Kunjungan</span>
        <select
          name="visitId"
          value={selectedVisitId}
          onChange={(event) => setSelectedVisitId(event.target.value)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
        >
          {clinicalWorklist.map((visit) => (
            <option key={visit.id} value={visit.id}>
              {visit.medicalRecordNumber} - {visit.patientName} - {visit.service}
            </option>
          ))}
        </select>
      </label>

      <div key={selectedVisitId} className="grid gap-3 md:grid-cols-2">
        <TextField name="bloodPressure" label="Tekanan darah" defaultValue={selectedVisit?.vitalSign?.bloodPressure} placeholder="120/80" />
        <TextField name="temperature" label="Suhu tubuh" defaultValue={selectedVisit?.vitalSign?.temperature} inputMode="decimal" placeholder="37.0" />
        <TextField name="weight" label="Berat badan" defaultValue={selectedVisit?.vitalSign?.weight} inputMode="decimal" placeholder="58.5" />
        <TextField name="height" label="Tinggi badan" defaultValue={selectedVisit?.vitalSign?.height} inputMode="decimal" placeholder="160" />
        <TextField name="pulse" label="Nadi" defaultValue={selectedVisit?.vitalSign?.pulse} inputMode="numeric" />
        <TextField name="respiration" label="Respirasi" defaultValue={selectedVisit?.vitalSign?.respiration} inputMode="numeric" />
        <TextField name="oxygenSaturation" label="Saturasi oksigen" defaultValue={selectedVisit?.vitalSign?.oxygenSaturation} inputMode="numeric" />
        <div className="md:col-span-2">
          <TextAreaField name="nurseNote" label="Catatan perawat" defaultValue={selectedVisit?.vitalSign?.nurseNote} />
        </div>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan tanda vital"}
      </Button>
    </form>
  )
}

function MedicalRecordForm({ clinicalWorklist }: { clinicalWorklist: ClinicalWorklistItem[] }) {
  const [state, formAction, pending] = React.useActionState(saveMedicalRecordAction, initialClinicFormState)
  const [selectedVisitId, setSelectedVisitId] = React.useState(clinicalWorklist[0]?.id ?? "")
  const selectedVisit = clinicalWorklist.find((visit) => visit.id === selectedVisitId)
  const primaryDiagnosis = selectedVisit?.medicalRecord?.diagnoses.find((diagnosis) => diagnosis.type === "PRIMARY")
  const latestTreatment = selectedVisit?.medicalRecord?.treatments.at(-1)

  if (clinicalWorklist.length === 0) {
    return <EmptyState title="Belum ada pasien untuk pemeriksaan" detail="Kunjungan aktif akan muncul setelah pasien didaftarkan dan tanda vital diisi." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Kunjungan</span>
        <select
          name="visitId"
          value={selectedVisitId}
          onChange={(event) => setSelectedVisitId(event.target.value)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
        >
          {clinicalWorklist.map((visit) => (
            <option key={visit.id} value={visit.id}>
              {visit.medicalRecordNumber} - {visit.patientName} - {visit.status}
            </option>
          ))}
        </select>
      </label>

      <div key={selectedVisitId} className="grid gap-3">
        <TextAreaField name="subjective" label="Subjective" defaultValue={selectedVisit?.medicalRecord?.subjective} />
        <TextAreaField name="objective" label="Objective" defaultValue={selectedVisit?.medicalRecord?.objective} />
        <TextAreaField name="assessment" label="Assessment" defaultValue={selectedVisit?.medicalRecord?.assessment} />
        <TextAreaField name="plan" label="Plan" defaultValue={selectedVisit?.medicalRecord?.plan} />
        <TextAreaField name="physicalExam" label="Pemeriksaan fisik" defaultValue={selectedVisit?.medicalRecord?.physicalExam} />
        <TextAreaField name="doctorNote" label="Catatan dokter" defaultValue={selectedVisit?.medicalRecord?.doctorNote} />
        <TextField name="followUpDate" label="Rencana kontrol" type="date" defaultValue={selectedVisit?.medicalRecord?.followUpDate} />

        <div className="grid gap-3 rounded-md border border-border bg-card p-3 md:grid-cols-2">
          <TextField name="diagnosisCode" label="Kode diagnosa" defaultValue={primaryDiagnosis?.code} placeholder="J06.9" />
          <TextField name="diagnosisName" label="Diagnosa utama" defaultValue={primaryDiagnosis?.name} />
          <div className="md:col-span-2">
            <TextAreaField name="diagnosisNote" label="Catatan diagnosa" defaultValue={primaryDiagnosis?.note} />
          </div>
        </div>

        <div className="grid gap-3 rounded-md border border-border bg-card p-3 md:grid-cols-2">
          <TextField name="treatmentCode" label="Kode tindakan" defaultValue={latestTreatment?.code} placeholder="CONS-GP" />
          <TextField name="treatmentName" label="Tindakan medis" defaultValue={latestTreatment?.name} />
          <TextField name="treatmentCost" label="Biaya tindakan" defaultValue={latestTreatment?.cost} inputMode="decimal" />
          <TextField name="treatmentNote" label="Catatan tindakan" defaultValue={latestTreatment?.note} />
        </div>
      </div>
      <FormMessage state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" name="intent" value="draft" variant="outline" size="lg" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan draft"}
        </Button>
        <Button type="submit" name="intent" value="final" size="lg" disabled={pending}>
          Finalisasi rekam medis
        </Button>
      </div>
    </form>
  )
}

function MedicalRecordTimeline({ medicalRecordHistory }: { medicalRecordHistory: MedicalRecordHistoryItem[] }) {
  const searchSelector = React.useCallback(
    (record: MedicalRecordHistoryItem) => [
      record.patient,
      record.medicalRecordNumber,
      record.service,
      record.doctor,
      record.status,
      record.chiefComplaint,
      record.diagnosis,
      record.treatments,
      record.prescriptions,
      record.documents,
    ],
    [],
  )
  const controls = useListControls({
    items: medicalRecordHistory,
    pageSize: 6,
    search: searchSelector,
  })

  if (medicalRecordHistory.length === 0) {
    return <EmptyState title="Belum ada rekam medis" detail="Draft dan finalisasi rekam medis dari dokter akan tampil sebagai timeline di sini." />
  }

  return (
    <div className="grid gap-4">
      <ListToolbar
        query={controls.query}
        onQueryChange={controls.setQuery}
        searchPlaceholder="Cari pasien, nomor RM, dokter, diagnosa, tindakan, resep"
        resultCount={controls.filteredItems.length}
        totalCount={medicalRecordHistory.length}
      />
      {controls.paginatedItems.length === 0 ? (
        <EmptyState title="Riwayat tidak ditemukan" detail="Ubah kata kunci pencarian untuk melihat riwayat rekam medis lain." />
      ) : (
        <div className="relative grid gap-4">
          {controls.paginatedItems.map((record, index) => (
            <div key={record.id} className="grid grid-cols-[1.5rem_1fr] gap-3">
              <div className="relative flex justify-center">
                <span className="mt-1 grid size-5 place-items-center rounded-full border border-primary/40 bg-background text-primary">
                  {record.status === "Final" ? <CheckCircle2 className="size-3" aria-hidden="true" /> : <Clock3 className="size-3" aria-hidden="true" />}
                </span>
                {index < controls.paginatedItems.length - 1 ? <span className="absolute top-7 h-[calc(100%+0.5rem)] w-px bg-border" /> : null}
              </div>
              <article className="rounded-md border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{record.patient}</p>
                  <StatusBadge label={record.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {record.medicalRecordNumber} - {record.patientMeta} - {record.visitDate} - {record.service}
                </p>
                <div className="mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Keluhan</p>
                    <p>{record.chiefComplaint}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Dokter</p>
                    <p>{record.doctor}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Assessment / diagnosa</p>
                    <p>{record.assessment}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Tanda vital</p>
                    <p>{record.vitalSign}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Tindakan</p>
                    <p>{record.treatments}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Resep</p>
                    <p>{record.prescriptions}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-md bg-muted p-3 text-sm leading-6 text-muted-foreground">
                  <p>Plan: {record.plan}</p>
                  <p className="mt-1">Dokumen: {record.documents}</p>
                  <p className="mt-1">Alergi: {record.allergies}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
      <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
    </div>
  )
}

function PrescriptionsSection({
  role,
  prescriptions,
  prescriptionOptions,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  role: RoleKey
  prescriptions: PrescriptionListItem[]
  prescriptionOptions: PrescriptionFormOptions
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "admin" || role === "doctor"
  const canProcess = role === "admin" || role === "pharmacist"
  const prescriptionStatuses = React.useMemo(() => getUniqueOptions(prescriptions, (prescription) => prescription.status), [prescriptions])
  const searchSelector = React.useCallback(
    (prescription: PrescriptionListItem) => [
      prescription.medicalRecordNumber,
      prescription.patient,
      prescription.items,
      prescription.doctor,
      prescription.pharmacist,
      prescription.stock,
      prescription.status,
    ],
    [],
  )
  const filterSelector = React.useCallback((prescription: PrescriptionListItem, value: string) => prescription.status === value, [])
  const controls = useListControls({
    items: prescriptions,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="Daftar resep" description="Apoteker melihat status proses dan sinyal stok sebelum menyerahkan obat.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari pasien, RM, dokter, obat, status stok"
          resultCount={controls.filteredItems.length}
          totalCount={prescriptions.length}
        />
        <div className="grid gap-3">
          {controls.paginatedItems.length === 0 ? (
            <EmptyState
              title={prescriptions.length === 0 ? "Belum ada resep" : "Resep tidak ditemukan"}
              detail={prescriptions.length === 0 ? "Resep yang dibuat dokter dari rekam medis akan tampil di sini." : "Ubah kata kunci atau filter status resep."}
            />
          ) : (
            controls.paginatedItems.map((prescription) => (
              <div key={prescription.id} className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-[0.7fr_1fr_0.45fr_0.35fr] md:items-center">
                <div>
                  <p className="font-medium">{prescription.medicalRecordNumber}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{prescription.patient}</p>
                </div>
                <div>
                  <p className="text-sm">{prescription.items}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{prescription.doctor}</p>
                </div>
                <p className="text-sm text-muted-foreground">{prescription.stock}</p>
                <StatusBadge label={prescription.status} />
              </div>
            ))
          )}
        </div>
        <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
      </Panel>
      <FilterModal
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Filter resep"
        description="Batasi daftar resep berdasarkan status proses."
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={prescriptionStatuses}
      />
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Aksi resep" description="Buat item resep sebagai dokter atau proses resep sebagai apoteker sesuai role.">
        <div className="grid gap-5">
          <Panel title="Buat resep" description="Dokter menambahkan obat dari rekam medis pasien.">
            {canCreate ? <PrescriptionItemForm prescriptionOptions={prescriptionOptions} /> : <PermissionNotice message="Pembuatan resep dibatasi untuk admin dan dokter." />}
          </Panel>
          <Panel title="Proses resep" description="Apoteker memvalidasi stok dan memproses resep.">
            {canProcess ? <ProcessPrescriptionForm prescriptions={prescriptions} /> : <PermissionNotice message="Pemrosesan resep dibatasi untuk admin dan apoteker." />}
          </Panel>
        </div>
      </ModalDialog>
    </div>
  )
}

function MedicinesSection({
  role,
  medicines,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  role: RoleKey
  medicines: MedicineListItem[]
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "admin" || role === "pharmacist"
  const medicineStatuses = React.useMemo(() => getUniqueOptions(medicines, (medicine) => medicine.status), [medicines])
  const searchSelector = React.useCallback(
    (medicine: MedicineListItem) => [medicine.code, medicine.name, medicine.category, medicine.unit, medicine.status, medicine.expires],
    [],
  )
  const filterSelector = React.useCallback((medicine: MedicineListItem, value: string) => medicine.status === value, [])
  const controls = useListControls({
    items: medicines,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="Inventori obat" description="Stok minimum dan kedaluwarsa ditampilkan di tabel utama karena berdampak langsung ke resep.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari kode, nama obat, kategori, satuan"
          resultCount={controls.filteredItems.length}
          totalCount={medicines.length}
        />
        {controls.paginatedItems.length === 0 ? (
          <EmptyState title="Obat tidak ditemukan" detail="Ubah kata kunci atau filter status untuk melihat inventori lain." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Kode</th>
                    <th className="py-3 pr-4 font-medium">Obat</th>
                    <th className="py-3 pr-4 font-medium">Kategori</th>
                    <th className="py-3 pr-4 font-medium">Stok</th>
                    <th className="py-3 pr-4 font-medium">Minimum</th>
                    <th className="py-3 pr-4 font-medium">Kedaluwarsa</th>
                    <th className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {controls.paginatedItems.map((medicine) => (
                    <tr key={medicine.code}>
                      <td className="py-4 pr-4 font-medium tabular-nums">{medicine.code}</td>
                      <td className="py-4 pr-4">{medicine.name}</td>
                      <td className="py-4 pr-4">{medicine.category}</td>
                      <td className="py-4 pr-4 tabular-nums">{medicine.stock}</td>
                      <td className="py-4 pr-4 tabular-nums">{medicine.min}</td>
                      <td className="py-4 pr-4 tabular-nums">{medicine.expires}</td>
                      <td className="py-4">
                        <StatusBadge label={medicine.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
          </>
        )}
      </Panel>
      <FilterModal
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Filter obat"
        description="Batasi inventori berdasarkan status stok atau status obat."
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={medicineStatuses}
      />
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola obat" description="Tambah master obat atau perbarui stok, status, dan data inventori.">
        <div className="grid gap-5">
          <Panel title="Tambah obat" description="Master obat dipakai saat dokter membuat resep dan apoteker memproses stok.">
            {canCreate ? <CreateMedicineForm /> : <PermissionNotice message="Penambahan obat dibatasi untuk admin dan apoteker." />}
          </Panel>
          <Panel title="Update inventori" description="Perbarui stok, batas minimum, status, harga, atau tanggal kedaluwarsa obat.">
            {canCreate ? <UpdateMedicineForm medicines={medicines} /> : <PermissionNotice message="Perubahan obat dibatasi untuk admin dan apoteker." />}
          </Panel>
        </div>
      </ModalDialog>
    </div>
  )
}

function PrescriptionItemForm({ prescriptionOptions }: { prescriptionOptions: PrescriptionFormOptions }) {
  const [state, formAction, pending] = React.useActionState(addPrescriptionItemAction, initialClinicFormState)

  if (prescriptionOptions.records.length === 0 || prescriptionOptions.medicines.length === 0) {
    return <EmptyState title="Belum siap membuat resep" detail="Pastikan ada rekam medis dan master obat aktif sebelum membuat resep." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Rekam medis</span>
        <select name="medicalRecordId" className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25">
          {prescriptionOptions.records.map((record) => (
            <option key={record.id} value={record.id}>
              {record.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Obat</span>
        <select name="medicineId" className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25">
          {prescriptionOptions.medicines.map((medicine) => (
            <option key={medicine.id} value={medicine.id}>
              {medicine.label}
            </option>
          ))}
        </select>
      </label>
      <TextField name="dosage" label="Dosis" placeholder="500mg" error={state.errors?.dosage?.[0]} />
      <TextField name="usageRule" label="Aturan pakai" placeholder="3x sehari setelah makan" error={state.errors?.usageRule?.[0]} />
      <TextField name="quantity" label="Jumlah" inputMode="numeric" error={state.errors?.quantity?.[0]} />
      <TextAreaField name="note" label="Catatan penggunaan" error={state.errors?.note?.[0]} />
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Tambah item resep"}
      </Button>
    </form>
  )
}

function ProcessPrescriptionForm({ prescriptions }: { prescriptions: PrescriptionListItem[] }) {
  const [state, formAction, pending] = React.useActionState(processPrescriptionAction, initialClinicFormState)
  const pendingPrescriptions = prescriptions.filter((prescription) => prescription.status === "Pending" || prescription.status === "Validasi stok")

  if (pendingPrescriptions.length === 0) {
    return <EmptyState title="Tidak ada resep pending" detail="Resep yang belum diproses akan muncul untuk divalidasi stok oleh apoteker." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Resep</span>
        <select name="prescriptionId" className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25">
          {pendingPrescriptions.map((prescription) => (
            <option key={prescription.id} value={prescription.id}>
              {prescription.medicalRecordNumber} - {prescription.patient} - {prescription.items}
            </option>
          ))}
        </select>
      </label>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Memproses..." : "Proses resep"}
      </Button>
    </form>
  )
}

function CreateMedicineForm() {
  const [state, formAction, pending] = React.useActionState(createMedicineAction, initialClinicFormState)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField name="code" label="Kode obat" error={state.errors?.code?.[0]} />
        <TextField name="name" label="Nama obat" error={state.errors?.name?.[0]} />
        <TextField name="category" label="Kategori" error={state.errors?.category?.[0]} />
        <TextField name="unit" label="Satuan" error={state.errors?.unit?.[0]} placeholder="tablet" />
        <TextField name="stock" label="Stok" inputMode="numeric" error={state.errors?.stock?.[0]} />
        <TextField name="minimumStock" label="Stok minimum" inputMode="numeric" error={state.errors?.minimumStock?.[0]} />
        <TextField name="price" label="Harga" inputMode="decimal" error={state.errors?.price?.[0]} />
        <TextField name="expirationDate" label="Tanggal kedaluwarsa" type="date" error={state.errors?.expirationDate?.[0]} />
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Tambah obat"}
      </Button>
    </form>
  )
}

function UpdateMedicineForm({ medicines }: { medicines: MedicineListItem[] }) {
  const [state, formAction, pending] = React.useActionState(updateMedicineAction, initialClinicFormState)

  if (medicines.length === 0) {
    return <EmptyState title="Belum ada obat" detail="Tambahkan master obat terlebih dahulu sebelum memperbarui inventori." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Obat</span>
          <select
            name="medicineId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.medicineId)}
          >
            <option value="">Pilih obat</option>
            {medicines.map((medicine) => (
              <option key={medicine.id} value={medicine.id}>
                {medicine.code} - {medicine.name} - stok {medicine.stock}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.medicineId?.[0]} />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField name="name" label="Nama obat" error={state.errors?.name?.[0]} />
          <TextField name="category" label="Kategori" error={state.errors?.category?.[0]} />
          <TextField name="unit" label="Satuan" error={state.errors?.unit?.[0]} placeholder="tablet" />
          <TextField name="stock" label="Stok" inputMode="numeric" error={state.errors?.stock?.[0]} />
          <TextField name="minimumStock" label="Stok minimum" inputMode="numeric" error={state.errors?.minimumStock?.[0]} />
          <TextField name="price" label="Harga" inputMode="decimal" error={state.errors?.price?.[0]} />
          <TextField name="expirationDate" label="Tanggal kedaluwarsa" type="date" error={state.errors?.expirationDate?.[0]} />
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Status obat</span>
            <select
              name="status"
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
              aria-invalid={Boolean(state.errors?.status)}
            >
              <option value="">Otomatis dari stok</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
              <option value="LOW_STOCK">Stok rendah</option>
              <option value="EXPIRED">Kedaluwarsa</option>
            </select>
            <FieldError message={state.errors?.status?.[0]} />
          </label>
        </div>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Memperbarui..." : "Update obat"}
      </Button>
    </form>
  )
}

function MedicalDocumentForm({ documentOptions }: { documentOptions: DocumentFormOptions }) {
  const [state, formAction, pending] = React.useActionState(createMedicalDocumentAction, initialClinicFormState)

  if (documentOptions.patients.length === 0) {
    return <EmptyState title="Belum ada pasien" detail="Tambahkan pasien terlebih dahulu sebelum menyimpan dokumen medis." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Pasien</span>
        <select name="patientId" className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25">
          {documentOptions.patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Kunjungan terkait</span>
        <select name="visitId" className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25">
          <option value="">Tanpa kunjungan</option>
          {documentOptions.visits.map((visit) => (
            <option key={visit.id} value={visit.id}>
              {visit.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Tipe dokumen</span>
        <select name="type" className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25">
          <option value="LAB_RESULT">Hasil lab</option>
          <option value="REFERRAL_LETTER">Surat rujukan</option>
          <option value="CONTROL_LETTER">Surat kontrol</option>
          <option value="EXAMINATION_PHOTO">Foto pemeriksaan</option>
          <option value="SUPPORTING_DOCUMENT">Dokumen pendukung</option>
          <option value="OTHER">Lainnya</option>
        </select>
      </label>
      <TextField name="fileName" label="Nama file" error={state.errors?.fileName?.[0]} placeholder="hasil-lab.pdf" />
      <TextField name="fileUrl" label="URL file" error={state.errors?.fileUrl?.[0]} placeholder="supabase://medical-documents/..." />
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan dokumen"}
      </Button>
    </form>
  )
}

function DocumentsSection({
  role,
  documents,
  documentOptions,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  role: RoleKey
  documents: MedicalDocumentListItem[]
  documentOptions: DocumentFormOptions
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "admin" || role === "doctor" || role === "nurse"
  const documentTypes = React.useMemo(() => getUniqueOptions(documents, (document) => document.type), [documents])
  const searchSelector = React.useCallback(
    (document: MedicalDocumentListItem) => [
      document.fileName,
      document.fileUrl,
      document.medicalRecordNumber,
      document.patient,
      document.visit,
      document.type,
      document.uploadedBy,
    ],
    [],
  )
  const filterSelector = React.useCallback((document: MedicalDocumentListItem, value: string) => document.type === value, [])
  const controls = useListControls({
    items: documents,
    pageSize: 6,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="Dokumen terbaru" description="Akses dokumen mengikuti permission pasien dan kunjungan.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari pasien, RM, nama file, tipe, uploader"
          resultCount={controls.filteredItems.length}
          totalCount={documents.length}
        />
        {controls.paginatedItems.length === 0 ? (
          <EmptyState
            title={documents.length === 0 ? "Belum ada dokumen" : "Dokumen tidak ditemukan"}
            detail={documents.length === 0 ? "Dokumen medis yang ditambahkan akan tampil dengan pasien, tipe, uploader, dan URL file." : "Ubah kata kunci atau filter tipe dokumen."}
          />
        ) : (
          <>
            <div className="grid gap-3">
              {controls.paginatedItems.map((document) => (
                <div key={document.id} className="rounded-md border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{document.fileName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {document.medicalRecordNumber} - {document.patient}
                      </p>
                    </div>
                    <StatusBadge label={document.type} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{document.visit}</p>
                  <p className="mt-2 break-all text-xs text-muted-foreground">{document.fileUrl}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {document.uploadedBy} - {document.uploadedAt}
                  </p>
                </div>
              ))}
            </div>
            <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
          </>
        )}
      </Panel>
      <FilterModal
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Filter dokumen"
        description="Batasi dokumen medis berdasarkan tipe dokumen."
        filterLabel="Tipe"
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={documentTypes}
      />
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Upload dokumen" description="Metadata dokumen disimpan sekarang; binary file bisa diarahkan ke Supabase Storage saat env storage tersedia.">
        {canCreate ? <MedicalDocumentForm documentOptions={documentOptions} /> : <PermissionNotice message="Upload dokumen dibatasi untuk admin, dokter, dan perawat." />}
      </ModalDialog>
    </div>
  )
}

function ReportsSection({
  reportSummary,
  filtersOpen,
  onFiltersOpenChange,
}: {
  reportSummary: ReportSummaryItem[]
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
}) {
  const [reports, setReports] = React.useState(reportSummary)
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

  const exportHref = `/reports/summary.csv${exportQuery.size > 0 ? `?${exportQuery.toString()}` : ""}`

  async function applyReportFilter() {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/reports/summary.json${exportQuery.size > 0 ? `?${exportQuery.toString()}` : ""}`)

      if (!response.ok) {
        setError("Laporan gagal dimuat. Periksa akses atau coba ulangi.")
        return
      }

      const payload = (await response.json()) as { reports: ReportSummaryItem[] }
      setReports(payload.reports)
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
    setReports(reportSummary)
    setError("")
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => (
          <MetricCard key={report.label} label={report.label} value={report.value} change={report.trend} detail={report.period} tone="text-primary" />
        ))}
      </div>
      <Panel title="Export laporan" description="Filter tanggal wajib untuk menjaga query laporan tetap cepat saat database membesar.">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={exportHref}>
              <Download className="size-4" aria-hidden="true" />
              Export CSV ringkasan
            </a>
          </Button>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm leading-6 text-cyan-950 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-100">
            {startDate || endDate ? `Filter aktif: ${startDate || "awal"} sampai ${endDate || "hari ini"}.` : "Gunakan tombol Filter untuk membatasi laporan berdasarkan tanggal."}
          </div>
        </div>
      </Panel>
      <ModalDialog open={filtersOpen} onOpenChange={onFiltersOpenChange} title="Filter laporan" description="Batasi laporan berdasarkan rentang tanggal agar query tetap ringan.">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField name="startDate" label="Tanggal mulai" type="date" value={startDate} onValueChange={setStartDate} />
          <TextField name="endDate" label="Tanggal akhir" type="date" value={endDate} onValueChange={setEndDate} />
        </div>
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </div>
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

function UsersSection({
  role,
  userList,
  roleOptions,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  role: RoleKey
  userList: UserListItem[]
  roleOptions: RoleOptionItem[]
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "admin"
  const userStatuses = React.useMemo(() => getUniqueOptions(userList, (user) => user.status), [userList])
  const searchSelector = React.useCallback(
    (user: UserListItem) => [user.name, user.email, user.username, user.role, user.roleKey, user.status],
    [],
  )
  const filterSelector = React.useCallback((user: UserListItem, value: string) => user.status === value, [])
  const controls = useListControls({
    items: userList,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="User aplikasi" description="Akun internal, role, status, dan jejak login terakhir dari database.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari nama, email, username, role"
          resultCount={controls.filteredItems.length}
          totalCount={userList.length}
        />
        <div className="grid gap-3">
          {controls.paginatedItems.length === 0 ? (
            <EmptyState title={userList.length === 0 ? "Belum ada user" : "User tidak ditemukan"} detail="Ubah kata kunci atau filter status untuk melihat akun lain." />
          ) : (
            controls.paginatedItems.map((user) => (
              <div key={user.id} className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-[1fr_0.55fr_0.35fr_0.55fr] md:items-center">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user.username} - {user.email}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{user.role}</p>
                <StatusBadge label={user.status} />
                <div className="text-sm tabular-nums text-muted-foreground">
                  <p>{user.lastLogin}</p>
                  <p className="mt-1 text-xs">Dibuat {user.createdAt}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
      </Panel>
      <FilterModal
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Filter user"
        description="Batasi daftar user berdasarkan status akun."
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={userStatuses}
      />
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola user" description="Tambah akun, ubah role, atau ubah status akun internal sesuai matrix akses PRD.">
        <div className="grid gap-5">
          <Panel title="Tambah user" description="Akun dibuat dengan password hash dan role internal sesuai matrix akses PRD.">
            {canCreate ? <CreateUserForm roleOptions={roleOptions} /> : <PermissionNotice message="Manajemen user hanya tersedia untuk admin." />}
          </Panel>
          <Panel title="Update role dan status" description="Gunakan untuk mengubah akses user atau menonaktifkan akun internal.">
            {canCreate ? <UpdateUserForm userList={userList} roleOptions={roleOptions} /> : <PermissionNotice message="Perubahan user hanya tersedia untuk admin." />}
          </Panel>
        </div>
      </ModalDialog>
    </div>
  )
}

function CreateUserForm({ roleOptions }: { roleOptions: RoleOptionItem[] }) {
  const [state, formAction, pending] = React.useActionState(createUserAction, initialClinicFormState)

  if (roleOptions.length === 0) {
    return <EmptyState title="Role belum tersedia" detail="Jalankan seed role terlebih dahulu sebelum membuat user baru." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <TextField name="name" label="Nama user" error={state.errors?.name?.[0]} autoComplete="name" />
        <TextField name="email" label="Email" type="email" error={state.errors?.email?.[0]} autoComplete="email" />
        <TextField name="username" label="Username" error={state.errors?.username?.[0]} autoComplete="username" />
        <TextField name="password" label="Password awal" type="password" error={state.errors?.password?.[0]} autoComplete="new-password" />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Role</span>
          <select
            name="roleId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.roleId)}
          >
            <option value="">Pilih role</option>
            {roleOptions.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.roleId?.[0]} />
        </label>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Membuat user..." : "Tambah user"}
      </Button>
    </form>
  )
}

function UpdateUserForm({ userList, roleOptions }: { userList: UserListItem[]; roleOptions: RoleOptionItem[] }) {
  const [state, formAction, pending] = React.useActionState(updateUserAction, initialClinicFormState)

  if (userList.length === 0) {
    return <EmptyState title="Belum ada user" detail="Tambahkan user terlebih dahulu sebelum mengubah role atau status." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">User</span>
          <select
            name="userId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.userId)}
          >
            <option value="">Pilih user</option>
            {userList.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.username} - {user.role}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.userId?.[0]} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Role baru</span>
          <select
            name="roleId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.roleId)}
          >
            <option value="">Tidak diubah</option>
            {roleOptions.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.roleId?.[0]} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Status baru</span>
          <select
            name="status"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.status)}
          >
            <option value="">Tidak diubah</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
            <option value="SUSPENDED">Ditangguhkan</option>
          </select>
          <FieldError message={state.errors?.status?.[0]} />
        </label>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Memperbarui..." : "Update user"}
      </Button>
    </form>
  )
}

function AuditSection({
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
        resultCount={controls.filteredItems.length}
        totalCount={auditLogs.length}
      />
      <div className="grid gap-3">
        {controls.paginatedItems.length === 0 ? (
          <EmptyState title={auditLogs.length === 0 ? "Belum ada audit log" : "Audit log tidak ditemukan"} detail="Ubah kata kunci atau filter risiko untuk melihat aktivitas lain." />
        ) : (
          controls.paginatedItems.map((log) => (
            <div key={log.id} className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-[0.8fr_1fr_0.45fr_0.45fr_0.35fr] md:items-center">
              <div>
                <p className="font-medium">{log.actor}</p>
                <p className="mt-1 text-xs text-muted-foreground">{log.role}</p>
              </div>
              <p className="text-sm text-muted-foreground">{log.action}</p>
              <p className="text-sm tabular-nums">{log.entity}</p>
              <p className="text-sm tabular-nums text-muted-foreground">{log.time}</p>
              <StatusBadge label={log.risk} />
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

function MetricCard({ label, value, change, detail, tone }: { label: string; value: string; change: string; detail: string; tone: string }) {
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

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-background/75 p-4 shadow-sm backdrop-blur md:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function ModalDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[88dvh] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-md border border-border bg-background p-5 shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Tutup dialog">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FilterModal({
  open,
  onOpenChange,
  title,
  description,
  filterLabel = "Status",
  filterValue,
  onFilterChange,
  filterOptions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  filterLabel?: string
  filterValue: string
  onFilterChange: (value: string) => void
  filterOptions: string[]
}) {
  return (
    <ModalDialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">{filterLabel}</span>
        <select
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
        >
          <option value="all">Semua {filterLabel.toLowerCase()}</option>
          {filterOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" size="lg" onClick={() => onFilterChange("all")}>
          Reset
        </Button>
        <Dialog.Close asChild>
          <Button type="button" size="lg">
            Terapkan
          </Button>
        </Dialog.Close>
      </div>
    </ModalDialog>
  )
}

function ListToolbar({
  query,
  onQueryChange,
  searchPlaceholder,
  resultCount,
  totalCount,
}: {
  query: string
  onQueryChange: (value: string) => void
  searchPlaceholder: string
  resultCount: number
  totalCount: number
}) {
  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
      <label className="flex min-h-11 items-center rounded-md border border-border bg-background px-3 text-sm">
        <Search className="mr-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="rounded-md bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          {resultCount} dari {totalCount} data
        </p>
      </div>
    </div>
  )
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Sebelumnya
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Berikutnya
        </Button>
      </div>
    </div>
  )
}

function ResponsiveVisitsTable({
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
    (visit: VisitListItem) => [visit.id, visit.patient, visit.medicalRecordNumber, visit.service, visit.doctor, visit.complaint, visit.status],
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
            searchPlaceholder="Cari pasien, RM, layanan, dokter, keluhan"
            resultCount={controls.filteredItems.length}
            totalCount={visits.length}
          />
        ) : null}
        <EmptyState title="Belum ada kunjungan" detail="Buat kunjungan baru dari form di halaman Kunjungan agar pasien masuk antrean layanan." />
        {onFiltersOpenChange ? (
          <FilterModal
            open={filtersOpen}
            onOpenChange={onFiltersOpenChange}
            title="Filter kunjungan"
            description="Batasi daftar kunjungan berdasarkan status layanan."
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
          searchPlaceholder="Cari pasien, RM, layanan, dokter, keluhan"
          resultCount={controls.filteredItems.length}
          totalCount={visits.length}
        />
      ) : null}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="py-3 pr-4 font-medium">ID</th>
              <th className="py-3 pr-4 font-medium">Pasien</th>
              <th className="py-3 pr-4 font-medium">Layanan</th>
              <th className="py-3 pr-4 font-medium">Keluhan</th>
              <th className="py-3 pr-4 font-medium">Jam</th>
              <th className="py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleVisits.map((visit) => (
              <tr key={visit.id} className="align-top">
                <td className="py-4 pr-4 font-medium tabular-nums">{visit.id}</td>
                <td className="py-4 pr-4">
                  <p className="font-medium">{visit.patient}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {visit.medicalRecordNumber} - {visit.doctor}
                  </p>
                </td>
                <td className="py-4 pr-4">{visit.service}</td>
                <td className="max-w-72 py-4 pr-4 leading-6 text-muted-foreground">{visit.complaint}</td>
                <td className="py-4 pr-4 tabular-nums">{visit.time}</td>
                <td className="py-4">
                  <StatusBadge label={visit.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {visibleVisits.map((visit) => (
          <div key={visit.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{visit.patient}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {visit.medicalRecordNumber} - {visit.time}
                </p>
              </div>
              <StatusBadge label={visit.status} />
            </div>
            <p className="mt-3 text-sm">{visit.service}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{visit.complaint}</p>
          </div>
        ))}
      </div>
      {onFiltersOpenChange ? (
        <FilterModal
          open={filtersOpen}
          onOpenChange={onFiltersOpenChange}
          title="Filter kunjungan"
          description="Batasi daftar kunjungan berdasarkan status layanan."
          filterValue={controls.filterValue}
          onFilterChange={controls.setFilterValue}
          filterOptions={visitStatuses}
        />
      ) : null}
      {!compact ? <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} /> : null}
    </div>
  )
}

function TextField({
  name,
  label,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  defaultValue,
  value,
  onValueChange,
}: {
  name: string
  label: string
  error?: string
  type?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={defaultValue}
        value={value}
        onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined}
        className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
        placeholder={placeholder ?? `Isi ${label.toLowerCase()}`}
        aria-invalid={Boolean(error)}
      />
      <FieldError message={error} />
    </label>
  )
}

function TextAreaField({
  name,
  label,
  error,
  placeholder,
  defaultValue,
}: {
  name: string
  label: string
  error?: string
  placeholder?: string
  defaultValue?: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
        placeholder={placeholder ?? `Isi ${label.toLowerCase()}`}
        aria-invalid={Boolean(error)}
      />
      <FieldError message={error} />
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

function FormMessage({ state }: { state: ClinicFormState }) {
  if (!state.message) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm leading-6",
        state.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
      role="status"
    >
      {state.message}
    </div>
  )
}

function PermissionNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
      {message}
    </div>
  )
}

function StatusBadge({ label }: { label: string }) {
  return <span className={cn("inline-flex w-fit rounded-md px-2 py-1 text-xs font-medium", statusTone[label] ?? statusTone.Normal)}>{label}</span>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto grid size-11 place-items-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <p className="mt-4 font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  )
}
