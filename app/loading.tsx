const skeletonItems = ["Dashboard", "Pasien", "Kunjungan", "Rekam medis", "Resep", "Obat"]

export default function Loading() {
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_28rem),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--muted),var(--background)_60%))] text-foreground">
      <div className="flex min-h-dvh">
        <aside className="hidden w-72 shrink-0 border-r border-border/80 bg-sidebar/90 p-4 lg:block">
          <div className="mb-6 flex items-center gap-3">
            <div className="size-10 animate-pulse rounded-md bg-primary/20" />
            <div className="grid gap-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="grid gap-2">
            {skeletonItems.map((item) => (
              <div key={item} className="h-11 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="border-b border-border/80 bg-background/88 px-4 py-3 md:px-6">
            <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          </header>
          <div className="grid gap-5 px-4 py-5 md:px-6 lg:px-8">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-md border border-border bg-card" />
              ))}
            </div>
            <div className="h-96 animate-pulse rounded-md border border-border bg-card" />
          </div>
        </section>
      </div>
    </main>
  )
}
