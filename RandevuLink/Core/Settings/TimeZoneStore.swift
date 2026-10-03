import Foundation

@MainActor
final class TimeZoneStore: ObservableObject {
    static let storageKey = "settings.timezone"
    static let istanbulIdentifier = "Europe/Istanbul"

    @Published var identifier: String {
        didSet {
            guard oldValue != identifier else { return }
            UserDefaults.standard.set(identifier, forKey: Self.storageKey)
        }
    }

    var timeZone: TimeZone {
        TimeZone(identifier: identifier) ?? TimeZone(identifier: Self.istanbulIdentifier)!
    }

    init() {
        let stored = UserDefaults.standard.string(forKey: Self.storageKey)
        if let stored, TimeZone(identifier: stored) != nil {
            identifier = stored
        } else {
            identifier = Self.istanbulIdentifier
            UserDefaults.standard.set(Self.istanbulIdentifier, forKey: Self.storageKey)
        }
    }

    func stamp(locale: Locale, now: Date = Date()) -> String {
        let formatter = DateFormatter()
        formatter.locale = locale
        formatter.timeZone = timeZone
        formatter.dateFormat = "d MMMM yyyy, HH:mm"
        return formatter.string(from: now)
    }

    static func cityName(for identifier: String) -> String {
        let tail = identifier.split(separator: "/").last.map(String.init) ?? identifier
        return tail.replacingOccurrences(of: "_", with: " ")
    }

    static let options: [String] = TimeZone.knownTimeZoneIdentifiers.sorted { lhs, rhs in
        let left = cityName(for: lhs)
        let right = cityName(for: rhs)
        let order = left.localizedCaseInsensitiveCompare(right)
        if order == .orderedSame { return lhs < rhs }
        return order == .orderedAscending
    }
}
