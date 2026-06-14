import { redirect } from "next/navigation"
import { Activity, Database, ShieldCheck } from "lucide-react"

import { LoginForm } from "@/app/login/login-form"
import { getCurrentUser } from "@/lib/auth/current-user"

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/")
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_26rem),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--muted),var(--background)_64%))] px-4 py-6 text-foreground">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <ShieldCheck className="mr-2 size-4 text-primary" aria-hidden="true" />
              Standalone electronic health record
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal text-balance xl:text-5xl">
              Rekam medis klinik yang rapi, aman, dan siap diaudit.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Login internal dengan database session, HTTP-only cookie, dan role access sebagai fondasi sebelum modul pasien dan pemeriksaan masuk ke produksi.
            </p>

            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-card p-4 shadow-sm">
                <Database className="size-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Supabase PostgreSQL</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Data auth dan klinik berjalan lewat Prisma schema.</p>
              </div>
              <div className="rounded-md border border-border bg-card p-4 shadow-sm">
                <Activity className="size-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Audit-ready</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Login, logout, dan aktivitas penting disiapkan untuk audit log.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-md border border-border bg-background/88 p-5 shadow-xl backdrop-blur md:p-6">
          <div className="mb-6">
            <div className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-normal">Masuk ke MedRecord</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Gunakan akun internal sesuai role klinik. Session akan disimpan sebagai cookie HTTP-only.
            </p>
          </div>
          <LoginForm />
        </section>
      </div>
    </main>
  )
}
