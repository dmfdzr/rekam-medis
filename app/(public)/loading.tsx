import Image from "next/image"

export default function Loading() {
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.10),transparent_28rem),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--muted),var(--background)_68%))] text-foreground">
      <section className="relative isolate min-h-dvh overflow-hidden border-b border-border px-4 py-4 sm:px-6 lg:px-8">
        <Image
          src="/assets/health.png"
          alt=""
          width={760}
          height={760}
          priority
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-auto w-[36rem] -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.045] sm:w-[48rem] lg:w-[64rem]"
        />
        <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-7xl flex-col">
          <header className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="size-12 animate-pulse rounded-md bg-primary/15" />
              <div className="grid gap-2">
                <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-10 animate-pulse rounded-md border border-border bg-card" />
              <div className="hidden h-10 w-32 animate-pulse rounded-md bg-primary/20 sm:block" />
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
            <div className="max-w-2xl">
              <div className="h-9 w-72 animate-pulse rounded-md border border-border bg-card" />
              <div className="mt-6 grid gap-3">
                <div className="h-12 w-full animate-pulse rounded-md bg-muted sm:h-14" />
                <div className="h-12 w-11/12 animate-pulse rounded-md bg-muted sm:h-14" />
                <div className="h-12 w-4/5 animate-pulse rounded-md bg-muted sm:h-14" />
              </div>
              <div className="mt-5 grid max-w-xl gap-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-muted" />
                <div className="h-4 w-8/12 animate-pulse rounded bg-muted" />
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <div className="h-11 w-full animate-pulse rounded-md bg-primary/20 sm:w-36" />
                <div className="h-11 w-full animate-pulse rounded-md border border-border bg-card sm:w-28" />
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-3 shadow-xl">
              <div className="rounded-md border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="grid gap-2">
                    <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-7 w-20 animate-pulse rounded-md bg-primary/15" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-28 animate-pulse rounded-md border border-border bg-card" />
                  ))}
                </div>
                <div className="mt-4 grid gap-2 rounded-md border border-border bg-card p-3">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="h-10 animate-pulse rounded-md bg-muted" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
