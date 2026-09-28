import SwiftUI

struct SectionHeaderView: View {
    @Environment(\.appColors) private var appColors
    let title: String
    let count: Int
    var showsBadge: Bool = false

    var body: some View {
        HStack(spacing: 8) {
            Text(title)
                .font(AppTypography.section)
                .foregroundStyle(appColors.textSecondary)

            if showsBadge {
                Text("\(count)")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(appColors.badgeText)
                    .frame(minWidth: 26, minHeight: 26)
                    .padding(.horizontal, 6)
                    .background(appColors.badge)
                    .clipShape(Capsule())
            }

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 4)
    }
}
