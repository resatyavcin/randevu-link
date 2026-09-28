import SwiftUI
import WidgetKit

struct WarmupWidget: Widget {
    let kind = WidgetSnapshotStore.kind

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WarmupProvider()) { entry in
            WarmupWidgetView(entry: entry)
        }
        .configurationDisplayName("Warmup")
        .description("Aktif süreler")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct WarmupWidgetBundle: WidgetBundle {
    var body: some Widget {
        WarmupWidget()
    }
}
