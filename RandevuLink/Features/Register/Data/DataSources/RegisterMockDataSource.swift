import Foundation

struct RegisterMockDataSource: Sendable {
    func load() -> RegisterSnapshot {
        let summary = RevenueSummary(
            totalPaidTl: 18450,
            cashTl: 9200,
            cardTl: 9250,
            paidCount: 12,
            averageTicketTl: 1538,
            differenceTl: -120
        )

        let payments: [RevenuePayment] = [
            .init(
                id: "p1",
                customerName: "Selin Kaya",
                serviceName: nil,
                sessionName: "Lazer 8 seans",
                quotedPriceTl: 6000,
                paidAmountTl: 6000,
                paymentMethod: .cash,
                paidAtLabel: "6 Eyl · 11:20",
                kind: .session,
                creditSessions: 4,
                sessionId: "s1"
            ),
            .init(
                id: "p2",
                customerName: "Ece Yılmaz",
                serviceName: "Fön",
                sessionName: nil,
                quotedPriceTl: 350,
                paidAmountTl: 350,
                paymentMethod: .card,
                paidAtLabel: "25 Eyl · 14:40",
                kind: .appointment,
                creditSessions: 0,
                sessionId: nil
            ),
            .init(
                id: "p3",
                customerName: "Ali Vural",
                serviceName: "Ek hizmet",
                sessionName: nil,
                quotedPriceTl: 450,
                paidAmountTl: 450,
                paymentMethod: .cash,
                paidAtLabel: "25 Eyl · 16:05",
                kind: .extra,
                creditSessions: 0,
                sessionId: nil
            ),
            .init(
                id: "p4",
                customerName: "Deniz Acar",
                serviceName: nil,
                sessionName: "Boya 3 seans",
                quotedPriceTl: 4500,
                paidAmountTl: 4500,
                paymentMethod: .card,
                paidAtLabel: "23 Eyl · 09:50",
                kind: .session,
                creditSessions: 3,
                sessionId: "s4"
            )
        ]

        let pending: [PendingRegisterItem] = [
            .init(
                id: "pend1",
                customerName: "Merve Demir",
                subtitle: "Kesim · 16:00",
                amountHintTl: 400
            )
        ]

        let services = [
            RegisterCatalogService(id: "svc1", name: "Fön", priceTl: 350),
            RegisterCatalogService(id: "svc2", name: "Sakal", priceTl: 250),
            RegisterCatalogService(id: "svc3", name: "Bakım", priceTl: 450),
            RegisterCatalogService(id: "svc4", name: "Kesim", priceTl: 400)
        ]

        return RegisterSnapshot(
            summary: summary,
            payments: payments,
            pending: pending,
            services: services,
            staffNames: ["Ayşe", "Mehmet", "Elif", "Can", "Zeynep"]
        )
    }
}
