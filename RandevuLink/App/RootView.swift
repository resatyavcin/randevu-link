import SwiftUI

struct RootView: View {
    @StateObject private var profileViewModel: ProfileViewModel
    @StateObject private var notesViewModel: NotesListViewModel
    @StateObject private var l10n = LocalizationManager()
    @StateObject private var timeZones = TimeZoneStore()
    @StateObject private var toast = ToastCenter()
    @AppStorage("appearance.darkMode") private var isDarkMode = false

    init(
        profileViewModel: ProfileViewModel,
        notesViewModel: NotesListViewModel
    ) {
        _profileViewModel = StateObject(wrappedValue: profileViewModel)
        _notesViewModel = StateObject(wrappedValue: notesViewModel)
    }

    var body: some View {
        MainView(
            profileViewModel: profileViewModel,
            notesViewModel: notesViewModel,
            isDarkMode: $isDarkMode
        )
        .environmentObject(l10n)
        .environmentObject(timeZones)
        .environmentObject(toast)
        .environment(\.appColors, isDarkMode ? .dark : .light)
        .environment(\.locale, Locale(identifier: l10n.language.localeIdentifier))
        .preferredColorScheme(isDarkMode ? .dark : .light)
    }
}
