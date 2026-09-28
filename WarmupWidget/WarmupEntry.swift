import WidgetKit

struct WarmupEntry: TimelineEntry {
    let date: Date
    let blocks: [WidgetTimerBlock]
    let label: String?
    let language: String

    /// En erken bitecek blok.
    var playhead: WidgetTimerBlock? {
        blocks.min { $0.end < $1.end }
    }
}
