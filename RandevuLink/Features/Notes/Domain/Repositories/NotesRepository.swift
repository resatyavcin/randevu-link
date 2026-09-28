import Foundation
import SwiftData

@MainActor
final class NotesRepository {
    struct Snapshot {
        var groups: [NoteGroup]
        var dayGroups: [NoteGroup]
    }

    private let context: ModelContext

    init(container: ModelContainer) {
        self.context = container.mainContext
    }

    // MARK: Fetch

    func fetch() -> Snapshot {
        let all = fetchEntities()
        let customer = all.filter { !$0.isDaily }.map { $0.toDomain() }
        let daily = all.filter { $0.isDaily }.map { $0.toDomain() }
        return Snapshot(groups: customer, dayGroups: daily)
    }

    // MARK: Customer groups

    @discardableResult
    func createGroup(title: String, items: [NoteItem]) -> NoteGroup {
        let entity = NoteGroupEntity(title: title)
        for item in items {
            let itemEntity = NoteEntityFactory.makeItem(from: item)
            itemEntity.group = entity
            entity.items.append(itemEntity)
        }
        context.insert(entity)
        save()
        return entity.toDomain()
    }

    func rename(groupId: String, title: String) {
        guard let entity = findGroup(id: groupId), entity.title != title else { return }
        entity.title = title
        entity.updatedAt = Date()
        save()
    }

    func setPinned(groupId: String, isPinned: Bool) {
        guard let entity = findGroup(id: groupId), entity.isPinned != isPinned else { return }
        entity.isPinned = isPinned
        save()
    }

    func deleteGroup(id: String) {
        guard let entity = findGroup(id: id) else { return }
        context.delete(entity)
        save()
    }

    // MARK: Daily groups

    @discardableResult
    func ensureDayGroup(dayKey: String) -> NoteGroupEntity {
        if let entity = findDayGroup(dayKey: dayKey) {
            return entity
        }
        let date = DayKey.date(from: dayKey) ?? Date()
        let entity = NoteGroupEntity(
            title: "",
            createdAt: date,
            updatedAt: date,
            isDaily: true,
            dayKey: dayKey
        )
        context.insert(entity)
        save()
        return entity
    }

    // MARK: Items

    @discardableResult
    func addItem(groupId: String, text: String) -> NoteItem? {
        guard let entity = findGroup(id: groupId) else { return nil }
        let item = NoteItem(text: text)
        let itemEntity = NoteEntityFactory.makeItem(from: item)
        itemEntity.group = entity
        entity.items.append(itemEntity)
        entity.updatedAt = Date()
        context.insert(itemEntity)
        save()
        return itemEntity.toDomain()
    }

    func updateItem(groupId: String, itemId: String, mutate: (inout NoteItem) -> Void) {
        guard
            let entity = findGroup(id: groupId),
            let itemEntity = entity.items.first(where: { $0.id.uuidString == itemId })
        else { return }
        var domain = itemEntity.toDomain()
        mutate(&domain)
        itemEntity.apply(domain)
        entity.updatedAt = Date()
        save()
    }

    func deleteItem(groupId: String, itemId: String) {
        guard
            let entity = findGroup(id: groupId),
            let itemEntity = entity.items.first(where: { $0.id.uuidString == itemId })
        else { return }
        let remaining = entity.items.filter { $0.id.uuidString != itemId }
        context.delete(itemEntity)
        if entity.isDaily, remaining.isEmpty {
            context.delete(entity)
        }
        save()
    }

    func markTimerReminded(groupId: String, itemId: String) {
        guard
            let entity = findGroup(id: groupId),
            let itemEntity = entity.items.first(where: { $0.id.uuidString == itemId })
        else { return }
        itemEntity.timerReminded = true
        save()
    }

    // MARK: Seed

    func seedDefaults(_ groups: [NoteGroup], dayGroups: [NoteGroup]) {
        for group in groups {
            let entity = NoteGroupEntity(
                title: group.title,
                createdAt: group.updatedAt,
                updatedAt: group.updatedAt,
                isPinned: group.isPinned
            )
            for item in group.items {
                let itemEntity = NoteEntityFactory.makeItem(from: item)
                itemEntity.group = entity
                entity.items.append(itemEntity)
            }
            context.insert(entity)
        }
        for group in dayGroups {
            let entity = NoteGroupEntity(
                title: "",
                createdAt: group.updatedAt,
                updatedAt: group.updatedAt,
                isDaily: true,
                dayKey: group.id
            )
            for item in group.items {
                let itemEntity = NoteEntityFactory.makeItem(from: item)
                itemEntity.group = entity
                entity.items.append(itemEntity)
            }
            context.insert(entity)
        }
        save()
    }

    var isEmpty: Bool {
        fetchEntities().isEmpty
    }

    // MARK: Helpers

    private func fetchEntities() -> [NoteGroupEntity] {
        let descriptor = FetchDescriptor<NoteGroupEntity>()
        return (try? context.fetch(descriptor)) ?? []
    }

    private func findGroup(id: String) -> NoteGroupEntity? {
        let all = fetchEntities()
        if let uuid = UUID(uuidString: id), let match = all.first(where: { $0.id == uuid }) {
            return match
        }
        return all.first { $0.isDaily && $0.dayKey == id }
    }

    private func findDayGroup(dayKey: String) -> NoteGroupEntity? {
        fetchEntities().first { $0.isDaily && $0.dayKey == dayKey }
    }

    private func save() {
        guard context.hasChanges else { return }
        do {
            try context.save()
        } catch {
            #if DEBUG
            print("NotesRepository save error: \(error)")
            #endif
        }
    }
}

enum DefaultNotesSeed {
    static func groups(on date: Date = Date(), calendar: Calendar = .current) -> [NoteGroup] {
        let yesterday = calendar.date(byAdding: .day, value: -1, to: date) ?? date
        return [
            NoteGroup(
                id: UUID().uuidString,
                title: "Selin Kaya",
                items: [
                    NoteItem(text: "Kesim", createdAt: date),
                    NoteItem(text: "Fön", createdAt: date)
                ],
                updatedAt: date
            ),
            NoteGroup(
                id: UUID().uuidString,
                title: "Deniz Acar",
                items: [
                    NoteItem(text: "Kök boya", createdAt: yesterday)
                ],
                updatedAt: yesterday,
                isPinned: true
            )
        ]
    }

    static func dayGroups(on date: Date = Date(), calendar: Calendar = .current) -> [NoteGroup] {
        guard
            let yesterday = calendar.date(byAdding: .day, value: -1, to: date),
            let lastMonth = calendar.date(byAdding: .month, value: -1, to: date)
        else { return [] }
        return [
            day(yesterday, texts: ["Kesim", "Fön"]),
            day(lastMonth, texts: ["Kök boya", "Bakım", "Fön"])
        ]
    }

    private static func day(_ date: Date, texts: [String]) -> NoteGroup {
        let items = texts.map { NoteItem(text: $0, createdAt: date) }
        return NoteGroup(id: DayKey.id(for: date), title: "", items: items, updatedAt: date)
    }
}
