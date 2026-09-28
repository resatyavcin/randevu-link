import SwiftUI
import UIKit

struct NameDrawer: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @Environment(\.dismiss) private var dismiss

    let title: String
    let suggested: String
    var onConfirm: (String) -> Void

    @State private var text = ""
    @State private var confirmDiscard = false
    @State private var discard = false
    @FocusState private var isFocused: Bool

    private var trimmed: String {
        text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        VStack(spacing: 16) {
            Capsule()
                .fill(appColors.controlBackground)
                .frame(width: 36, height: 5)
                .padding(.top, 8)

            Text(title)
                .font(AppTypography.rowTitle)
                .foregroundStyle(appColors.textPrimary)
                .frame(maxWidth: .infinity)

            TextField(l10n(.notesNamePlaceholder), text: $text)
                .font(AppTypography.rowTitle)
                .foregroundStyle(appColors.textPrimary)
                .focused($isFocused)
                .submitLabel(.done)
                .padding(.horizontal, AppSpacing.rowHorizontal)
                .padding(.vertical, AppSpacing.rowVertical)
                .background(appColors.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
                .onSubmit(confirm)

            Button(action: confirm) {
                Text(l10n(.notesNameSave))
                    .font(AppTypography.listen)
                    .foregroundStyle(trimmed.isEmpty ? appColors.textSecondary : appColors.background)
                    .frame(maxWidth: .infinity)
                    .frame(height: AppSpacing.controlSize)
                    .background(trimmed.isEmpty ? appColors.controlBackground : appColors.accent)
                    .clipShape(Capsule())
                    .contentShape(Capsule())
            }
            .buttonStyle(.plain)
            .disabled(trimmed.isEmpty)
        }
        .padding(.horizontal, AppSpacing.screenHorizontal)
        .padding(.bottom, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(appColors.background)
        .background {
            OutsideTapInstaller(hasText: !trimmed.isEmpty) {
                attemptClose()
            }
            .frame(width: 0, height: 0)
        }
        .sheet(isPresented: $confirmDiscard, onDismiss: finishDiscardPrompt) {
            ConfirmDrawer(
                title: l10n(.notesDiscardTitle),
                message: trimmed,
                confirmTitle: l10n(.notesDiscardConfirm),
                cancelTitle: l10n(.commonCancel),
                onConfirm: { discard = true }
            )
            .presentationDetents([.height(220)])
            .presentationDragIndicator(.hidden)
            .presentationBackground(appColors.background)
        }
        .onAppear {
            if text.isEmpty {
                text = suggested
            }
            isFocused = true
        }
    }

    private func confirm() {
        guard !trimmed.isEmpty else {
            dismiss()
            return
        }
        onConfirm(trimmed)
        dismiss()
    }

    private func attemptClose() {
        guard !confirmDiscard else { return }
        if trimmed.isEmpty {
            dismiss()
        } else {
            discard = false
            isFocused = false
            confirmDiscard = true
        }
    }

    private func finishDiscardPrompt() {
        if discard {
            dismiss()
        } else {
            isFocused = true
        }
    }
}

private struct OutsideTapInstaller: UIViewControllerRepresentable {
    var hasText: Bool
    var onAttempt: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIViewController(context: Context) -> UIViewController {
        let controller = UIViewController()
        controller.view.backgroundColor = .clear
        controller.view.isUserInteractionEnabled = false
        return controller
    }

    func updateUIViewController(_ controller: UIViewController, context: Context) {
        context.coordinator.hasText = hasText
        context.coordinator.onAttempt = onAttempt
        DispatchQueue.main.async {
            context.coordinator.install(from: controller)
        }
    }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate, UIAdaptivePresentationControllerDelegate {
        var hasText = false
        var onAttempt: () -> Void = {}
        private weak var sheetView: UIView?
        nonisolated(unsafe) private weak var originalDelegate: NSObject?
        private weak var installedContainer: UIView?
        private var installedOnDimming = false

        func install(from controller: UIViewController) {
            let host = controller.parent ?? controller
            sheetView = host.view
            guard let presentation = host.presentationController else { return }
            if presentation.delegate !== self {
                originalDelegate = presentation.delegate as? NSObject
                presentation.delegate = self
            }
            guard let sheet = host.view, sheet.bounds.height > 40 else { return }
            guard let container = presentation.containerView, installedContainer !== container else { return }
            let tap = UITapGestureRecognizer(target: self, action: #selector(tapped))
            tap.cancelsTouchesInView = true
            tap.delegate = self
            if let dimming = dimmingView(in: container, sheet: sheet) {
                dimming.addGestureRecognizer(tap)
                installedOnDimming = true
            } else {
                container.addGestureRecognizer(tap)
                installedOnDimming = false
            }
            installedContainer = container
        }

        @objc private func tapped() {
            onAttempt()
        }

        func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
            if installedOnDimming { return true }
            guard let container = gestureRecognizer.view, let sheetView else { return false }
            let point = touch.location(in: container)
            let frame = sheetView.convert(sheetView.bounds, to: container)
            return !frame.insetBy(dx: 0, dy: -8).contains(point)
        }

        private func dimmingView(in container: UIView, sheet: UIView) -> UIView? {
            if let named = container.subviews.first(where: {
                String(describing: type(of: $0)).localizedCaseInsensitiveContains("dimming")
            }) {
                return named
            }
            return container.subviews.first { subview in
                !sheet.isDescendant(of: subview) && subview.bounds.height > sheet.bounds.height + 40
            }
        }

        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer
        ) -> Bool {
            true
        }

        func presentationControllerShouldDismiss(_ presentationController: UIPresentationController) -> Bool {
            !hasText
        }

        func presentationControllerDidAttemptToDismiss(_ presentationController: UIPresentationController) {
            onAttempt()
        }

        override func responds(to aSelector: Selector!) -> Bool {
            super.responds(to: aSelector) || (originalDelegate?.responds(to: aSelector) ?? false)
        }

        override func forwardingTarget(for aSelector: Selector!) -> Any? {
            if super.responds(to: aSelector) { return nil }
            if let originalDelegate, originalDelegate.responds(to: aSelector) {
                return originalDelegate
            }
            return super.forwardingTarget(for: aSelector)
        }
    }
}
