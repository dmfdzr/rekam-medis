import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  Stethoscope,
  TestTube,
  Upload,
  UserRound,
  Users,
} from "lucide-react"

export type RoleKey = "master" | "admin" | "doctor"

export type NavigationItem = {
  id: SectionKey
  label: string
  icon: LucideIcon
}

export type SectionKey =
  | "dashboard"
  | "patients"
  | "visits"
  | "laboratory"
  | "assessment"
  | "records"
  | "prescriptions"
  | "documents"
  | "reports"
  | "users"
  | "audit"
  | "settings"

export const roles: Record<
  RoleKey,
  {
    label: string
    user: string
    description: string
    accent: string
  }
> = {
  master: {
    label: "Master",
    user: "Master User",
    description: "Akses penuh seluruh fitur aplikasi",
    accent: "bg-sky-700",
  },
  admin: {
    label: "Admin Pendaftaran",
    user: "Admin Pendaftaran",
    description: "Pasien, pencarian, dan pembuatan kunjungan",
    accent: "bg-cyan-600",
  },
  doctor: {
    label: "Dokter",
    user: "dr. Raka Mahendra",
    description: "Pemeriksaan, diagnosa, tindakan, dan resep",
    accent: "bg-teal-600",
  },
}

const navigation: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Pasien", icon: UserRound },
  { id: "visits", label: "Kunjungan", icon: CalendarDays },
  { id: "assessment", label: "Asesmen", icon: ClipboardCheck },
  { id: "laboratory", label: "Laboratorium", icon: TestTube },
  { id: "prescriptions", label: "Resep", icon: ClipboardList },
  { id: "records", label: "CPPT", icon: Stethoscope },
  { id: "documents", label: "Dokumen Medis", icon: Upload },
  { id: "reports", label: "Laporan", icon: BarChart3 },
  { id: "users", label: "Manajemen User", icon: Users },
  { id: "audit", label: "Audit Log", icon: ShieldCheck },
  { id: "settings", label: "Pengaturan Akun", icon: KeyRound },
]

const roleAccess: Record<RoleKey, SectionKey[]> = {
  master: [
    "dashboard",
    "patients",
    "visits",
    "assessment",
    "laboratory",
    "records",
    "prescriptions",
    "documents",
    "reports",
    "users",
    "audit",
    "settings",
  ],
  admin: ["dashboard", "patients", "visits", "settings"],
  doctor: ["dashboard", "assessment", "laboratory", "records", "prescriptions", "documents", "reports", "settings"],
}

export function getNavigationForRole(role: RoleKey) {
  const allowedSections = new Set(roleAccess[role])

  return navigation.filter((item) => allowedSections.has(item.id))
}

export function canAccessSection(role: RoleKey, section: SectionKey) {
  return roleAccess[role].includes(section)
}

export const dashboardMetrics = [
  {
    label: "Kunjungan hari ini",
    value: "42",
    change: "+12%",
    tone: "text-sky-700 dark:text-sky-300",
    detail: "8 pasien menunggu asesmen",
  },
  {
    label: "Rekam medis final",
    value: "31",
    change: "74%",
    tone: "text-teal-700 dark:text-teal-300",
    detail: "11 pemeriksaan masih draft",
  },
  {
    label: "Dokumen terverifikasi",
    value: "9",
    change: "+3",
    tone: "text-amber-700 dark:text-amber-300",
    detail: "Resume medis selesai diverifikasi",
  },
  {
    label: "Obat stok rendah",
    value: "6",
    change: "Perlu restock",
    tone: "text-red-700 dark:text-red-300",
    detail: "2 item kedaluwarsa < 30 hari",
  },
]

