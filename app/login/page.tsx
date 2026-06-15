import Image from "next/image"
import { redirect } from "next/navigation"
import { ClipboardCheck, Stethoscope } from "lucide-react"

import { LoginForm } from "@/app/login/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { getCurrentUser } from "@/lib/auth/current-user"

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/")
  }

  return (
    <main className="relative min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_26rem),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--muted),var(--background)_64%))] px-4 py-6 text-foreground">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <Image src="/assets/health.png" alt="MedNote Logo" width={18} height={18} className="size-4.5" />
              Rekam medis elektronik klinik
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal text-balance xl:text-5xl">
              Data pasien, pemeriksaan, dan resep dalam satu alur kerja klinik.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Akses aplikasi sesuai peran kerja untuk membantu pendaftaran, pemeriksaan, farmasi, laporan, dan pengelolaan data medis.
            </p>

            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-card p-4 shadow-sm">
                <Stethoscope className="size-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Alur pemeriksaan</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Kunjungan, tanda vital, rekam medis, tindakan, dan resep tercatat rapi.</p>
              </div>
              <div className="rounded-md border border-border bg-card p-4 shadow-sm">
                <ClipboardCheck className="size-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Kontrol akses</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Setiap pengguna hanya melihat menu dan data sesuai tanggung jawabnya.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-md border border-border bg-background/88 p-5 shadow-xl backdrop-blur md:p-6">
          <div className="mb-6">
            <Image src="/assets/health.png" alt="MedNote Logo" width={40} height={40} className="size-10" />
            <h2 className="mt-5 text-2xl font-semibold tracking-normal">Masuk ke MedNote</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Gunakan akun yang diberikan administrator klinik untuk mengakses aplikasi.
            </p>
          </div>
          <LoginForm />
        </section>
      </div>
    </main>
  )
}
