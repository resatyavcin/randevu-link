import Foundation

enum RegisterPeriod: Equatable {
    case today
    case days30
    case days90
}

enum RegisterTab: Equatable {
    case paid
    case pending
}

@MainActor
final class RegisterViewModel: ObservableObject {
    @Published private(set) var summary: RevenueSummary?
    @Published private(set) var payments: [RevenuePayment] = []
    @Published private(set) var pending: [PendingRegisterItem] = []
    @Published private(set) var services: [RegisterCatalogService] = []
    @Published private(set) var staffNames: [String] = []

    @Published var period: RegisterPeriod = .days30
    @Published var tab: RegisterTab = .paid
    @Published var methodFilter: PaymentMethod? = nil
    @Published var toastMessage: String?

    private let getSnapshot: GetRegisterSnapshotUseCase

    init(getSnapshot: GetRegisterSnapshotUseCase) {
        self.getSnapshot = getSnapshot
    }

    var filteredPayments: [RevenuePayment] {
        guard let methodFilter else { return payments }
        return payments.filter { $0.paymentMethod == methodFilter }
    }

    var pendingCount: Int { pending.count }

    func load() {
        let snapshot = getSnapshot.execute()
        summary = snapshot.summary
        payments = snapshot.payments
        pending = snapshot.pending
        services = snapshot.services
        staffNames = snapshot.staffNames
    }

    func collectPendingAppointment(id: String, amountTl: Int, method: PaymentMethod) {
        guard let item = pending.first(where: { $0.id == id }) else { return }
        let payment = RevenuePayment(
            id: UUID().uuidString,
            customerName: item.customerName,
            serviceName: item.subtitle,
            sessionName: nil,
            quotedPriceTl: amountTl,
            paidAmountTl: amountTl,
            paymentMethod: method,
            paidAtLabel: "Bugün",
            kind: .appointment,
            creditSessions: 0,
            sessionId: nil
        )
        payments.insert(payment, at: 0)
        pending.removeAll { $0.id == id }
        bumpSummary(amount: amountTl, method: method)
        toastMessage = "Tahsil edildi"
    }

    func createWalkIn(
        firstName: String,
        lastName: String,
        phone: String,
        serviceIds: [String],
        method: PaymentMethod,
        staffName: String,
        note: String?
    ) {
        let chosen = services.filter { serviceIds.contains($0.id) }
        let amount = chosen.reduce(0) { $0 + $1.priceTl }
        guard amount > 0 else { return }
        let payment = RevenuePayment(
            id: UUID().uuidString,
            customerName: "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces),
            serviceName: "Ek hizmet",
            sessionName: nil,
            quotedPriceTl: amount,
            paidAmountTl: amount,
            paymentMethod: method,
            paidAtLabel: "Bugün",
            kind: .extra,
            creditSessions: 0,
            sessionId: nil
        )
        payments.insert(payment, at: 0)
        bumpSummary(amount: amount, method: method)
        toastMessage = "Ek hizmet alındı"
        _ = phone
        _ = staffName
        _ = note
    }

    private func bumpSummary(amount: Int, method: PaymentMethod) {
        guard let current = summary else { return }
        let cash = current.cashTl + (method == .cash ? amount : 0)
        let card = current.cardTl + (method == .card ? amount : 0)
        let total = current.totalPaidTl + amount
        let count = current.paidCount + 1
        summary = RevenueSummary(
            totalPaidTl: total,
            cashTl: cash,
            cardTl: card,
            paidCount: count,
            averageTicketTl: count == 0 ? 0 : Int((Double(total) / Double(count)).rounded()),
            differenceTl: current.differenceTl
        )
    }
}
