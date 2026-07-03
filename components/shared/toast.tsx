"use client"

import * as React from "react"
import { CheckCircle2, CircleAlert, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ToastTone = "success" | "error"

type ToastItem = {
  id: string
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  notify: (toast: Omit<ToastItem, "id">) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = React.useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current.slice(-2), { ...toast, id }])
      window.setTimeout(() => dismiss(id), toast.tone === "success" ? 3200 : 5200)
    },
    [dismiss],
  )

  React.useEffect(() => {
    function preserveFormValues(event: Event) {
      event.preventDefault()
    }

    document.addEventListener("reset", preserveFormValues, true)
    return () => document.removeEventListener("reset", preserveFormValues, true)
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed right-4 top-4 z-[80] grid w-[min(24rem,calc(100vw-2rem))] gap-2" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const Icon = toast.tone === "success" ? CheckCircle2 : CircleAlert

          return (
            <div
              key={toast.id}
              className={cn(
                "flex items-start gap-3 rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-lg",
                toast.tone === "success" ? "border-emerald-300 dark:border-emerald-400/30" : "border-destructive/40",
              )}
              role={toast.tone === "error" ? "alert" : "status"}
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", toast.tone === "success" ? "text-emerald-600" : "text-destructive")} aria-hidden="true" />
              <p className="min-w-0 flex-1 leading-6">{toast.message}</p>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Tutup notifikasi" onClick={() => dismiss(toast.id)}>
                <X className="size-3" aria-hidden="true" />
              </Button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }

  return context
}

export function ToastBridge({ state }: { state: { ok?: boolean; message?: string } }) {
  const { notify } = useToast()

  React.useEffect(() => {
    if (!state.message) {
      return
    }

    notify({
      tone: state.ok ? "success" : "error",
      message: state.message,
    })
  }, [notify, state])

  return null
}
