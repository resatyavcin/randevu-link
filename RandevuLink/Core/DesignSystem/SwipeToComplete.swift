import SwiftUI
import UIKit

enum SwipeComplete {
    static let threshold: CGFloat = 64
    static let notch: CGFloat = 8
    static let maxVisual: CGFloat = 108

    static func resisted(_ pull: CGFloat) -> CGFloat {
        let pull = max(0, pull)
        guard pull > threshold else { return pull }
        let extra = (pull - threshold) * 0.32
        return min(threshold + extra, maxVisual)
    }
}

struct SwipeToComplete: ViewModifier {
    var isEnabled: Bool
    var completes: Bool = true
    var isDone: Bool
    var onCommit: () -> Void
    var onTap: () -> Void
    var onLongPress: () -> Void

    @Environment(\.appColors) private var appColors
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pull: CGFloat = 0
    @State private var notch: CGFloat = 0
    @State private var crossed = false
    @State private var checkScale: CGFloat = 0.7
    @State private var undoing = false
    @State private var feedback = UIImpactFeedbackGenerator(style: .light)

    private var visualOffset: CGFloat {
        SwipeComplete.resisted(pull) + notch
    }

    func body(content: Content) -> some View {
        content
            .offset(x: -visualOffset)
            .background(alignment: .trailing) {
                reveal
            }
            .clipped()
            .overlay {
                SwipePanBridge(
                    isEnabled: isEnabled,
                    completes: completes,
                    onBegan: begin,
                    onChange: setPull,
                    onEnd: finish,
                    onTap: onTap,
                    onLongPress: onLongPress
                )
            }
            .onChange(of: isEnabled) { _, enabled in
                guard !enabled else { return }
                reset(animated: false)
            }
            .onChange(of: completes) { _, enabled in
                guard !enabled else { return }
                reset(animated: false)
            }
            .onDisappear {
                reset(animated: false)
            }
    }

    private var reveal: some View {
        let icon = undoing ? "arrow.uturn.backward" : "checkmark"
        let fill = undoing ? appColors.textPrimary.opacity(0.16) : appColors.positive
        let iconColor = undoing ? appColors.textPrimary : Color.white
        return ZStack(alignment: .trailing) {
            fill
                .frame(width: max(visualOffset, 0))
                .frame(maxHeight: .infinity, alignment: .trailing)
            Image(systemName: icon)
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(iconColor)
                .scaleEffect(checkScale)
                .opacity(iconOpacity)
                .padding(.trailing, 20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
        .allowsHitTesting(false)
    }

    private var iconOpacity: Double {
        Double(min(1, max(0, visualOffset / 36)))
    }

    private func begin() {
        undoing = isDone
        feedback.prepare()
    }

    private func setPull(_ value: CGFloat) {
        var transaction = Transaction()
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            pull = value
        }
        let next = value >= SwipeComplete.threshold
        guard next != crossed else { return }
        crossed = next
        if next {
            feedback.impactOccurred()
            feedback.prepare()
            withAnimation(settle) {
                notch = SwipeComplete.notch
                checkScale = 1
            }
        } else {
            withAnimation(release) {
                notch = 0
                checkScale = 0.7
            }
        }
    }

    private func finish(pull value: CGFloat, commitAllowed: Bool) {
        let commit = completes && commitAllowed && (crossed || value >= SwipeComplete.threshold)
        withAnimation(release) {
            pull = 0
            notch = 0
            checkScale = 0.7
            crossed = false
        }
        guard commit else { return }
        onCommit()
    }

    private func reset(animated: Bool) {
        let apply = {
            pull = 0
            notch = 0
            checkScale = 0.7
            crossed = false
        }
        if animated {
            withAnimation(release, apply)
        } else {
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction, apply)
        }
    }

    private var settle: Animation {
        reduceMotion
            ? .easeOut(duration: 0.16)
            : .spring(response: 0.32, dampingFraction: 0.52)
    }

    private var release: Animation {
        reduceMotion
            ? .easeOut(duration: 0.2)
            : .spring(response: 0.34, dampingFraction: 0.78)
    }
}

private struct SwipePanBridge: UIViewRepresentable {
    var isEnabled: Bool
    var completes: Bool
    var onBegan: () -> Void
    var onChange: (CGFloat) -> Void
    var onEnd: (_ pull: CGFloat, _ commitAllowed: Bool) -> Void
    var onTap: () -> Void
    var onLongPress: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> SwipeSurface {
        let view = SwipeSurface()
        view.coordinator = context.coordinator
        return view
    }

    func updateUIView(_ uiView: SwipeSurface, context: Context) {
        let coordinator = context.coordinator
        coordinator.isEnabled = isEnabled
        coordinator.completes = completes
        coordinator.onBegan = onBegan
        coordinator.onChange = onChange
        coordinator.onEnd = onEnd
        coordinator.onTap = onTap
        coordinator.onLongPress = onLongPress
        uiView.coordinator = coordinator
    }