export const queueSummary = [
  { status: "Menunggu", count: 8, className: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200" },
  { status: "Asesmen", count: 12, className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-200" },
  { status: "Pemeriksaan", count: 13, className: "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-200" },
  { status: "Selesai", count: 31, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" },
]

export const patients = [
  {
    id: "26-00-41",
    name: "Siti Aminah",
    nik: "3273********0001",
    gender: "Perempuan",
    age: "34 tahun",
    phone: "0812-4432-1180",
    allergy: "Amoxicillin",
    status: "Aktif",
    lastVisit: "14 Jun 2026",
  },
  {
    id: "26-00-42",
    name: "Bima Pratama",
    nik: "3273********0032",
    gender: "Laki-laki",
    age: "9 tahun",
    phone: "0821-7789-1044",
    allergy: "Tidak ada",
    status: "Aktif",
    lastVisit: "14 Jun 2026",
  },
  {
    id: "26-00-43",
    name: "Hendra Wijaya",
    nik: "3174********0088",
    gender: "Laki-laki",
    age: "51 tahun",
    phone: "0857-2218-9031",
    allergy: "Sulfa",
    status: "Observasi",
    lastVisit: "13 Jun 2026",
  },
  {
    id: "26-00-44",
    name: "Ratna Laksmi",
    nik: "3276********0020",
    gender: "Perempuan",
    age: "45 tahun",
    phone: "0813-9033-2401",
    allergy: "Tidak ada",
    status: "Aktif",
    lastVisit: "12 Jun 2026",
  },
]

export const visits = [
  {
    id: "VIS-1442",
    patient: "Siti Aminah",
    service: "Ruang Perawatan Dewasa",
    doctor: "dr. Raka Mahendra",
    complaint: "Demam, nyeri tenggorokan, batuk kering",
    status: "Pemeriksaan",
    time: "09:15",
  },
  {
    id: "VIS-1443",
    patient: "Bima Pratama",
    service: "Ruang Perawatan Anak",
    doctor: "dr. Raka Mahendra",
    complaint: "Mual dan diare sejak malam",
    status: "Asesmen",
    time: "09:40",
  },
  {
    id: "VIS-1444",
    patient: "Hendra Wijaya",
    service: "Ruang VIP",
    doctor: "dr. Raka Mahendra",
    complaint: "Kontrol tekanan darah",
    status: "Menunggu",
    time: "10:05",
  },
  {
    id: "VIS-1445",
    patient: "Ratna Laksmi",
    service: "Ruang Melati",
    doctor: "dr. Raka Mahendra",
    complaint: "Nyeri kepala berulang",
    status: "Selesai",
    time: "10:30",
  },
]

export const vitalSigns = [
  { label: "Tekanan darah", value: "128/82", unit: "mmHg" },
  { label: "Suhu", value: "37.8", unit: "C" },
  { label: "Nadi", value: "92", unit: "x/menit" },
  { label: "Respirasi", value: "20", unit: "x/menit" },
  { label: "SpO2", value: "98", unit: "%" },
  { label: "BMI", value: "23.6", unit: "normal" },
]

export const medicalTimeline = [
  {
    date: "14 Jun 2026",
    title: "ISPA akut",
    doctor: "dr. Raka Mahendra",
    soap: "S: demam 2 hari. O: faring hiperemis. A: ISPA akut. P: terapi simptomatik dan kontrol bila memburuk.",
    status: "Draft",
  },
  {
    date: "29 Mei 2026",
    title: "Kontrol alergi",
    doctor: "dr. Raka Mahendra",
    soap: "Keluhan membaik, edukasi pencetus alergi, resep antihistamin bila perlu.",
    status: "Final",
  },
  {
    date: "14 Apr 2026",
    title: "Pemeriksaan umum",
    doctor: "dr. Anita Puspita",
    soap: "Tidak ada keluhan berat, tanda vital stabil, edukasi pola tidur.",
    status: "Final",
  },
]

export const prescriptions = [
  {
    id: "RX-821",
    patient: "Siti Aminah",
    doctor: "dr. Raka Mahendra",
    items: "Paracetamol 500mg, Cetirizine 10mg",
    status: "Pending",
    stock: "Cukup",
  },
  {
    id: "RX-822",
    patient: "Bima Pratama",
    doctor: "dr. Raka Mahendra",
    items: "Oralit, Zinc syrup",
    status: "Validasi stok",
    stock: "Zinc rendah",
  },
  {
    id: "RX-823",
    patient: "Ratna Laksmi",
    doctor: "dr. Anita Puspita",
    items: "Ibuprofen 200mg",
    status: "Diproses",
    stock: "Cukup",
  },
]

export const medicines = [
  { code: "MED-001", name: "Paracetamol 500mg", category: "Analgesik", stock: 240, min: 80, expires: "2027-02-12", status: "Aman" },
  { code: "MED-014", name: "Cetirizine 10mg", category: "Antihistamin", stock: 74, min: 60, expires: "2026-12-18", status: "Aman" },
  { code: "MED-021", name: "Zinc syrup", category: "Suplemen", stock: 18, min: 30, expires: "2026-09-04", status: "Stok rendah" },
  { code: "MED-033", name: "Amoxicillin 500mg", category: "Antibiotik", stock: 21, min: 50, expires: "2026-07-02", status: "Kritis" },
]

export const reports = [
  { label: "Laporan kunjungan", period: "Minggu berjalan", value: "286", trend: "+8.5%" },
  { label: "Pasien baru", period: "Bulan Juni", value: "73", trend: "+14" },
  { label: "Diagnosa terbanyak", period: "30 hari", value: "ISPA", trend: "21%" },
  { label: "Penggunaan obat", period: "30 hari", value: "Paracetamol", trend: "410 tablet" },
]

export const users = [
  { name: "Master User", role: "Master", status: "Aktif", lastLogin: "14 Jun 2026 08:00" },
  { name: "Admin Pendaftaran", role: "Admin Pendaftaran", status: "Aktif", lastLogin: "14 Jun 2026 08:12" },
  { name: "dr. Raka Mahendra", role: "Dokter", status: "Aktif", lastLogin: "14 Jun 2026 08:32" },
]

export const auditLogs = [
  { actor: "Ardi Santoso", action: "Membuat kunjungan", entity: "VIS-1444", time: "10:05", risk: "Normal" },
  { actor: "Admin Pendaftaran", action: "Mengisi asesmen", entity: "VIS-1443", time: "09:48", risk: "Normal" },
  { actor: "dr. Raka Mahendra", action: "Menyimpan draft rekam medis", entity: "26-00-41", time: "09:44", risk: "Sensitif" },
  { actor: "dr. Raka Mahendra", action: "Memproses resep", entity: "RX-823", time: "09:32", risk: "Normal" },
]

export const workflowSteps = [
  { title: "Pasien", detail: "Identitas pasien, NIK, kontak, dan nomor RM menjadi dasar alur layanan.", icon: UserRound },
  { title: "Kunjungan", detail: "Petugas membuat kunjungan dari data pasien dan menentukan ruang rawat.", icon: CalendarDays },
  { title: "Asesmen", detail: "Dokter mengisi diagnosa masuk, riwayat penyakit, dan data klinis awal.", icon: HeartPulse },
  { title: "Laboratorium", detail: "Hasil pemeriksaan laboratorium dicatat setelah asesmen tersimpan.", icon: TestTube },
  { title: "Resep", detail: "Obat dan aturan pakai dibuat setelah hasil laboratorium tersedia.", icon: ClipboardList },
  { title: "CPPT", detail: "Catatan perkembangan pasien difinalisasi setelah resep diproses.", icon: ClipboardCheck },
  { title: "Verifikasi dokumen medis", detail: "Dokumen resume medis diverifikasi dengan kondisi dan instruksi pulang.", icon: FileText },
]

export type AppUser = { id: string; name: string; email: string; username: string; role: string; roleName: string; }
