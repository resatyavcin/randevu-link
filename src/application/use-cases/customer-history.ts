import type { Repositories } from "@/application/ports/repositories"
import { historyRows } from "@/domain/services/customer-history"

export interface CustomerHistoryRepositories {
  appointmentsApi: Pick<Repositories["appointmentsApi"], "listByPhone">
  sessionsApi: Pick<Repositories["sessionsApi"], "list" | "get">
}

export function createCustomerHistory(repositories: CustomerHistoryRepositories) {
  return async (phone: string, signal?: AbortSignal) => {
    const [appointments, page] = await Promise.all([
      repositories.appointmentsApi.listByPhone(phone, undefined, signal),
      repositories.sessionsApi.list({ phone, page: 0, size: 50 }, signal),
    ])
    const sessions = await Promise.all(
      page.content.filter((row) => row.completedCount > 0)
        .map((row) => repositories.sessionsApi.get(row.id, signal)),
    )
    return historyRows(appointments, sessions)
  }
}
