import type { Metadata } from "next"
import { Geist_Mono, Outfit } from "next/font/google"

import "./globals.css"
import "leaflet/dist/leaflet.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PageTransition } from "@/components/page-transition"
import { ToastProvider } from "@/components/shared/toast"
import { cn } from "@/lib/utils";

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Rekam Medis Elektronik",
  description: "Aplikasi rekam medis elektronik standalone untuk operasional klinik.",
  icons: {
    icon: "/assets/ueu.png",
    shortcut: "/assets/ueu.png",
    apple: "/assets/ueu.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", outfit.variable)}
    >
      <body>
        <ThemeProvider>
          <ToastProvider>
            <PageTransition>{children}</PageTransition>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
