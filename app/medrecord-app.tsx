"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronRight, Download, Filter, Menu, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type {
  ClinicalWorklistItem,
  AuditLogListItem,
  DashboardSummary,
  DocumentFormOptions,
  MedicalDocumentListItem,
  MedicalRecordHistoryItem,
  PatientListItem,
  PrescriptionFormOptions,
  PrescriptionListItem,
  RoleOptionItem,
  ReportDetails,
  ReportSummaryItem,
  UserListItem,
  VisitFormOptions,
  VisitListItem,
} from "@/lib/data/clinic"
import { cn } from "@/lib/utils"
import {
  getNavigationForRole,
  roles,
  type RoleKey,
  type SectionKey,
  type AppUser,
} from "@/lib/medical-data"

import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutConfirmDialog } from "@/components/auth/logout-dialog"

import { DashboardSection } from "@/components/dashboard/dashboard-section"
import { PatientsSection } from "@/components/patients/patients-section"
import { VisitsSection } from "@/components/visits/visits-section"
import { LaboratorySection } from "@/components/laboratory/laboratory-section"
import { MedicalRecordsSection } from "@/components/medical-records/medical-records-section"
import { PrescriptionsSection } from "@/components/prescriptions/prescriptions-section"
import { DocumentsSection } from "@/components/documents/documents-section"
import { ReportsSection } from "@/components/reports/reports-section"
import { UsersSection } from "@/components/users/users-section"
import { AuditSection } from "@/components/users/audit-section"
import { SettingsSection } from "@/components/settings/settings-section"
import { AssessmentSection } from "@/components/assessment/assessment-section"

const filterableSections = new Set<SectionKey>(["patients", "visits", "prescriptions", "documents", "reports", "users", "audit"])
const composerSections = new Set<SectionKey>(["patients", "visits", "laboratory", "assessment", "records", "prescriptions", "users"])

function mapUserRoleToAppRole(role: string): RoleKey {
  const roleMap: Record<string, RoleKey> = {
    MASTER: "master",
    ADMIN: "admin",
    DOCTOR: "doctor",
  }

  return roleMap[role] ?? "doctor"
}

const sectionMeta: Record<SectionKey, { title: string; description: string; action?: string }> = {
  dashboard: {
    title: "Dashboard Operasional",
    description: "Pantau ringkasan pasien aktif, kunjungan berjalan, dokumen medis, dan status verifikasi dalam satu layar.",
  },
  patients: {
    title: "Data Pasien",
    description: "Kelola identitas pasien, NIK, kontak, alergi, dan alamat terstruktur untuk kebutuhan pendaftaran serta laporan wilayah.",
    action: "Kelola pasien",
  },
  visits: {
    title: "Kunjungan",
    description: "Buat kunjungan dari data pasien, tentukan ruang rawat, DPJP, rawat bersama, dan registrasi pasien.",
    action: "Kelola kunjungan",
  },
  laboratory: {
    title: "Input Laboratorium",
    description: "Catat hasil laboratorium setelah asesmen tersimpan sebagai dasar pembuatan resep.",
    action: "Simpan hasil lab",
  },
  assessment: {
    title: "Asesmen Klinis",
    description: "Dokter yang ditugaskan mengisi tanda vital, diagnosa masuk, riwayat penyakit, ICD-10, dan tindakan ICD-9-CM.",
    action: "Simpan asesmen",
  },
  records: {
    title: "CPPT",
    description: "Simpan draft atau finalisasi catatan perkembangan pasien setelah resep diproses.",
    action: "Kelola CPPT",
  },
  prescriptions: {
    title: "Resep",
    description: "Dokter yang ditugaskan membuat resep manual dan memproses obat sebelum pasien masuk tahap CPPT.",
    action: "Kelola resep",
  },
  documents: {
    title: "Dokumen Medis",
    description: "Lihat, unduh PDF resume medis, dan verifikasi dokumen dengan kondisi serta instruksi pulang.",
  },
  reports: {
    title: "Laporan",
    description: "Analisis kunjungan, diagnosis, tindakan, export data, dan persebaran diagnosis berdasarkan wilayah pasien.",
    action: "Export laporan",
  },
  users: {
    title: "Manajemen User",
    description: "Kelola akun master, admin, dan dokter beserta role, status, profil, dan password.",
    action: "Kelola user",
  },
  audit: {
    title: "Audit Log",
    description: "Lacak aktivitas penting, risiko, detail aksi, IP, dan perangkat untuk akuntabilitas data medis.",
  },
  settings: {
    title: "Pengaturan Akun",
    description: "Perbarui profil akun dan password login yang digunakan untuk mengakses aplikasi.",
  },
}

