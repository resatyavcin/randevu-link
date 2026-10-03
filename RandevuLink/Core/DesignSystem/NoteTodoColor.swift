import SwiftUI

enum NoteTodoColor: String, CaseIterable, Identifiable {
    case lilac
    case sage
    case sand
    case blush
    case sky

    var id: String { rawValue }

    static let fallback = NoteTodoColor.lilac

    static func resolved(_ raw: String) -> NoteTodoColor {
        NoteTodoColor(rawValue: raw) ?? .lilac
    }

    var titleKey: L {
        switch self {
        case .lilac: .settingsNoteColorLilac
        case .sage: .settingsNoteColorSage
        case .sand: .settingsNoteColorSand
        case .blush: .settingsNoteColorBlush
        case .sky: .settingsNoteColorSky
        }
    }

    func tint(isDark: Bool) -> Color {
        switch self {
        case .lilac:
            return isDark
                ? Color(red: 0.68, green: 0.62, blue: 0.96)
                : Color(red: 0.55, green: 0.48, blue: 0.90)
        case .sage:
            return isDark
                ? Color(red: 0.55, green: 0.80, blue: 0.64)
                : Color(red: 0.42, green: 0.66, blue: 0.52)
        case .sand:
            return isDark
                ? Color(red: 0.90, green: 0.76, blue: 0.52)
                : Color(red: 0.84, green: 0.68, blue: 0.44)
        case .blush:
            return isDark
                ? Color(red: 0.94, green: 0.64, blue: 0.66)
                : Color(red: 0.86, green: 0.52, blue: 0.54)
        case .sky:
            return isDark
                ? Color(red: 0.55, green: 0.76, blue: 0.94)
                : Color(red: 0.42, green: 0.64, blue: 0.86)
        }
    }

    func checkmark(isDark: Bool) -> Color {
        if isDark || self == .sand {
            return Color(white: 0.14)
        }
        return .white
    }

    func star(isDark: Bool) -> Color {
        switch self {
        case .lilac:
            return isDark
                ? Color(red: 0.50, green: 0.42, blue: 0.84)
                : Color(red: 0.34, green: 0.28, blue: 0.70)
        case .sage:
            return isDark
                ? Color(red: 0.32, green: 0.58, blue: 0.42)
                : Color(red: 0.22, green: 0.42, blue: 0.30)
        case .sand:
            return isDark
                ? Color(red: 0.72, green: 0.54, blue: 0.26)
                : Color(red: 0.58, green: 0.42, blue: 0.16)
        case .blush:
            return isDark
                ? Color(red: 0.76, green: 0.40, blue: 0.42)
                : Color(red: 0.64, green: 0.28, blue: 0.32)
        case .sky:
            return isDark
                ? Color(red: 0.30, green: 0.52, blue: 0.74)
                : Color(red: 0.18, green: 0.38, blue: 0.62)
        }
    }

    static func plainStar(isDark: Bool) -> Color {
        isDark
            ? Color(red: 0.78, green: 0.68, blue: 0.42)
            : Color(red: 0.72, green: 0.62, blue: 0.36)
    }
}

struct NoteThemeStar: View {
    var color: NoteTodoColor?
    var size: CGFloat = 12
    var half = false
    @Environment(\.colorScheme) private var colorScheme

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        Image(systemName: half ? "star.leadinghalf.filled" : "star.fill")
            .font(.system(size: size, weight: .semibold))
            .foregroundStyle(color?.star(isDark: isDark) ?? NoteTodoColor.plainStar(isDark: isDark))
            .accessibilityHidden(true)
    }
}
