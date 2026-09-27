import Foundation

struct SessionPackageMockDataSource: Sendable {
    private let calendar = Calendar.current

    func loadPackages() -> [SessionPackage] {
        [
            make(
                id: "s1",
                first: "Selin",
                last: "Kaya",
                phone: "5321112233",
                name: "Lazer 8 seans",
                service: "Lazer epilasyon",
                total: 8,
                completed: 3,
                period: "Her 15 gün",
                price: 12000,
                paid: 6000,
                status: .active,
                feeQueued: false,
                events: [
                    .init(id: "e1", kind: .paid, staffName: "Ayşe", amountTl: 6000, paymentMethod: .cash, note: "Peşin", occurredAt: daysAgo(20)),
                    .init(id: "e2", kind: .completed, staffName: "Ayşe", amountTl: nil, paymentMethod: nil, note: nil, occurredAt: daysAgo(18)),
                    .init(id: "e3", kind: .completed, staffName: "Elif", amountTl: nil, paymentMethod: nil, note: nil, occurredAt: daysAgo(10)),
                    .init(id: "e4", kind: .completed, staffName: "Ayşe", amountTl: nil, paymentMethod: nil, note: nil, occurredAt: daysAgo(2))
                ],
                visits: [
                    .init(id: "v1", dateLabel: "28 Eyl Cmt · 14:00", serviceName: "Lazer epilasyon", staffName: "Ayşe")
                ]
            ),
            make(
                id: "s2",
                first: "Burak",
                last: "Öz",
                phone: "5054445566",
                name: "Sakal bakım 4",
                service: "Sakal",
                total: 4,
                completed: 2,
                period: "Haftada 1",
                price: 2000,
                paid: 500,
                status: .active,
                feeQueued: true,
                events: [
                    .init(id: "e5", kind: .paid, staffName: "Mehmet", amountTl: 500, paymentMethod: .card, note: nil, occurredAt: daysAgo(12)),
                    .init(id: "e6", kind: .completed, staffName: "Mehmet", amountTl: nil, paymentMethod: nil, note: nil, occurredAt: daysAgo(11)),
                    .init(id: "e7", kind: .completed, staffName: "Can", amountTl: nil, paymentMethod: nil, note: nil, occurredAt: daysAgo(4))
                ],
                visits: []
            ),
            make(
                id: "s3",
                first: "İrem",
                last: "Çelik",
                phone: "5417778899",
                name: "Manikür paketi",
                service: "Manikür",
                total: 6,
                completed: 6,
                period: nil,
                price: 3600,
                paid: 3600,
                status: .completed,
                feeQueued: false,
                events: [
                    .init(id: "e8", kind: .paid, staffName: "Elif", amountTl: 3600, paymentMethod: .cash, note: nil, occurredAt: daysAgo(40)),
                    .init(id: "e9", kind: .completed, staffName: "Elif", amountTl: nil, paymentMethod: nil, note: nil, occurredAt: daysAgo(5))
                ],
                visits: []
            ),
            make(
                id: "s4",
                first: "Deniz",
                last: "Acar",
                phone: "5550001122",
                name: "Boya 3 seans",
                service: "Boya",
                total: 3,
                completed: 0,
                period: "Ayda 1",
                price: 4500,
                paid: 4500,
                status: .active,
                feeQueued: false,
                events: [
                    .init(id: "e10", kind: .paid, staffName: "Zeynep", amountTl: 4500, paymentMethod: .card, note: "Tamamı peşin", occurredAt: daysAgo(3))
                ],
                visits: [
                    .init(id: "v2", dateLabel: "27 Eyl Cum · 10:00", serviceName: "Boya", staffName: "Zeynep")
                ]
            )
        ]
    }

    private func make(
        id: String,
        first: String,
        last: String,
        phone: String,
        name: String,
        service: String?,
        total: Int,
        completed: Int,
        period: String?,
        price: Int,
        paid: Int,
        status: PackageStatus,
        feeQueued: Bool,
        events: [PackageEvent],
        visits: [PackageVisit]
    ) -> SessionPackage {
        SessionPackage(
            id: id,
            customerFirstName: first,
            customerLastName: last,
            customerPhone: phone,
            name: name,
            serviceName: service,
            totalSessions: total,
            completedCount: completed,
            periodNote: period,
            totalPriceTl: price,
            paidTotalTl: paid,
            status: status,
            events: events,
            pendingVisits: visits,
            feeQueued: feeQueued
        )
    }

    private func daysAgo(_ days: Int) -> Date {
        calendar.date(byAdding: .day, value: -days, to: Date()) ?? Date()
    }
}
