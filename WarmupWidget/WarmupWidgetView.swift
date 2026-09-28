import SwiftUI
import WidgetKit

enum WarmupPalette {
    static let card = Color(red: 21 / 255, green: 21 / 255, blue: 21 / 255)
    static let cell = Color(red: 23 / 255, green: 58 / 255, blue: 94 / 255)
    static let cellSoft = Color(red: 18 / 255, green: 49 / 255, blue: 79 / 255)
    static let track = Color(red: 14 / 255, green: 39 / 255, blue: 66 / 255)
    static let accent = Color(red: 10 / 255, green: 132 / 255, blue: 255 / 255)
    static let hatch = Color(red: 45 / 255, green: 140 / 255, blue: 255 / 255)
    static let muted = Color(red: 138 / 255, green: 138 / 255, blue: 143 / 255)
}

struct WarmupWidgetView: View {
    @Environment(\.widgetFamily) private var family
    var entry: WarmupEntry

    private var soonest: [WidgetTimerBlock] {
        Array(entry.blocks.sorted { $0.end < $1.end }.prefix(family == .systemSmall ? 2 : 4))
    }

    var body: some View {
        Group {
            if soonest.isEmpty {
                emptyState
            } else {
                activeState
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .containerBackground(WarmupPalette.card, for: .widget)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Text(WidgetCopy.text("widget.empty.title", language: entry.language))
                .font(.system(size: family == .systemSmall ? 32 : 40, weight: .heavy))
                .tracking(-1.2)
                .foregroundStyle(.white)
            Text(WidgetCopy.text("widget.empty.subtitle", language: entry.language))
                .font(.system(size: 13, weight: .medium))
                .tracking(-0.2)
                .foregroundStyle(WarmupPalette.muted)
                .multilineTextAlignment(.center)
        }
        .padding(20)
    }

    private var activeState: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
            Spacer(minLength: 10)
            track
        }
        .padding(family == .systemSmall ? 14 : 18)
    }

    private var header: some View {
        HStack(alignment: .top, spacing: 8) {
            VStack(alignment: .leading, spacing: 6) {
                countdown
                Text(caption)
                    .font(.system(size: family == .systemSmall ? 12 : 14, weight: .medium))
                    .tracking(-0.2)
                    .foregroundStyle(WarmupPalette.muted)
                    .lineLimit(1)
            }
            Spacer(minLength: 4)
            Circle()
                .fill(WarmupPalette.accent)
                .frame(width: family == .systemSmall ? 28 : 36, height: family == .systemSmall ? 28 : 36)
                .overlay {
                    Image(systemName: "checkmark")
                        .font(.system(size: family == .systemSmall ? 12 : 15, weight: .bold))
                        .foregroundStyle(.white)
                }
        }
    }

    @ViewBuilder
    private var countdown: some View {
        if let playhead = entry.playhead, playhead.end > entry.date {
            Text(timerInterval: entry.date...playhead.end, countsDown: true, showsHours: false)
                .font(.system(size: family == .systemSmall ? 36 : 48, weight: .heavy))
                .monospacedDigit()
                .tracking(-1.6)
                .foregroundStyle(.white)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
        }
    }

    private var caption: String {
        let format = WidgetCopy.text("widget.leftFor", language: entry.language)
        return String(format: format, entry.label ?? "")
    }

    private var track: some View {
        VStack(spacing: 3) {
            ForEach(Array(soonest.enumerated()), id: \.offset) { index, block in
                blockRow(block, live: index == 0)
            }
        }
        .padding(4)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WarmupPalette.track, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func blockRow(_ block: WidgetTimerBlock, live: Bool) -> some View {
        HStack(spacing: 8) {
            Text(block.title)
                .font(.system(size: 13, weight: .semibold))
                .tracking(-0.2)
                .foregroundStyle(.white)
                .lineLimit(1)
            Spacer(minLength: 4)
            if block.end > entry.date {
                Text(timerInterval: entry.date...block.end, countsDown: true, showsHours: false)
                    .font(.system(size: 13, weight: .semibold))
                    .monospacedDigit()
                    .foregroundStyle(.white.opacity(0.72))
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 10)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WarmupPalette.cellSoft)
        .overlay {
            if live {
                WarmupPalette.cell.opacity(0.6)
                HatchOverlay()
            }
        }
        .overlay {
            if live {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(WarmupPalette.accent, lineWidth: 2)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

private enum WidgetCopy {
    static func text(_ key: String, language: String) -> String {
        let code = language == "en" ? "en" : "tr"
        if let path = Bundle.main.path(forResource: code, ofType: "lproj"),
           let bundle = Bundle(path: path) {
            let value = bundle.localizedString(forKey: key, value: "", table: "Localizable")
            if !value.isEmpty, value != key {
                return value
            }
        }
        switch (key, code) {
        case ("widget.empty.title", "en"):
            return "Clear 🌱"
        case ("widget.empty.subtitle", "en"):
            return "Nothing scheduled"
        case ("widget.leftFor", "en"):
            return "Left for %@"
        case ("widget.empty.title", _):
            return "Temiz 🌱"
        case ("widget.empty.subtitle", _):
            return "Zamanlanmış bir şey yok"
        default:
            return "%@ için kalan"
        }
    }
}

private struct HatchOverlay: View {
    var body: some View {
        Canvas { context, size in
            let stripe: CGFloat = 9.9
            var x = -size.height
            while x < size.width + size.height {
                var path = Path()
                path.move(to: CGPoint(x: x, y: size.height))
                path.addLine(to: CGPoint(x: x + size.height, y: 0))
                path.addLine(to: CGPoint(x: x + size.height + 2, y: 0))
                path.addLine(to: CGPoint(x: x + 2, y: size.height))
                path.closeSubpath()
                context.fill(path, with: .color(WarmupPalette.hatch.opacity(0.55)))
                x += stripe
            }
        }
        .allowsHitTesting(false)
    }
}
