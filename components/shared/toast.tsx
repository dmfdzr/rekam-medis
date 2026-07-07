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
  duration: number
  closing?: boolean
}

type ToastInput = {
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  notify: (toast: ToastInput) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const timeoutRef = React.useRef<Map<string, number>>(new Map())
  const removeTimeoutRef = React.useRef<Map<string, number>>(new Map())

  const dismiss = React.useCallback((id: string) => {
    const timeout = timeoutRef.current.get(id)
    const removeTimeout = removeTimeoutRef.current.get(id)

    if (timeout) {
      window.clearTimeout(timeout)
      timeoutRef.current.delete(id)
    }

    if (removeTimeout) {
      window.clearTimeout(removeTimeout)
      removeTimeoutRef.current.delete(id)
    }

    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, closing: true } : toast)))

    const nextRemoveTimeout = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
      removeTimeoutRef.current.delete(id)
    }, 280)

    removeTimeoutRef.current.set(id, nextRemoveTimeout)
  }, [])

  const notify = React.useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID()
      const duration = toast.tone === "success" ? 3200 : 5200
      setToasts((current) => [...current.slice(-2), { ...toast, id, duration }])

      const timeout = window.setTimeout(() => dismiss(id), duration)
      timeoutRef.current.set(id, timeout)
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

  React.useEffect(() => {
    return () => {
      timeoutRef.current.forEach((timeout) => window.clearTimeout(timeout))
      removeTimeoutRef.current.forEach((timeout) => window.clearTimeout(timeout))
    }
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
                "toast-item relative overflow-hidden rounded-md border bg-popover text-sm text-popover-foreground shadow-lg",
                toast.tone === "success" ? "border-emerald-300 dark:border-emerald-400/30" : "border-destructive/40",
                toast.closing ? "toast-item-exit" : "toast-item-enter",
              )}
              role={toast.tone === "error" ? "alert" : "status"}
              style={{ "--toast-duration": `${toast.duration}ms` } as React.CSSProperties}
            >
              <div className="flex items-start gap-3 p-3 pb-3.5">
                <Icon className={cn("mt-0.5 size-4 shrink-0", toast.tone === "success" ? "text-emerald-600" : "text-destructive")} aria-hidden="true" />
                <p className="min-w-0 flex-1 leading-6">{toast.message}</p>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Tutup notifikasi" onClick={() => dismiss(toast.id)}>
                  <X className="size-3" aria-hidden="true" />
                </Button>
              </div>
              <div
                className={cn(
                  "toast-progress absolute inset-x-0 bottom-0 h-0.5 origin-left",
                  toast.tone === "success" ? "bg-emerald-500" : "bg-destructive",
                  toast.closing && "toast-progress-paused",
                )}
              />
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
