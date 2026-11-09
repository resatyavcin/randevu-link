import { createCustomerHistory } from "@/application/use-cases/customer-history"
import { createServices } from "@/application/use-cases/create-services"
import { availabilityApi as availabilityApiRepository, appointmentsApi as appointmentsApiRepository, customersApi as customersApiRepository } from "@/infrastructure/repositories/appointments"
import { authApi as authApiRepository, staffPortalApi as staffPortalApiRepository } from "@/infrastructure/repositories/auth"
import { servicesApi as servicesApiRepository, serviceCategoriesApi as serviceCategoriesApiRepository, rolesApi as rolesApiRepository } from "@/infrastructure/repositories/catalog"
import { revenueApi as revenueApiRepository, registerSalesApi as registerSalesApiRepository, sessionChargesApi as sessionChargesApiRepository } from "@/infrastructure/repositories/revenue"
import { sessionsApi as sessionsApiRepository, sessionBookingsApi as sessionBookingsApiRepository } from "@/infrastructure/repositories/sessions"
import { tablePreferencesApi as tablePreferencesApiRepository, settingsApi as settingsApiRepository } from "@/infrastructure/repositories/settings"
import { staffApi as staffApiRepository } from "@/infrastructure/repositories/staff"

export { ApiError } from "@/application/errors/api-error"
export { getStaffPortalToken, setStaffPortalToken } from "@/infrastructure/repositories/auth"

export const { availabilityApi, appointmentsApi, customersApi, authApi, staffPortalApi, servicesApi, serviceCategoriesApi, rolesApi, revenueApi, registerSalesApi, sessionChargesApi, sessionsApi, sessionBookingsApi, tablePreferencesApi, settingsApi, staffApi } = createServices({
  availabilityApi: availabilityApiRepository,
  appointmentsApi: appointmentsApiRepository,
  customersApi: customersApiRepository,
  authApi: authApiRepository,
  staffPortalApi: staffPortalApiRepository,
  servicesApi: servicesApiRepository,
  serviceCategoriesApi: serviceCategoriesApiRepository,
  rolesApi: rolesApiRepository,
  revenueApi: revenueApiRepository,
  registerSalesApi: registerSalesApiRepository,
  sessionChargesApi: sessionChargesApiRepository,
  sessionsApi: sessionsApiRepository,
  sessionBookingsApi: sessionBookingsApiRepository,
  tablePreferencesApi: tablePreferencesApiRepository,
  settingsApi: settingsApiRepository,
  staffApi: staffApiRepository
})

export const getCustomerHistory = createCustomerHistory({ appointmentsApi, sessionsApi })
