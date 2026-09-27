import SwiftUI

struct GreetingHeaderView: View {
    let greeting: String
    let subtitle: String

    var body: some View {
        VStack(spacing: AppSpacing.greetingToSubtitle) {
            Text(greeting)
                .font(AppTypography.greeting)
                .foregroundStyle(AppColors.textPrimary)
                .multilineTextAlignment(.center)

            Text(subtitle)
                .font(AppTypography.subtitle)
                .foregroundStyle(AppColors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, AppSpacing.greetingTop)
        .padding(.horizontal, AppSpacing.screenHorizontal)
    }
}
