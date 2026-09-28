import Foundation

@MainActor
final class NoteGroupDetailViewModel: ObservableObject {
    let groupId: String
    private let store: NotesListViewModel

    init(groupId: String, store: NotesListViewModel) {
        self.groupId = groupId
        self.store = store
    }

    var group: NoteGroup? {
        store.group(id: groupId)
    }

    func rename(title: String) {
        store.rename(groupId: groupId, title: title)
    }

    func setPinned(_ isPinned: Bool) {
        store.setPinned(groupId: groupId, isPinned: isPinned)
    }

    func addItem(text: String) {
        store.addItem(groupId: groupId, text: text)
    }

    func startTimer(itemId: String, seconds: TimeInterval) {
        store.startTimer(groupId: groupId, itemId: itemId, seconds: seconds)
    }

    func toggleDone(itemId: String) {
        store.toggleDone(groupId: groupId, itemId: itemId)
    }

    func deleteItem(itemId: String) {
        store.deleteItem(groupId: groupId, itemId: itemId)
    }

    func updateText(itemId: String, text: String) {
        let current = group?.items.first { $0.id == itemId }
        let styles = NoteWords.aligned(
            oldText: current?.text ?? "",
            oldStyles: current?.wordStyles ?? [],
            newText: text
        )
        store.updateItemText(groupId: groupId, itemId: itemId, text: text, wordStyles: styles)
    }

    func setBold(itemId: String, isBold: Bool) {
        store.setItemBold(groupId: groupId, itemId: itemId, isBold: isBold)
    }

    func setItalic(itemId: String, isItalic: Bool) {
        store.setItemItalic(groupId: groupId, itemId: itemId, isItalic: isItalic)
    }
}
