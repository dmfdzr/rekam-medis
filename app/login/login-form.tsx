"use client"

import { useActionState } from "react"
import { LockKeyhole, LogIn, Mail } from "lucide-react"

import { loginAction, type LoginFormState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

const initialState: LoginFormState = {}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <label htmlFor="identifier" className="text-sm font-medium">
          Email atau username
        </label>
        <div className="flex min-h-11 items-center rounded-md border border-input bg-background px-3 transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25">
          <Mail className="mr-2 size-4 text-muted-foreground" aria-hidden="true" />
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="admin@medrecord.local"
            aria-describedby={state.errors?.identifier ? "identifier-error" : undefined}
            aria-invalid={Boolean(state.errors?.identifier)}
          />
        </div>
        {state.errors?.identifier ? (
          <p id="identifier-error" className="text-sm text-destructive" role="alert">
            {state.errors.identifier[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="flex min-h-11 items-center rounded-md border border-input bg-background px-3 transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25">
          <LockKeyhole className="mr-2 size-4 text-muted-foreground" aria-hidden="true" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="Masukkan password"
            aria-describedby={state.errors?.password ? "password-error" : undefined}
            aria-invalid={Boolean(state.errors?.password)}
          />
        </div>
        {state.errors?.password ? (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {state.errors.password[0]}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {state.message}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="min-h-11 w-full" disabled={pending}>
        <LogIn className="size-4" aria-hidden="true" />
        {pending ? "Memeriksa akun..." : "Masuk"}
      </Button>

      <div className="rounded-md border border-border bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
        Demo: gunakan `admin`, `pendaftaran`, `dokter`, `perawat`, atau `apoteker` dengan password `rekammedis123`.
      </div>
    </form>
  )
}
