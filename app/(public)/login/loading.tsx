import Image from "next/image"
import { ArrowLeft } from "lucide-react"

export default function Loading() {
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_28rem),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--muted),var(--background)_68%))] px-4 py-4 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-3">
          <div className="inline-flex h-10 items-center gap-2 rounded-md px-3">
            <ArrowLeft className="size-4 text-muted-foreground" aria-hidden="true" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
          <div className="size-10 animate-pulse rounded-md border border-border bg-card" />
        </header>

        <section className="grid flex-1 place-items-center py-8">
          <div className="w-full max-w-md rounded-md border border-border bg-background/90 p-5 shadow-xl backdrop-blur md:p-6">
            <div className="mb-6">
              <Image src="/assets/ueu.png" alt="" width={64} height={64} className="h-14 w-auto bg-transparent object-contain opacity-40" />
              <div className="mt-5 h-7 w-64 animate-pulse rounded-md bg-muted" />
              <div className="mt-3 grid gap-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-9/12 animate-pulse rounded bg-muted" />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                <div className="h-9 animate-pulse rounded-md border border-border bg-input/20" />
              </div>
              <div className="grid gap-2">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-9 animate-pulse rounded-md border border-border bg-input/20" />
              </div>
              <div className="h-10 animate-pulse rounded-md bg-primary/20" />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
