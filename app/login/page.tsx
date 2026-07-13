import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { LoginForm } from "@/app/login/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/current-user"

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/app")
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_28rem),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--muted),var(--background)_68%))] px-4 py-4 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="lg" className="h-10">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Beranda
            </Link>
          </Button>
          <ThemeToggle />
        </header>

        <section className="grid flex-1 place-items-center py-8">
          <div className="w-full max-w-md rounded-md border border-border bg-background/90 p-5 shadow-xl backdrop-blur md:p-6">
          <div className="mb-6">
            <Image src="/assets/ueu.png" alt="UEU Logo" width={64} height={64} className="h-14 w-auto bg-transparent object-contain" />
            <h2 className="mt-5 text-2xl font-semibold tracking-normal">Masuk ke Rekam Medis Elektronik</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Gunakan akun yang diberikan administrator rumah sakit untuk mengakses aplikasi.
            </p>
          </div>
          <LoginForm />
          </div>
        </section>
      </div>
    </main>
  )
}
