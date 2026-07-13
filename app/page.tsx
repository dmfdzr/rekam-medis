import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Activity, ArrowRight, BarChart3, ClipboardCheck, FileText, FlaskConical, LockKeyhole, Pill, ShieldCheck, Stethoscope, UsersRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { getCurrentUser } from "@/lib/auth/current-user"

const workflowItems = [
  {
    title: "Pasien",
    description: "Identitas pasien, NIK, kontak, alergi, dan alamat terstruktur menjadi dasar pendaftaran serta laporan wilayah.",
    icon: UsersRound,
  },
  {
    title: "Kunjungan",
    description: "Petugas menentukan ruang rawat, DPJP, rawat bersama, dan registrasi pasien.",
    icon: Stethoscope,
  },
  {
    title: "Asesmen dan laboratorium",
    description: "Dokter yang ditugaskan mengisi asesmen, lalu hasil laboratorium dicatat sebagai dasar resep.",
    icon: FlaskConical,
  },
  {
    title: "Resep dan CPPT",
    description: "Resep dibuat manual setelah laboratorium, lalu CPPT disimpan sebagai draft atau difinalisasi.",
    icon: Pill,
  },
  {
    title: "Verifikasi dokumen medis",
    description: "Resume medis diverifikasi dengan kondisi pulang, instruksi pulang, nama verifier, dan waktu verifikasi.",
    icon: ClipboardCheck,
  },
  {
    title: "Laporan",
    description: "Pantau ringkasan kunjungan, diagnosis, tindakan, export data, dan persebaran diagnosis berdasarkan wilayah pasien.",
    icon: BarChart3,
  },
]

const accessItems = [
  "Akses berbasis role untuk master, admin, dan dokter.",
  "Session memakai cookie HTTP-only dan aktivitas penting dicatat ke audit log.",
  "Dokumen medis dibuat saat dibutuhkan agar penyimpanan tetap ringan.",
]

export default async function LandingPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/app")
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="relative isolate overflow-hidden border-b border-border">
        <Image
          src="/assets/health.png"
          alt=""
          width={760}
          height={760}
          priority
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-auto w-xl -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.05] sm:w-3xl lg:w-5xl"
        />
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Rekam Medis Elektronik">
              <Image src="/assets/ueu.png" alt="UEU Logo" width={56} height={56} className="h-12 w-auto shrink-0 bg-transparent object-contain" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Rekam Medis Elektronik</p>
                <p className="truncate text-xs text-muted-foreground">Resume Medis</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild size="lg">
                <Link href="/login">
                  Masuk aplikasi
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                Aplikasi internal untuk operasional rumah sakit
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-normal text-balance sm:text-5xl lg:text-6xl">
                Sistem Informasi Manajemen Rumah Sakit Esa Unggul
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Rekam Medis Elektronik membantu rumah sakit mencatat resume medis dengan alur yang rapi, mulai dari kelola pasien, kunjungan rawat inap, asesmen, laboratorium, resep, CPPT, dokumen medis, laporan wilayah diagnosis, hingga audit aktivitas dalam satu aplikasi web.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 w-full sm:w-fit">
                  <Link href="/login">
                    Masuk aplikasi
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 w-full sm:w-fit">
                  <a href="#tentang">Tentang</a>
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-3 shadow-xl">
              <div className="rounded-md border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="text-sm font-semibold">Dashboard SIMRS</p>
                    <p className="mt-1 text-xs text-muted-foreground">Ringkasan operasional dan dokumen medis</p>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Role based</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ["Pasien aktif", "128", "Data pasien aktif", UsersRound],
                    ["Kunjungan hari ini", "42", "Hari berjalan", Activity],
                    ["Kunjungan Aktif", "14", "Belum selesai", Stethoscope],
                    ["Dokumen Medis", "36", "Seluruh dokumen medis", FileText],
                  ].map(([label, value, detail, Icon]) => (
                    <div key={label as string} className="rounded-md border border-border bg-card p-3">
                      <Icon className="size-4 text-primary" aria-hidden="true" />
                      <p className="mt-3 text-xs text-muted-foreground">{label as string}</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">{value as string}</p>
                      <p className="mt-1 text-[0.7rem] leading-4 text-muted-foreground">{detail as string}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-md border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Alur layanan</p>
                    <span className="text-xs text-muted-foreground">Tersinkron</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {["Pasien", "Kunjungan", "Asesmen", "Laboratorium", "Resep", "CPPT", "Verifikasi dokumen medis"].map((step, index) => (
                      <div key={step} className="flex items-center gap-3 rounded-md bg-muted px-3 py-2 text-sm">
                        <span className="grid size-6 place-items-center rounded-md bg-background text-xs font-semibold tabular-nums">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate">{step}</span>
                        <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="scroll-mt-4 border-b border-border bg-muted/35 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-semibold text-primary">Sekilas tentang aplikasi</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">Dibuat untuk pekerjaan harian fasilitas kesehatan kecil hingga menengah.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Rekam Medis Elektronik digunakan sebagai aplikasi internal tanpa integrasi BPJS, SATUSEHAT, payment gateway, atau layanan autentikasi eksternal. Fokusnya adalah pencatatan klinis berurutan, kontrol akses dokter sesuai kunjungan, dokumen resume medis PDF, dan laporan persebaran diagnosis berbasis wilayah pasien.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {workflowItems.map((item) => (
              <article key={item.title} className="rounded-md border border-border bg-card p-4">
                <item.icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="rounded-md border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                <LockKeyhole className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Privasi dan akses internal</h2>
                <p className="mt-1 text-sm text-muted-foreground">Data medis hanya dibuka oleh user berwenang.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {accessItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-md bg-muted p-3 text-sm leading-6">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-normal">Mulai dari akun yang diberikan administrator rumah sakit.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Halaman login tetap terpisah agar akses aplikasi jelas. Setelah masuk, user langsung melihat dashboard dan menu sesuai role yang dimiliki.
            </p>
            <Button asChild size="lg" className="mt-6 h-11 w-full sm:w-fit">
              <Link href="/login">
                Masuk ke Rekam Medis Elektronik
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
