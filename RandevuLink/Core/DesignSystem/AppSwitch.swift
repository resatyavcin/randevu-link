import SwiftUI

struct AppSwitch: View {
    @Environment(\.appColors) private var appColors
    @Environment(\.colorScheme) private var colorScheme
    @Binding var isOn: Bool

    private let trackWidth: CGFloat = 52
    private let trackHeight: CGFloat = 32
    private let knobSize: CGFloat = 26

    var body: some View {
        ZStack(alignment: isOn ? .trailing : .leading) {
            Capsule()
                .fill(trackColor)

            Circle()
                .fill(knobColor)
                .frame(width: knobSize, height: knobSize)
                .padding(3)
                .shadow(color: .black.opacity(0.16), radius: 1.5, y: 1)
        }
        .frame(width: trackWidth, height: trackHeight)
        .animation(.easeInOut(duration: 0.2), value: isOn)
        .accessibilityHidden(true)
    }

    private var isDark: Bool { colorScheme == .dark }

    private var trackColor: Color {
        if isOn {
            return isDark ? Color(white: 0.92) : Color(white: 0.08)
        }
        return appColors.controlBackground
    }

    private var knobColor: Color {
        if isOn {
            return isDark ? Color(white: 0.12) : .white
        }
        return isDark ? Color(white: 0.92) : .white
    }
}
