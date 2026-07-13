"use client"

import { type UserListItem, type RoleOptionItem } from "@/lib/data/clinic"
import { createUserAction, updateUserAction, resetUserPasswordAction, deactivateUserAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { TextField, FormMessage, ComboboxField } from "@/components/shared/forms"
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
        <ComboboxField
          name="roleId"
          label="Role"
          items={roleOptions.map((role) => ({ value: role.id, label: role.name }))}
          placeholder="Pilih role"
          error={state.errors?.roleId}
        />
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
        <ComboboxField
          name="userId"
          label="User"
          items={userList.map((user) => ({ value: user.id, label: `${user.name} - ${user.username} - ${user.role}` }))}
          placeholder="Pilih user"
          error={state.errors?.userId}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField name="name" label="Nama baru" error={state.errors?.name?.[0]} autoComplete="name" />
          <TextField name="email" label="Email baru" type="email" error={state.errors?.email?.[0]} autoComplete="email" />
          <TextField name="username" label="Username baru" error={state.errors?.username?.[0]} autoComplete="username" />
          <ComboboxField
            name="roleId"
            label="Role baru"
            items={[
              { value: "", label: "Tidak diubah" },
              ...roleOptions.map((role) => ({ value: role.id, label: role.name })),
            ]}
            placeholder="Tidak diubah"
            error={state.errors?.roleId}
          />
          <ComboboxField
            name="status"
            label="Status baru"
            items={[
              { value: "", label: "Tidak diubah" },
              { value: "ACTIVE", label: "Aktif" },
              { value: "INACTIVE", label: "Nonaktif" },
              { value: "SUSPENDED", label: "Ditangguhkan" },
            ]}
            placeholder="Tidak diubah"
            error={state.errors?.status}
          />
        </div>
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Memperbarui..." : "Update user"}
      </Button>
    </form>
  )
}

export function ResetUserPasswordForm({ userList }: { userList: UserListItem[] }) {
  const [state, formAction, pending] = React.useActionState(resetUserPasswordAction, initialClinicFormState)
  const resettableUsers = userList.filter((user) => user.status !== "Nonaktif")

  if (resettableUsers.length === 0) {
    return <EmptyState title="Tidak ada user aktif" detail="User aktif akan muncul di sini jika perlu reset password." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <ComboboxField
          name="userId"
          label="User"
          items={resettableUsers.map((user) => ({ value: user.id, label: `${user.name} - ${user.username} - ${user.role}` }))}
          placeholder="Pilih user"
          error={state.errors?.userId}
        />
        <TextField name="password" label="Password baru" type="password" error={state.errors?.password?.[0]} autoComplete="new-password" showPasswordToggle />
        <TextField name="confirmPassword" label="Konfirmasi password" type="password" error={state.errors?.confirmPassword?.[0]} autoComplete="new-password" showPasswordToggle />
      </div>
      <DestructiveActionNotice message="Reset password akan mencabut sesi aktif user target. User perlu login ulang memakai password baru." />
      <FormMessage state={state} />
      <ConfirmSubmitButton
        message="Reset password user ini dan cabut sesi aktifnya?"
        confirmLabel="Reset password"
        pending={pending}
        pendingLabel="Mereset..."
      >
        Reset password
      </ConfirmSubmitButton>
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
      <ComboboxField
        name="userId"
        label="User"
        items={activeUsers.map((user) => ({ value: user.id, label: `${user.name} - ${user.username} - ${user.role}` }))}
        placeholder="Pilih user"
        error={state.errors?.userId}
      />
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
