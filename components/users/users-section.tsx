"use client"

import { type UserListItem, type RoleOptionItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"

import * as React from "react"

import { getUniqueOptions } from "@/lib/utils"
import { useListControls } from "@/lib/hooks"
import { EmptyState, StatusBadge } from "@/components/shared/feedback"
import { Panel, ModalDialog, ChoiceFormSwitch, type ChoiceFormOption } from "@/components/shared/layout"
import { ListToolbar, FilterModal, PaginationControls } from "@/components/shared/list-controls"
import { CreateUserForm, UpdateUserForm, ResetUserPasswordForm, DeactivateUserForm } from "./user-forms"

export function UsersSection({
  role,
  userList,
  roleOptions,
  filtersOpen,
  composerOpen,
  onFiltersOpenChange,
  onComposerOpenChange,
}: {
  role: RoleKey
  userList: UserListItem[]
  roleOptions: RoleOptionItem[]
  filtersOpen: boolean
  composerOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
  onComposerOpenChange: (open: boolean) => void
}) {
  const canCreate = role === "admin"
  const userActions: ChoiceFormOption[] = canCreate
    ? [
        {
          id: "create-user",
          title: "Tambah user",
          description: "Buat akun internal dengan role, username, email, dan password awal.",
          content: <CreateUserForm roleOptions={roleOptions} />,
        },
        {
          id: "update-user",
          title: "Update user",
          description: "Ubah profil akun, role, atau status user sesuai kebutuhan operasional.",
          content: <UpdateUserForm userList={userList} roleOptions={roleOptions} />,
        },
        {
          id: "reset-user-password",
          title: "Reset password",
          description: "Atur password baru untuk user aktif dan cabut sesi yang sedang berjalan.",
          content: <ResetUserPasswordForm userList={userList} />,
        },
        {
          id: "deactivate-user",
          title: "Nonaktifkan user",
          description: "Nonaktifkan akun dan cabut sesi aktif tanpa menghapus audit aktivitas sebelumnya.",
          content: <DeactivateUserForm userList={userList} />,
        },
      ]
    : []
  const userStatuses = React.useMemo(() => getUniqueOptions(userList, (user) => user.status), [userList])
  const searchSelector = React.useCallback(
    (user: UserListItem) => [user.name, user.email, user.username, user.role, user.roleKey, user.status],
    [],
  )
  const filterSelector = React.useCallback((user: UserListItem, value: string) => user.status === value, [])
  const controls = useListControls({
    items: userList,
    search: searchSelector,
    filter: filterSelector,
  })

  return (
    <div className="grid gap-5">
      <Panel title="User aplikasi" description="Akun internal, role, status, dan jejak login terakhir dari database.">
        <ListToolbar
          query={controls.query}
          onQueryChange={controls.setQuery}
          searchPlaceholder="Cari nama, email, username, role"
          resultCount={controls.totalItems}
          totalCount={userList.length}
        />
        <div className="grid gap-3">
          {controls.paginatedItems.length === 0 ? (
            <EmptyState title={userList.length === 0 ? "Belum ada user" : "User tidak ditemukan"} detail="Ubah kata kunci atau filter status untuk melihat akun lain." />
          ) : (
            controls.paginatedItems.map((user) => (
              <div key={user.id} className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-[1fr_0.55fr_0.35fr_0.55fr] md:items-center">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user.username} - {user.email}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{user.role}</p>
                <StatusBadge label={user.status} />
                <div className="text-sm tabular-nums text-muted-foreground">
                  <p>{user.lastLogin}</p>
                  <p className="mt-1 text-xs">Dibuat {user.createdAt}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
      </Panel>
      <FilterModal
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Filter user"
        description="Batasi daftar user berdasarkan status akun."
        filterValue={controls.filterValue}
        onFilterChange={controls.setFilterValue}
        filterOptions={userStatuses}
      />
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola user" description="Pilih aksi pengelolaan user yang ingin dikerjakan.">
        <ChoiceFormSwitch key={composerOpen ? "users-open" : "users-closed"} options={userActions} emptyMessage="Manajemen user hanya tersedia untuk admin." />
      </ModalDialog>
    </div>
  )
}
