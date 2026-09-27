import Foundation

@MainActor
final class SessionsListViewModel: ObservableObject {
    enum StatusFilter: Equatable {
        case all
        case status(PackageStatus)
    }

    @Published private(set) var packages: [SessionPackage] = []
    @Published var statusFilter: StatusFilter = .all
    @Published var phoneQuery: String = ""

    private let getPackages: GetSessionPackagesUseCase
    private var allPackages: [SessionPackage] = []

    init(getPackages: GetSessionPackagesUseCase) {
        self.getPackages = getPackages
    }

    func load() {
        allPackages = getPackages.execute()
        applyFilters()
    }

    func applyFilters() {
        let status: PackageStatus? = {
            if case .status(let value) = statusFilter { return value }
            return nil
        }()
        let phoneDigits = phoneQuery.filter(\.isNumber)

        packages = allPackages.filter { package in
            if let status, package.status != status { return false }
            if !phoneDigits.isEmpty, !package.customerPhone.contains(phoneDigits) {
                return false
            }
            return true
        }
    }

    func add(_ input: NewSessionPackageInput) {
        let created = SessionPackage(
            id: UUID().uuidString,
            customerFirstName: input.customerFirstName.trimmingCharacters(in: .whitespaces),
            customerLastName: input.customerLastName.trimmingCharacters(in: .whitespaces),
            customerPhone: input.customerPhone.filter(\.isNumber),
            name: input.name.trimmingCharacters(in: .whitespaces),
            serviceName: input.serviceName.isEmpty ? nil : input.serviceName,
            totalSessions: max(1, input.totalSessions),
            completedCount: 0,
            periodNote: input.periodNote.isEmpty ? nil : input.periodNote,
            totalPriceTl: max(0, input.totalPriceTl),
            paidTotalTl: 0,
            status: .active,
            events: [],
            pendingVisits: [],
            feeQueued: false
        )
        allPackages.insert(created, at: 0)
        applyFilters()
    }
}
