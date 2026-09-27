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

    func dismiss() {
        dismissTask?.cancel()
        withAnimation(.spring(response: 0.34, dampingFraction: 0.9)) {
            message = nil
        }
    }
}

struct ToastHost: View {
    @ObservedObject var toast: ToastCenter

    var body: some View {
        ZStack {
            if let message = toast.message {
                Text(message)
                    .font(AppTypography.section)
                    .foregroundStyle(AppColors.background)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(AppColors.accent)
                    .clipShape(Capsule())
                    .shadow(color: .black.opacity(0.12), radius: 8, y: 4)
                    .transition(
                        .asymmetric(
                            insertion: .move(edge: .bottom).combined(with: .opacity),
                            removal: .move(edge: .bottom).combined(with: .opacity)
                        )
                    )
                    .padding(.bottom, AppSpacing.bottomBarInset + 8)
                    .allowsHitTesting(false)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
        .animation(.spring(response: 0.38, dampingFraction: 0.86), value: toast.message)
    }
}
