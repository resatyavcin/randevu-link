import SwiftUI

struct DurationKeypadSheet: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @Environment(\.dismiss) private var dismiss

    let noteText: String
    var onConfirm: (TimeInterval) -> Void

    @State private var amount = 0
    @State private var unit: DurationUnit = .minutes
    @State private var repeatTask: Task<Void, Never>?
    @State private var didRepeat = false

    private var seconds: TimeInterval {
        switch unit {
        case .minutes: TimeInterval(amount * 60)
        case .hours: TimeInterval(amount * 3600)
        }
    }

    private var step: Int {
        unit == .minutes ? 5 : 1
    }

    var body: some View {
        VStack(spacing: 16) {
            Capsule()
                .fill(appColors.controlBackground)
                .frame(width: 36, height: 5)
                .padding(.top, 8)

            Text(noteText)
                .font(AppTypography.rowTitle)
                .foregroundStyle(appColors.textPrimary)
                .lineLimit(1)
                .frame(maxWidth: .infinity)

            VStack(spacing: 8) {
                unitPicker

                HStack(spacing: 8) {
                    stepButton(systemName: "minus", delta: -step)
                    Text("\(amount)")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(appColors.textPrimary)
                        .frame(maxWidth: .infinity)
                        .contentTransition(.numericText())
                        .animation(.snappy, value: amount)
                    stepButton(systemName: "plus", delta: step)
                }
            }
            .padding(12)
            .background(appColors.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))

            confirmButton(title: l10n(.notesDurationStart), enabled: amount > 0) {
                onConfirm(seconds)
                dismiss()
            }
        }
        .padding(.horizontal, AppSpacing.screenHorizontal)
        .padding(.bottom, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(appColors.background)
        .onDisappear { stopRepeating() }
    }

    private func confirmButton(title: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(AppTypography.listen)
                .foregroundStyle(enabled ? appColors.background : appColors.textSecondary)
                .frame(maxWidth: .infinity)
                .frame(height: AppSpacing.controlSize)
                .background(enabled ? appColors.accent : appColors.controlBackground)
                .clipShape(Capsule())
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
    }

    private var unitPicker: some View {
        HStack(spacing: 0) {
            unitChip(.minutes, l10n(.notesDurationMinutes))
            unitChip(.hours, l10n(.notesDurationHours))
        }
        .padding(4)
        .background(appColors.controlBackground)
        .clipShape(Capsule())
    }

    private func unitChip(_ value: DurationUnit, _ title: String) -> some View {
        Button {
            unit = value
        } label: {
            Text(title)
                .font(AppTypography.section)
                .foregroundStyle(unit == value ? appColors.textPrimary : appColors.textSecondary)
                .frame(maxWidth: .infinity)
                .frame(height: 36)
                .background(unit == value ? appColors.controlSelected : Color.clear)
                .clipShape(Capsule())
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private func stepButton(systemName: String, delta: Int) -> some View {
        Image(systemName: systemName)
            .font(.system(size: 18, weight: .bold))
            .foregroundStyle(appColors.textPrimary)
            .frame(width: 44, height: 44)
            .background(appColors.background)
            .clipShape(Circle())
            .contentShape(Circle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in beginHold(delta: delta) }
                    .onEnded { _ in endHold(delta: delta) }
            )
    }

    private func change(by delta: Int) {
        amount = max(0, amount + delta)
    }

    private func beginHold(delta: Int) {
        guard repeatTask == nil else { return }
        didRepeat = false
        repeatTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 350_000_000)
            while !Task.isCancelled {
                didRepeat = true
                change(by: delta)
                try? await Task.sleep(nanoseconds: 120_000_000)
            }
        }
    }

    private func endHold(delta: Int) {
        let repeated = didRepeat
        stopRepeating()
        if !repeated {
            change(by: delta)
        }
    }

    private func stopRepeating() {
        repeatTask?.cancel()
        repeatTask = nil
    }

    private enum DurationUnit {
        case minutes
        case hours
    }
}