function SidebarContent({
  activeSection,
  collapsed,
  navigation,
  onNavigate,
  onClose,
  user,
}: {
  activeSection: SectionKey
  collapsed: boolean
  navigation: ReturnType<typeof getNavigationForRole>
  onNavigate: (section: SectionKey) => void
  onClose?: () => void
  user?: AppUser
}) {
  return (
    <div className="flex h-full flex-col gap-0">
      <div className={cn("flex h-14 w-full shrink-0 items-center justify-between gap-3", collapsed ? "justify-center" : "")}>
        <div className={cn("flex min-w-0 items-center gap-3", collapsed ? "justify-center" : "")}>
          <Image src="/assets/ueu.png" alt="UEU Logo" width={56} height={56} className="h-12 w-auto shrink-0 bg-transparent object-contain" />
          <div className={cn("min-w-0", collapsed ? "sr-only" : "")}>
            <p className="truncate text-sm font-semibold">Rekam Medis Elektronik</p>
            <p className="truncate text-xs text-muted-foreground">Resume Medis</p>
          </div>
        </div>
        {onClose ? (
          <Button type="button" variant="ghost" size="icon" aria-label="Tutup menu" onClick={onClose}>
            <X />
          </Button>
        ) : null}
      </div>

      <nav
        aria-label="Navigasi utama"
        className={cn(
          "mt-4 min-h-0 flex-1 overflow-y-auto pb-2",
          collapsed ? "grid w-full content-start justify-items-center gap-1.5" : "grid w-full content-start gap-1",
        )}
      >
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
                "flex h-11 items-center rounded-md text-left text-sm transition",
                collapsed ? "size-11 justify-center p-0" : "w-full gap-3 px-3",
                selected
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className={cn("truncate", collapsed ? "sr-only" : "")}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {user ? (
        <div className="mt-2 grid w-full shrink-0 gap-3 border-t border-sidebar-border pb-3 pt-4">
          <div className="flex min-w-0 items-center gap-3 rounded-md border border-sidebar-border bg-background/70 p-2.5">
            <Image src="/assets/ueu.png" alt="UEU Logo" width={24} height={24} className="size-6 shrink-0 bg-transparent" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.roleName}</p>
            </div>
          </div>
          <LogoutConfirmDialog className="w-full justify-center" />
        </div>
      ) : (
        <div className="shrink-0" />
      )}
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
  user,
  section,
  role,
  dashboardSummary,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
  patients,
  visits,
  visitOptions,
  assessmentList,
  assessmentOptions,
  laboratoryList,
  laboratoryOptions,
  medicalRecordWorklist,
  medicalRecordHistory,
  prescriptions,
  prescriptionOptions,
  documents,
  documentOptions,
  reportSummary,
  reportDetails,
  auditLogs,
  userList,
  roleOptions,
}: {
  user: AppUser
  section: SectionKey
  role: RoleKey
  dashboardSummary: DashboardSummary
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
  patients: PatientListItem[]
  visits: VisitListItem[]
  visitOptions: VisitFormOptions
  assessmentList: ClinicalWorklistItem[]
  assessmentOptions: ClinicalWorklistItem[]
  laboratoryList: ClinicalWorklistItem[]
  laboratoryOptions: ClinicalWorklistItem[]
  medicalRecordWorklist: ClinicalWorklistItem[]
  medicalRecordHistory: MedicalRecordHistoryItem[]
  prescriptions: PrescriptionListItem[]
  prescriptionOptions: PrescriptionFormOptions
  documents: MedicalDocumentListItem[]
  documentOptions: DocumentFormOptions
  reportSummary: ReportSummaryItem[]
  reportDetails: ReportDetails
  auditLogs: AuditLogListItem[]
  userList: UserListItem[]
  roleOptions: RoleOptionItem[]
}) {
  switch (section) {
    case "dashboard":
      return <DashboardSection role={role} visits={visits} dashboardSummary={dashboardSummary} />
    case "patients":
      return <PatientsSection patients={patients} role={role} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "visits":
      return <VisitsSection visits={visits} visitOptions={visitOptions} role={role} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "laboratory":
      return <LaboratorySection role={role} laboratoryList={laboratoryList} laboratoryOptions={laboratoryOptions} composerOpen={composerOpen} onComposerOpenChange={onComposerOpenChange} />
    case "assessment":
      return <AssessmentSection role={role} assessmentList={assessmentList} assessmentOptions={assessmentOptions} composerOpen={composerOpen} onComposerOpenChange={onComposerOpenChange} />
    case "records":
      return <MedicalRecordsSection role={role} clinicalWorklist={medicalRecordWorklist} medicalRecordHistory={medicalRecordHistory} composerOpen={composerOpen} onComposerOpenChange={onComposerOpenChange} />
    case "prescriptions":
      return <PrescriptionsSection role={role} prescriptions={prescriptions} prescriptionOptions={prescriptionOptions} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "documents":
      return <DocumentsSection role={role} documents={documents} documentOptions={documentOptions} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "reports":
      return <ReportsSection role={role} reportSummary={reportSummary} reportDetails={reportDetails} filtersOpen={filtersOpen} onFiltersOpenChange={onFiltersOpenChange} />
    case "users":
      return <UsersSection role={role} userList={userList} roleOptions={roleOptions} filtersOpen={filtersOpen} composerOpen={composerOpen} onFiltersOpenChange={onFiltersOpenChange} onComposerOpenChange={onComposerOpenChange} />
    case "audit":
      return <AuditSection auditLogs={auditLogs} filtersOpen={filtersOpen} onFiltersOpenChange={onFiltersOpenChange} />
    case "settings":
      return <SettingsSection user={user} />
    default:
      return null
  }
}

