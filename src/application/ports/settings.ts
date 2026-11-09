import type { TablePreferenceDto, TablePreferenceName, BookingAppearanceDto, BookingAppearanceRequest } from "@/domain/models/contracts";

export interface TablePreferencesRepository {
    get: (tableName: TablePreferenceName, signal?: AbortSignal) => Promise<TablePreferenceDto>;
    save: (tableName: TablePreferenceName, pageSize: number) => Promise<TablePreferenceDto>;
}

export interface SettingsRepository {
    bookingAppearance: (signal?: AbortSignal) => Promise<BookingAppearanceDto>;
    saveBookingAppearance: (body: BookingAppearanceRequest) => Promise<BookingAppearanceDto>;
}
