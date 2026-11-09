import assert from "node:assert/strict"
import { test } from "node:test"
import { demoRequest, DemoError } from "@/infrastructure/demo/backend"
import { day } from "@/infrastructure/demo/seed"
import { appointmentsApi, servicesApi, authApi, staffPortalApi } from "@/composition/services"
import type * as T from "@/domain/models/contracts"

async function call<R>(path: string, method = "GET", input?: unknown): Promise<R> {
  return await demoRequest(path, { method, body: input === undefined ? undefined : JSON.stringify(input) }) as R
}

test("salon demo: complete workflows without backend requests", async (t) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error("A demo must never access the backend") }
  const storage = new Map<string, string>()
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } } })
  Object.defineProperty(globalThis, "document", { configurable: true, value: { cookie: "" } })
  // Auth cookie writing only needs the current protocol.
  Object.assign(window, { location: { protocol: "https:" } })
  try {
    await t.test("public API uses local data, filter and pagination agree", async () => {
      const services = await servicesApi.list({ active: true, size: 2 })
      assert.equal(services.content.length, 2)
      assert.ok(services.totalElements >= 10)
      const page = await appointmentsApi.list({ from: day(), to: day(), size: 2 })
      assert.equal(page.totalElements, 6)
      assert.equal(page.content.length, 2)
      assert.equal(page.totalPages, 3)
      const filtered = await appointmentsApi.list({ from: day(), to: day(), status: "PENDING" })
      assert.ok(filtered.content.every((a) => a.date === day() && a.status === "PENDING"))
      const query = await appointmentsApi.list({ q: "Zeynep" })
      assert.ok(query.content.length > 0)
      assert.ok(query.content.every((a) => a.customerFirstName === "Zeynep"))
    })
    await t.test("booking, collision prevention, lookup, collection and revenue stay consistent", async () => {
      const services = await servicesApi.listAll()
      const service = services.find((s) => s.name === "Erkek saç kesimi")!
      const people = await call<T.PageResponse<T.StaffDto>>(`/api/staff?serviceId=${service.id}`)
      const staff = people.content[0]
      const date = day(2)
      const times = await call<string[]>(`/api/staff/${staff.id}/availability?date=${date}`)
      assert.ok(times.length)
      const request = { serviceId: service.id, staffId: staff.id, firstName: "Demo", lastName: "Danışan", phone: "5552223344", date, slot: times[0], note: "Panel notu" }
      const appointment = await appointmentsApi.create(request)
      await assert.rejects(appointmentsApi.create(request), /uygun değil/)
      const lookup = await appointmentsApi.lookup(appointment.id.replace(/-/g, "").slice(0, 8))
      assert.equal(lookup.id, appointment.id)
      assert.equal(lookup.note, request.note)
      const before = await call<T.RevenueSummaryDto>("/api/admin/revenue?days=1")
      const paid = await appointmentsApi.collect(appointment.id, { amountTl: 500, method: "CASH", staffId: staff.id })
      assert.equal(paid.status, "COMPLETED")
      const after = await call<T.RevenueSummaryDto>("/api/admin/revenue?days=1")
      assert.equal(after.totalPaidTl - before.totalPaidTl, 500)
      assert.equal(after.cashTl - before.cashTl, 500)
      assert.equal(after.totalPaidTl, after.cashTl + after.cardTl)
      assert.equal(after.totalPaidTl, after.daily.reduce((n, d) => n + d.totalTl, 0))
      const history = await call<T.CustomerHistoryItemDto[]>("/api/admin/customers/5552223344/history")
      assert.ok(history.some((h) => h.appointmentId === appointment.id && h.kind === "COMPLETED"))
      const another = await appointmentsApi.create({ ...request, slot: times[1] })
      await appointmentsApi.cancel(another.id)
      const cancelled = await appointmentsApi.list({ phone: request.phone, status: "CANCELLED" })
      assert.equal(cancelled.content[0].id, another.id)
    })
    await t.test("availability respects the selected service duration", async () => {
      const date = day(4)
      const times = await call<string[]>(`/api/staff/staff-2/availability?date=${date}&serviceId=service-4`)
      assert.ok(times.length)
      const appointment = await appointmentsApi.create({ serviceId: "service-4", staffId: "staff-2", firstName: "Ece", lastName: "Test", phone: "5552223355", date, slot: times[0] })
      const remaining = await call<string[]>(`/api/staff/staff-2/availability?date=${date}&serviceId=service-4`)
      assert.ok(!remaining.includes(appointment.slot))
      const minutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5))
      assert.ok(remaining.every((s) => Math.abs(minutes(s) - minutes(appointment.slot)) >= 150))
    })
    await t.test("catalog and staff mutations are read back with relations", async () => {
      const role = await call<T.RoleDto>("/api/admin/roles", "POST", { name: "Tırnak uzmanı" })
      const category = await call<T.ServiceCategoryDto>("/api/admin/service-categories", "POST", { name: "El & ayak bakımı", gender: "KADIN" })
      const input = { name: "Manikür", roleIds: [role.id], categoryId: category.id, durationMin: 45, priceTl: 650 }
      const service = await call<T.ServiceDto>("/api/admin/services", "POST", input)
      assert.equal(service.category.name, category.name)
      const person = await call<T.StaffDto>("/api/admin/staff", "POST", { name: "Demo Uzman", roleId: role.id, phone: "5553334455" })
      const assigned = await call<T.StaffDto>(`/api/admin/staff/${person.id}/services`, "PUT", { serviceIds: [service.id] })
      assert.deepEqual(assigned.serviceIds, [service.id])
      const edited = await call<T.ServiceDto>(`/api/admin/services/${service.id}`, "PATCH", { ...input, priceTl: 700 })
      assert.equal(edited.priceTl, 700)
      await call(`/api/admin/service-categories/${category.id}`, "PATCH", { name: "Tırnak bakımı", gender: "KADIN" })
      const rows = await call<T.PageResponse<T.ServiceDto>>(`/api/services?categoryId=${category.id}`)
      assert.equal(rows.content[0].category.name, "Tırnak bakımı")
      await call(`/api/admin/services/${service.id}`, "DELETE")
      const visible = await call<T.PageResponse<T.ServiceDto>>(`/api/services?categoryId=${category.id}&active=true`)
      assert.equal(visible.totalElements, 0)
      await call(`/api/admin/staff/${person.id}`, "DELETE")
      await call(`/api/admin/roles/${role.id}`, "DELETE")
      await call(`/api/admin/service-categories/${category.id}`, "DELETE")
    })
    await t.test("session payment, credit visit, public booking and event reversal", async () => {
      const service = (await servicesApi.listAll()).find((s) => s.name === "Cilt bakımı")!
      const session = await call<T.SessionDto>("/api/admin/sessions", "POST", { name: "Cilt bakım paketi", customerPhone: "5554445566", customerFirstName: "Deniz", customerLastName: "Test", serviceId: service.id, totalSessions: 3, totalPriceTl: 4500 })
      await assert.rejects(call(`/api/admin/sessions/${session.id}/complete-credit`, "POST", { staffId: "staff-3" }), /yeterli kredi/)
      const paid = await call<T.SessionDto>(`/api/admin/sessions/${session.id}/pay`, "POST", { amountTl: 3000, staffId: "staff-3", method: "CARD" })
      assert.equal(paid.creditBalanceTl, 3000)
      const complete = await call<T.SessionDto>(`/api/admin/sessions/${session.id}/complete-credit`, "POST", { staffId: "staff-3" })
      assert.equal(complete.completedCount, 1)
      assert.equal(complete.creditBalanceTl, 1500)
      const options = await call<T.SessionBookingOptionDto[]>("/api/session-bookings?phone=5554445566")
      assert.equal(options[0].nextIndex, 2)
      const date = day(3)
      const slots = await call<string[]>(`/api/staff/staff-3/availability?date=${date}`)
      const booking = await call<T.SessionBookingResultDto>(`/api/session-bookings/${session.id}`, "POST", { phone: "5554445566", staffId: "staff-3", date, slot: slots[0] })
      assert.equal(booking.appointment.sessionId, session.id)
      const visited = await call<T.SessionDto>(`/api/admin/sessions/${session.id}/complete-credit`, "POST", { staffId: "staff-3", appointmentId: booking.appointment.id })
      assert.equal(visited.completedCount, 2)
      const event = visited.events.find((e) => e.appointmentId === booking.appointment.id)!
      const reversed = await call<T.SessionDto>(`/api/admin/sessions/${session.id}/events/${event.id}`, "DELETE")
      assert.equal(reversed.completedCount, 1)
      assert.equal(reversed.creditBalanceTl, 1500)
      const visits = await call<T.SessionVisitDto[]>(`/api/admin/sessions/${session.id}/visits`)
      assert.equal(visits.length, 1)
      await call(`/api/admin/sessions/${session.id}`, "DELETE")
      const pending = await appointmentsApi.list({ phone: "5554445566", status: "PENDING" })
      assert.equal(pending.totalElements, 0)
    })
    await t.test("queued session fees and register sales update revenue once", async () => {
      const session = await call<T.SessionDto>("/api/admin/sessions/session-2")
      const charge = await call<T.SessionChargeDto>(`/api/admin/sessions/${session.id}/charges`, "POST", { staffId: "staff-3", extraServiceIds: ["service-11"] })
      const before = await call<T.RevenueSummaryDto>("/api/admin/revenue?days=1")
      await call(`/api/admin/session-charges/${charge.id}/collect`, "POST", { amountTl: 350, method: "CARD", staffId: "staff-3", completeVisit: false })
      const after = await call<T.RevenueSummaryDto>("/api/admin/revenue?days=1")
      assert.equal(after.totalPaidTl - before.totalPaidTl, 350)
      const updated = await call<T.SessionDto>(`/api/admin/sessions/${session.id}`)
      assert.equal(updated.paidTotalTl - session.paidTotalTl, 0)
      assert.equal(updated.completedCount - session.completedCount, 0)
      await assert.rejects(call(`/api/admin/session-charges/${charge.id}/collect`, "POST", { amountTl: 350, method: "CARD", completeVisit: false }), /zaten işlendi/)
      const sale = await call<T.RevenuePaymentDto>("/api/admin/register-sales", "POST", { customerFirstName: "Ece", customerLastName: "Test", customerPhone: "5555556677", staffId: "staff-1", serviceIds: ["service-7", "service-8"], method: "CASH" })
      assert.equal(sale.paidAmountTl, 800)
      const last = await call<T.RevenueSummaryDto>("/api/admin/revenue?days=1")
      assert.equal(last.totalPaidTl - after.totalPaidTl, 800)
    })
    await t.test("settings, preferences and changes persist locally", async () => {
      await call("/api/admin/table-preferences/appointments", "PUT", { pageSize: 10 })
      assert.deepEqual(await call("/api/admin/table-preferences/appointments"), { tableName: "appointments", pageSize: 10 })
      await call("/api/admin/settings/booking-appearance", "PUT", { theme: "DARK" })
      assert.deepEqual(await call("/api/booking-link/appearance"), { theme: "DARK" })
      const persisted = JSON.parse(storage.get("randevu-link.demo.v1")!)
      assert.equal(persisted.theme, "DARK")
      assert.ok(persisted.appointments.some((a: T.AppointmentDto) => a.customerPhone === "5552223344"))
    })
    await t.test("demo auth and staff portal never call fetch", async () => {
      const otp = await authApi.requestOtp("5550000003", "STAFF")
      assert.equal(otp.debugCode, "123456")
      await authApi.verifyOtp("5550000003", "123456", "STAFF")
      assert.equal((await staffPortalApi.me()).id, "staff-3")
      assert.ok(Array.isArray(await staffPortalApi.appointments(day())))
      await assert.rejects(authApi.verifyOtp("5550000003", "000000", "STAFF"), /123456/)
    })
    await t.test("abort and unknown endpoint cannot fall through to real network", async () => {
      const controller = new AbortController(); controller.abort()
      await assert.rejects(demoRequest("/api/services", { signal: controller.signal }), { name: "AbortError" })
      await assert.rejects(demoRequest("/api/not-implemented"), (error) => error instanceof DemoError && error.status === 501)
    })
  } finally {
    globalThis.fetch = originalFetch
    Reflect.deleteProperty(globalThis, "window")
    Reflect.deleteProperty(globalThis, "document")
  }
})
