"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tablePreferencesApi } from "@/composition/services"
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS, type TablePreferenceName } from "@/domain/models/contracts"

function isAllowedSize(value: number) {
  return (TABLE_PAGE_SIZE_OPTIONS as readonly number[]).includes(value)
}

export function useTablePageSize(tableName: TablePreferenceName) {
  const client = useQueryClient()
  const queryKey = ["preferences", tableName]
  const preference = useQuery({
    queryKey,
    queryFn: ({ signal }) => tablePreferencesApi.get(tableName, signal),
    staleTime: Infinity,
  })
  const save = useMutation({
    scope: { id: `table-preference-${tableName}` },
    mutationFn: (size: number) => tablePreferencesApi.save(tableName, size),
  })
  const size = preference.data?.pageSize ?? DEFAULT_TABLE_PAGE_SIZE
  const pageSize = isAllowedSize(size) ? size : DEFAULT_TABLE_PAGE_SIZE

  function setPageSize(next: number) {
    if (!isAllowedSize(next) || next === pageSize) return
    void client.cancelQueries({ queryKey })
    client.setQueryData(queryKey, { tableName, pageSize: next })
    save.mutate(next)
  }

  return { pageSize, setPageSize, loaded: !preference.isPending }
}
