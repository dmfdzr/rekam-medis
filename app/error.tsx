"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_28rem),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--muted),var(--background)_60%))] px-4 text-foreground">
      <section className="w-full max-w-lg rounded-md border border-border bg-background/85 p-6 shadow-sm backdrop-blur">
        <p className="text-sm font-medium text-destructive">Terjadi kesalahan</p>
        <h1 className="mt-2 text-2xl font-semibold">Halaman tidak dapat dimuat</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sistem gagal memuat data. Coba ulangi proses ini. Jika masih terjadi, periksa koneksi database atau session login.
        </p>
        {error.digest ? <p className="mt-3 text-xs text-muted-foreground">Kode error: {error.digest}</p> : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button type="button" size="lg" onClick={reset}>
            Coba lagi
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => window.location.assign("/login")}>
            Kembali ke login
          </Button>
        </div>
      </section>
    </main>
  )
}
