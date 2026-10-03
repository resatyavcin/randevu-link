import Foundation
import SwiftData

@MainActor
final class NotesRepository {
    struct Snapshot {
        var groups: [NoteGroup]
    }

    private let context: ModelContext
    private(set) var lastLocalSave = Date.distantPast

    init(container: ModelContainer) {
        self.context = container.mainContext
    }

    // MARK: Fetch

    func fetch() -> Snapshot {
        let groups = fetchEntities()
            .filter { !$0.isDaily }
            .map { $0.toDomain() }
        return Snapshot(groups: groups)
    }

    // MARK: Groups

    @discardableResult
    func createGroup(title: String, items: [NoteItem], isTodoList: Bool = false) -> NoteGroup {
        let entity = NoteGroupEntity(title: title, isTodoList: isTodoList)
        for item in items {
            let itemEntity = NoteEntityFactory.makeItem(from: item)
            itemEntity.group = entity
            entity.items = (entity.items ?? []) + [itemEntity]
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

    func setSinkCompleted(groupId: String, sinkCompleted: Bool) {
        guard let entity = findGroup(id: groupId), entity.isTodoList, entity.sinkCompleted != sinkCompleted else { return }
        entity.sinkCompleted = sinkCompleted
        save()
    }

    func deleteGroup(id: String) {
        guard let entity = findGroup(id: id) else { return }
        context.delete(entity)
        save()
    }

    // MARK: Items

    @discardableResult
    func addItem(groupId: String, text: String) -> NoteItem? {
        guard let entity = findGroup(id: groupId) else { return nil }
        let item = NoteItem(text: text)
        let itemEntity = NoteEntityFactory.makeItem(from: item)
        itemEntity.group = entity
        entity.items = (entity.items ?? []) + [itemEntity]
        entity.updatedAt = Date()
        context.insert(itemEntity)
        save()
        return itemEntity.toDomain()
    }

    @discardableResult
    func updateItem(groupId: String, itemId: String, mutate: (inout NoteItem) -> Void) -> NoteItem? {
        guard
            let entity = findGroup(id: groupId),
            let itemEntity = entity.items?.first(where: { $0.id.uuidString == itemId })
        else { return nil }
        var domain = itemEntity.toDomain()
        mutate(&domain)
        itemEntity.apply(domain)
        entity.updatedAt = Date()
        save()
        return domain
    }

    func deleteItem(groupId: String, itemId: String) {
        guard
            let entity = findGroup(id: groupId),
            let itemEntity = entity.items?.first(where: { $0.id.uuidString == itemId })
        else { return }
        context.delete(itemEntity)
        save()
    }

    func markTimerReminded(groupId: String, itemId: String) {
        guard
            let entity = findGroup(id: groupId),
            let itemEntity = entity.items?.first(where: { $0.id.uuidString == itemId })
        else { return }
        itemEntity.timerReminded = true
        save()
    }

    // MARK: Seed

    func seedDefaults(_ groups: [NoteGroup]) {
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
                entity.items = (entity.items ?? []) + [itemEntity]
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
        guard let uuid = UUID(uuidString: id) else { return nil }
        var descriptor = FetchDescriptor<NoteGroupEntity>(
            predicate: #Predicate { $0.id == uuid && $0.isDaily == false }
        )
        descriptor.fetchLimit = 1
        return try? context.fetch(descriptor).first
    }

    private func save() {
        guard context.hasChanges else { return }
        do {
            try context.save()
            lastLocalSave = Date()
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
}
