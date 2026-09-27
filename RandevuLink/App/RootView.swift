import SwiftUI

struct RootView: View {
    @StateObject private var profileViewModel: ProfileViewModel
    @StateObject private var sessionsViewModel: SessionsListViewModel
    @StateObject private var registerViewModel: RegisterViewModel
    @StateObject private var l10n = LocalizationManager()
    @StateObject private var toast = ToastCenter()
    @AppStorage("appearance.darkMode") private var isDarkMode = false

    init(
        profileViewModel: ProfileViewModel,
        sessionsViewModel: SessionsListViewModel,
        registerViewModel: RegisterViewModel
    ) {
        _profileViewModel = StateObject(wrappedValue: profileViewModel)
        _sessionsViewModel = StateObject(wrappedValue: sessionsViewModel)
        _registerViewModel = StateObject(wrappedValue: registerViewModel)
    }

    var body: some View {
        MainView(
            profileViewModel: profileViewModel,
            sessionsViewModel: sessionsViewModel,
            registerViewModel: registerViewModel,
            isDarkMode: $isDarkMode
        )
        .environmentObject(l10n)
        .environmentObject(toast)
        .environment(\.locale, Locale(identifier: l10n.language.localeIdentifier))
        .preferredColorScheme(isDarkMode ? .dark : .light)
    }
}
