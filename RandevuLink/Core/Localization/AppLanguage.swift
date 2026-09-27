import Foundation

enum AppLanguage: String, CaseIterable, Identifiable, Sendable {
    case turkish = "tr"
    case english = "en"

    var id: String { rawValue }

    /// Dilin kendi dilindeki adi (ornek: Turkce, English).
    var nativeName: String {
        switch self {
        case .turkish: return "Türkçe"
        case .english: return "English"
        }
    }

    var localeIdentifier: String { rawValue }
}
