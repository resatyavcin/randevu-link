import SwiftUI

struct SelectionBar: View {
    @Environment(\.appColors) private var appColors
    var isDeleting: Bool
    var deleteTitle: String
    var cancelTitle: String
    var onDelete: () -> Void
    var onCancel: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            if isDeleting {
                chip(cancelTitle, action: onCancel)
            } else {
                chip(deleteTitle, action: onDelete)
            }
        }
        .fixedSize(horizontal: true, vertical: false)
    }

    private func chip(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(appColors.textPrimary)
                .padding(.horizontal, 14)
                .frame(height: 36)
                .background(appColors.controlBackground)
                .clipShape(Capsule())
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}
