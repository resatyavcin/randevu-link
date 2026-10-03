import Foundation

struct NoteTimer: Equatable, Sendable {
    let durationSeconds: TimeInterval
    let startedAt: Date
    var reminded: Bool

    init(durationSeconds: TimeInterval, startedAt: Date = Date(), reminded: Bool = false) {
        self.durationSeconds = durationSeconds
        self.startedAt = startedAt
        self.reminded = reminded
    }

    func progress(at date: Date = Date()) -> Double {
        guard durationSeconds > 0 else { return 1 }
        return min(1, max(0, date.timeIntervalSince(startedAt) / durationSeconds))
    }

    func remaining(at date: Date = Date()) -> TimeInterval {
        max(0, durationSeconds - date.timeIntervalSince(startedAt))
    }

    func isFinished(at date: Date = Date()) -> Bool {
        date >= startedAt.addingTimeInterval(durationSeconds)
    }
}

struct NoteWordStyle: Equatable, Sendable {
    var isBold = false
    var isItalic = false
}

enum NoteWords {
    static func parts(_ text: String) -> [String] {
        text.split(separator: " ", omittingEmptySubsequences: true).map(String.init)
    }

    static func indices(in text: String, overlapping selection: NSRange) -> [Int] {
        guard selection.length > 0 else { return [] }
        let ns = text as NSString
        let selectionEnd = selection.location + selection.length
        var search = 0
        var hits: [Int] = []
        for (index, word) in parts(text).enumerated() {
            let found = ns.range(
                of: word,
                range: NSRange(location: search, length: ns.length - search)
            )
            guard found.location != NSNotFound else { continue }
            let wordEnd = found.location + found.length
            if found.location < selectionEnd, wordEnd > selection.location {
                hits.append(index)
            }
            search = wordEnd
        }
        return hits
    }

    static func aligned(oldText: String, oldStyles: [NoteWordStyle], newText: String) -> [NoteWordStyle] {
        let oldWords = parts(oldText)
        let newWords = parts(newText)
        let old = fitted(oldStyles, count: oldWords.count)
        if oldWords.count == newWords.count {
            return old
        }
        var result = Array(repeating: NoteWordStyle(), count: newWords.count)
        var start = 0
        while start < oldWords.count, start < newWords.count, oldWords[start] == newWords[start] {
            result[start] = old[start]
            start += 1
        }
        var oldIndex = oldWords.count - 1
        var newIndex = newWords.count - 1
        while oldIndex >= start, newIndex >= start, oldWords[oldIndex] == newWords[newIndex] {
            result[newIndex] = old[oldIndex]
            oldIndex -= 1
            newIndex -= 1
        }
        return result
    }

    static func resolved(
        text: String,
        styles: [NoteWordStyle],
        fallbackBold: Bool,
        fallbackItalic: Bool
    ) -> [(word: String, style: NoteWordStyle)] {
        let words = parts(text)
        let fallback = NoteWordStyle(isBold: fallbackBold, isItalic: fallbackItalic)
        return words.enumerated().map { index, word in
            if styles.isEmpty {
                return (word, fallback)
            }
            if index < styles.count {
                return (word, styles[index])
            }
            return (word, NoteWordStyle())
        }
    }

    private static func fitted(_ styles: [NoteWordStyle], count: Int) -> [NoteWordStyle] {
        if styles.count >= count {
            return Array(styles.prefix(count))
        }
        return styles + Array(repeating: NoteWordStyle(), count: count - styles.count)
    }
}

struct NoteItem: Identifiable, Equatable, Sendable {
    let id: String
    var text: String
    var wordStyles: [NoteWordStyle]
    var timer: NoteTimer?
    var isDone: Bool
    var isBold: Bool
    var isItalic: Bool
    var blinks: Bool
    var colorId: String?
    var rating: Double
    var defaultDurationSeconds: TimeInterval

    static let defaultDuration: TimeInterval = 30 * 60

