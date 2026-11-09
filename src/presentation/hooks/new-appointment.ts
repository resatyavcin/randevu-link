"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { appointmentsApi, servicesApi, staffApi } from "@/composition/services"

export function useAvailableServices(enabled = true) {
  return useQuery({
    queryKey: ["services", "active"],
    enabled,
    queryFn: ({ signal }) => servicesApi.listAll({ active: true }, signal),
  })
}

export function useAvailableStaff(serviceId: string | null, enabled = Boolean(serviceId)) {
  return useQuery({
    queryKey: ["personel", "available", serviceId],
    queryFn: ({ signal }) => staffApi.listAll({ active: true, serviceId }, signal),
    enabled,
  })
}

export function useAvailableSlots(serviceId: string, staffId: string, date: string) {
  return useQuery({
    queryKey: ["availability", staffId, serviceId, date],
    queryFn: ({ signal }) => staffApi.availability(staffId, date, signal, serviceId),
    enabled: Boolean(staffId && serviceId && date),
  })
}

export function useCreateAppointment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: appointmentsApi.create,
    onSettled: () => client.invalidateQueries({ queryKey: ["availability"] }),
    onSuccess: async () => {
      await Promise.all(
        ["appointments", "revenue"].map((key) => client.invalidateQueries({ queryKey: [key] })),
      )
    },
  })
}
