import SwiftUI

struct ProfileRowCard: View {
    @Environment(\.appColors) private var appColors
    let title: String
    let source: String

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(AppTypography.rowTitle)
                    .foregroundStyle(appColors.textPrimary)
                    .multilineTextAlignment(.leading)

                Text(source)
                    .font(AppTypography.rowSource)
                    .foregroundStyle(appColors.textSecondary)
            }

            Spacer(minLength: 8)

            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(appColors.textSecondary.opacity(0.7))
        }
        .padding(.horizontal, AppSpacing.rowHorizontal)
        .padding(.vertical, AppSpacing.rowVertical)
        .contentShape(Rectangle())
    }
}
