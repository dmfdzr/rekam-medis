import * as React from "react"
import { useRouter } from "next/navigation"

import { normalizeSearchValue } from "@/lib/utils"

export function useRefreshOnSuccess(state: { ok?: boolean; message?: string }) {
  const router = useRouter()
  const lastMessageRef = React.useRef<string | undefined>(undefined)

  React.useEffect(() => {
    if (!state.ok || !state.message || lastMessageRef.current === state.message) {
      return
    }

    lastMessageRef.current = state.message
    router.refresh()
  }, [router, state.message, state.ok])
}

const defaultPageSize = 10

export function useListControls<T>({
  items,
  pageSize = defaultPageSize,
  search,
  filter,
}: {
  items: T[]
  pageSize?: number
  search: (item: T) => string[]
  filter?: (item: T, value: string) => boolean
}) {
  const [query, setQuery] = React.useState("")
  const [filterValue, setFilterValue] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const filteredItems = React.useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query).trim()

    return items.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        search(item).some((value) => normalizeSearchValue(value).includes(normalizedQuery))
      const matchesFilter = !filter || filterValue === "all" || filter(item, filterValue)

      return matchesQuery && matchesFilter
    })
  }, [items, query, filterValue, filter, search])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  return {
    query,
    setQuery,
    filterValue,
    setFilterValue,
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems: filteredItems.length,
  }
}
