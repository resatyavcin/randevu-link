import type { TablePreferencesRepository, SettingsRepository } from "@/application/ports/settings"
import { request } from "@/infrastructure/transport/demo-transport"
import type {
  TablePreferenceDto,
  TablePreferenceName,
  BookingAppearanceDto,
  BookingAppearanceRequest,
} from "@/domain/models/contracts"

export const tablePreferencesApi: TablePreferencesRepository = {
  get: (tableName: TablePreferenceName, signal?: AbortSignal) =>
    request<TablePreferenceDto>(`/api/admin/table-preferences/${tableName}`, {
      signal,
    }),
  save: (tableName: TablePreferenceName, pageSize: number) =>
    request<TablePreferenceDto>(`/api/admin/table-preferences/${tableName}`, {
      method: "PUT",
      body: JSON.stringify({ pageSize }),
    }),
}
export const settingsApi: SettingsRepository = {
  bookingAppearance: (signal?: AbortSignal) =>
    request<BookingAppearanceDto>(`/api/booking-link/appearance`, { signal }),
  saveBookingAppearance: (body: BookingAppearanceRequest) =>
    request<BookingAppearanceDto>(`/api/admin/settings/booking-appearance`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
}
