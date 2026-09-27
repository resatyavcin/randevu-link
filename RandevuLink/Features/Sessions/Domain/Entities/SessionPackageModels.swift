import Foundation

enum PackageStatus: String, Equatable, Sendable, CaseIterable {
    case active
    case completed
    case cancelled
}

enum PackageEventKind: String, Equatable, Sendable {
    case completed
    case paid
    case adjusted
}

enum PackageSlotKind: String, Equatable, Sendable {
    case paid
    case credit
    case debt
    case unpaid
}

enum PaymentMethod: String, Equatable, Sendable, CaseIterable {
    case cash
    case card
}

struct PackageEvent: Identifiable, Equatable, Sendable {
    let id: String
    let kind: PackageEventKind
    let staffName: String?
    let amountTl: Int?
    let paymentMethod: PaymentMethod?
    let note: String?
    let occurredAt: Date
}

struct PackageVisit: Identifiable, Equatable, Sendable {
    let id: String
    let dateLabel: String
    let serviceName: String
    let staffName: String?
}

struct PackageSlot: Identifiable, Equatable, Sendable {
    var id: Int { index }
    let index: Int
    let kind: PackageSlotKind
    let label: String
}

struct SessionPackage: Identifiable, Equatable, Sendable {
    let id: String
    let customerFirstName: String
    let customerLastName: String
    let customerPhone: String
    let name: String
    let serviceName: String?
    let totalSessions: Int
    let completedCount: Int
    let periodNote: String?
    let totalPriceTl: Int
    let paidTotalTl: Int
    let status: PackageStatus
    let events: [PackageEvent]
    let pendingVisits: [PackageVisit]
    let feeQueued: Bool

    var customerName: String {
        "\(customerFirstName) \(customerLastName)".trimmingCharacters(in: .whitespaces)
    }

    var unitPriceTl: Int {
        guard totalSessions > 0 else { return 0 }
        return totalPriceTl / totalSessions
    }

    var creditBalanceTl: Int {
        paidTotalTl - completedCount * unitPriceTl
    }

    var remainingTl: Int {
        max(0, totalPriceTl - paidTotalTl)
    }

    var progress: Double {
        guard totalSessions > 0 else { return 0 }
        return Double(completedCount) / Double(totalSessions)
    }

    var phoneDisplay: String {
        "+90 \(Self.formatPhone(customerPhone))"
    }

    var slots: [PackageSlot] {
        Self.makeSlots(
            totalSessions: totalSessions,
            completedCount: completedCount,
            paidTotalTl: paidTotalTl,
            unitPriceTl: unitPriceTl
        )
    }

    private static func formatPhone(_ raw: String) -> String {
        let digits = raw.filter(\.isNumber)
        guard digits.count == 10 else { return raw }
        let a = digits.prefix(3)
        let b = digits.dropFirst(3).prefix(3)
        let c = digits.dropFirst(6).prefix(2)
        let d = digits.suffix(2)
        return "\(a) \(b) \(c) \(d)"
    }

    static func makeSlots(
        totalSessions: Int,
        completedCount: Int,
        paidTotalTl: Int,
        unitPriceTl: Int
    ) -> [PackageSlot] {
        guard totalSessions > 0 else { return [] }
        if unitPriceTl <= 0 {
            return (1...totalSessions).map { n in
                let done = n <= completedCount
                return PackageSlot(
                    index: n,
                    kind: done ? .paid : .unpaid,
                    label: done ? "Ödendi" : "Bekliyor"
                )
            }
        }
        let fullPaid = paidTotalTl / unitPriceTl
        let remainder = paidTotalTl - fullPaid * unitPriceTl
        return (1...totalSessions).map { n in
            let done = n <= completedCount
            let covered = n <= fullPaid
            let partial = n == fullPaid + 1 && remainder > 0
            if covered && done {
                return PackageSlot(index: n, kind: .paid, label: "Ödendi")
            }
            if covered && !done {
                return PackageSlot(index: n, kind: .credit, label: "Kredi")
            }
            if partial && done {
                return PackageSlot(index: n, kind: .debt, label: "Ödeme eksik")
            }
            if partial && !done {
                return PackageSlot(index: n, kind: .credit, label: "Kredi")
            }
            if done {
                return PackageSlot(index: n, kind: .debt, label: "Ödeme eksik")
            }
            return PackageSlot(index: n, kind: .unpaid, label: "Bekliyor")
        }
    }
}

struct NewSessionPackageInput: Equatable, Sendable {
    var customerPhone: String = ""
    var customerFirstName: String = ""
    var customerLastName: String = ""
    var name: String = ""
    var serviceName: String = ""
    var totalSessions: Int = 8
    var totalPriceTl: Int = 0
    var periodNote: String = ""
}
