import SwiftUI

struct TimeZoneDrawerView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @EnvironmentObject private var timeZones: TimeZoneStore
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    private var matches: [String] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return TimeZoneStore.options }
        return TimeZoneStore.options.filter { identifier in
            let city = TimeZoneStore.cityName(for: identifier)
            return city.localizedCaseInsensitiveContains(trimmed)
                || identifier.localizedCaseInsensitiveContains(trimmed)
        }
    }

    var body: some View {
        ZStack(alignment: .top) {
            appColors.background
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 16) {
                header
                searchField
                list
            }
            .padding(.horizontal, AppSpacing.screenHorizontal)
            .padding(.top, 20)
        }
    }

    private var header: some View {
        HStack {
            Text(l10n(.settingsTimeZone))
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

    private var searchField: some View {
        TextField(l10n(.settingsTimeZoneSearch), text: $query)
            .font(AppTypography.rowTitle)
            .foregroundStyle(appColors.textPrimary)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .padding(.horizontal, AppSpacing.rowHorizontal)
            .padding(.vertical, AppSpacing.rowVertical)
            .background(appColors.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
    }

    private var list: some View {
        ScrollView {
            VStack(spacing: AppSpacing.rowGap) {
                ForEach(matches, id: \.self) { identifier in
                    zoneRow(identifier)
                        .background(appColors.cardBackground)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
            .padding(.bottom, 20)
        }
        .screenScroll()
    }

    private func zoneRow(_ identifier: String) -> some View {
        let selected = timeZones.identifier == identifier
        return Button {
            timeZones.identifier = identifier
            dismiss()
        } label: {
            HStack(spacing: 12) {
                Text(TimeZoneStore.cityName(for: identifier))
                    .font(AppTypography.rowTitle)
                    .foregroundStyle(appColors.textPrimary)

                Spacer(minLength: 0)

                if selected {
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
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}
