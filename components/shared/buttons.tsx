"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog } from "radix-ui"
import { LoaderCircle } from "lucide-react"

export function ConfirmSubmitButton({
  children,
  message,
  confirmLabel,
  pending,
  pendingLabel,
  variant = "default",
  disabled = false,
  name,
  value,
}: {
  children: React.ReactNode
  message: string
  confirmLabel: string
  pending: boolean
  pendingLabel: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  disabled?: boolean
  name?: string
  value?: string
}) {
  const [open, setOpen] = React.useState(false)
  const submitButtonRef = React.useRef<HTMLButtonElement>(null)
  const isDestructive = variant === "destructive"

  return (
    <>
      <Button type="button" variant={variant} size="lg" className="w-full sm:w-fit" disabled={disabled || pending} aria-busy={pending} onClick={() => setOpen(true)}>
        {pending ? pendingLabel : children}
      </Button>
      <button ref={submitButtonRef} type="submit" name={name} value={value} className="hidden" tabIndex={-1} aria-hidden="true" />

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[60] grid w-[calc(100vw-1.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-md border border-border bg-background p-4 shadow-2xl outline-none sm:p-6"
            onEscapeKeyDown={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
          >
            <div>
              <Dialog.Title className="text-base font-semibold leading-snug sm:text-lg">{message}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">Tindakan ini tidak dapat dibatalkan. Pastikan data yang dimasukkan sudah benar.</Dialog.Description>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" disabled={pending}>
                  Batal
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                size="lg"
                variant={isDestructive ? "destructive" : "default"}
                className="w-full sm:w-auto"
                disabled={pending}
                aria-busy={pending}
                onClick={() => {
                  if (submitButtonRef.current) {
                    submitButtonRef.current.click()
                    setOpen(false)
                  }
                }}
              >
                {confirmLabel}
              </Button>
            </div>
            {pending ? (
              <div className="absolute inset-0 z-10 grid place-items-center rounded-md bg-background/80 backdrop-blur-sm">
                <div className="mx-auto grid size-12 place-items-center rounded-md bg-primary/10 text-primary">
                  <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
                </div>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