    @MainActor
    final class Coordinator {
        var isEnabled = true
        var completes = true
        var onBegan: () -> Void = {}
        var onChange: (CGFloat) -> Void = { _ in }
        var onEnd: (CGFloat, Bool) -> Void = { _, _ in }
        var onTap: () -> Void = {}
        var onLongPress: () -> Void = {}
        private var didLock = false
        private var pinnedOffset: CGPoint?
        private weak var pinnedScroll: UIScrollView?

        func shouldBegin(_ pan: LeftSwipeRecognizer) -> Bool {
            guard isEnabled, completes, let start = pan.touchStarted else { return false }
            guard Date().timeIntervalSince(start) < 0.35 else { return false }
            let velocity = pan.velocity(in: pan.view)
            let translation = pan.translation(in: pan.view)
            return velocity.x < 0 && translation.x < 0 && abs(velocity.x) > abs(velocity.y)
        }

        func handle(_ pan: UIPanGestureRecognizer) {
            let distance = max(0, -(pan.translation(in: pan.view).x))
            switch pan.state {
            case .began:
                pinScroll(from: pan.view)
                didLock = true
                onBegan()
                onChange(distance)
            case .changed:
                guard didLock else { return }
                holdScroll()
                onChange(distance)
            case .ended:
                guard didLock else { return }
                didLock = false
                releaseScroll()
                onEnd(distance, true)
            case .cancelled, .failed:
                guard didLock else { return }
                didLock = false
                releaseScroll()
                onEnd(0, false)
            default:
                break
            }
        }

        private func pinScroll(from view: UIView?) {
            guard let scroll = enclosingScroll(from: view) else { return }
            pinnedScroll = scroll
            pinnedOffset = scroll.contentOffset
        }

        private func holdScroll() {
            guard let scroll = pinnedScroll, let pinnedOffset else { return }
            guard scroll.contentOffset != pinnedOffset else { return }
            scroll.setContentOffset(pinnedOffset, animated: false)
        }

        private func releaseScroll() {
            pinnedScroll = nil
            pinnedOffset = nil
        }

        private func enclosingScroll(from view: UIView?) -> UIScrollView? {
            var current = view
            while let next = current {
                if let scroll = next as? UIScrollView { return scroll }
                current = next.superview
            }
            return nil
        }
    }
}

private final class LeftSwipeRecognizer: UIPanGestureRecognizer {
    var touchStarted: Date?

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        touchStarted = Date()
        super.touchesBegan(touches, with: event)
    }

    override func reset() {
        super.reset()
        touchStarted = nil
    }
}

private final class SwipeSurface: UIView, UIGestureRecognizerDelegate {
    var coordinator: SwipePanBridge.Coordinator? {
        didSet { longPress.isEnabled = coordinator?.isEnabled ?? true }
    }

    private let pan = LeftSwipeRecognizer()
    private let tap = UITapGestureRecognizer()
    private let longPress = UILongPressGestureRecognizer()

    override init(frame: CGRect) {
        super.init(frame: frame)
        isUserInteractionEnabled = true
        isAccessibilityElement = false
        accessibilityElementsHidden = true
        backgroundColor = .clear

        pan.delegate = self
        pan.cancelsTouchesInView = false
        pan.delaysTouchesBegan = false
        pan.maximumNumberOfTouches = 1
        pan.addTarget(self, action: #selector(handlePan))

        tap.delegate = self
        tap.cancelsTouchesInView = false
        tap.delaysTouchesBegan = false
        tap.require(toFail: pan)
        tap.require(toFail: longPress)
        tap.addTarget(self, action: #selector(handleTap))

        longPress.delegate = self
        longPress.minimumPressDuration = 0.45
        longPress.allowableMovement = 12
        longPress.cancelsTouchesInView = false
        longPress.delaysTouchesBegan = false
        longPress.addTarget(self, action: #selector(handleLongPress))

        addGestureRecognizer(pan)
        addGestureRecognizer(tap)
        addGestureRecognizer(longPress)
    }

    required init?(coder: NSCoder) {
        nil
    }

    override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        guard gestureRecognizer === pan else { return true }
        return coordinator?.shouldBegin(pan) ?? false
    }

    func gestureRecognizer(
        _ gestureRecognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
    ) -> Bool {
        gestureRecognizer === pan && otherGestureRecognizer.view is UIScrollView
    }

    @objc private func handlePan(_ recognizer: UIPanGestureRecognizer) {
        coordinator?.handle(recognizer)
    }

    @objc private func handleTap() {
        coordinator?.onTap()
    }

    @objc private func handleLongPress(_ recognizer: UILongPressGestureRecognizer) {
        guard recognizer.state == .began else { return }
        coordinator?.onLongPress()
    }
}
