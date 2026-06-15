import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_28rem),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--muted),var(--background)_60%))] px-4 text-foreground">
      <section className="w-full max-w-lg rounded-md border border-border bg-background/85 p-6 shadow-sm backdrop-blur">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Alamat yang dibuka tidak tersedia di aplikasi rekam medis ini.
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/">Kembali ke dashboard</Link>
        </Button>
      </section>
    </main>
  )
}
