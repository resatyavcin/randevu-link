import SwiftUI

struct GreetingHeaderView: View {
    @Environment(\.appColors) private var appColors
    let greeting: String
    let subtitle: String

    var body: some View {
        VStack(spacing: AppSpacing.greetingToSubtitle) {
            Text(greeting)
                .font(AppTypography.greeting)
                .foregroundStyle(appColors.textPrimary)
                .multilineTextAlignment(.center)

            if !subtitle.isEmpty {
                Text(subtitle)
                    .font(AppTypography.subtitle)
                    .foregroundStyle(appColors.textSecondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, AppSpacing.greetingTop)
        .padding(.horizontal, AppSpacing.screenHorizontal)
    }
}