    init(
        id: String = UUID().uuidString,
        text: String,
        wordStyles: [NoteWordStyle] = [],
        timer: NoteTimer? = nil,
        isDone: Bool = false,
        isBold: Bool = false,
        isItalic: Bool = false,
        blinks: Bool = false,
        colorId: String? = nil,
        rating: Double = 0,
        defaultDurationSeconds: TimeInterval = NoteItem.defaultDuration,
        createdAt: Date = Date(),
        completedAt: Date? = nil
    ) {
        self.id = id
        self.text = text
        self.wordStyles = wordStyles
        self.timer = timer
        self.isDone = isDone
        self.isBold = isBold
        self.isItalic = isItalic
        self.blinks = blinks
        self.colorId = colorId
        self.rating = rating
        self.defaultDurationSeconds = defaultDurationSeconds
        self.createdAt = createdAt
        self.completedAt = completedAt
    }

    var createdAt: Date
    var completedAt: Date?

    var blinkColor: NoteTodoColor? {
        colorId.flatMap(NoteTodoColor.init(rawValue:))
    }
}

struct NoteGroup: Identifiable, Equatable, Sendable {
    let id: String
    var title: String
    var items: [NoteItem]
    var updatedAt: Date = Date()
    var isPinned: Bool = false
    var isTodoList: Bool = false
    var sinkCompleted: Bool = false

    func longestRemainingSeconds(at date: Date = Date()) -> TimeInterval? {
        items.compactMap { item -> TimeInterval? in
            let completed = isTodoList && item.isDone
            guard !completed, let timer = item.timer, !timer.isFinished(at: date) else { return nil }
            return timer.remaining(at: date)
        }.max()
    }
}

enum RelativeDay {
    static func title(
        for date: Date,
        locale: Locale,
        today: String,
        yesterday: String,
        tomorrow: String,
        calendar: Calendar = .current
    ) -> String {
        if calendar.isDateInToday(date) { return today }
        if calendar.isDateInYesterday(date) { return yesterday }
        if calendar.isDateInTomorrow(date) { return tomorrow }
        let formatter = DateFormatter()
        formatter.locale = locale
        let sameYear = calendar.isDate(date, equalTo: Date(), toGranularity: .year)
        formatter.setLocalizedDateFormatFromTemplate(sameYear ? "d MMMM" : "d MMMM yyyy")
        return formatter.string(from: date)
    }
}

struct DayBucket<Item: Identifiable>: Identifiable {
    /// Stays put when a newer row is inserted at the top of the day.
    let id: String
    let title: String
    var items: [Item]
}

enum DayBuckets {
    private struct Run<Item> {
        var day: String
        var title: String
        var items: [Item]
    }

    static func group<Item: Identifiable>(
        _ items: [Item],
        date: (Item) -> Date,
        title: (Date) -> String,
        calendar: Calendar = .current
    ) -> [DayBucket<Item>] {
        var runs: [Run<Item>] = []
        for item in items {
            let day = DayKey.id(for: date(item), calendar: calendar)
            if runs.last?.day == day {
                runs[runs.count - 1].items.append(item)
            } else {
                runs.append(Run(day: day, title: title(date(item)), items: [item]))
            }
        }

        return runs.map { run in
            let anchor = run.items.min { date($0) < date($1) } ?? run.items[0]
            return DayBucket(
                id: "\(run.day)-\(String(describing: anchor.id))",
                title: run.title,
                items: run.items
            )
        }
    }
}

enum DayKey {
    static func id(for date: Date, calendar: Calendar = .current) -> String {
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }

    static func date(from id: String, calendar: Calendar = .current) -> Date? {
        let parts = id.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        return calendar.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
    }
}

enum DurationLabel {
    static func short(_ seconds: TimeInterval) -> (value: Int, unit: Unit) {
        let minutes = max(1, Int((seconds / 60).rounded()))
        if minutes >= 60, minutes.isMultiple(of: 60) {
            return (minutes / 60, .hours)
        }
        return (minutes, .minutes)
    }

    enum Unit {
        case minutes
        case hours
    }
}
