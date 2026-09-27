import SwiftUI

struct MainView: View {
    @EnvironmentObject private var l10n: LocalizationManager
    @EnvironmentObject private var toast: ToastCenter
    @ObservedObject var profileViewModel: ProfileViewModel
    @ObservedObject var sessionsViewModel: SessionsListViewModel
    @ObservedObject var registerViewModel: RegisterViewModel
    @Binding var isDarkMode: Bool
    @State private var mode: BottomBarMode = .sessions

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch mode {
                case .focus:
                    ProfileView(viewModel: profileViewModel, isDarkMode: $isDarkMode)
                case .sessions:
                    SessionsListView(viewModel: sessionsViewModel)
                case .register:
                    RegisterView(viewModel: registerViewModel)
                }
            }

            ToastHost(toast: toast)

            BottomBarView(mode: $mode) {
                toast.show(l10n(.commonListening))
            }
            .padding(.bottom, 8)
        }
    }
}
