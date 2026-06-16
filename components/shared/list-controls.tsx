"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Dialog } from "radix-ui"
import { Button } from "@/components/ui/button"
import { ModalDialog } from "./layout"

export function FilterModal({
  open,
  onOpenChange,
  title,
  description,
  filterLabel = "Status",
  filterValue,
  onFilterChange,
  filterOptions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  filterLabel?: string
  filterValue: string
  onFilterChange: (value: string) => void
  filterOptions: string[]
}) {
  return (
    <ModalDialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">{filterLabel}</span>
        <select
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
        >
          <option value="all">Semua {filterLabel.toLowerCase()}</option>
          {filterOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" size="lg" onClick={() => onFilterChange("all")}>
          Reset
        </Button>
        <Dialog.Close asChild>
          <Button type="button" size="lg">
            Terapkan
          </Button>
        </Dialog.Close>
      </div>
    </ModalDialog>
  )
}

export function ListToolbar({
  query,
  onQueryChange,
  searchPlaceholder,
  resultCount,
  totalCount,
}: {
  query: string
  onQueryChange: (value: string) => void
  searchPlaceholder: string
  resultCount: number
  totalCount: number
}) {
  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
      <label className="flex min-h-11 items-center rounded-md border border-border bg-background px-3 text-sm">
        <Search className="mr-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="rounded-md bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          {resultCount} dari {totalCount} data
        </p>
      </div>
    </div>
  )
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Sebelumnya
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Berikutnya
        </Button>
      </div>
    </div>
  )
}

