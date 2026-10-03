import Foundation
import SwiftData

@Model
final class NoteGroupEntity {
    var id: UUID = UUID()
    var title: String = ""
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var isPinned: Bool = false
    /// Unused. Kept so existing SwiftData/CloudKit stores still open.
    var isDaily: Bool = false
    var isTodoList: Bool = false
    var sinkCompleted: Bool = false
    /// Unused. Kept so existing SwiftData/CloudKit stores still open.
    var dayKey: String?

    @Relationship(deleteRule: .cascade, inverse: \NoteItemEntity.group)
    var items: [NoteItemEntity]? = []

    init(
        id: UUID = UUID(),
        title: String,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        isPinned: Bool = false,
        isDaily: Bool = false,
        isTodoList: Bool = false,
        sinkCompleted: Bool = false,
        dayKey: String? = nil,
        items: [NoteItemEntity] = []
    ) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.isPinned = isPinned
        self.isDaily = isDaily
        self.isTodoList = isTodoList
        self.sinkCompleted = sinkCompleted
        self.dayKey = dayKey
        self.items = items
    }
}

@Model
final class NoteItemEntity {
    var id: UUID = UUID()
    var text: String = ""
    var createdAt: Date = Date()
    var isDone: Bool = false
    var isBold: Bool = false
    var isItalic: Bool = false
    var blinks: Bool = false
    var colorId: String?
    var rating: Int = 0
    var ratingScore: Double = 0
    var defaultDurationSeconds: Double = NoteItem.defaultDuration
    var boldFlags: [Bool] = []
    var italicFlags: [Bool] = []
    var timerStartedAt: Date?
    var timerDuration: Double?
    var timerReminded: Bool = false
    var completedAt: Date?
    var group: NoteGroupEntity?

    init(
        id: UUID = UUID(),
        text: String,
        createdAt: Date = Date(),
        isDone: Bool = false,
        isBold: Bool = false,
        isItalic: Bool = false,
        blinks: Bool = false,
        colorId: String? = nil,
        rating: Int = 0,
        ratingScore: Double = 0,
        defaultDurationSeconds: Double = NoteItem.defaultDuration,
        boldFlags: [Bool] = [],
        italicFlags: [Bool] = [],
        timerStartedAt: Date? = nil,
        timerDuration: Double? = nil,
        timerReminded: Bool = false,
        completedAt: Date? = nil
    ) {
        self.id = id
        self.text = text
        self.createdAt = createdAt
        self.isDone = isDone
        self.isBold = isBold
        self.isItalic = isItalic
        self.blinks = blinks
        self.colorId = colorId
        self.rating = rating
        self.ratingScore = ratingScore
        self.defaultDurationSeconds = defaultDurationSeconds
        self.boldFlags = boldFlags
        self.italicFlags = italicFlags
        self.timerStartedAt = timerStartedAt
        self.timerDuration = timerDuration
        self.timerReminded = timerReminded
        self.completedAt = completedAt
    }
}

extension NoteGroupEntity {
    func toDomain() -> NoteGroup {
        let sortedItems = (items ?? []).sorted { $0.createdAt > $1.createdAt }
        return NoteGroup(
            id: id.uuidString,
            title: title,
            items: sortedItems.map { $0.toDomain() },
            updatedAt: updatedAt,
            isPinned: isPinned,
            isTodoList: isTodoList,
            sinkCompleted: sinkCompleted
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
            blinks: blinks,
            colorId: colorId,
            rating: (rating == 0 || ratingScore > 0) ? ratingScore : Double(rating),
            defaultDurationSeconds: defaultDurationSeconds,
            createdAt: createdAt,
            completedAt: completedAt
        )
    }

    func apply(_ item: NoteItem) {
        text = item.text
        isDone = item.isDone
        isBold = item.isBold
        isItalic = item.isItalic
        blinks = item.blinks
        colorId = item.colorId
        rating = 0
        ratingScore = item.rating
        defaultDurationSeconds = item.defaultDurationSeconds
        boldFlags = item.wordStyles.map(\.isBold)
        italicFlags = item.wordStyles.map(\.isItalic)
        timerStartedAt = item.timer?.startedAt
        timerDuration = item.timer?.durationSeconds
        timerReminded = item.timer?.reminded ?? false
        completedAt = item.completedAt
    }
}

@Model
final class AppPreferenceEntity {
    var todoColorId: String = "lilac"

    init(todoColorId: String = "lilac") {
        self.todoColorId = todoColorId
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
            blinks: item.blinks,
            colorId: item.colorId,
            rating: 0,
            ratingScore: item.rating,
            defaultDurationSeconds: item.defaultDurationSeconds,
            boldFlags: item.wordStyles.map(\.isBold),
            italicFlags: item.wordStyles.map(\.isItalic),
            timerStartedAt: item.timer?.startedAt,
            timerDuration: item.timer?.durationSeconds,
            timerReminded: item.timer?.reminded ?? false,
            completedAt: item.completedAt
        )
        return entity
    }
}
