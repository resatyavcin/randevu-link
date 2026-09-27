import Foundation

enum RevenueKind: String, Equatable, Sendable {
    case appointment
    case session
    case extra
}

struct RevenueSummary: Equatable, Sendable {
    let totalPaidTl: Int
    let cashTl: Int
    let cardTl: Int
    let paidCount: Int
    let averageTicketTl: Int
    let differenceTl: Int
}

struct RevenuePayment: Identifiable, Equatable, Sendable {
    let id: String
    let customerName: String
    let serviceName: String?
    let sessionName: String?
    let quotedPriceTl: Int
    let paidAmountTl: Int
    let paymentMethod: PaymentMethod
    let paidAtLabel: String
    let kind: RevenueKind
    let creditSessions: Int
    let sessionId: String?
}

struct PendingRegisterItem: Identifiable, Equatable, Sendable {
    let id: String
    let customerName: String
    let subtitle: String
    let amountHintTl: Int?
}

struct RegisterCatalogService: Identifiable, Equatable, Sendable {
    let id: String
    let name: String
    let priceTl: Int
}

struct RegisterSnapshot: Equatable, Sendable {
    let summary: RevenueSummary
    let payments: [RevenuePayment]
    let pending: [PendingRegisterItem]
    let services: [RegisterCatalogService]
    let staffNames: [String]
}
