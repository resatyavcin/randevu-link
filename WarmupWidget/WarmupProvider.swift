import WidgetKit

struct WarmupProvider: TimelineProvider {
    func placeholder(in context: Context) -> WarmupEntry {
        WarmupEntry(date: .now, blocks: [], label: nil, language: "tr")
    }

    func getSnapshot(in context: Context, completion: @escaping (WarmupEntry) -> Void) {
        completion(entry(at: .now, snapshot: WidgetSnapshotStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WarmupEntry>) -> Void) {
        let snapshot = WidgetSnapshotStore.load()
        let now = Date()
        let horizon = now.addingTimeInterval(2 * 60 * 60)
        var dates = Set<Date>([now])

        for block in snapshot.blocks where block.end > now && block.end <= horizon {
            dates.insert(block.end)
        }

        var cursor = now.addingTimeInterval(60)
        while cursor < horizon, dates.count < 40 {
            dates.insert(cursor)
            cursor = cursor.addingTimeInterval(60)
        }

        let entries = dates.sorted().map { entry(at: $0, snapshot: snapshot) }
        let next = dates.max()?.addingTimeInterval(60) ?? now.addingTimeInterval(15 * 60)
        completion(Timeline(entries: entries, policy: .after(next)))
    }

    private func entry(at date: Date, snapshot: WidgetSnapshot) -> WarmupEntry {
        let blocks = snapshot.blocks
            .filter { !$0.isFinished(at: date) }
            .sorted { $0.end < $1.end }
        let label = blocks.first?.title
        return WarmupEntry(date: date, blocks: blocks, label: label, language: snapshot.language)
    }
}
