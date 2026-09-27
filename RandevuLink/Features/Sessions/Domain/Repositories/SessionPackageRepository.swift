import Foundation

protocol SessionPackageRepository {
    func packages() -> [SessionPackage]
    func package(id: String) -> SessionPackage?
}

struct SessionPackageRepositoryImpl: SessionPackageRepository {
    private let dataSource: SessionPackageMockDataSource

    init(dataSource: SessionPackageMockDataSource) {
        self.dataSource = dataSource
    }

    func packages() -> [SessionPackage] {
        dataSource.loadPackages()
    }

    func package(id: String) -> SessionPackage? {
        dataSource.loadPackages().first { $0.id == id }
    }
}

struct GetSessionPackagesUseCase {
    private let repository: SessionPackageRepository

    init(repository: SessionPackageRepository) {
        self.repository = repository
    }

    func execute(status: PackageStatus? = nil, phone: String? = nil) -> [SessionPackage] {
        repository.packages().filter { package in
            if let status, package.status != status { return false }
            if let phone, !phone.isEmpty {
                let digits = phone.filter(\.isNumber)
                return package.customerPhone.contains(digits)
            }
            return true
        }
    }
}

struct GetSessionPackageUseCase {
    private let repository: SessionPackageRepository

    init(repository: SessionPackageRepository) {
        self.repository = repository
    }

    func execute(id: String) -> SessionPackage? {
        repository.package(id: id)
    }
}
