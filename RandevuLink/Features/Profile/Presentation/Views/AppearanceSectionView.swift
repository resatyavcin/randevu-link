import SwiftUI

struct AppearanceSectionView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @Binding var isDarkMode: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sectionToCard) {
            SectionHeaderView(title: l10n(.appearanceSection), count: 0)

            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isDarkMode.toggle()
                }
            } label: {
                HStack(spacing: 12) {
                    Text(l10n(.darkMode))
                        .font(AppTypography.rowTitle)
                        .foregroundStyle(appColors.textPrimary)

                    Spacer(minLength: 0)

                    AppSwitch(isOn: $isDarkMode)
                }
                .padding(.horizontal, AppSpacing.rowHorizontal)
                .padding(.vertical, 10)
                .background(appColors.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
                .contentShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
            }
            .buttonStyle(.plain)
            .accessibilityLabel(l10n(.darkMode))
            .accessibilityAddTraits(.isToggle)
            .accessibilityValue(isDarkMode ? "Açık" : "Kapalı")
        }
    }
}
