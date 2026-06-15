"use client"

import { useActionState } from "react"
import { Dialog } from "radix-ui"
import { LoaderCircle, LockKeyhole, LogIn, Mail } from "lucide-react"

import { loginAction, type LoginFormState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

const initialState: LoginFormState = {}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <>
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
              placeholder="Email atau username"
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
      </form>

      <Dialog.Root open={pending}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 grid w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-3 rounded-md border border-border bg-background p-5 text-center shadow-2xl outline-none"
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <div className="mx-auto grid size-12 place-items-center rounded-md bg-primary/10 text-primary">
              <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
            </div>
            <Dialog.Title className="text-base font-semibold">Memeriksa akun</Dialog.Title>
            <Dialog.Description className="text-sm leading-6 text-muted-foreground">
              Mohon tunggu sebentar. Akses akan dibuka setelah akun berhasil diverifikasi.
            </Dialog.Description>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
