import SwiftUI

enum BottomBarMode: String, CaseIterable {
    case focus
    case notes
}

struct BottomBarView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @Binding var mode: BottomBarMode
    var isListening: Bool = false
    var showsListen: Bool = true
    var onListen: () -> Void = {}
    var onStamp: (() -> Void)?
    var onEnter: (() -> Void)?
    var onSample: (() -> Void)?

    private let control: CGFloat = 44

    var body: some View {
        HStack(spacing: 12) {
            if !isListening {
                modeToggle
            }

            Spacer(minLength: 0)

            if showsListen {
                listenButton
            }
            if let onStamp {
                iconButton(systemName: "calendar.badge.clock", label: l10n(.notesStampDate), action: onStamp)
            }
            if let onSample {
                iconButton(systemName: "text.insert", label: "Lorem", action: onSample)
            }
            if let onEnter {
                iconButton(systemName: "arrow.turn.down.left", label: l10n(.notesDetailAddItem), action: onEnter)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
    }

    private func iconButton(systemName: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(appColors.textPrimary)
                .frame(width: control, height: control)
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .background {
            Color.clear
                .modifier(JoinedGlass(circle: true, interactive: false))
                .allowsHitTesting(false)
        }
        .accessibilityLabel(label)
    }

    private var modeToggle: some View {
        HStack(spacing: 0) {
            toggleItem(systemName: "note.text", isSelected: mode == .notes, label: l10n(.notesTitle)) {
                mode = .notes
            }
            toggleItem(systemName: "gearshape", isSelected: mode == .focus, label: l10n(.settingsTitle)) {
                mode = .focus
            }
        }
        .background {
            Color.clear
                .modifier(JoinedGlass(circle: false, interactive: false))
                .allowsHitTesting(false)
        }
    }

    private var listenButton: some View {
        Button(action: onListen) {
            listenLabel(systemName: isListening ? "stop.fill" : "play.fill", title: l10n(isListening ? .commonStop : .commonListen))
        }
        .buttonStyle(.plain)
        .background {
            Color.clear
                .modifier(JoinedGlass(circle: false, interactive: false))
                .allowsHitTesting(false)
        }
    }

    private func listenLabel(systemName: String, title: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: systemName)
                .font(.system(size: 13, weight: .bold))
            Text(title)
                .font(.system(size: 16, weight: .semibold))
        }
        .foregroundStyle(appColors.textPrimary)
        .padding(.horizontal, 16)
        .frame(height: control)
        .contentShape(Capsule())
    }

    private func toggleItem(
        systemName: String,
        isSelected: Bool,
        label: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(isSelected ? appColors.textPrimary : appColors.textSecondary)
                .frame(width: control, height: control)
                .background {
                    if isSelected {
                        Circle()
                            .fill(appColors.controlSelected)
                            .padding(4)
                    }
                }
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}

struct JoinedGlass: ViewModifier {
    var circle: Bool
    var interactive: Bool = false

    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            if interactive {
                if circle {
                    content.glassEffect(.regular.interactive(), in: Circle())
                } else {
                    content.glassEffect(.regular.interactive(), in: Capsule())
                }
            } else if circle {
                content.glassEffect(.regular, in: Circle())
            } else {
                content.glassEffect(.regular, in: Capsule())
            }
        } else if circle {
            content.background(Circle().fill(.ultraThinMaterial))
        } else {
            content.background(Capsule().fill(.ultraThinMaterial))
        }
    }
}
