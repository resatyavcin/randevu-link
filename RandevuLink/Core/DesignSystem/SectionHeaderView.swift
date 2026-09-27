import SwiftUI

struct SectionHeaderView: View {
    let title: String
    let count: Int
    var showsBadge: Bool = false

    var body: some View {
        HStack(spacing: 8) {
            Text(title)
                .font(AppTypography.section)
                .foregroundStyle(AppColors.textSecondary)

            if showsBadge {
                Text("\(count)")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(AppColors.badgeText)
                    .frame(minWidth: 26, minHeight: 26)
                    .padding(.horizontal, 6)
                    .background(AppColors.badge)
                    .clipShape(Capsule())
            }

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 4)
    }
}
