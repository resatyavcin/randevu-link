import type * as T from "@/domain/models/contracts"
import { getStoredMe, type AuthMe, type AuthScope } from "@/infrastructure/storage/auth-session"
import { day, seedDatabase, type DemoDatabase } from "@/infrastructure/demo/seed"

const STORAGE_KEY = "randevu-link.demo.v1"
let database: DemoDatabase | undefined
export class DemoError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
const fail = (message: string, status = 400): never => { throw new DemoError(status, message) }
const id = () => crypto.randomUUID()
const now = () => new Date().toISOString()
const fold = (value: string) => value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i")
const phoneKey = (value: string) => value.replace(/\D/g, "").slice(-10)
const samePhone = (a: string, b: string) => phoneKey(a) === phoneKey(b)

function db() {
  if (database) return database
  if (typeof window !== "undefined") {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null") as DemoDatabase | null
      if (saved?.version === 1 && Array.isArray(saved.appointments) && Array.isArray(saved.services)) {
        const anonymize = (phone: string) => phone.replace(/^555(?=\d{7}$)/, "000")
        saved.staff.forEach((row) => { row.phone = anonymize(row.phone) })
        saved.appointments.forEach((row) => { row.customerPhone = anonymize(row.customerPhone) })
        saved.sessions.forEach((row) => { row.customerPhone = anonymize(row.customerPhone) })
        saved.charges.forEach((row) => { row.customerPhone = anonymize(row.customerPhone) })
        const rename = (name: string) => ["Ali Yıldız", "Reşat Berber"].includes(name) ? "Reşat Yavçin" : name
        saved.staff.forEach((row) => { row.name = rename(row.name); row.photoUrl = null })
        saved.appointments.forEach((row) => {
          if (row.staffName) row.staffName = rename(row.staffName)
          if (row.servedStaffName) row.servedStaffName = rename(row.servedStaffName)
        })
        database = saved
      }
    } catch { /* Start a fresh demo if storage is unavailable. */ }
  }
  database ??= seedDatabase()
  return database
}
function save() {
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db())) } catch { /* In-memory demo remains usable. */ }
  }
}
function find<R extends { id: string }>(rows: R[], key: string): R {
  return rows.find((row) => row.id === key) ?? fail("Kayıt bulunamadı", 404)
}
function paginate<R>(rows: R[], q: URLSearchParams): T.PageResponse<R> {
  const page = Math.max(0, Number(q.get("page")) || 0)
  const size = Math.max(1, Math.min(200, Number(q.get("size")) || 20))
  return { content: rows.slice(page * size, (page + 1) * size), page, size, totalElements: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / size)) }
}
function baseFilter<R extends { active?: boolean }>(rows: R[], q: URLSearchParams) {
  return rows.filter((row) => !q.has("active") || row.active === (q.get("active") === "true"))
}
function extras(keys: string[] = []): T.AppointmentExtraDto[] {
  return keys.map((key) => { const s = find(db().services, key); return { serviceId: s.id, name: s.name, priceTl: s.priceTl } })
}
function me(scope: AuthScope = "DASHBOARD", phone?: string): AuthMe {
  const storedId = getStoredMe(scope)?.id
  const staff = db().staff.find((s) => phone ? samePhone(s.phone, phone) : s.id === storedId) ?? db().staff[scope === "STAFF" ? 2 : 0]
  return { id: staff.id, name: staff.name, phone: staff.phone, photoUrl: staff.photoUrl, role: staff.role, roleCode: staff.roleCode, dashboardAdmin: staff.dashboardAdmin, scope }
}
function staffFor(serviceId: string, staffId?: string | null) {
  const staff = staffId ? find(db().staff, staffId) : db().staff.find((s) => s.active && s.serviceIds.includes(serviceId))
  if (!staff || !staff.active || !staff.serviceIds.includes(serviceId)) fail("Bu hizmet için uygun personel bulunamadı")
  return staff!
}
function slots(staffId: string, date: string, duration = 30) {
  const staff = find(db().staff, staffId)
  const weekday = new Date(`${date}T12:00:00`).getDay()
  if (!staff.active || !staff.workDays.includes(weekday)) return []
  const occupied = db().appointments.filter((a) => a.staffId === staffId && a.date === date && a.status !== "CANCELLED")
  const minutes = (slot: string) => Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3, 5))
  const output: string[] = []
  const current = new Date()
  for (let start = 10 * 60; start + duration <= 20 * 60; start += 30) {
    if (date < day() || (date === day() && start <= current.getHours() * 60 + current.getMinutes())) continue
    if (occupied.some((a) => start < minutes(a.slot) + (db().services.find((s) => s.id === a.serviceId)?.durationMin ?? 30) && start + duration > minutes(a.slot))) continue
    output.push(`${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`)
  }
  return output
}
function createAppointment(body: T.CreateAppointmentRequest): T.AppointmentDto {
  const service = find(db().services, body.serviceId)
  const staff = staffFor(service.id, body.staffId)
  if (!service.active) fail("Hizmet aktif değil")
  if (!body.firstName?.trim() || !body.lastName?.trim() || phoneKey(body.phone).length !== 10) fail("Müşteri bilgilerini kontrol edin")
  if (!slots(staff.id, body.date, service.durationMin).includes(body.slot.slice(0, 5))) fail("Bu saat uygun değil; başka bir saat seçin", 409)
  const appointment: T.AppointmentDto = { id: id(), note: body.note ?? null, serviceId: service.id, serviceName: service.name, staffId: staff.id, staffName: staff.name,
    servedStaffId: null, servedStaffName: null, customerFirstName: body.firstName.trim(), customerLastName: body.lastName.trim(), customerPhone: phoneKey(body.phone),
    date: body.date, slot: body.slot.slice(0, 5), status: "PENDING", createdAt: now(), priceTl: service.priceTl, quotedPriceTl: service.priceTl,
    paidAmountTl: null, paymentMethod: null, paidAt: null, paymentNote: null, extras: [], sessionId: null, sessionName: null }
  db().appointments.push(appointment)
  return appointment
}
function sessionEvent(session: T.SessionDto, kind: T.SessionEventKindApi, amount: number, staffId?: string | null, method?: T.PaymentMethodApi | null, note?: string | null, appointmentId?: string | null) {
  const staff = staffId ? find(db().staff, staffId) : null
  session.events.push({ id: id(), kind, staffId: staff?.id ?? null, staffName: staff?.name ?? null, amountTl: amount, collectedTl: kind === "PAID" ? amount : null,
    paymentMethod: method ?? null, note: note ?? null, occurredAt: now(), extras: [], appointmentId: appointmentId ?? null, bookedStaffName: null })
  syncSession(session)
}
function syncSession(session: T.SessionDto) {
  session.paidTotalTl = session.events.filter((e) => e.kind === "PAID").reduce((n, e) => n + (e.amountTl ?? 0), 0)
  session.completedCount = session.events.filter((e) => e.kind === "COMPLETED").length
  session.unitPriceTl = session.totalPriceTl / session.totalSessions
  session.creditBalanceTl = session.paidTotalTl - session.completedCount * session.unitPriceTl
  if (session.status !== "CANCELLED") session.status = session.completedCount >= session.totalSessions ? "COMPLETED" : "ACTIVE"
  session.updatedAt = now()
}
function completeVisit(session: T.SessionDto, staffId?: string | null, appointmentId?: string | null) {
  if (session.status !== "ACTIVE") fail("Bu paket için seans tamamlanamaz")
  const appointment = appointmentId ? find(db().appointments, appointmentId) : null
  if (appointment && (appointment.sessionId !== session.id || appointment.status !== "PENDING")) fail("Randevu bu paket için uygun değil")
  sessionEvent(session, "COMPLETED", session.unitPriceTl, staffId, null, null, appointmentId)
  if (appointment) { appointment.status = "COMPLETED"; appointment.servedStaffId = staffId ?? appointment.staffId; appointment.servedStaffName = db().staff.find((s) => s.id === appointment.servedStaffId)?.name ?? null }
}
function payments(): T.RevenuePaymentDto[] {
  const appointments: T.RevenuePaymentDto[] = db().appointments.filter((a) => a.status === "COMPLETED" && a.paidAmountTl != null).map((a) => ({
    appointmentId: a.id, customerName: `${a.customerFirstName} ${a.customerLastName}`, serviceName: a.serviceName, staffName: a.servedStaffName ?? a.staffName,
    date: a.paidAt?.slice(0, 10) ?? a.date, paidAt: a.paidAt, quotedPriceTl: a.quotedPriceTl, paidAmountTl: a.paidAmountTl!, paymentMethod: a.paymentMethod, paymentNote: a.paymentNote,
    extras: a.extras, creditSessions: 0, sessionId: a.sessionId, sessionName: a.sessionName, kind: "APPOINTMENT" }))
  const sessions: T.RevenuePaymentDto[] = db().sessions.flatMap((s) => s.events.filter((e) => e.kind === "PAID").map((e) => ({
    appointmentId: e.id, customerName: `${s.customerFirstName} ${s.customerLastName}`, serviceName: s.serviceName, staffName: e.staffName,
    date: e.occurredAt.slice(0, 10), paidAt: e.occurredAt, quotedPriceTl: e.collectedTl ?? 0, paidAmountTl: e.collectedTl ?? 0, paymentMethod: e.paymentMethod,
    paymentNote: e.note, extras: e.extras, creditSessions: 0, sessionId: s.id, sessionName: s.name, kind: e.extras.length ? "EXTRA" : "SESSION" })))
  return [...appointments, ...sessions, ...db().sales].sort((a, b) => (b.paidAt ?? b.date).localeCompare(a.paidAt ?? a.date))
}
function revenueWindow(q: URLSearchParams) {
  return { from: q.get("from") ?? day(-(Number(q.get("days")) || 30) + 1), to: q.get("to") ?? day() }
}
function inWindow(date: string, q: URLSearchParams) {
  return (!q.get("from") || date >= q.get("from")!) && (!q.get("to") || date <= q.get("to")!)
}

