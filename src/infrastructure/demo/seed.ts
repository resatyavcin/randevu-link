import type { AppointmentDto, RoleDto, ServiceCategoryDto, ServiceDto, StaffDto, SessionDto, SessionChargeDto, RevenuePaymentDto } from "@/domain/models/contracts"

export type DemoDatabase = {
  version: 1
  roles: RoleDto[]
  categories: ServiceCategoryDto[]
  services: ServiceDto[]
  staff: StaffDto[]
  appointments: AppointmentDto[]
  sessions: SessionDto[]
  charges: SessionChargeDto[]
  sales: RevenuePaymentDto[]
  preferences: Record<string, number>
  theme: "LIGHT" | "DARK"
}

export function day(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function seedDatabase(): DemoDatabase {
  const roles: RoleDto[] = [
    { id: "role-hair", code: "HAIR", name: "Saç uzmanı", active: true },
    { id: "role-barber", code: "BARBER", name: "Berber", active: true },
    { id: "role-beauty", code: "BEAUTY", name: "Güzellik uzmanı", active: true },
  ]
  const categories: ServiceCategoryDto[] = [
    { id: "cat-hair", name: "Saç tasarım", gender: "KADIN", sortOrder: 0, pinRank: 1, active: true },
    { id: "cat-color", name: "Boya & bakım", gender: "KADIN", sortOrder: 1, pinRank: null, active: true },
    { id: "cat-barber", name: "Erkek bakım", gender: "ERKEK", sortOrder: 2, pinRank: 1, active: true },
    { id: "cat-beauty", name: "Cilt & güzellik", gender: "KADIN", sortOrder: 3, pinRank: null, active: true },
  ]
  const definitions: [string, number, number, number, number][] = [
    ["Saç kesimi", 0, 0, 45, 850], ["Fön", 0, 0, 30, 400],
    ["Dip boya", 1, 0, 90, 1800], ["Balyaj", 1, 0, 150, 4500],
    ["Keratin bakım", 1, 0, 90, 2500], ["Saç & sakal kesimi", 2, 1, 45, 750],
    ["Erkek saç kesimi", 2, 1, 30, 500], ["Sakal şekillendirme", 2, 1, 20, 300],
    ["Cilt bakımı", 3, 2, 60, 1500], ["Lazer epilasyon", 3, 2, 45, 1200],
    ["Kaş tasarımı", 3, 2, 20, 350],
  ]
  const services: ServiceDto[] = definitions.map(([name, cat, role, durationMin, priceTl], i) => ({
    id: `service-${i + 1}`, name, category: categories[cat], roleIds: [roles[role].id],
    roles: [roles[role]], durationMin, priceTl, priceMaxTl: null, active: true,
  }))
  const staff: StaffDto[] = [["Reşat Berber", "resat", 1], ["Elif Demir", "elif", 0], ["Selin Kaya", "selin", 2], ["Mert Yılmaz", "mert", 1], ["Deniz Aydın", "deniz", 0]].map(([name, , role], i) => {
    const r = roles[Number(role)]
    return { id: `staff-${i + 1}`, name: String(name), roleId: r.id, role: r.name, roleCode: r.code, roleActive: true,
      phone: `00000000${String(i + 1).padStart(2, "0")}`, photoUrl: null, workDays: [1, 2, 3, 4, 5, 6, 0],
      serviceIds: services.filter((s) => s.roleIds.includes(r.id)).map((s) => s.id), active: true, dashboardAdmin: i === 0 }
  })
  const customers = [["Zeynep", "Çelik"], ["Emre", "Şahin"], ["Ayşe", "Yılmaz"], ["Burak", "Kaya"], ["Ece", "Demir"], ["Can", "Aydın"], ["Derya", "Arslan"], ["Merve", "Koç"], ["Oğuz", "Aksoy"], ["İrem", "Öztürk"], ["Selma", "Yıldırım"], ["Kaan", "Kurt"]]
  const appointments: AppointmentDto[] = []
  for (let offset = -30; offset <= 45; offset++) {
    const nextSlot = new Map(staff.map((s) => [s.id, 10 * 60]))
    for (let index = 0; index < 6; index++) {
      const n = (offset + 30) * 6 + index
      const service = services[n % services.length]
      const person = staff.filter((s) => s.serviceIds.includes(service.id)).sort((a, b) => nextSlot.get(a.id)! - nextSlot.get(b.id)!)[0]
      const minute = nextSlot.get(person.id)!
      nextSlot.set(person.id, minute + service.durationMin)
      const customer = customers[n % customers.length]
      const date = day(offset)
      const status = n % 11 === 0 ? "CANCELLED" : offset < 0 || (offset === 0 && index < 2) ? "COMPLETED" : "PENDING"
      appointments.push({ id: `apt-${n + 1}`, serviceId: service.id, serviceName: service.name, staffId: person.id, staffName: person.name,
        servedStaffId: status === "COMPLETED" ? person.id : null, servedStaffName: status === "COMPLETED" ? person.name : null,
        customerFirstName: customer[0], customerLastName: customer[1], customerPhone: `00010000${String(n % customers.length).padStart(2, "0")}`,
        date, slot: `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`, status, createdAt: `${date}T08:00:00+03:00`, priceTl: service.priceTl,
        quotedPriceTl: service.priceTl, paidAmountTl: status === "COMPLETED" ? service.priceTl : null,
        paymentMethod: status === "COMPLETED" ? n % 2 ? "CARD" : "CASH" : null,
        paidAt: status === "COMPLETED" ? `${date}T16:00:00+03:00` : null, paymentNote: null, extras: [], sessionId: null, sessionName: null })
    }
  }
  const sessions: SessionDto[] = [0, 2, 4].map((customerIndex, i) => {
    const service = services[i === 0 ? 9 : 8]
    const totalPriceTl = service.priceTl * 6
    return { id: `session-${i + 1}`, customerPhone: `00010000${String(customerIndex).padStart(2, "0")}`, customerFirstName: customers[customerIndex][0], customerLastName: customers[customerIndex][1],
      name: `${service.name} · 6 seans`, serviceId: service.id, serviceName: service.name, totalSessions: 6, completedCount: 2,
      periodNote: "4 haftada bir", totalPriceTl, paidTotalTl: service.priceTl * (i === 0 ? 3 : i === 1 ? 2 : 1), unitPriceTl: service.priceTl, creditBalanceTl: service.priceTl * (i === 0 ? 1 : i === 1 ? 0 : -1),
      status: "ACTIVE", createdAt: `${day(-28)}T10:00:00+03:00`, updatedAt: `${day(-7)}T11:00:00+03:00`,
      events: [0, 1].flatMap((n) => {
        const occurredAt = `${day(-28 + n * 21)}T11:00:00+03:00`
        const common = { staffId: "staff-3", staffName: "Selin Kaya", note: null, occurredAt, extras: [], appointmentId: null, bookedStaffName: "Selin Kaya" }
        const amount = service.priceTl * (i === 0 && n === 0 ? 2 : 1)
        return [...(i === 2 && n === 1 ? [] : [{ ...common, id: `event-${i}-${n}-pay`, kind: "PAID" as const, amountTl: amount, collectedTl: amount, paymentMethod: "CARD" as const }]),
          { ...common, id: `event-${i}-${n}-visit`, kind: "COMPLETED" as const, amountTl: service.priceTl, collectedTl: null, paymentMethod: null }]
      }) }
  })
  const session = sessions[2]
  const charges: SessionChargeDto[] = [{ id: "charge-1", sessionId: session.id, sessionName: session.name, customerFirstName: session.customerFirstName, customerLastName: session.customerLastName, customerPhone: session.customerPhone, staffId: "staff-3", staffName: "Selin Kaya", amountTl: null, note: "Son seansın ödemesi bekleniyor", status: "PENDING", createdAt: `${day()}T10:00:00+03:00`, extras: [] }]
  return { version: 1, roles, categories, services, staff, appointments, sessions, charges, sales: [], preferences: {}, theme: "LIGHT" }
}
