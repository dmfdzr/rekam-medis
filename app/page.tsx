import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Activity, ArrowRight, ClipboardCheck, FileText, LockKeyhole, Pill, ShieldCheck, Stethoscope, UsersRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { getCurrentUser } from "@/lib/auth/current-user"

const workflowItems = [
  {
    title: "Pendaftaran pasien",
    description: "Data pasien, NIK, kontak, alergi, dan nomor rekam medis tersusun dalam satu sumber data.",
    icon: UsersRound,
  },
  {
    title: "Kunjungan dan pemeriksaan",
    description: "Alur pendaftaran, tanda vital, pemeriksaan dokter, diagnosa, dan tindakan saling terhubung.",
    icon: Stethoscope,
  },
  {
    title: "Resep dan farmasi",
    description: "Resep dari dokter dapat diproses apotek dengan sinyal stok dan riwayat penggunaan obat.",
    icon: Pill,
  },
  {
    title: "Laporan dan audit",
    description: "Ringkasan operasional, export laporan, dan audit log membantu kontrol data medis.",
    icon: ClipboardCheck,
  },
]

const accessItems = [
  "Akses berbasis role untuk admin, pendaftaran, dokter, perawat, dan apoteker.",
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
          width={520}
          height={520}
          priority
          className="pointer-events-none absolute -right-24 top-16 -z-10 size-[22rem] bg-transparent opacity-[0.04] sm:size-[28rem] lg:right-10 lg:top-10 lg:size-[32rem]"
        />
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="MedNote">
              <Image src="/assets/health.png" alt="MedNote Logo" width={36} height={36} className="size-9 shrink-0 bg-transparent" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">MedNote</p>
                <p className="truncate text-xs text-muted-foreground">Rekam medis elektronik</p>
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
                Aplikasi internal untuk operasional klinik
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-normal text-balance sm:text-5xl lg:text-6xl">
                MedNote membantu klinik mencatat rekam medis dengan alur yang rapi.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Kelola pasien, kunjungan, tanda vital, pemeriksaan dokter, resep, obat, dokumen medis, laporan, dan audit aktivitas dalam satu aplikasi web standalone.
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
                    <p className="text-sm font-semibold">Dashboard klinik</p>
                    <p className="mt-1 text-xs text-muted-foreground">Ringkasan alur layanan hari ini</p>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Role based</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ["Pasien aktif", "128", UsersRound],
                    ["Kunjungan", "42", Activity],
                    ["Rekam medis", "36", FileText],
                    ["Resep diproses", "18", Pill],
                  ].map(([label, value, Icon]) => (
                    <div key={label as string} className="rounded-md border border-border bg-card p-3">
                      <Icon className="size-4 text-primary" aria-hidden="true" />
                      <p className="mt-3 text-xs text-muted-foreground">{label as string}</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">{value as string}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-md border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Alur pasien</p>
                    <span className="text-xs text-muted-foreground">Tersinkron</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {["Pendaftaran", "Tanda vital", "Pemeriksaan dokter", "Farmasi"].map((step, index) => (
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
              MedNote berdiri sebagai aplikasi internal tanpa integrasi BPJS, SATUSEHAT, SIMRS, payment gateway, atau layanan autentikasi eksternal. Fokusnya adalah pencatatan klinis yang terstruktur, pencarian riwayat pasien yang cepat, dan kontrol akses sesuai peran kerja.
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
            <h2 className="text-2xl font-semibold tracking-normal">Mulai dari akun yang diberikan administrator klinik.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Halaman login tetap terpisah agar akses aplikasi jelas. Setelah masuk, user langsung melihat dashboard dan menu sesuai role yang dimiliki.
            </p>
            <Button asChild size="lg" className="mt-6 h-11 w-full sm:w-fit">
              <Link href="/login">
                Masuk ke MedNote
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
