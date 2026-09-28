import SwiftUI

enum BottomBarMode: String, CaseIterable {
    case focus
    case notes
    case daily
}

struct BottomBarView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @Binding var mode: BottomBarMode
    var isListening: Bool = false
    var showsListen: Bool = true
    var onListen: () -> Void = {}
    var onEnter: (() -> Void)?
    var onSample: (() -> Void)?
    var onAdd: (() -> Void)?

    var body: some View {
        HStack(spacing: 12) {
            if !isListening {
                modeToggle
            }

            Spacer(minLength: 0)

            if showsListen {
                listenButton
            }

            if let onSample {
                iconButton(systemName: "text.insert", label: "Lorem", action: onSample)
            }

            if let onEnter {
                iconButton(systemName: "arrow.turn.down.left", label: l10n(.notesDetailAddItem), action: onEnter)
            }

            addButton
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
    }

    @ViewBuilder
    private var addButton: some View {
        if let onAdd {
            Button(action: onAdd) {
                plusIcon
            }
            .buttonStyle(.plain)
            .contentShape(Circle())
            .accessibilityLabel(l10n(.notesGroupNew))
        }
    }

    private func iconButton(systemName: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(appColors.icon)
                .frame(width: AppSpacing.controlSize, height: AppSpacing.controlSize)
                .background(appColors.controlBackground)
                .clipShape(Circle())
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }

    private var plusIcon: some View {
        Image(systemName: "plus")
            .font(.system(size: 15, weight: .bold))
            .foregroundStyle(appColors.icon)
            .frame(width: AppSpacing.controlSize, height: AppSpacing.controlSize)
            .background(appColors.controlBackground)
            .clipShape(Circle())
            .contentShape(Circle())
    }

    private var modeToggle: some View {
        HStack(spacing: 0) {
            toggleItem(systemName: "note.text", isSelected: mode == .notes, label: l10n(.notesTitle)) {
                mode = .notes
            }
            toggleItem(systemName: "calendar", isSelected: mode == .daily, label: l10n(.dailyTitle)) {
                mode = .daily
            }
            toggleItem(systemName: "gearshape", isSelected: mode == .focus, label: l10n(.settingsTitle)) {
                mode = .focus
            }
        }
        .padding(4)
        .background(appColors.controlBackground)
        .clipShape(Capsule())
    }

    private var listenButton: some View {
        Button(action: onListen) {
            HStack(spacing: 8) {
                Image(systemName: isListening ? "stop.fill" : "play.fill")
                    .font(.system(size: 12, weight: .bold))
                Text(l10n(isListening ? .commonStop : .commonListen))
                    .font(AppTypography.listen)
            }
            .foregroundStyle(appColors.background)
            .padding(.horizontal, 18)
            .frame(height: AppSpacing.controlSize)
            .background(appColors.accent)
            .clipShape(Capsule())
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private func toggleItem(
        systemName: String,
        isSelected: Bool,
        label: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(isSelected ? appColors.textPrimary : appColors.textSecondary)
                .frame(width: 40, height: 40)
                .background(isSelected ? appColors.controlSelected : Color.clear)
                .clipShape(Circle())
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}
