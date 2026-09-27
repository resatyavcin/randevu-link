import SwiftUI

@main
struct RandevuLinkApp: App {
    private let container = AppContainer()

    var body: some Scene {
        WindowGroup {
            RootView(
                profileViewModel: container.makeProfileViewModel(),
                sessionsViewModel: container.makeSessionsListViewModel(),
                registerViewModel: container.makeRegisterViewModel()
            )
        }
    }
}
