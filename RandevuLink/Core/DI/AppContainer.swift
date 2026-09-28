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
    func makeNotesListViewModel() -> NotesListViewModel {
        let repository = NotesRepository(container: NotesStore.shared)
        return NotesListViewModel(repository: repository)
    }
}