export function MedRecordApp({
  user,
  dashboardSummary,
  patients,
  visits,
  visitOptions,
  assessmentList,
  assessmentOptions,
  laboratoryList,
  laboratoryOptions,
  medicalRecordWorklist,
  medicalRecordHistory,
  prescriptions,
  prescriptionOptions,
  documents,
  documentOptions,
  reportSummary,
  reportDetails,
  auditLogs,
  userList,
  roleOptions,
}: {
  user: AppUser
  dashboardSummary: DashboardSummary
  patients: PatientListItem[]
  visits: VisitListItem[]
  visitOptions: VisitFormOptions
  assessmentList: ClinicalWorklistItem[]
  assessmentOptions: ClinicalWorklistItem[]
  laboratoryList: ClinicalWorklistItem[]
  laboratoryOptions: ClinicalWorklistItem[]
  medicalRecordWorklist: ClinicalWorklistItem[]
  medicalRecordHistory: MedicalRecordHistoryItem[]
  prescriptions: PrescriptionListItem[]
  prescriptionOptions: PrescriptionFormOptions
  documents: MedicalDocumentListItem[]
  documentOptions: DocumentFormOptions
  reportSummary: ReportSummaryItem[]
  reportDetails: ReportDetails
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
    <div className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_28rem),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--muted),var(--background)_60%))] text-foreground">
      <div className="flex h-full min-h-0">
        <aside
          className={cn(
            "hidden h-dvh shrink-0 border-r border-border/80 bg-sidebar/90 p-4 text-sidebar-foreground backdrop-blur transition-[width] duration-200 lg:block",
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

        <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!mobileOpen}>
          <button
            type="button"
            aria-label="Tutup menu"
            className={cn("absolute inset-0 bg-slate-950/50 transition-opacity duration-200", mobileOpen ? "opacity-100" : "opacity-0")}
            onClick={() => setMobileOpen(false)}
            tabIndex={mobileOpen ? 0 : -1}
          />
          <aside
            className={cn(
              "relative h-full w-[min(22rem,90vw)] overflow-hidden border-r border-border bg-sidebar p-4 shadow-2xl transition-transform duration-300 ease-out",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <SidebarContent
              activeSection={activeSection}
              collapsed={false}
              navigation={navigation}
              onNavigate={navigate}
              onClose={() => setMobileOpen(false)}
              user={user}
            />
          </aside>
        </div>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-30 shrink-0 border-b border-border/80 bg-background/88 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="lg:hidden"
                aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
                onClick={() => setMobileOpen((current) => !current)}
              >
                {mobileOpen ? <X /> : <Menu />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="hidden lg:inline-flex"
                aria-label={sidebarCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
                onClick={() => setSidebarCollapsed((current) => !current)}
              >
                {sidebarCollapsed ? <Menu /> : <X />}
              </Button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Rekam Medis Elektronik</span>
                  <ChevronRight className="size-3" aria-hidden="true" />
                  <span>{currentRole.label}</span>
                </div>
                <h1 className="mt-1 truncate text-xl font-semibold tracking-normal md:text-2xl">{meta.title}</h1>
              </div>

              <ThemeToggle />

              <div className="hidden min-w-0 items-center gap-3 rounded-md border border-border bg-card px-3 py-2 lg:flex">
                <Image src="/assets/ueu.png" alt="UEU Logo" width={24} height={24} className="size-6 shrink-0 bg-transparent" />
                <div className="min-w-0 text-right">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.roleName}</p>
                </div>
                <LogoutConfirmDialog />
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 md:px-6 lg:px-8">
            <PageHeader
              meta={meta}
              filtersOpen={filtersOpen}
              canShowFilterButton={canShowFilterButton}
              canShowComposerButton={canShowComposerButton}
              onOpenFilters={() => setFiltersOpen(true)}
              onOpenComposer={() => setComposerOpen(true)}
            />
            <SectionRenderer
              user={user}
              section={activeSection}
              role={activeRole}
              dashboardSummary={dashboardSummary}
              filtersOpen={filtersOpen}
              composerOpen={composerOpen}
              onFiltersOpenChange={setFiltersOpen}
              onComposerOpenChange={setComposerOpen}
              patients={patients}
              visits={visits}
              visitOptions={visitOptions}
              assessmentList={assessmentList}
              assessmentOptions={assessmentOptions}
              laboratoryList={laboratoryList}
              laboratoryOptions={laboratoryOptions}
              medicalRecordWorklist={medicalRecordWorklist}
              medicalRecordHistory={medicalRecordHistory}
              prescriptions={prescriptions}
              prescriptionOptions={prescriptionOptions}
              documents={documents}
              documentOptions={documentOptions}
              reportSummary={reportSummary}
              reportDetails={reportDetails}
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
