"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      <div key={`${pathname}-indicator`} className="route-transition-indicator" aria-hidden="true" />
      <div key={pathname} className="route-content-transition">
        {children}
      </div>
    </>
  )
}
