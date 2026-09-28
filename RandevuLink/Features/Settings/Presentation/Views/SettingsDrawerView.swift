import SwiftUI

struct SettingsDrawerView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack(alignment: .top) {
            appColors.background
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 24) {
                header

                languageSection

                Spacer(minLength: 0)
            }
            .padding(.horizontal, AppSpacing.screenHorizontal)
            .padding(.top, 20)
        }
    }

    private var header: some View {
        HStack {
            Text(l10n(.languageSection))
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(appColors.textPrimary)

            Spacer(minLength: 0)

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(appColors.icon)
                    .frame(width: 34, height: 34)
                    .background(appColors.controlBackground)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(l10n(.commonClose))
        }
    }

    private var languageSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sectionToCard) {
            SectionHeaderView(title: l10n(.languageSection), count: 0)

            VStack(spacing: AppSpacing.rowGap) {
                ForEach(AppLanguage.allCases) { language in
                    languageRow(language)
                        .background(appColors.cardBackground)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
        }
    }

    private func languageRow(_ language: AppLanguage) -> some View {
        Button {
            l10n.language = language
            dismiss()
        } label: {
            HStack(spacing: 12) {
                Text(language.nativeName)
                    .font(AppTypography.rowTitle)
                    .foregroundStyle(appColors.textPrimary)

                Spacer(minLength: 0)

                if l10n.language == language {
                    Image(systemName: "checkmark")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(appColors.textPrimary)
                }
            }
            .padding(.horizontal, AppSpacing.rowHorizontal)
            .padding(.vertical, AppSpacing.rowVertical)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
