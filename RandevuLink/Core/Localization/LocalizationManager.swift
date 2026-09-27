import Foundation
import SwiftUI

@MainActor
final class LocalizationManager: ObservableObject {
    private static let storageKey = "settings.language"

    @Published var language: AppLanguage {
        didSet {
            guard oldValue != language else { return }
            UserDefaults.standard.set(language.rawValue, forKey: Self.storageKey)
        }
    }

    init() {
        if let stored = UserDefaults.standard.string(forKey: Self.storageKey),
           let lang = AppLanguage(rawValue: stored) {
            language = lang
        } else {
            language = .turkish
        }
    }

    /// Secili dile ait .lproj bundle'i. Bulunamazsa ana bundle'a duser.
    private var bundle: Bundle {
        if let path = Bundle.main.path(forResource: language.rawValue, ofType: "lproj"),
           let bundle = Bundle(path: path) {
            return bundle
        }
        return .main
    }

    func string(_ key: L) -> String {
        bundle.localizedString(forKey: key.rawValue, value: key.rawValue, table: nil)
    }

    /// Ergonomik kullanim: l10n(.darkMode)
    func callAsFunction(_ key: L) -> String {
        string(key)
    }
}
