import SwiftUI

enum BottomBarMode: String, CaseIterable {
    case focus
    case sessions
    case register
}

struct BottomBarView: View {
    @EnvironmentObject private var l10n: LocalizationManager
    @Binding var mode: BottomBarMode
    var onListen: () -> Void = {}

    var body: some View {
        HStack(spacing: 14) {
            modeToggle

            Spacer(minLength: 0)

            listenButton
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
    }

    private var modeToggle: some View {
        HStack(spacing: 0) {
            toggleItem(systemName: "square.stack.3d.up", isSelected: mode == .sessions) {
                mode = .sessions
            }
            toggleItem(systemName: "wallet.pass", isSelected: mode == .register) {
                mode = .register
            }
            toggleItem(systemName: "gearshape", isSelected: mode == .focus) {
                mode = .focus
            }
        }
        .padding(4)
        .background(AppColors.controlBackground)
        .clipShape(Capsule())
    }

    private var listenButton: some View {
        Button(action: onListen) {
            HStack(spacing: 8) {
                Image(systemName: "play.fill")
                    .font(.system(size: 12, weight: .bold))
                Text(l10n(.commonListen))
                    .font(AppTypography.listen)
            }
            .foregroundStyle(AppColors.background)
            .padding(.horizontal, 18)
            .frame(height: AppSpacing.controlSize)
            .background(AppColors.accent)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private func toggleItem(
        systemName: String,
        isSelected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(isSelected ? AppColors.textPrimary : AppColors.textSecondary)
                .frame(width: 40, height: 40)
                .background(isSelected ? AppColors.controlSelected : Color.clear)
                .clipShape(Circle())
        }
        .buttonStyle(.plain)
    }
}
