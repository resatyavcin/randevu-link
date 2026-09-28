import Foundation
import SwiftData

@Model
final class NoteGroupEntity {
    @Attribute(.unique) var id: UUID
    var title: String
    var createdAt: Date
    var updatedAt: Date
    var isPinned: Bool
    var isDaily: Bool
    var dayKey: String?

    @Relationship(deleteRule: .cascade, inverse: \NoteItemEntity.group)
    var items: [NoteItemEntity]

    init(
        id: UUID = UUID(),
        title: String,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        isPinned: Bool = false,
        isDaily: Bool = false,
        dayKey: String? = nil,
        items: [NoteItemEntity] = []
    ) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.isPinned = isPinned
        self.isDaily = isDaily
        self.dayKey = dayKey
        self.items = items
    }
}

@Model
final class NoteItemEntity {
    @Attribute(.unique) var id: UUID
    var text: String
    var createdAt: Date
    var isDone: Bool
    var isBold: Bool
    var isItalic: Bool
    var defaultDurationSeconds: Double
    var boldFlags: [Bool]
    var italicFlags: [Bool]
    var timerStartedAt: Date?
    var timerDuration: Double?
    var timerReminded: Bool
    var group: NoteGroupEntity?

    init(
        id: UUID = UUID(),
        text: String,
        createdAt: Date = Date(),
        isDone: Bool = false,
        isBold: Bool = false,
        isItalic: Bool = false,
        defaultDurationSeconds: Double = NoteItem.defaultDuration,
        boldFlags: [Bool] = [],
        italicFlags: [Bool] = [],
        timerStartedAt: Date? = nil,
        timerDuration: Double? = nil,
        timerReminded: Bool = false
    ) {
        self.id = id
        self.text = text
        self.createdAt = createdAt
        self.isDone = isDone
        self.isBold = isBold
        self.isItalic = isItalic
        self.defaultDurationSeconds = defaultDurationSeconds
        self.boldFlags = boldFlags
        self.italicFlags = italicFlags
        self.timerStartedAt = timerStartedAt
        self.timerDuration = timerDuration
        self.timerReminded = timerReminded
    }
}

extension NoteGroupEntity {
    func toDomain() -> NoteGroup {
        let sortedItems = items.sorted { $0.createdAt > $1.createdAt }
        let identifier: String = isDaily ? (dayKey ?? id.uuidString) : id.uuidString
        return NoteGroup(
            id: identifier,
            title: title,
            items: sortedItems.map { $0.toDomain() },
            updatedAt: updatedAt,
            isPinned: isPinned
        )
    }
}

extension NoteItemEntity {
    func toDomain() -> NoteItem {
        let count = min(boldFlags.count, italicFlags.count)
        let styles: [NoteWordStyle] = (0..<count).map { index in
            NoteWordStyle(isBold: boldFlags[index], isItalic: italicFlags[index])
        }
        let timer: NoteTimer? = {
            guard let startedAt = timerStartedAt, let duration = timerDuration else { return nil }
            return NoteTimer(durationSeconds: duration, startedAt: startedAt, reminded: timerReminded)
        }()
        return NoteItem(
            id: id.uuidString,
            text: text,
            wordStyles: styles,
            timer: timer,
            isDone: isDone,
            isBold: isBold,
            isItalic: isItalic,
            defaultDurationSeconds: defaultDurationSeconds,
            createdAt: createdAt
        )
    }

    func apply(_ item: NoteItem) {
        text = item.text
        isDone = item.isDone
        isBold = item.isBold
        isItalic = item.isItalic
        defaultDurationSeconds = item.defaultDurationSeconds
        boldFlags = item.wordStyles.map(\.isBold)
        italicFlags = item.wordStyles.map(\.isItalic)
        timerStartedAt = item.timer?.startedAt
        timerDuration = item.timer?.durationSeconds
        timerReminded = item.timer?.reminded ?? false
    }
}

enum NoteEntityFactory {
    static func makeItem(from item: NoteItem) -> NoteItemEntity {
        let entity = NoteItemEntity(
            id: UUID(uuidString: item.id) ?? UUID(),
            text: item.text,
            createdAt: item.createdAt,
            isDone: item.isDone,
            isBold: item.isBold,
            isItalic: item.isItalic,
            defaultDurationSeconds: item.defaultDurationSeconds,
            boldFlags: item.wordStyles.map(\.isBold),
            italicFlags: item.wordStyles.map(\.isItalic),
            timerStartedAt: item.timer?.startedAt,
            timerDuration: item.timer?.durationSeconds,
            timerReminded: item.timer?.reminded ?? false
        )
        return entity
    }
}
