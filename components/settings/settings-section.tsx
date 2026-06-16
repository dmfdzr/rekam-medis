"use client"

import { type AppUser } from "@/lib/data/clinic"

import * as React from "react"

import { Panel } from "@/components/shared/layout"
import { UpdateAccountForm, ChangePasswordForm } from "./settings-forms"

export function SettingsSection({ user }: { user: AppUser }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Profil akun" description="Informasi akun yang sedang digunakan pada session aktif.">
        <div className="grid gap-3 rounded-md border border-border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">Nama</p>
            <p className="mt-1 font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-1 font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Username</p>
            <p className="mt-1 font-medium">{user.username}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="mt-1 font-medium">{user.roleName}</p>
          </div>
        </div>
      </Panel>
      <div className="grid gap-5">
        <Panel title="Update profil" description="Perbarui nama, email, dan username akun yang sedang digunakan.">
          <UpdateAccountForm user={user} />
        </Panel>
        <Panel title="Ganti password" description="Gunakan password lama untuk memverifikasi perubahan password akun.">
          <ChangePasswordForm />
        </Panel>
      </div>
    </div>
  )
}

