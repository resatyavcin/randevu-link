import SwiftUI

struct ProfileView: View {
    @ObservedObject var viewModel: ProfileViewModel
    @Binding var isDarkMode: Bool

    var body: some View {
        ZStack {
            AppColors.background
                .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.sectionGap) {
                    if let profile = viewModel.profile {
                        GreetingHeaderView(
                            greeting: profile.greeting,
                            subtitle: profile.subtitle
                        )
                        .padding(.bottom, AppSpacing.headerToSections - AppSpacing.sectionGap)

                        AppearanceSectionView(isDarkMode: $isDarkMode)
                        LanguageSectionView()
                    }
                }
                .padding(.horizontal, AppSpacing.screenHorizontal)
                .padding(.bottom, AppSpacing.bottomBarInset)
            }
        }
        .onAppear {
            viewModel.load()
        }
    }
}

#Preview {
    let dataSource = ProfileMockDataSource()
    let repository = ProfileRepositoryImpl(dataSource: dataSource)
    let viewModel = ProfileViewModel(getProfile: GetProfileUseCase(repository: repository))
    ProfileView(viewModel: viewModel, isDarkMode: .constant(false))
        .environmentObject(LocalizationManager())
}
