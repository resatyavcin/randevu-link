import SwiftUI

struct AppColors: Equatable {
    let background: Color
    let cardBackground: Color
    let textPrimary: Color
    let textSecondary: Color
    let badge: Color
    let badgeText: Color
    let accent: Color
    let controlBackground: Color
    let controlSelected: Color
    let icon: Color
    let selection: Color
    let destructive: Color
    let positive: Color

    static let light = AppColors(
        background: .white,
        cardBackground: Color(red: 0.965, green: 0.965, blue: 0.97),
        textPrimary: Color(red: 0.11, green: 0.11, blue: 0.12),
        textSecondary: Color(red: 0.55, green: 0.55, blue: 0.58),
        badge: Color(red: 0.22, green: 0.22, blue: 0.24),
        badgeText: .white,
        accent: Color(red: 0.08, green: 0.08, blue: 0.09),
        controlBackground: Color(red: 0.93, green: 0.93, blue: 0.94),
        controlSelected: .white,
        icon: Color(red: 0.25, green: 0.25, blue: 0.27),
        selection: Color(red: 0.31, green: 0.27, blue: 0.90),
        destructive: Color(red: 0.84, green: 0.16, blue: 0.16),
        positive: Color(red: 0.15, green: 0.52, blue: 0.32)
    )

    static let dark = AppColors(
        background: Color(white: 0.07),
        cardBackground: Color(white: 0.16),
        textPrimary: Color(white: 0.95),
        textSecondary: Color(white: 0.64),
        badge: Color(white: 0.90),
        badgeText: Color(white: 0.08),
        accent: Color(white: 0.95),
        controlBackground: Color(white: 0.18),
        controlSelected: Color(white: 0.28),
        icon: Color(white: 0.90),
        selection: Color(red: 0.45, green: 0.42, blue: 0.98),
        destructive: Color(red: 0.93, green: 0.32, blue: 0.30),
        positive: Color(red: 0.45, green: 0.82, blue: 0.58)
    )
}

private struct AppColorsKey: EnvironmentKey {
    static let defaultValue = AppColors.light
}

extension EnvironmentValues {
    var appColors: AppColors {
        get { self[AppColorsKey.self] }
        set { self[AppColorsKey.self] = newValue }
    }
}
