"use client"

import * as React from "react"
import { Dialog } from "radix-ui"
import { ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PermissionNotice } from "./feedback"
import { cn } from "@/lib/utils"

export function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-background/75 p-4 shadow-sm backdrop-blur md:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function MetricCard({ label, value, change, detail, tone }: { label: string; value: string; change: string; detail: string; tone: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("rounded-md bg-muted px-2 py-1 text-xs font-medium", tone)}>{change}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

export function ModalDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-md border border-border bg-background p-4 shadow-2xl outline-none sm:w-[min(42rem,calc(100vw-2rem))] sm:p-5"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Tutup dialog">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export type ChoiceFormOption = {
  id: string
  title: string
  description: string
  content: React.ReactNode
}

export function ChoiceFormSwitch({
  options,
  emptyMessage,
}: {
  options: ChoiceFormOption[]
  emptyMessage: string
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const selectedOption = options.find((option) => option.id === selectedId)

  if (options.length === 0) {
    return <PermissionNotice message={emptyMessage} />
  }

  if (selectedOption) {
    return (
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{selectedOption.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{selectedOption.description}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(null)}>
            <ChevronRight className="size-3 rotate-180" aria-hidden="true" />
            Pilihan
          </Button>
        </div>
        {selectedOption.content}
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setSelectedId(option.id)}
          className="group rounded-md border border-border bg-card p-4 text-left outline-none transition hover:border-primary/50 hover:bg-accent/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
        >
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{option.title}</span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">{option.description}</span>
            </span>
            <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
          </span>
        </button>
      ))}
    </div>
  )
}

