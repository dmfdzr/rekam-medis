"use client"

import { type UserListItem, type RoleOptionItem } from "@/lib/data/clinic"
import { createUserAction, updateUserAction, deactivateUserAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { TextField, FieldError, FormMessage } from "@/components/shared/forms"
import { EmptyState, DestructiveActionNotice } from "@/components/shared/feedback"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { Button } from "@/components/ui/button"

const initialClinicFormState: ClinicFormState = {}

export function CreateUserForm({ roleOptions }: { roleOptions: RoleOptionItem[] }) {
  const [state, formAction, pending] = React.useActionState(createUserAction, initialClinicFormState)

  if (roleOptions.length === 0) {
    return <EmptyState title="Role belum tersedia" detail="Hubungi administrator sistem sebelum membuat user baru." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <TextField name="name" label="Nama user" error={state.errors?.name?.[0]} autoComplete="name" />
        <TextField name="email" label="Email" type="email" error={state.errors?.email?.[0]} autoComplete="email" />
        <TextField name="username" label="Username" error={state.errors?.username?.[0]} autoComplete="username" />
        <TextField name="password" label="Password awal" type="password" error={state.errors?.password?.[0]} autoComplete="new-password" showPasswordToggle />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Role</span>
          <select
            name="roleId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.roleId)}
          >
            <option value="">Pilih role</option>
            {roleOptions.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.roleId?.[0]} />
        </label>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Membuat user..." : "Tambah user"}
      </Button>
    </form>
  )
}

export function UpdateUserForm({ userList, roleOptions }: { userList: UserListItem[]; roleOptions: RoleOptionItem[] }) {
  const [state, formAction, pending] = React.useActionState(updateUserAction, initialClinicFormState)

  if (userList.length === 0) {
    return <EmptyState title="Belum ada user" detail="Tambahkan user terlebih dahulu sebelum memperbarui data akun." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">User</span>
          <select
            name="userId"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            aria-invalid={Boolean(state.errors?.userId)}
          >
            <option value="">Pilih user</option>
            {userList.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.username} - {user.role}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.userId?.[0]} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField name="name" label="Nama baru" error={state.errors?.name?.[0]} autoComplete="name" />
          <TextField name="email" label="Email baru" type="email" error={state.errors?.email?.[0]} autoComplete="email" />
          <TextField name="username" label="Username baru" error={state.errors?.username?.[0]} autoComplete="username" />
          <TextField name="password" label="Password baru" type="password" error={state.errors?.password?.[0]} autoComplete="new-password" showPasswordToggle />
          <p className="text-xs text-muted-foreground">Kosongkan jika password tidak diubah.</p>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Role baru</span>
            <select
              name="roleId"
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
              aria-invalid={Boolean(state.errors?.roleId)}
            >
              <option value="">Tidak diubah</option>
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <FieldError message={state.errors?.roleId?.[0]} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Status baru</span>
            <select
              name="status"
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
              aria-invalid={Boolean(state.errors?.status)}
            >
              <option value="">Tidak diubah</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
              <option value="SUSPENDED">Ditangguhkan</option>
            </select>
            <FieldError message={state.errors?.status?.[0]} />
          </label>
        </div>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Memperbarui..." : "Update user"}
      </Button>
    </form>
  )
}

export function DeactivateUserForm({ userList }: { userList: UserListItem[] }) {
  const [state, formAction, pending] = React.useActionState(deactivateUserAction, initialClinicFormState)
  const activeUsers = userList.filter((user) => user.status !== "Nonaktif")

  if (activeUsers.length === 0) {
    return <EmptyState title="Tidak ada user aktif" detail="User aktif akan muncul di sini jika perlu dinonaktifkan." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">User</span>
        <select
          name="userId"
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
          aria-invalid={Boolean(state.errors?.userId)}
        >
          <option value="">Pilih user</option>
          {activeUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.username} - {user.role}
            </option>
          ))}
        </select>
        <FieldError message={state.errors?.userId?.[0]} />
      </label>
      <DestructiveActionNotice message="User tidak dihapus permanen. Akun menjadi nonaktif dan sesi aktifnya dicabut agar akses berhenti." />
      <FormMessage state={state} />
      <ConfirmSubmitButton
        message="Nonaktifkan user ini dan cabut sesi aktifnya?"
        confirmLabel="Nonaktifkan user"
        pending={pending}
        pendingLabel="Menonaktifkan..."
        variant="destructive"
      >
        Nonaktifkan user
      </ConfirmSubmitButton>
    </form>
  )
}

