import Foundation

struct AppContainer {
    @MainActor
    func makeProfileViewModel() -> ProfileViewModel {
        let dataSource = ProfileMockDataSource()
        let repository = ProfileRepositoryImpl(dataSource: dataSource)
        let useCase = GetProfileUseCase(repository: repository)
        return ProfileViewModel(getProfile: useCase)
    }

    @MainActor
    func makeSessionsListViewModel() -> SessionsListViewModel {
        let dataSource = SessionPackageMockDataSource()
        let repository = SessionPackageRepositoryImpl(dataSource: dataSource)
        let useCase = GetSessionPackagesUseCase(repository: repository)
        return SessionsListViewModel(getPackages: useCase)
    }

    @MainActor
    func makeRegisterViewModel() -> RegisterViewModel {
        let dataSource = RegisterMockDataSource()
        let repository = RegisterRepositoryImpl(dataSource: dataSource)
        let useCase = GetRegisterSnapshotUseCase(repository: repository)
        return RegisterViewModel(getSnapshot: useCase)
    }
}
