import Foundation

@MainActor
final class ProfileViewModel: ObservableObject {
    @Published private(set) var profile: UserProfile?

    private let getProfile: GetProfileUseCase

    init(getProfile: GetProfileUseCase) {
        self.getProfile = getProfile
    }

    func load() {
        profile = getProfile.execute()
    }
}
