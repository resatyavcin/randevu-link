import Foundation

struct ProfileRepositoryImpl: ProfileRepository {
    private let dataSource: ProfileMockDataSource

    init(dataSource: ProfileMockDataSource) {
        self.dataSource = dataSource
    }

    func fetchProfile() -> UserProfile {
        dataSource.load()
    }
}
