import Foundation

@MainActor
final class SessionPackageDetailViewModel: ObservableObject {
    @Published private(set) var package: SessionPackage
    @Published var toastMessage: String?

    init(package: SessionPackage) {
        self.package = package
    }

    var canQueueFee: Bool {
        package.status != .cancelled
            && package.remainingTl >= 1
            && !package.feeQueued
    }

    var canComplete: Bool {
        package.status == .active
            && package.completedCount < package.totalSessions
    }

    func queueFee() {
        guard canQueueFee else { return }
        package = mutated(
            feeQueued: true
        )
        toastMessage = "Kasaya gönderildi"
    }

    func complete(visitId: String?, staffName: String) {
        guard canComplete else { return }
        let event = PackageEvent(
            id: UUID().uuidString,
            kind: .completed,
            staffName: staffName,
            amountTl: nil,
            paymentMethod: nil,
            note: nil,
            occurredAt: Date()
        )
        var visits = package.pendingVisits
        if let visitId {
            visits.removeAll { $0.id == visitId }
        }
        let nextCompleted = package.completedCount + 1
        package = mutated(
            completedCount: nextCompleted,
            status: nextCompleted >= package.totalSessions ? .completed : .active,
            events: [event] + package.events,
            pendingVisits: visits
        )
        toastMessage = "Seans krediden tamamlandı"
    }

    func undo(eventId: String) {
        guard let event = package.events.first(where: { $0.id == eventId }),
              event.kind != .adjusted
        else { return }

        var completed = package.completedCount
        var paid = package.paidTotalTl
        if event.kind == .completed {
            completed = max(0, completed - 1)
        }
        if event.kind == .paid, let amount = event.amountTl {
            paid = max(0, paid - amount)
        }
        package = mutated(
            completedCount: completed,
            paidTotalTl: paid,
            status: completed >= package.totalSessions ? .completed : .active,
            events: package.events.filter { $0.id != eventId }
        )
        toastMessage = "Geri alındı"
    }

    func cancelPackage() {
        package = mutated(status: .cancelled)
        toastMessage = "Paket iptal edildi"
    }

    func applyPayment(amountTl: Int, method: PaymentMethod, staffName: String, note: String?) {
        let amount = min(max(amountTl, 0), package.remainingTl)
        guard amount > 0 else { return }
        let event = PackageEvent(
            id: UUID().uuidString,
            kind: .paid,
            staffName: staffName,
            amountTl: amount,
            paymentMethod: method,
            note: note,
            occurredAt: Date()
        )
        package = mutated(
            paidTotalTl: package.paidTotalTl + amount,
            feeQueued: false,
            events: [event] + package.events
        )
        toastMessage = "Tahsil edildi"
    }

    private func mutated(
        completedCount: Int? = nil,
        paidTotalTl: Int? = nil,
        status: PackageStatus? = nil,
        feeQueued: Bool? = nil,
        events: [PackageEvent]? = nil,
        pendingVisits: [PackageVisit]? = nil
    ) -> SessionPackage {
        SessionPackage(
            id: package.id,
            customerFirstName: package.customerFirstName,
            customerLastName: package.customerLastName,
            customerPhone: package.customerPhone,
            name: package.name,
            serviceName: package.serviceName,
            totalSessions: package.totalSessions,
            completedCount: completedCount ?? package.completedCount,
            periodNote: package.periodNote,
            totalPriceTl: package.totalPriceTl,
            paidTotalTl: paidTotalTl ?? package.paidTotalTl,
            status: status ?? package.status,
            events: events ?? package.events,
            pendingVisits: pendingVisits ?? package.pendingVisits,
            feeQueued: feeQueued ?? package.feeQueued
        )
    }
}
