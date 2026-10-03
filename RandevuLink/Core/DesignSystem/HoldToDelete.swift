import SwiftUI
import UIKit

enum HoldDelete {
    static let duration: TimeInterval = 0.9
    static let armDelay: TimeInterval = 0.15
    static let deletedPause: TimeInterval = 0.42

    static func textColor(base: Color, progress: CGFloat) -> Color {
        let amount = min(1, max(0, progress) / 0.55)
        let from = UIColor(base).resolvedColor(with: .current)
        let mixed = mix(from, .white, amount: amount)
        return Color(uiColor: mixed)
    }

    private static func mix(_ from: UIColor, _ to: UIColor, amount: CGFloat) -> UIColor {
        var r1: CGFloat = 0, g1: CGFloat = 0, b1: CGFloat = 0, a1: CGFloat = 0
        var r2: CGFloat = 0, g2: CGFloat = 0, b2: CGFloat = 0, a2: CGFloat = 0
        from.getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
        to.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)
        return UIColor(
            red: r1 + (r2 - r1) * amount,
            green: g1 + (g2 - g1) * amount,
            blue: b1 + (b2 - b1) * amount,
            alpha: a1 + (a2 - a1) * amount
        )
    }
}

struct DeleteFill: View {
    @Environment(\.appColors) private var appColors
    var progress: CGFloat

    var body: some View {
        GeometryReader { geo in
            appColors.destructive
                .frame(
                    width: max(0, geo.size.width * min(1, progress)),
                    height: geo.size.height,
                    alignment: .leading
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
        .allowsHitTesting(false)
    }
}

struct HoldToDelete: ViewModifier {
    var isEnabled: Bool
    var deletedLabel: String
    @Binding var progress: CGFloat
    @Binding var showDeleted: Bool
    var onCommit: () -> Void
    var onQuickTap: () -> Void = {}

    @State private var pressBegan: Date?
    @State private var pressID = 0
    @State private var armed = false
    @State private var suppressTap = false
    @State private var committed = false
    @State private var armTask: Task<Void, Never>?
    @State private var midpointTick: Task<Void, Never>?

    func body(content: Content) -> some View {
        content
            .contentShape(Rectangle())
            .overlay {
                if showDeleted {
                    Text(deletedLabel)
                        .font(AppTypography.rowTitle)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                        .padding(.horizontal, AppSpacing.rowHorizontal)
                        .allowsHitTesting(false)
                        .transition(.opacity)
                }
            }
            .modifier(HoldGestureAttachment(
                isEnabled: isEnabled,
                onPressing: handlePress,
                onCommit: commit
            ))
            .onTapGesture(perform: handleTap)
            .onDisappear {
                armTask?.cancel()
                midpointTick?.cancel()
                pressBegan = nil
                armed = false
                if !committed {
                    progress = 0
                    showDeleted = false
                }
            }
    }

    private func handleTap() {
        if suppressTap {
            suppressTap = false
            return
        }
        guard !isEnabled else { return }
        onQuickTap()
    }

    private func handlePress(_ pressing: Bool) {
        guard isEnabled, !committed else { return }
        if pressing {
            begin()
        } else {
            let id = pressID
            let wasArmed = armed
            armTask?.cancel()
            Task { @MainActor in
                guard pressID == id, !committed else { return }
                if wasArmed {
                    suppressTap = true
                    cancelHold()
                    try? await Task.sleep(nanoseconds: 300_000_000)
                    guard pressID == id else { return }
                    suppressTap = false
                } else {
                    pressBegan = nil
                    armed = false
                    progress = 0
                }
            }
        }
    }

    private func begin() {
        pressID += 1
        let id = pressID
        armed = false
        pressBegan = Date()
        progress = 0
        armTask?.cancel()
        armTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(HoldDelete.armDelay * 1_000_000_000))
            guard !Task.isCancelled, pressID == id, pressBegan != nil, !committed else { return }
            arm()
        }
    }

    private func arm() {
        guard pressBegan != nil, !committed else { return }
        armed = true
        suppressTap = true
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        scheduleMidpoint()
        let span = HoldDelete.duration - HoldDelete.armDelay
        withAnimation(.linear(duration: span)) {
            progress = 1
        }
    }

    private func scheduleMidpoint() {
        midpointTick?.cancel()
        let generator = UISelectionFeedbackGenerator()
        generator.prepare()
        let half = (HoldDelete.duration - HoldDelete.armDelay) / 2
        midpointTick = Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(half * 1_000_000_000))
            guard !Task.isCancelled, armed, pressBegan != nil, !committed else { return }
            generator.selectionChanged()
        }
    }

    private func cancelHold() {
        guard !committed else { return }
        armTask?.cancel()
        midpointTick?.cancel()
        midpointTick = nil
        pressBegan = nil
        armed = false
        withAnimation(.easeOut(duration: 0.22)) {
            progress = 0
        }
    }

    private func commit() {
        guard isEnabled, !committed else { return }
        committed = true
        midpointTick?.cancel()
        pressBegan = nil
        progress = 1
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        withAnimation(.easeOut(duration: 0.15)) {
            showDeleted = true
        }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(HoldDelete.deletedPause * 1_000_000_000))
            onCommit()
        }
    }
}

private struct HoldGestureAttachment: ViewModifier {
    var isEnabled: Bool
    var onPressing: (Bool) -> Void
    var onCommit: () -> Void

    func body(content: Content) -> some View {
        if isEnabled {
            content.onLongPressGesture(
                minimumDuration: HoldDelete.duration,
                maximumDistance: 28,
                pressing: onPressing,
                perform: onCommit
            )
        } else {
            content
        }
    }
}
