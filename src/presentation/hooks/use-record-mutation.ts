"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useRecordMutation<T>(resource: string, write: (input: T) => Promise<void>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: write,
    onSuccess: () => client.invalidateQueries({ queryKey: [resource] }),
  })
}
