"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModalDialog } from "@/components/shared/layout"

type DownloadActionProps = {
  href: string
  label: string
  loadingTitle?: string
  loadingDetail?: string
  icon?: LucideIcon
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  className?: string
  target?: string
  rel?: string
}

export function DownloadAction({
  href,
  label,
  loadingTitle = "Menyiapkan download",
  loadingDetail = "File sedang disiapkan. Download akan dimulai otomatis.",
  icon: Icon,
  variant = "outline",
  size = "lg",
  className,
  target,
  rel,
}: DownloadActionProps) {
  const [loading, setLoading] = React.useState(false)

  function handleClick() {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 2500)
  }

  return (
    <>
      <Button asChild variant={variant} size={size} className={className}>
        <a href={href} target={target} rel={rel} onClick={handleClick}>
          {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
          {label}
        </a>
      </Button>
      <ModalDialog open={loading} onOpenChange={setLoading} title={loadingTitle} description={loadingDetail}>
        <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Mohon tunggu sebentar.</p>
        </div>
      </ModalDialog>
    </>
  )
}
