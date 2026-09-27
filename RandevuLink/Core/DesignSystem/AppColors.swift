import SwiftUI
import UIKit

enum AppColors {
    static let background = dynamic(light: .white, dark: UIColor(white: 0.07, alpha: 1))
    static let cardBackground = dynamic(
        light: UIColor(red: 0.965, green: 0.965, blue: 0.97, alpha: 1),
        dark: UIColor(white: 0.16, alpha: 1)
    )
    static let textPrimary = dynamic(
        light: UIColor(red: 0.11, green: 0.11, blue: 0.12, alpha: 1),
        dark: UIColor(white: 0.95, alpha: 1)
    )
    static let textSecondary = dynamic(
        light: UIColor(red: 0.55, green: 0.55, blue: 0.58, alpha: 1),
        dark: UIColor(white: 0.64, alpha: 1)
    )
    static let badge = dynamic(
        light: UIColor(red: 0.22, green: 0.22, blue: 0.24, alpha: 1),
        dark: UIColor(white: 0.90, alpha: 1)
    )
    static let badgeText = dynamic(light: .white, dark: UIColor(white: 0.08, alpha: 1))
    static let accent = dynamic(
        light: UIColor(red: 0.08, green: 0.08, blue: 0.09, alpha: 1),
        dark: UIColor(white: 0.95, alpha: 1)
    )
    static let controlBackground = dynamic(
        light: UIColor(red: 0.93, green: 0.93, blue: 0.94, alpha: 1),
        dark: UIColor(white: 0.18, alpha: 1)
    )
    static let controlSelected = dynamic(light: .white, dark: UIColor(white: 0.28, alpha: 1))
    static let icon = dynamic(
        light: UIColor(red: 0.25, green: 0.25, blue: 0.27, alpha: 1),
        dark: UIColor(white: 0.90, alpha: 1)
    )
    /// Positive money / credit tone for register totals.
    static let positive = dynamic(
        light: UIColor(red: 0.15, green: 0.52, blue: 0.32, alpha: 1),
        dark: UIColor(red: 0.45, green: 0.82, blue: 0.58, alpha: 1)
    )

    private static func dynamic(light: UIColor, dark: UIColor) -> Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        })
    }
}
