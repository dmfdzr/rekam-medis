"use client"

import { logoutAction } from "@/app/actions/auth"

import { useFormStatus } from "react-dom"
import { Dialog } from "radix-ui"
import { AlertTriangle, Clock3, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"

export function LogoutConfirmDialog({ className }: { className?: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button type="button" variant="outline" size="sm" className={className}>
          <LogOut className="size-3" aria-hidden="true" />
          Logout
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-96 -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-md border border-border bg-background p-4 shadow-2xl outline-none sm:w-[min(24rem,calc(100vw-2rem))] sm:p-5"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <form action={logoutAction} className="relative grid gap-4">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold">Keluar dari aplikasi?</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                  Sesi kerja akan ditutup. Pastikan perubahan data yang sedang dikerjakan sudah tersimpan.
                </Dialog.Description>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="lg">
                  Batal
                </Button>
              </Dialog.Close>
              <LogoutSubmitButton />
            </div>
            <LogoutPendingOverlay />
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function LogoutSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="destructive" size="lg" className="w-full sm:w-fit" disabled={pending} aria-busy={pending}>
      {pending ? <Clock3 className="size-4 animate-spin" aria-hidden="true" /> : <LogOut className="size-4" aria-hidden="true" />}
      {pending ? "Keluar..." : "Keluar"}
    </Button>
  )
}

function LogoutPendingOverlay() {
  const { pending } = useFormStatus()

  if (!pending) {
    return null
  }

  return (
    <div className="absolute inset-0 grid place-items-center rounded-md bg-background/90 p-5 text-center backdrop-blur-sm" role="status" aria-live="polite">
      <div className="grid justify-items-center gap-3">
        <div className="grid size-11 place-items-center rounded-md bg-primary/10 text-primary">
          <Clock3 className="size-5 animate-spin" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold">Mengakhiri sesi</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Mohon tunggu sebentar.</p>
        </div>
      </div>
    </div>
  )
}

