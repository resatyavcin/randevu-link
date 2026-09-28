import SwiftUI
import SwiftData

@main
struct RandevuLinkApp: App {
    private let container = AppContainer()

    init() {
        TimerNotifier.prepare()
    }

    var body: some Scene {
        WindowGroup {
            RootView(
                profileViewModel: container.makeProfileViewModel(),
                notesViewModel: container.makeNotesListViewModel()
            )
        }
        .modelContainer(NotesStore.shared)
    }
}
