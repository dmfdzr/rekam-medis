"use client"

import { type AppUser } from "@/lib/data/clinic"
import { updateAccountAction, changePasswordAction } from "@/app/actions/auth"

import * as React from "react"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, FormMessage } from "@/components/shared/forms"
import { ConfirmSubmitButton } from "@/components/shared/buttons"

export function UpdateAccountForm({ user }: { user: AppUser }) {
  const [state, formAction, pending] = React.useActionState(updateAccountAction, {})
  useRefreshOnSuccess(state)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <TextField name="name" label="Nama" defaultValue={user.name} error={state.errors?.name?.[0]} autoComplete="name" />
        <TextField name="email" label="Email" type="email" defaultValue={user.email} error={state.errors?.email?.[0]} autoComplete="email" />
        <TextField name="username" label="Username" defaultValue={user.username} error={state.errors?.username?.[0]} autoComplete="username" />
      </div>
      <FormMessage state={state} />
      <ConfirmSubmitButton message="Update profil akun ini?" confirmLabel="Update profil" pending={pending} pendingLabel="Memperbarui...">
        Update profil
      </ConfirmSubmitButton>
    </form>
  )
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = React.useActionState(changePasswordAction, {})
  useRefreshOnSuccess(state)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <TextField name="currentPassword" label="Password saat ini" type="password" error={state.errors?.currentPassword?.[0]} autoComplete="current-password" showPasswordToggle />
        <TextField name="newPassword" label="Password baru" type="password" error={state.errors?.newPassword?.[0]} autoComplete="new-password" showPasswordToggle />
        <TextField name="confirmPassword" label="Konfirmasi password" type="password" error={state.errors?.confirmPassword?.[0]} autoComplete="new-password" showPasswordToggle />
      </div>
      <FormMessage state={state} />
      <ConfirmSubmitButton message="Ganti password akun sekarang?" confirmLabel="Ganti password" pending={pending} pendingLabel="Memperbarui...">
        Ganti password
      </ConfirmSubmitButton>
    </form>
  )
}

