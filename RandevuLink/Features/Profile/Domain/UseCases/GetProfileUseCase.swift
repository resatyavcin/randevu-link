import Foundation

struct GetProfileUseCase: Sendable {
    private let repository: any ProfileRepository

    init(repository: any ProfileRepository) {
        self.repository = repository
    }

    func execute() -> UserProfile {
        repository.fetchProfile()
    }
}
