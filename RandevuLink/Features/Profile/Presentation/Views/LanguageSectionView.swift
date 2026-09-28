import SwiftUI

struct LanguageSectionView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @State private var isPresented = false

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sectionToCard) {
            SectionHeaderView(title: l10n(.languageSection), count: 0)

            Button {
                isPresented = true
            } label: {
                HStack(spacing: 12) {
                    Text(l10n.language.nativeName)
                        .font(AppTypography.rowTitle)
                        .foregroundStyle(appColors.textPrimary)

                    Spacer(minLength: 8)

                    Image(systemName: "chevron.right")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(appColors.textSecondary.opacity(0.7))
                }
                .padding(.horizontal, AppSpacing.rowHorizontal)
                .padding(.vertical, AppSpacing.rowVertical)
                .background(appColors.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
                .contentShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .sheet(isPresented: $isPresented) {
            SettingsDrawerView()
                .environmentObject(l10n)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
    }
}
