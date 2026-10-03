import Foundation
import CoreData

@MainActor
final class NotesListViewModel: ObservableObject {
    @Published private(set) var groups: [NoteGroup] = []
    @Published private(set) var reminderText: String?
    @Published private(set) var finishedItemIDs: [String] = []
    @Published var popToList = false
    @Published var groupToOpen: String?
    @Published private(set) var freshGroupId: String?
    @Published private(set) var freshItemId: String?

    private let repository: NotesRepository
    private var didLoad = false
    private var watchTask: Task<Void, Never>?
    private var activeGroupId: String?
    private var pendingLines: [String] = []
    private var freshGroupTask: Task<Void, Never>?
    private var freshItemTask: Task<Void, Never>?
    private var remoteObserver: NSObjectProtocol?
    private var remoteRefreshTask: Task<Void, Never>?
    private var openGroupHandler: ((String) -> Void)?

    init(repository: NotesRepository) {
        self.repository = repository
        remoteObserver = NotificationCenter.default.addObserver(
            forName: .NSPersistentStoreRemoteChange,
            object: nil,
            queue: nil
        ) { [weak self] _ in
            Task { @MainActor in
                self?.scheduleRemoteRefresh()
            }
        }
    }

    func load() {
        if !didLoad {
            if repository.isEmpty {
                repository.seedDefaults(DefaultNotesSeed.groups())
            }
            apply(repository.fetch())
            didLoad = true
        }
        watchTimers()
        TimerNotifier.resync(groups: groups)
    }

    func group(id: String) -> NoteGroup? {
        groups.first { $0.id == id }
    }

    var orderedGroups: [NoteGroup] {
        groups.sorted { lhs, rhs in
            if lhs.isPinned != rhs.isPinned { return lhs.isPinned }
            return lhs.updatedAt > rhs.updatedAt
        }
    }

    func bindGroupOpener(_ handler: ((String) -> Void)?) {
        openGroupHandler = handler
    }

    func focusMostRecentGroup() {
        guard let id = groups.max(by: { $0.updatedAt < $1.updatedAt })?.id else { return }
        activeGroupId = id
        if let openGroupHandler {
            openGroupHandler(id)
        } else {
            groupToOpen = id
        }
    }

    func consumeGroupToOpen() {
        groupToOpen = nil
    }

