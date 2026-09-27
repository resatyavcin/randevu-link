import Foundation

protocol RegisterRepository {
    func load() -> RegisterSnapshot
}

struct RegisterRepositoryImpl: RegisterRepository {
    private let dataSource: RegisterMockDataSource

    init(dataSource: RegisterMockDataSource) {
        self.dataSource = dataSource
    }

    func load() -> RegisterSnapshot {
        dataSource.load()
    }
}

struct GetRegisterSnapshotUseCase {
    private let repository: RegisterRepository

    init(repository: RegisterRepository) {
        self.repository = repository
    }

    func execute() -> RegisterSnapshot {
        repository.load()
    }
}
