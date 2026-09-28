import Foundation

enum WidgetSnapshotStore {
    static let appGroup = "group.com.resatyavcin.app"
    static let kind = "WarmupWidget"
    private static let key = "snapshot"

    static func save(_ snapshot: WidgetSnapshot) {
        guard let defaults = UserDefaults(suiteName: appGroup) else { return }
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        defaults.set(data, forKey: key)
    }

    static func load() -> WidgetSnapshot {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let data = defaults.data(forKey: key),
            let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
        else {
            return WidgetSnapshot(blocks: [])
        }
        return snapshot
    }
}

struct WidgetSnapshot: Codable, Equatable, Sendable {
    var blocks: [WidgetTimerBlock]
    var language: String

    init(blocks: [WidgetTimerBlock], language: String = "tr") {
        self.blocks = blocks
        self.language = language
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        blocks = try container.decode([WidgetTimerBlock].self, forKey: .blocks)
        language = try container.decodeIfPresent(String.self, forKey: .language) ?? "tr"
    }
}

struct WidgetTimerBlock: Codable, Equatable, Hashable, Sendable {
    let title: String
    let startedAt: Date
    let durationSeconds: TimeInterval

    var end: Date {
        startedAt.addingTimeInterval(durationSeconds)
    }

    func remaining(at date: Date) -> TimeInterval {
        max(0, end.timeIntervalSince(date))
    }

    func isFinished(at date: Date) -> Bool {
        date >= end
    }
}