/** Entire API contract runs locally. Unknown endpoints fail rather than falling back to fetch. */
export async function demoRequest(path: string, init?: RequestInit & { authScope?: AuthScope | null }): Promise<unknown> {
  if (init?.signal?.aborted) throw new DOMException("Aborted", "AbortError")
  const url = new URL(path, "https://demo.invalid")
  const method = init?.method ?? "GET"
  const body = <R>() => JSON.parse(String(init?.body ?? "{}")) as R
  const result = route(url.pathname, url.searchParams, method, body, init?.authScope ?? undefined)
  if (method !== "GET") save()
  // Match fetch semantics: callers must not mutate the shared local database.
  return result === undefined ? undefined : structuredClone(result)
}
function route(path: string, q: URLSearchParams, method: string, body: <R>() => R, scope?: AuthScope): unknown {
  const data = db()
  const parts = path.split("/").filter(Boolean)
  const admin = parts[1] === "admin"
  const resource = parts[admin ? 2 : 1]
  const key = parts[admin ? 3 : 2]
  const action = parts[admin ? 4 : 3]
  if (resource === "auth") {
    if (key === "logout") return
    if (key === "me") return me(scope)
    const input = body<{ phone: string; code: string; scope: AuthScope }>()
    if (action === "request") return { expiresInSeconds: 300, resendAvailableInSeconds: 30, debugCode: "123456" }
    if (action === "verify") {
      if (input.code !== "123456") fail("Demo doğrulama kodu: 123456")
      return { accessToken: "demo-access", refreshToken: "demo-refresh", expiresIn: 3600, refreshExpiresAt: new Date(Date.now() + 86400000).toISOString(), me: me(input.scope, input.phone) }
    }
    if (key === "refresh") return { accessToken: "demo-access", refreshToken: "demo-refresh", expiresIn: 3600, refreshExpiresAt: new Date(Date.now() + 86400000).toISOString(), me: me(scope) }
  }
  if (resource === "staff-portal") {
    if (key === "me") return me("STAFF")
    if (key === "appointments") return data.appointments.filter((a) => a.date === q.get("date") && a.staffId === me("STAFF").id)
  }
  if (resource === "table-preferences") {
    if (method === "PUT") data.preferences[key] = body<{ pageSize: number }>().pageSize
    return { tableName: key, pageSize: data.preferences[key] ?? 20 }
  }
  if (resource === "booking-link" || resource === "settings") {
    if (method === "PUT") data.theme = body<T.BookingAppearanceRequest>().theme
    return { theme: data.theme }
  }
  if (resource === "roles") {
    if (method === "GET") return admin ? paginate(baseFilter(data.roles, q), q) : data.roles.filter((r) => r.active)
    if (method === "DELETE") { find(data.roles, key).active = false; return }
    const input = body<T.RoleRequest>()
    if (!input.name?.trim()) fail("Rol adı gerekli")
    if (method === "POST") { const role = { id: id(), code: `CUSTOM_${data.roles.length}`, name: input.name, active: input.active ?? true }; data.roles.push(role); return role }
    const role = find(data.roles, key)
    Object.assign(role, input)
    data.staff.filter((s) => s.roleId === key).forEach((s) => { s.role = role.name; s.roleActive = role.active })
    data.services.forEach((s) => { s.roles = s.roleIds.map((r) => find(data.roles, r)) })
    return role
  }
  if (resource === "service-categories") {
    if (method === "GET") { const rows = baseFilter(data.categories, q).filter((c) => !q.get("gender") || c.gender === q.get("gender")); return admin ? paginate(rows, q) : rows }
    if (method === "DELETE") { find(data.categories, key).active = false; return }
    const input = body<T.ServiceCategoryRequest>()
    if (!input.name?.trim()) fail("Kategori adı gerekli")
    if (method === "POST") { const category = { ...input, id: id(), sortOrder: data.categories.length, pinRank: input.pinRank ?? null, active: input.active ?? true }; data.categories.push(category); return category }
    const category = find(data.categories, key)
    Object.assign(category, input)
    data.services.filter((s) => s.category.id === key).forEach((s) => { s.category = { ...category } })
    return category
  }
  if (resource === "services") {
    const rows = baseFilter(data.services, q).filter((s) => (!q.get("gender") || s.category.gender === q.get("gender")) && (!q.get("categoryId") || s.category.id === q.get("categoryId")) && (!q.get("roleId") || s.roleIds.includes(q.get("roleId")!)))
    if (key === "counts") return { total: rows.length, categories: Object.fromEntries(data.categories.map((c) => [c.id, rows.filter((s) => s.category.id === c.id).length])) }
    if (method === "GET") return paginate(rows, q)
    if (method === "DELETE") { find(data.services, key).active = false; return }
    const input = body<T.ServiceRequest>()
    if (!input.name?.trim() || input.priceTl < 0 || input.durationMin <= 0) fail("Hizmet bilgilerini kontrol edin")
    const value: T.ServiceDto = { ...input, id: key || id(), category: find(data.categories, input.categoryId), roles: input.roleIds.map((r) => find(data.roles, r)), active: input.active ?? true, priceMaxTl: input.priceMaxTl ?? null }
    if (method === "POST") data.services.push(value)
    else Object.assign(find(data.services, key), value)
    return value
  }
  if (resource === "staff") {
    if (action === "availability") return slots(key, q.get("date") ?? day(), q.get("serviceId") ? find(data.services, q.get("serviceId")!).durationMin : 30)
    if (method === "GET" && key) return find(data.staff, key)
    if (method === "GET") return paginate(baseFilter(data.staff, q).filter((s) => (!q.get("serviceId") || s.serviceIds.includes(q.get("serviceId")!)) && (!q.get("q") || fold(`${s.name} ${s.phone}`).includes(fold(q.get("q")!)))), q)
    if (method === "DELETE") { find(data.staff, key).active = false; return }
    if (action === "services") { const staff = find(data.staff, key); staff.serviceIds = body<{ serviceIds: string[] }>().serviceIds; staff.serviceIds.forEach((s) => find(data.services, s)); return staff }
    const input = body<T.StaffRequest>()
    const role = find(data.roles, input.roleId)
    const old = key ? find(data.staff, key) : null
    const staff: T.StaffDto = { ...input, id: key || id(), role: role.name, roleCode: role.code, roleActive: role.active, photoUrl: input.photoUrl ?? null, workDays: input.workDays ?? [1, 2, 3, 4, 5, 6], serviceIds: old?.serviceIds ?? [], active: input.active ?? true, dashboardAdmin: input.dashboardAdmin ?? false }
    if (old) Object.assign(old, staff); else data.staff.push(staff)
    return staff
  }
  if (resource === "availability") {
    return Array.from({ length: Math.min(365, Number(q.get("count")) || 30) }, (_, i) => {
      const date = day(i)
      const weekday = new Date(`${date}T12:00:00`).getDay()
      return { date, weekday, workingStaffIds: data.staff.filter((s) => s.active && s.workDays.includes(weekday) && (!q.get("staffId") || s.id === q.get("staffId")) && (!q.get("serviceId") || s.serviceIds.includes(q.get("serviceId")!))).map((s) => s.id) }
    })
  }
  if (resource === "appointments") {
    if (key === "lookup") {
      const code = (q.get("code") ?? "").replace(/[-#]/g, "").toLowerCase()
      if (!code) fail("Randevu kodunu girin")
      return data.appointments.find((a) => a.id.replace(/-/g, "").toLowerCase() === code || a.id.replace(/-/g, "").slice(0, 8).toLowerCase() === code) ?? fail("Randevu bulunamadı", 404)
    }
    if (method === "GET") return paginate(data.appointments.filter((a) => inWindow(a.date, q) && (!q.get("phone") || samePhone(a.customerPhone, q.get("phone")!)) && (!q.get("status") || a.status === q.get("status")) && (!q.get("paymentMethod") || a.paymentMethod === q.get("paymentMethod")) && (q.get("excludeSession") !== "true" || !a.sessionId) && (!q.get("q") || fold(`${a.customerFirstName} ${a.customerLastName} ${a.customerPhone}`).includes(fold(q.get("q")!)))).sort((a, b) => `${a.date}${a.slot}`.localeCompare(`${b.date}${b.slot}`)), q)
    if (!key) return createAppointment(body<T.CreateAppointmentRequest>())
    const appointment = find(data.appointments, key)
    if (appointment.status !== "PENDING") fail("Yalnızca bekleyen randevular değiştirilebilir", 409)
    if (action === "cancel") { appointment.status = "CANCELLED"; return }
    if (action === "collect") {
      const input = body<T.CollectPaymentRequest>()
      if (!(input.amountTl > 0)) fail("Geçerli bir tutar girin")
      if (appointment.sessionId || input.sessionId) fail("Seans randevusu kasada tahsil edilmez")
      if (input.staffId) find(data.staff, input.staffId)
      appointment.extras = extras(input.extraServiceIds)
      appointment.paidAmountTl = input.amountTl; appointment.paymentMethod = input.method; appointment.paidAt = now(); appointment.paymentNote = input.note ?? null
      appointment.status = "COMPLETED"; appointment.servedStaffId = input.staffId ?? appointment.staffId; appointment.servedStaffName = data.staff.find((s) => s.id === appointment.servedStaffId)?.name ?? null
      return appointment
    }
  }
  if (resource === "revenue") {
    const window = revenueWindow(q)
    const rows = payments().filter((p) => p.date >= window.from && p.date <= window.to)
    if (key === "payments") return paginate(rows.filter((p) => !q.get("paymentMethod") || p.paymentMethod === q.get("paymentMethod")), q)
    const sum = (method?: string) => rows.filter((p) => !method || p.paymentMethod === method).reduce((n, p) => n + p.paidAmountTl, 0)
    const totalPaidTl = sum()
    const appointments = data.appointments.filter((a) => a.date >= window.from && a.date <= window.to)
    const quotedTotalTl = rows.reduce((n, p) => n + p.quotedPriceTl, 0)
    const dates: string[] = []
    const cursor = new Date(`${window.from}T12:00:00`)
    while (dates.length < 366 && cursor <= new Date(`${window.to}T12:00:00`)) { dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`); cursor.setDate(cursor.getDate() + 1) }
    return { days: dates.length, totalPaidTl, cashTl: sum("CASH"), cardTl: sum("CARD"), paidCount: rows.length, pendingCount: appointments.filter((a) => a.status === "PENDING").length, cancelledCount: appointments.filter((a) => a.status === "CANCELLED").length, averageTicketTl: rows.length ? totalPaidTl / rows.length : 0, quotedTotalTl, differenceTl: totalPaidTl - quotedTotalTl,
      daily: dates.map((date) => { const daily = rows.filter((p) => p.date === date); const sum = (method?: string) => daily.filter((p) => !method || p.paymentMethod === method).reduce((n, p) => n + p.paidAmountTl, 0); return { date, totalTl: sum(), cashTl: sum("CASH"), cardTl: sum("CARD"), count: daily.length } }) }
  }
  if (resource === "customers") {
    const phone = decodeURIComponent(key)
    const history: T.CustomerHistoryItemDto[] = data.appointments.filter((a) => samePhone(a.customerPhone, phone)).flatMap((a) => {
      const common = { source: "APPOINTMENT" as const, appointmentId: a.id, sessionId: a.sessionId, title: a.serviceName, staffId: a.staffId, staffName: a.staffName, note: a.paymentNote }
      return [{ ...common, kind: "CREATED" as const, occurredAt: a.createdAt, amountTl: null }, ...(a.status === "PENDING" ? [] : [{ ...common, kind: a.status === "CANCELLED" ? "CANCELLED" as const : "COMPLETED" as const, occurredAt: a.paidAt ?? `${a.date}T${a.slot}:00+03:00`, amountTl: a.paidAmountTl }])]
    })
    data.sessions.filter((s) => samePhone(s.customerPhone, phone)).forEach((s) => s.events.forEach((e) => history.push({ source: "SESSION", kind: e.kind, occurredAt: e.occurredAt, appointmentId: e.appointmentId, sessionId: s.id, title: s.name, staffId: e.staffId, staffName: e.staffName, amountTl: e.amountTl, note: e.note })))
    return history.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  }
  if (resource === "sessions") {
    const rows = data.sessions.filter((s) => (!q.get("phone") || samePhone(s.customerPhone, q.get("phone")!)) && (!q.get("status") || s.status === q.get("status")))
    if (key === "debts") return rows.filter((s) => s.creditBalanceTl < 0).map((s) => ({ id: s.id, index: Math.floor(rows.indexOf(s) / 20) }))
    if (method === "GET" && !key) return paginate(rows, q)
    if (!key && method === "POST") {
      const input = body<T.SessionRequest>()
      if (!input.name?.trim() || input.totalSessions < 1 || input.totalPriceTl < 0) fail("Paket bilgilerini kontrol edin")
      const customer = data.appointments.find((a) => samePhone(a.customerPhone, input.customerPhone))
      const service = input.serviceId ? find(data.services, input.serviceId) : null
      const session: T.SessionDto = { ...input, id: id(), customerPhone: phoneKey(input.customerPhone), customerFirstName: input.customerFirstName ?? customer?.customerFirstName ?? "Demo", customerLastName: input.customerLastName ?? customer?.customerLastName ?? "Müşteri", serviceId: service?.id ?? null, serviceName: service?.name ?? null, periodNote: input.periodNote ?? null, completedCount: 0, paidTotalTl: 0, unitPriceTl: input.totalPriceTl / input.totalSessions, creditBalanceTl: 0, status: "ACTIVE", createdAt: now(), updatedAt: now(), events: [] }
      data.sessions.unshift(session); return session
    }
    const session = find(data.sessions, key)
    if (action === "events" && method === "DELETE") {
      const eventId = parts[5]
      const event = find(session.events, eventId)
      if (event.kind === "COMPLETED" && event.appointmentId) find(data.appointments, event.appointmentId).status = "PENDING"
      session.events = session.events.filter((e) => e.id !== eventId)
      syncSession(session); return session
    }
    if (action === "visits") return session.events.filter((e) => e.kind === "COMPLETED").map((e) => ({ id: e.id, date: e.occurredAt.slice(0, 10), slot: e.occurredAt.slice(11, 16), serviceName: session.serviceName ?? session.name, staffId: e.staffId, staffName: e.staffName }))
    if (action === "charges" && method === "GET") return data.charges.filter((c) => c.sessionId === key && c.status === "PENDING")
    if (method === "GET") return session
    if (method === "DELETE") { session.status = "CANCELLED"; data.appointments.filter((a) => a.sessionId === key && a.status === "PENDING").forEach((a) => { a.status = "CANCELLED" }); data.charges.filter((c) => c.sessionId === key && c.status === "PENDING").forEach((c) => { c.status = "CANCELLED" }); return }
    if (action === "pay") {
      const input = body<T.SessionPaymentRequest>()
      if (!(input.amountTl > 0) || session.status === "CANCELLED") fail("Geçerli bir ödeme tutarı girin")
      sessionEvent(session, "PAID", input.amountTl, input.staffId, input.method, input.note); return session
    }
    if (action === "complete-credit") {
      const input = body<T.CompleteCreditRequest>()
      if (session.creditBalanceTl < session.unitPriceTl) fail("Bir seans için yeterli kredi bulunmuyor")
      completeVisit(session, input.staffId, input.appointmentId); return session
    }
    if (action === "queue" || action === "charges") {
      if (session.status !== "ACTIVE") fail("Paket aktif değil")
      const input = body<T.QueueSessionChargeRequest>()
      if (action === "queue") {
        if (session.paidTotalTl >= session.totalPriceTl) fail("Paket ücreti ödenmiş")
        const existing = data.charges.find((c) => c.sessionId === key && c.status === "PENDING" && !c.extras.length)
        if (existing) return existing
      } else if (!input.extraServiceIds?.length) fail("Ek hizmet seçin")
      const chargeExtras = extras(input.extraServiceIds)
      const staff = input.staffId ? find(data.staff, input.staffId) : null
      const charge: T.SessionChargeDto = { id: id(), sessionId: session.id, sessionName: session.name, customerFirstName: session.customerFirstName, customerLastName: session.customerLastName, customerPhone: session.customerPhone, staffId: staff?.id ?? null, staffName: staff?.name ?? null, amountTl: chargeExtras.length ? chargeExtras.reduce((n, e) => n + e.priceTl, 0) : null, note: input.note ?? null, status: "PENDING", createdAt: now(), extras: chargeExtras }
      data.charges.push(charge); return charge
    }
    if (method === "PATCH") {
      const input = body<T.SessionUpdateRequest>()
      if (input.totalSessions < Math.max(1, session.completedCount) || input.totalPriceTl < 0 || !input.name?.trim()) fail("Paket bilgilerini kontrol edin")
      const service = input.serviceId ? find(data.services, input.serviceId) : null
      Object.assign(session, input, { serviceId: service?.id ?? null, serviceName: service?.name ?? null }); syncSession(session); return session
    }
  }
  if (resource === "session-charges") {
    if (method === "GET") return data.charges.filter((c) => !q.get("status") || c.status === q.get("status"))
    const charge = find(data.charges, key)
    if (charge.status !== "PENDING") fail("Bu tahsilat zaten işlendi", 409)
    const input = body<T.CollectSessionChargeRequest>()
    if (!(input.amountTl > 0)) fail("Geçerli bir tutar girin")
    const session = find(data.sessions, charge.sessionId)
    if (session.status === "CANCELLED") fail("Paket iptal edilmiş")
    const staffId = input.staffId ?? charge.staffId
    const selectedExtras = input.extraServiceIds ? extras(input.extraServiceIds) : charge.extras
    const extrasTotal = selectedExtras.reduce((n, e) => n + e.priceTl, 0)
    if (input.completeVisit) fail("Seans krediden tamamlanır")
    if (extrasTotal && input.amountTl !== extrasTotal) fail("Ek hizmet tutarı seçilen hizmetlerle eşleşmeli")
    if (extrasTotal) {
      sessionEvent(session, "PAID", 0, staffId, input.method, input.note)
      const event = session.events[session.events.length - 1]
      event.extras = selectedExtras
      event.collectedTl = extrasTotal
    } else {
      sessionEvent(session, "PAID", input.amountTl, staffId, input.method, input.note)
    }
    Object.assign(charge, { status: "COLLECTED", amountTl: input.amountTl, note: input.note ?? charge.note, extras: selectedExtras }); return charge
  }
  if (resource === "session-bookings") {
    if (method === "GET") return data.sessions.filter((s) => s.status === "ACTIVE" && samePhone(s.customerPhone, q.get("phone") ?? "")).map((s) => {
      const scheduledCount = data.appointments.filter((a) => a.sessionId === s.id && a.status === "PENDING").length
      return { id: s.id, name: s.name, customerFirstName: s.customerFirstName, customerLastName: s.customerLastName, totalSessions: s.totalSessions, completedCount: s.completedCount, scheduledCount, nextIndex: s.completedCount + scheduledCount + 1, periodNote: s.periodNote, serviceId: s.serviceId, serviceName: s.serviceName, durationMin: data.services.find((v) => v.id === s.serviceId)?.durationMin ?? 45 }
    }).filter((s) => s.nextIndex <= s.totalSessions)
    const session = find(data.sessions, key)
    const input = body<T.BookSessionRequest>()
    if (!samePhone(input.phone, session.customerPhone) || !session.serviceId || session.status !== "ACTIVE") fail("Paket rezervasyon bilgileri uygun değil")
    const scheduled = data.appointments.filter((a) => a.sessionId === key && a.status === "PENDING").length
    if (session.completedCount + scheduled >= session.totalSessions) fail("Pakette kullanılabilir seans kalmadı")
    const appointment = createAppointment({ ...input, serviceId: session.serviceId!, firstName: session.customerFirstName, lastName: session.customerLastName })
    appointment.sessionId = session.id; appointment.sessionName = session.name; appointment.quotedPriceTl = 0
    return { appointment, sessionName: session.name, sessionIndex: session.completedCount + scheduled + 1, totalSessions: session.totalSessions, serviceName: session.serviceName, durationMin: find(data.services, session.serviceId!).durationMin }
  }
  if (resource === "register-sales") {
    const input = body<T.RegisterSaleRequest>()
    if (!input.serviceIds?.length) fail("En az bir hizmet seçin")
    const selected = extras(input.serviceIds)
    const amount = selected.reduce((n, e) => n + e.priceTl, 0)
    const sale: T.RevenuePaymentDto = { appointmentId: id(), customerName: `${input.customerFirstName} ${input.customerLastName}`, serviceName: selected.map((s) => s.name).join(", "), staffName: find(data.staff, input.staffId).name, date: day(), paidAt: now(), quotedPriceTl: amount, paidAmountTl: amount, paymentMethod: input.method, paymentNote: input.note ?? null, extras: selected, creditSessions: 0, sessionId: null, sessionName: null, kind: "EXTRA" }
    data.sales.push(sale); return sale
  }
  return fail(`Demo işlemi tanımlı değil: ${method} ${path}`, 501)
}
