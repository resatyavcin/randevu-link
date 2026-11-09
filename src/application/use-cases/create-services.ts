import type { Repositories } from "@/application/ports/repositories"

/** Bind application operations to injected repositories. No framework or storage dependencies. */
export function createServices(repositories: Repositories) {
  return {
    availabilityApi: {
      days: (...args: Parameters<Repositories["availabilityApi"]["days"]>) => repositories.availabilityApi.days(...args),
    },
    appointmentsApi: {
      list: (...args: Parameters<Repositories["appointmentsApi"]["list"]>) => repositories.appointmentsApi.list(...args),
      create: (...args: Parameters<Repositories["appointmentsApi"]["create"]>) => repositories.appointmentsApi.create(...args),
      listByPhone: (...args: Parameters<Repositories["appointmentsApi"]["listByPhone"]>) => repositories.appointmentsApi.listByPhone(...args),
      lookup: (...args: Parameters<Repositories["appointmentsApi"]["lookup"]>) => repositories.appointmentsApi.lookup(...args),
      collect: (...args: Parameters<Repositories["appointmentsApi"]["collect"]>) => repositories.appointmentsApi.collect(...args),
      cancel: (...args: Parameters<Repositories["appointmentsApi"]["cancel"]>) => repositories.appointmentsApi.cancel(...args),
    },
    customersApi: {
      history: (...args: Parameters<Repositories["customersApi"]["history"]>) => repositories.customersApi.history(...args),
    },
    authApi: {
      requestOtp: (...args: Parameters<Repositories["authApi"]["requestOtp"]>) => repositories.authApi.requestOtp(...args),
      verifyOtp: (...args: Parameters<Repositories["authApi"]["verifyOtp"]>) => repositories.authApi.verifyOtp(...args),
      logout: (...args: Parameters<Repositories["authApi"]["logout"]>) => repositories.authApi.logout(...args),
      me: (...args: Parameters<Repositories["authApi"]["me"]>) => repositories.authApi.me(...args),
    },
    staffPortalApi: {
      requestOtp: (...args: Parameters<Repositories["staffPortalApi"]["requestOtp"]>) => repositories.staffPortalApi.requestOtp(...args),
      login: (...args: Parameters<Repositories["staffPortalApi"]["login"]>) => repositories.staffPortalApi.login(...args),
      me: (...args: Parameters<Repositories["staffPortalApi"]["me"]>) => repositories.staffPortalApi.me(...args),
      appointments: (...args: Parameters<Repositories["staffPortalApi"]["appointments"]>) => repositories.staffPortalApi.appointments(...args),
    },
    servicesApi: {
      list: (...args: Parameters<Repositories["servicesApi"]["list"]>) => repositories.servicesApi.list(...args),
      counts: (...args: Parameters<Repositories["servicesApi"]["counts"]>) => repositories.servicesApi.counts(...args),
      listAll: (...args: Parameters<Repositories["servicesApi"]["listAll"]>) => repositories.servicesApi.listAll(...args),
      create: (...args: Parameters<Repositories["servicesApi"]["create"]>) => repositories.servicesApi.create(...args),
      update: (...args: Parameters<Repositories["servicesApi"]["update"]>) => repositories.servicesApi.update(...args),
      remove: (...args: Parameters<Repositories["servicesApi"]["remove"]>) => repositories.servicesApi.remove(...args),
    },
    serviceCategoriesApi: {
      list: (...args: Parameters<Repositories["serviceCategoriesApi"]["list"]>) => repositories.serviceCategoriesApi.list(...args),
      adminList: (...args: Parameters<Repositories["serviceCategoriesApi"]["adminList"]>) => repositories.serviceCategoriesApi.adminList(...args),
      create: (...args: Parameters<Repositories["serviceCategoriesApi"]["create"]>) => repositories.serviceCategoriesApi.create(...args),
      update: (...args: Parameters<Repositories["serviceCategoriesApi"]["update"]>) => repositories.serviceCategoriesApi.update(...args),
      remove: (...args: Parameters<Repositories["serviceCategoriesApi"]["remove"]>) => repositories.serviceCategoriesApi.remove(...args),
    },
    rolesApi: {
      list: (...args: Parameters<Repositories["rolesApi"]["list"]>) => repositories.rolesApi.list(...args),
      adminList: (...args: Parameters<Repositories["rolesApi"]["adminList"]>) => repositories.rolesApi.adminList(...args),
      create: (...args: Parameters<Repositories["rolesApi"]["create"]>) => repositories.rolesApi.create(...args),
      update: (...args: Parameters<Repositories["rolesApi"]["update"]>) => repositories.rolesApi.update(...args),
      remove: (...args: Parameters<Repositories["rolesApi"]["remove"]>) => repositories.rolesApi.remove(...args),
    },
    revenueApi: {
      summary: (...args: Parameters<Repositories["revenueApi"]["summary"]>) => repositories.revenueApi.summary(...args),
      payments: (...args: Parameters<Repositories["revenueApi"]["payments"]>) => repositories.revenueApi.payments(...args),
    },
    registerSalesApi: {
      create: (...args: Parameters<Repositories["registerSalesApi"]["create"]>) => repositories.registerSalesApi.create(...args),
    },
    sessionChargesApi: {
      listPending: (...args: Parameters<Repositories["sessionChargesApi"]["listPending"]>) => repositories.sessionChargesApi.listPending(...args),
      collect: (...args: Parameters<Repositories["sessionChargesApi"]["collect"]>) => repositories.sessionChargesApi.collect(...args),
    },
    sessionsApi: {
      list: (...args: Parameters<Repositories["sessionsApi"]["list"]>) => repositories.sessionsApi.list(...args),
      debts: (...args: Parameters<Repositories["sessionsApi"]["debts"]>) => repositories.sessionsApi.debts(...args),
      get: (...args: Parameters<Repositories["sessionsApi"]["get"]>) => repositories.sessionsApi.get(...args),
      create: (...args: Parameters<Repositories["sessionsApi"]["create"]>) => repositories.sessionsApi.create(...args),
      update: (...args: Parameters<Repositories["sessionsApi"]["update"]>) => repositories.sessionsApi.update(...args),
      pay: (...args: Parameters<Repositories["sessionsApi"]["pay"]>) => repositories.sessionsApi.pay(...args),
      completeFromCredit: (...args: Parameters<Repositories["sessionsApi"]["completeFromCredit"]>) => repositories.sessionsApi.completeFromCredit(...args),
      queueFee: (...args: Parameters<Repositories["sessionsApi"]["queueFee"]>) => repositories.sessionsApi.queueFee(...args),
      queueCharge: (...args: Parameters<Repositories["sessionsApi"]["queueCharge"]>) => repositories.sessionsApi.queueCharge(...args),
      charges: (...args: Parameters<Repositories["sessionsApi"]["charges"]>) => repositories.sessionsApi.charges(...args),
      visits: (...args: Parameters<Repositories["sessionsApi"]["visits"]>) => repositories.sessionsApi.visits(...args),
      deleteEvent: (...args: Parameters<Repositories["sessionsApi"]["deleteEvent"]>) => repositories.sessionsApi.deleteEvent(...args),
      cancel: (...args: Parameters<Repositories["sessionsApi"]["cancel"]>) => repositories.sessionsApi.cancel(...args),
    },
    sessionBookingsApi: {
      listByPhone: (...args: Parameters<Repositories["sessionBookingsApi"]["listByPhone"]>) => repositories.sessionBookingsApi.listByPhone(...args),
      book: (...args: Parameters<Repositories["sessionBookingsApi"]["book"]>) => repositories.sessionBookingsApi.book(...args),
    },
    tablePreferencesApi: {
      get: (...args: Parameters<Repositories["tablePreferencesApi"]["get"]>) => repositories.tablePreferencesApi.get(...args),
      save: (...args: Parameters<Repositories["tablePreferencesApi"]["save"]>) => repositories.tablePreferencesApi.save(...args),
    },
    settingsApi: {
      bookingAppearance: (...args: Parameters<Repositories["settingsApi"]["bookingAppearance"]>) => repositories.settingsApi.bookingAppearance(...args),
      saveBookingAppearance: (...args: Parameters<Repositories["settingsApi"]["saveBookingAppearance"]>) => repositories.settingsApi.saveBookingAppearance(...args),
    },
    staffApi: {
      list: (...args: Parameters<Repositories["staffApi"]["list"]>) => repositories.staffApi.list(...args),
      listAll: (...args: Parameters<Repositories["staffApi"]["listAll"]>) => repositories.staffApi.listAll(...args),
      get: (...args: Parameters<Repositories["staffApi"]["get"]>) => repositories.staffApi.get(...args),
      create: (...args: Parameters<Repositories["staffApi"]["create"]>) => repositories.staffApi.create(...args),
      update: (...args: Parameters<Repositories["staffApi"]["update"]>) => repositories.staffApi.update(...args),
      setServices: (...args: Parameters<Repositories["staffApi"]["setServices"]>) => repositories.staffApi.setServices(...args),
      remove: (...args: Parameters<Repositories["staffApi"]["remove"]>) => repositories.staffApi.remove(...args),
      availability: (...args: Parameters<Repositories["staffApi"]["availability"]>) => repositories.staffApi.availability(...args),
    },
  }
}
