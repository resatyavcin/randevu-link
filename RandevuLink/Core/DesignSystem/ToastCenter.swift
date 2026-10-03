import SwiftUI
import UIKit

@MainActor
final class ToastCenter: ObservableObject {
    @Published private(set) var message: String?

    private var dismissTask: Task<Void, Never>?

    func show(_ text: String, duration: TimeInterval = 1.8) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        dismissTask?.cancel()
        withAnimation(.spring(response: 0.38, dampingFraction: 0.86)) {
            message = trimmed
        }

        dismissTask = Task {
            try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
            guard !Task.isCancelled else { return }
            await MainActor.run {
                withAnimation(.spring(response: 0.34, dampingFraction: 0.9)) {
                    message = nil
                }
            }
        }
    }

    func showPinned(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        dismissTask?.cancel()
        withAnimation(.spring(response: 0.38, dampingFraction: 0.86)) {
            message = trimmed
        }
    }

    func updatePinned(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, message != trimmed else { return }

        dismissTask?.cancel()
        var transaction = Transaction()
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            message = trimmed
        }
    }

    func dismiss() {
        dismissTask?.cancel()
        withAnimation(.spring(response: 0.34, dampingFraction: 0.9)) {
            message = nil
        }
    }
}

struct ToastHost: View {
    @Environment(\.appColors) private var appColors
    @ObservedObject var toast: ToastCenter

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
                .allowsHitTesting(false)

            if let message = toast.message {
                Text(message)
                    .font(AppTypography.section)
                    .foregroundStyle(appColors.background)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(appColors.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                    .padding(.horizontal, AppSpacing.screenHorizontal)
                    .padding(.bottom, AppSpacing.bottomBarInset + 8)
                    .allowsHitTesting(false)
                    .transition(
                        .asymmetric(
                            insertion: .move(edge: .bottom).combined(with: .opacity),
                            removal: .move(edge: .bottom).combined(with: .opacity)
                        )
                    )
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
        .animation(.spring(response: 0.38, dampingFraction: 0.86), value: toast.message == nil)
    }
}
