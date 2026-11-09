"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerHistory } from "@/composition/services"
export type { HistoryRow } from "@/domain/services/customer-history"

export function useCustomerHistory(phone: string) {
  return useQuery({
    queryKey: ["appointments", "customer-history", phone],
    queryFn: ({ signal }) => getCustomerHistory(phone, signal),
  })
}
