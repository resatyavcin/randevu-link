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

    /// Konusma tanima yereli. Uygulama kodu "tr"/"en"; Speech bolge ister.
    var speechLocale: Locale {
        switch self {
        case .turkish: Locale(identifier: "tr-TR")
        case .english: Locale(identifier: "en-US")
        }
    }

    static let storageKey = "settings.language"

    static var stored: AppLanguage {
        guard let raw = UserDefaults.standard.string(forKey: storageKey),
              let language = AppLanguage(rawValue: raw) else {
            return .turkish
        }
        return language
    }
}
