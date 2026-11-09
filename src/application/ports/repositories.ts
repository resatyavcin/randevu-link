import type { AvailabilityRepository } from "./appointments"
import type { AppointmentsRepository } from "./appointments"
import type { CustomersRepository } from "./appointments"
import type { AuthRepository } from "./auth"
import type { StaffPortalRepository } from "./auth"
import type { ServicesRepository } from "./catalog"
import type { ServiceCategoriesRepository } from "./catalog"
import type { RolesRepository } from "./catalog"
import type { RevenueRepository } from "./revenue"
import type { RegisterSalesRepository } from "./revenue"
import type { SessionChargesRepository } from "./revenue"
import type { SessionsRepository } from "./sessions"
import type { SessionBookingsRepository } from "./sessions"
import type { TablePreferencesRepository } from "./settings"
import type { SettingsRepository } from "./settings"
import type { StaffRepository } from "./staff"

export interface Repositories {
  availabilityApi: AvailabilityRepository
  appointmentsApi: AppointmentsRepository
  customersApi: CustomersRepository
  authApi: AuthRepository
  staffPortalApi: StaffPortalRepository
  servicesApi: ServicesRepository
  serviceCategoriesApi: ServiceCategoriesRepository
  rolesApi: RolesRepository
  revenueApi: RevenueRepository
  registerSalesApi: RegisterSalesRepository
  sessionChargesApi: SessionChargesRepository
  sessionsApi: SessionsRepository
  sessionBookingsApi: SessionBookingsRepository
  tablePreferencesApi: TablePreferencesRepository
  settingsApi: SettingsRepository
  staffApi: StaffRepository
}
