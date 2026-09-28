import Foundation
import CoreData
import WidgetKit

@MainActor
final class NotesListViewModel: ObservableObject {
    @Published private(set) var groups: [NoteGroup] = []
    @Published private(set) var dayGroups: [NoteGroup] = []
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
                repository.seedDefaults(DefaultNotesSeed.groups(), dayGroups: DefaultNotesSeed.dayGroups())
            }
            apply(repository.fetch())
            didLoad = true
        }
        watchTimers()
        publishWidgetSnapshot()
        TimerNotifier.resync(groups: groups + dayGroups)
    }

    func group(id: String) -> NoteGroup? {
        groups.first { $0.id == id } ?? dayGroups.first { $0.id == id }
    }

    func addDailyLine(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let id = DayKey.id(for: Date())
        _ = repository.ensureDayGroup(dayKey: id)
        if let item = repository.addItem(groupId: id, text: trimmed) {
            showFreshItem(item.id)
        }
        refresh(syncNotifications: true)
    }

    func finishDailySpeech(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        addDailyLine(trimmed)
    }

    var orderedGroups: [NoteGroup] {
        groups.sorted { lhs, rhs in
            if lhs.isPinned != rhs.isPinned { return lhs.isPinned }
            return lhs.updatedAt > rhs.updatedAt
        }
    }

    func focusMostRecentGroup() {
        guard let id = groups.max(by: { $0.updatedAt < $1.updatedAt })?.id else { return }
        activeGroupId = id
        groupToOpen = id
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
    func createGroup(title: String) -> String? {
        let title = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return nil }
        let lines = pendingLines
        pendingLines = []
        let items = lines.map(makeItem)
        let group = repository.createGroup(title: title, items: items)
        activeGroupId = group.id
        showFreshGroup(group.id)
        if let newest = items.last {
            showFreshItem(newest.id)
        }
        popToList = true
        refresh(syncNotifications: true)
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
        if let item = repository.addItem(groupId: groupId, text: trimmed) {
            showFreshItem(item.id)
        }
        refresh(syncNotifications: true)
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
        refresh(syncNotifications: true)
    }

    func updateItemText(groupId: String, itemId: String, text: String, wordStyles: [NoteWordStyle]) {
        repository.updateItem(groupId: groupId, itemId: itemId) { item in
            item.text = text
            item.wordStyles = wordStyles
            item.isBold = false
            item.isItalic = false
        }
        refresh()
    }

    func setItemBold(groupId: String, itemId: String, isBold: Bool) {
        repository.updateItem(groupId: groupId, itemId: itemId) { item in
            item.isBold = isBold
        }
        refresh()
    }

    func setItemItalic(groupId: String, itemId: String, isItalic: Bool) {
        repository.updateItem(groupId: groupId, itemId: itemId) { item in
            item.isItalic = isItalic
        }
        refresh()
    }

    func deleteItem(groupId: String, itemId: String) {
        TimerNotifier.cancel(itemId: itemId)
        repository.deleteItem(groupId: groupId, itemId: itemId)
        finishedItemIDs.removeAll { $0 == itemId }
        refresh(syncNotifications: true)
    }

    func rename(groupId: String, title: String) {
        repository.rename(groupId: groupId, title: title)
        refresh()
    }

    func setPinned(groupId: String, isPinned: Bool) {
        repository.setPinned(groupId: groupId, isPinned: isPinned)
        refresh()
    }

    func startTimer(groupId: String, itemId: String, seconds: TimeInterval) {
        let duration = max(1, seconds)
        repository.updateItem(groupId: groupId, itemId: itemId) { item in
            item.timer = NoteTimer(durationSeconds: duration)
            item.defaultDurationSeconds = duration
        }
        refresh(syncNotifications: true)
    }

    func toggleDone(groupId: String, itemId: String) {
        var becameDone = false
        repository.updateItem(groupId: groupId, itemId: itemId) { item in
            item.isDone.toggle()
            becameDone = item.isDone
        }
        if becameDone {
            TimerNotifier.cancel(itemId: itemId)
        }
        refresh(syncNotifications: true)
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
        publishWidgetSnapshot()
        if syncNotifications {
            TimerNotifier.resync(groups: groups + dayGroups)
        }
    }

    private func scheduleRemoteRefresh() {
        remoteRefreshTask?.cancel()
        remoteRefreshTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 250_000_000)
            guard !Task.isCancelled else { return }
            refreshFromStore()
        }
    }

    private func refreshFromStore() {
        guard didLoad else { return }
        refresh(syncNotifications: true)
    }

    private func apply(_ snapshot: NotesRepository.Snapshot) {
        groups = snapshot.groups
        dayGroups = snapshot.dayGroups
    }

    private func publishWidgetSnapshot() {
        let now = Date()
        let blocks = (groups + dayGroups).flatMap(\.items).compactMap { item -> WidgetTimerBlock? in
            guard !item.isDone, let timer = item.timer, !timer.isFinished(at: now) else { return nil }
            return WidgetTimerBlock(
                title: item.text,
                startedAt: timer.startedAt,
                durationSeconds: timer.durationSeconds
            )
        }
        let language = UserDefaults.standard.string(forKey: "settings.language") ?? "tr"
        WidgetSnapshotStore.save(WidgetSnapshot(blocks: blocks, language: language))
        WidgetCenter.shared.reloadTimelines(ofKind: WidgetSnapshotStore.kind)
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
            try? await Task.sleep(nanoseconds: 2_800_000_000)
            guard !Task.isCancelled, freshGroupId == id else { return }
            freshGroupId = nil
        }
    }

    private func showFreshItem(_ id: String) {
        freshItemId = id
        freshItemTask?.cancel()
        freshItemTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 2_800_000_000)
            guard !Task.isCancelled, freshItemId == id else { return }
            freshItemId = nil
        }
    }

    private func watchTimers() {
        watchTask?.cancel()
        guard hasOpenTimer else { return }

        watchTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 200_000_000)
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
        for group in groups + dayGroups {
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
            apply(repository.fetch())
            finishedItemIDs = dueIDs
            reminderText = dueText
            publishWidgetSnapshot()
        }
        if !hasOpenTimer {
            watchTask?.cancel()
            watchTask = nil
        }
    }

    private var hasOpenTimer: Bool {
        (groups + dayGroups).contains { group in
            group.items.contains { item in
                guard let timer = item.timer else { return false }
                return !timer.reminded
            }
        }
    }
}
