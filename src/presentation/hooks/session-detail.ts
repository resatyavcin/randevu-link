"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { servicesApi, sessionsApi, staffApi } from "@/composition/services"

export function useSessionDetail(id: string) {
  return useQuery({
    queryKey: ["sessions", "detail", id],
    queryFn: async ({ signal }) => {
      const [session, staff, services, pendingVisits, charges] = await Promise.all([
        sessionsApi.get(id, signal),
        staffApi.listAll({ active: true }, signal),
        servicesApi.listAll({ active: true }, signal),
        sessionsApi.visits(id, signal),
        sessionsApi.charges(id, signal),
      ])
      return {
        session,
        staff,
        services,
        pendingVisits,
        feeQueued: charges.some((row) => !row.extras.length),
      }
    },
    enabled: Boolean(id),
  })
}

export function useSessionActions(id: string) {
  const client = useQueryClient()
  const onSuccess = () =>
    Promise.all(
      ["sessions", "appointments", "revenue", "availability"].map((resource) =>
        client.invalidateQueries({ queryKey: [resource] }),
      ),
    )
  const queue = useMutation({ mutationFn: () => sessionsApi.queueFee(id), onSuccess })
  const complete = useMutation({
    mutationFn: (body: Parameters<typeof sessionsApi.completeFromCredit>[1]) =>
      sessionsApi.completeFromCredit(id, body),
    onSuccess,
  })
  const edit = useMutation({
    mutationFn: (body: Parameters<typeof sessionsApi.update>[1]) => sessionsApi.update(id, body),
    onSuccess,
  })
  const cancel = useMutation({ mutationFn: () => sessionsApi.cancel(id), onSuccess })
  const undo = useMutation({
    mutationFn: (eventId: string) => sessionsApi.deleteEvent(id, eventId),
    onSuccess,
  })
  return { queue, complete, edit, cancel, undo }
}