    func addSpokenLine(_ text: String, openGroupId: String?) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if let groupId = targetGroupId(openGroupId: openGroupId) {
            addItem(groupId: groupId, text: trimmed)
        } else {
            pendingLines.append(trimmed)
        }
    }

    @discardableResult
    func createGroup(title: String, isTodoList: Bool = false) -> String? {
        let title = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return nil }
        let lines = pendingLines
        pendingLines = []
        let items = lines.map(makeItem)
        let group = repository.createGroup(title: title, items: items, isTodoList: isTodoList)
        activeGroupId = group.id
        groups.append(group)
        showFreshGroup(group.id)
        if let newest = items.last {
            showFreshItem(newest.id)
        }
        watchTimers()
        TimerNotifier.resync(groups: groups)
        Task { @MainActor in
            popToList = true
        }
        return group.id
    }

    func finishSpeech(_ text: String, openGroupId: String?) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty {
            addSpokenLine(trimmed, openGroupId: openGroupId)
        }
        guard targetGroupId(openGroupId: openGroupId) == nil, !pendingLines.isEmpty else { return }
        let title = pendingLines.joined(separator: " ")
        pendingLines = []
        createGroup(title: title)
    }

    func addItem(groupId: String, text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        guard let item = repository.addItem(groupId: groupId, text: trimmed) else { return }
        showFreshItem(item.id)
        guard var group = group(id: groupId) else {
            refresh(syncNotifications: true)
            return
        }
        group.items.insert(item, at: 0)
        group.updatedAt = Date()
        replace(group, syncNotifications: true)
    }

    func deleteGroup(id: String) {
        let itemIDs = group(id: id)?.items.map(\.id) ?? []
        for itemId in itemIDs {
            TimerNotifier.cancel(itemId: itemId)
        }
        repository.deleteGroup(id: id)
        if activeGroupId == id {
            activeGroupId = nil
        }
        finishedItemIDs.removeAll { itemIDs.contains($0) }
        groups.removeAll { $0.id == id }
        watchTimers()
        TimerNotifier.resync(groups: groups)
    }

    func updateItemText(
        groupId: String,
        itemId: String,
        text: String,
        wordStyles: [NoteWordStyle],
        reflectInList: Bool = true
    ) {
        guard let updated = repository.updateItem(groupId: groupId, itemId: itemId, mutate: { item in
            item.text = text
            item.wordStyles = wordStyles
            item.isBold = false
            item.isItalic = false
        }) else {
            if reflectInList { refresh() }
            return
        }
        guard reflectInList else { return }
        replaceItem(groupId: groupId, item: updated)
    }

    func setItemBold(groupId: String, itemId: String, isBold: Bool) {
        guard let updated = repository.updateItem(groupId: groupId, itemId: itemId, mutate: { item in
            item.isBold = isBold
        }) else { return }
        replaceItem(groupId: groupId, item: updated)
    }

    func setItemItalic(groupId: String, itemId: String, isItalic: Bool) {
        guard let updated = repository.updateItem(groupId: groupId, itemId: itemId, mutate: { item in
            item.isItalic = isItalic
        }) else { return }
        replaceItem(groupId: groupId, item: updated)
    }

    func setItemRating(groupId: String, itemId: String, rating: Double) {
        let next = (min(5, max(0, rating)) * 2).rounded() / 2
        guard let updated = repository.updateItem(groupId: groupId, itemId: itemId, mutate: { item in
            item.rating = next
        }) else { return }
        replaceItem(groupId: groupId, item: updated)
    }

    func setItemColor(groupId: String, itemId: String, colorId: String?) {
        guard group(id: groupId)?.isTodoList != true else { return }
        guard let updated = repository.updateItem(groupId: groupId, itemId: itemId, mutate: { item in
            item.colorId = colorId
            item.blinks = colorId != nil
        }) else { return }
        replaceItem(groupId: groupId, item: updated)
    }

    func deleteItem(groupId: String, itemId: String) {
        TimerNotifier.cancel(itemId: itemId)
        repository.deleteItem(groupId: groupId, itemId: itemId)
        finishedItemIDs.removeAll { $0 == itemId }
        guard var group = group(id: groupId) else {
            refresh(syncNotifications: true)
            return
        }
        group.items.removeAll { $0.id == itemId }
        replace(group, syncNotifications: true)
    }

    func rename(groupId: String, title: String, reflectInList: Bool = true) {
        repository.rename(groupId: groupId, title: title)
        guard reflectInList, var group = group(id: groupId) else {
            if reflectInList { refresh() }
            return
        }
        guard group.title != title else { return }
        group.title = title
        group.updatedAt = Date()
        replace(group)
    }

    func setPinned(groupId: String, isPinned: Bool) {
        repository.setPinned(groupId: groupId, isPinned: isPinned)
        guard var group = group(id: groupId) else {
            refresh()
            return
        }
        guard group.isPinned != isPinned else { return }
        group.isPinned = isPinned
        replace(group)
    }

    func setSinkCompleted(groupId: String, sinkCompleted: Bool) {
        repository.setSinkCompleted(groupId: groupId, sinkCompleted: sinkCompleted)
        guard var group = group(id: groupId) else {
            refresh()
            return
        }
        guard group.sinkCompleted != sinkCompleted else { return }
        group.sinkCompleted = sinkCompleted
        replace(group)
    }

    func startTimer(groupId: String, itemId: String, seconds: TimeInterval) {
        let duration = max(1, seconds)
        guard let updated = repository.updateItem(groupId: groupId, itemId: itemId, mutate: { item in
            item.timer = NoteTimer(durationSeconds: duration)
            item.defaultDurationSeconds = duration
        }) else { return }
        replaceItem(groupId: groupId, item: updated, syncNotifications: true)
    }

    func toggleDone(groupId: String, itemId: String) {
        guard group(id: groupId)?.isTodoList == true else { return }
        var becameDone = false
        guard let updated = repository.updateItem(groupId: groupId, itemId: itemId, mutate: { item in
            item.isDone.toggle()
            item.completedAt = item.isDone ? Date() : nil
            becameDone = item.isDone
        }) else { return }
        if becameDone {
            TimerNotifier.cancel(itemId: itemId)
        }
        replaceItem(groupId: groupId, item: updated, syncNotifications: true)
    }

    func consumeReminder() {
        reminderText = nil
    }

    func consumePopToList() {
        popToList = false
    }

    private func refresh(syncNotifications: Bool = false) {
        apply(repository.fetch())
        watchTimers()
        if syncNotifications {
            TimerNotifier.resync(groups: groups)
        }
    }

    private func scheduleRemoteRefresh() {
        remoteRefreshTask?.cancel()
        remoteRefreshTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 300_000_000)
            guard !Task.isCancelled else { return }
            // Local saves post the same notification. Skip that echo so typing
            // does not refetch the whole store.
            guard Date().timeIntervalSince(repository.lastLocalSave) >= 0.5 else { return }
            refreshFromStore()
        }
    }

    private func refreshFromStore() {
        guard didLoad else { return }
        refresh(syncNotifications: true)
    }

    private func apply(_ snapshot: NotesRepository.Snapshot) {
        guard groups != snapshot.groups else { return }
        groups = snapshot.groups
    }

    private func replace(_ group: NoteGroup, syncNotifications: Bool = false) {
        guard let index = groups.firstIndex(where: { $0.id == group.id }) else {
            refresh(syncNotifications: syncNotifications)
            return
        }
        guard groups[index] != group else { return }
        groups[index] = group
        if syncNotifications {
            watchTimers()
            TimerNotifier.resync(groups: groups)
        }
    }

    private func replaceItem(groupId: String, item: NoteItem, syncNotifications: Bool = false) {
        guard var group = group(id: groupId),
              let index = group.items.firstIndex(where: { $0.id == item.id })
        else {
            refresh(syncNotifications: syncNotifications)
            return
        }
        group.items[index] = item
        group.updatedAt = Date()
        replace(group, syncNotifications: syncNotifications)
    }

    private func targetGroupId(openGroupId: String?) -> String? {
        if let openGroupId, group(id: openGroupId) != nil {
            return openGroupId
        }
        if let activeGroupId, group(id: activeGroupId) != nil {
            return activeGroupId
        }
        return nil
    }

    private func makeItem(_ text: String) -> NoteItem {
        NoteItem(text: text)
    }

    private func showFreshGroup(_ id: String) {
        freshGroupId = id
        freshGroupTask?.cancel()
        freshGroupTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 800_000_000)
            guard !Task.isCancelled, freshGroupId == id else { return }
            freshGroupId = nil
        }
    }

    private func showFreshItem(_ id: String) {
        freshItemId = id
        freshItemTask?.cancel()
        freshItemTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 800_000_000)
            guard !Task.isCancelled, freshItemId == id else { return }
            freshItemId = nil
        }
    }

    private func watchTimers() {
        watchTask?.cancel()
        guard hasOpenTimer else { return }

        watchTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                await MainActor.run {
                    self?.checkFinishedTimers()
                }
            }
        }
    }

    private func checkFinishedTimers() {
        let now = Date()
        var dueText: String?
        var dueIDs: [String] = []
        for group in groups {
            for item in group.items {
                guard let timer = item.timer, !timer.reminded, timer.isFinished(at: now) else { continue }
                repository.markTimerReminded(groupId: group.id, itemId: item.id)
                TimerNotifier.cancel(itemId: item.id)
                dueIDs.append(item.id)
                if dueText == nil {
                    dueText = item.text
                }
            }
        }
        if !dueIDs.isEmpty {
            var next = groups
            for groupIndex in next.indices {
                for itemIndex in next[groupIndex].items.indices {
                    guard dueIDs.contains(next[groupIndex].items[itemIndex].id),
                          var timer = next[groupIndex].items[itemIndex].timer else { continue }
                    timer.reminded = true
                    next[groupIndex].items[itemIndex].timer = timer
                }
            }
            groups = next
            finishedItemIDs = dueIDs
            reminderText = dueText
        }
        if !hasOpenTimer {
            watchTask?.cancel()
            watchTask = nil
        }
    }

    private var hasOpenTimer: Bool {
        groups.contains { group in
            group.items.contains { item in
                guard let timer = item.timer else { return false }
                return !timer.reminded
            }
        }
    }
}
