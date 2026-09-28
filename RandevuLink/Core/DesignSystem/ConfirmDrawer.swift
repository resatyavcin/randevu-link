import SwiftUI

struct ConfirmDrawer: View {
    @Environment(\.appColors) private var appColors
    @Environment(\.dismiss) private var dismiss

    let title: String
    let message: String
    let confirmTitle: String
    let cancelTitle: String
    var onConfirm: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Capsule()
                .fill(appColors.controlBackground)
                .frame(width: 36, height: 5)
                .padding(.top, 8)

            VStack(spacing: 6) {
                Text(title)
                    .font(AppTypography.rowTitle)
                    .foregroundStyle(appColors.textPrimary)
                if !message.isEmpty {
                    Text(message)
                        .font(AppTypography.subtitle)
                        .foregroundStyle(appColors.textSecondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity)

            HStack(spacing: 8) {
                actionButton(title: cancelTitle, prominent: false) {
                    dismiss()
                }
                actionButton(title: confirmTitle, prominent: true) {
                    onConfirm()
                    dismiss()
                }
            }
        }
        .padding(.horizontal, AppSpacing.screenHorizontal)
        .padding(.bottom, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(appColors.background)
    }

    private func actionButton(
        title: String,
        prominent: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Text(title)
                .font(AppTypography.listen)
                .foregroundStyle(prominent ? appColors.background : appColors.textPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: AppSpacing.controlSize)
                .background(prominent ? appColors.accent : appColors.controlBackground)
                .clipShape(Capsule())
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}
