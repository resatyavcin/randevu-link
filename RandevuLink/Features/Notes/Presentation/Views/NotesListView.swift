import SwiftUI
import UIKit

enum NotesRoute: Hashable {
    case group(String)
    case editor(groupId: String, itemId: String)
}

struct NotesListView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @EnvironmentObject private var toast: ToastCenter
    @ObservedObject var viewModel: NotesListViewModel
    @Binding var openGroupId: String?
    @Binding var hidesListen: Bool
    @Binding var deleteModeActive: Bool
    var onBeginDuration: () -> Void = {}

    @State private var path = NavigationPath()
    @State private var listDeleting = false
    @State private var detailDeleting = false
    @State private var openEditorItemId: String?
    @State private var routedGroupId: String?
    @State private var skipRootLayout = false
    @State private var rootLayoutTask: Task<Void, Never>?
    @State private var pinnedHeight: CGFloat = 52

    init(
        viewModel: NotesListViewModel,
        openGroupId: Binding<String?>,
        hidesListen: Binding<Bool>,
        deleteModeActive: Binding<Bool>,
        onBeginDuration: @escaping () -> Void = {}
    ) {
        self.viewModel = viewModel
        _openGroupId = openGroupId
        _hidesListen = hidesListen
        _deleteModeActive = deleteModeActive
        self.onBeginDuration = onBeginDuration
        if openGroupId.wrappedValue == nil, let id = viewModel.groupToOpen {
            var seeded = NavigationPath()
            seeded.append(NotesRoute.group(id))
            _path = State(initialValue: seeded)
            _routedGroupId = State(initialValue: id)
            _skipRootLayout = State(initialValue: true)
        }
    }

    var body: some View {
        NavigationStack(path: $path) {
            ZStack(alignment: .top) {
                appColors.background
                    .ignoresSafeArea()

                if !skipRootLayout {
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(alignment: .leading, spacing: 22) {
                                if !listDeleting {
                                    GroupNameComposer(pathCount: path.count) { title, isTodoList in
                                        _ = viewModel.createGroup(title: title, isTodoList: isTodoList)
                                    }
                                }
                                if viewModel.groups.isEmpty {
                                    Text(l10n(.notesEmpty))
                                        .font(AppTypography.subtitle)
                                        .foregroundStyle(appColors.textSecondary)
                                        .frame(maxWidth: .infinity)
                                        .padding(.top, 28)
                                        .transition(.opacity)
                                } else {
                                    groupsBlock
                                }
                            }
                            .padding(.horizontal, AppSpacing.screenHorizontal)
                            .padding(.top, pinnedHeight + 8)
                            .padding(.bottom, AppSpacing.bottomBarInset)
                        }
                        .screenScroll()
                        .scrollDismissesKeyboard(.interactively)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .onChange(of: viewModel.freshGroupId) { _, id in
                            guard let id else { return }
                            let target = groupSections.first { section in
                                section.items.contains { $0.id == id }
                            }?.id ?? id
                            withAnimation(NoteMotion.settle) {
                                proxy.scrollTo(target, anchor: .top)
                            }
                        }
                    }

                    header
                        .padding(.horizontal, AppSpacing.screenHorizontal)
                        .padding(.top, 4)
                        .padding(.bottom, 4)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(alignment: .top) {
                            appColors.background
                                .ignoresSafeArea(edges: .top)
                                .allowsHitTesting(false)
                        }
                        .onGeometryChange(for: CGFloat.self) { proxy in
                            proxy.size.height
                        } action: { height in
                            guard abs(pinnedHeight - height) > 0.5 else { return }
                            var transaction = Transaction(animation: nil)
                            transaction.disablesAnimations = true
                            withTransaction(transaction) {
                                pinnedHeight = height
                            }
                        }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: NotesRoute.self) { route in
                switch route {
                case .group(let groupId):
                    NoteGroupDetailView(
                        store: viewModel,
                        groupId: groupId,
                        isDeleting: $detailDeleting,
                        onBeginDuration: onBeginDuration,
                        onOpenItem: { itemId in
                            openEditor(groupId: groupId, itemId: itemId)
                        },
                        onBack: pop
                    )
                case .editor(let groupId, let itemId):
                    NoteItemEditorView(
                        store: viewModel,
                        groupId: groupId,
                        itemId: itemId,
                        onBack: pop
                    )
                }
            }
        }
        .onAppear {
            viewModel.load()
            hidesListen = path.count > 1
            let path = $path
            let openGroupId = $openGroupId
            let routedGroupId = $routedGroupId
            viewModel.bindGroupOpener { id in
                Self.revealGroup(id, path: path, openGroupId: openGroupId, routedGroupId: routedGroupId)
            }
            guard skipRootLayout else { return }
            rootLayoutTask?.cancel()
            rootLayoutTask = Task { @MainActor in
                await Task.yield()
                await Task.yield()
                guard !Task.isCancelled, skipRootLayout else { return }
                var transaction = Transaction(animation: nil)
                transaction.disablesAnimations = true
                withTransaction(transaction) {
                    skipRootLayout = false
                }
            }
        }
        .onDisappear {
            rootLayoutTask?.cancel()
            rootLayoutTask = nil
            viewModel.bindGroupOpener(nil)
            openGroupId = nil
            hidesListen = false
            listDeleting = false
            detailDeleting = false
            deleteModeActive = false
        }
        .onChange(of: listDeleting) { _, _ in
            publishDeleteMode()
        }
        .onChange(of: detailDeleting) { _, _ in
            publishDeleteMode()
        }
        .onChange(of: path.count) { _, count in
            if count < 2 {
                openEditorItemId = nil
            }
            if count == 0 {
                openGroupId = nil
                routedGroupId = nil
                skipRootLayout = false
            }
            let hideListen = count > 1
            let leavingRoot = count != 0
            Task { @MainActor in
                hidesListen = hideListen
                if leavingRoot {
                    endDeleteModes()
                }
            }
        }
        .onChange(of: deleteModeActive) { _, active in
            guard !active else { return }
            endDeleteModes()
        }
        .onChange(of: viewModel.groupToOpen, initial: true) { _, _ in
            openRequestedGroup()
        }
        .onChange(of: viewModel.popToList) { _, shouldPop in
            guard shouldPop else { return }
            path = NavigationPath()
            viewModel.consumePopToList()
        }
        .onChange(of: viewModel.reminderText) { _, text in
            guard let text else { return }
            toast.show(String(format: l10n(.notesTimerDone), text), duration: 2.4)
            viewModel.consumeReminder()
        }
    }

    private func publishDeleteMode() {
        let active = listDeleting || detailDeleting
        guard deleteModeActive != active else { return }
        var transaction = Transaction()
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            deleteModeActive = active
        }
    }

    private func openRequestedGroup() {
        guard let id = viewModel.groupToOpen else { return }
        Self.revealGroup(id, path: $path, openGroupId: $openGroupId, routedGroupId: $routedGroupId)
        viewModel.consumeGroupToOpen()
    }

    private static func revealGroup(
        _ id: String,
        path: Binding<NavigationPath>,
        openGroupId: Binding<String?>,
        routedGroupId: Binding<String?>
    ) {
        let needsIdentity = openGroupId.wrappedValue != id
        let needsPush = routedGroupId.wrappedValue != id
        guard needsIdentity || needsPush else { return }
        var transaction = Transaction(animation: nil)
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            UIView.performWithoutAnimation {
                if needsIdentity {
                    openGroupId.wrappedValue = id
                }
                if needsPush {
                    var next = path.wrappedValue
                    next.append(NotesRoute.group(id))
                    path.wrappedValue = next
                    routedGroupId.wrappedValue = id
                }
            }
        }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            Text(l10n(.notesTitle))
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(appColors.textPrimary)
                .lineLimit(1)
            Spacer(minLength: 8)
            if listDeleting || !viewModel.groups.isEmpty {
                SelectionBar(
                    isDeleting: listDeleting,
                    deleteTitle: l10n(.commonDelete),
                    cancelTitle: l10n(.commonCancel),
                    onDelete: beginDelete,
                    onCancel: endDelete
                )
            }
        }
        .frame(minHeight: 40)
    }

    private func beginDelete() {
        listDeleting = true
    }

    private func endDelete() {
        listDeleting = false
    }

    private func endDeleteModes() {
        guard listDeleting || detailDeleting else { return }
        listDeleting = false
        detailDeleting = false
    }

    private func openEditor(groupId: String, itemId: String) {
        guard openEditorItemId != itemId else { return }
        openEditorItemId = itemId
        path.append(NotesRoute.editor(groupId: groupId, itemId: itemId))
    }

    private func openGroup(_ id: String) {
        endDeleteModes()
        openGroupId = id
        routedGroupId = id
        path.append(NotesRoute.group(id))
    }

    private func pop() {
        guard !path.isEmpty else { return }
        path.removeLast()
    }

    private func deleteGroup(_ id: String) {
        withAnimation(.easeInOut(duration: 0.28)) {
            viewModel.deleteGroup(id: id)
        }
        if openGroupId == id {
            path = NavigationPath()
        }
        if viewModel.groups.isEmpty {
            endDelete()
        }
    }

    private var groupSections: [DayBucket<NoteGroup>] {
        DayBuckets.group(viewModel.orderedGroups, date: \.updatedAt, title: dayTitle)
    }

    private func dayTitle(_ date: Date) -> String {
        RelativeDay.title(
            for: date,
            locale: Locale(identifier: l10n.language.localeIdentifier),
            today: l10n(.dailyToday),
            yesterday: l10n(.dailyYesterday),
            tomorrow: l10n(.dailyTomorrow)
        )
    }

    private var groupsBlock: some View {
        VStack(alignment: .leading, spacing: 22) {
            ForEach(groupSections) { section in
                VStack(alignment: .leading, spacing: 10) {
                    Text(section.title)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(appColors.textPrimary)
                        .transition(.opacity)
                    VStack(spacing: AppSpacing.rowGap) {
                        ForEach(section.items) { group in
                            NoteGroupRow(
                                group: group,
                                isFresh: viewModel.freshGroupId == group.id,
                                isDeleting: listDeleting,
                                onOpen: { openGroup(group.id) },
                                onDelete: { deleteGroup(group.id) }
                            )
                            .noteArrival(from: .field, isFresh: viewModel.freshGroupId == group.id)
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
                }
            }
        }
        .animation(NoteMotion.settle, value: viewModel.orderedGroups.map(\.id))
    }
}

/// Owns the draft name so each keystroke does not rebuild the group list.
private struct GroupNameComposer: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    var pathCount: Int
    var onCreate: (String, Bool) -> Void

    @State private var title = ""
    @State private var isTodo = false
    @FocusState private var focused: Bool
    @Namespace private var kindNamespace

    private var trimmedTitle: String {
        title.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .center, spacing: 4) {
                TextField(
                    "",
                    text: $title,
                    prompt: Text(l10n(.notesGroupName))
                        .foregroundStyle(appColors.textSecondary)
                )
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(appColors.textPrimary)
                .tint(appColors.textPrimary)
                .textInputAutocapitalization(.sentences)
                .submitLabel(.done)
                .focused($focused)
                .onSubmit(submit)
                .lineLimit(1)

                addButton
            }
            .frame(minHeight: 44)

            kindSegment
        }
        .onChange(of: pathCount) { _, count in
            guard count > 0 else { return }
            focused = false
        }
    }

    private var kindSegment: some View {
        HStack(spacing: 2) {
            kindSegmentItem(isTodo: false, title: l10n(.notesGroupKindNormal))
            kindSegmentItem(isTodo: true, title: l10n(.notesGroupKindTodo))
        }
        .padding(3)
        .background(appColors.controlBackground, in: Capsule())
        .animation(.easeInOut(duration: 0.22), value: isTodo)
    }

    private func kindSegmentItem(isTodo: Bool, title: String) -> some View {
        let selected = self.isTodo == isTodo
        return Button {
            guard self.isTodo != isTodo else { return }
            withAnimation(.easeInOut(duration: 0.22)) {
                self.isTodo = isTodo
            }
        } label: {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(selected ? appColors.textPrimary : appColors.textSecondary)
                .lineLimit(1)
                .padding(.horizontal, 12)
                .frame(height: 26)
                .background {
                    if selected {
                        Capsule()
                            .fill(appColors.controlSelected)
                            .matchedGeometryEffect(id: "groupKind", in: kindNamespace)
                    }
                }
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private var addButton: some View {
        let ready = !trimmedTitle.isEmpty
        return Button(action: submit) {
            Image(systemName: "plus")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(ready ? appColors.background : appColors.textSecondary)
                .frame(width: 34, height: 34)
                .background(ready ? appColors.accent : appColors.controlBackground, in: Circle())
                .frame(width: 44, height: 44)
                .contentShape(Circle())
        }
        .buttonStyle(AddGroupButtonStyle())
        .disabled(!ready)
        .accessibilityLabel(l10n(.notesNameSave))
        .animation(.easeInOut(duration: 0.22), value: ready)
    }

    private func submit() {
        let title = trimmedTitle
        guard !title.isEmpty else { return }
        let isTodoList = isTodo
        focused = false
        self.title = ""
        isTodo = false
        onCreate(title, isTodoList)
    }
}

private struct AddGroupButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.72 : 1)
    }
}

private struct NoteGroupRow: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    let group: NoteGroup
    var isFresh: Bool
    var isDeleting: Bool
    var onOpen: () -> Void
    var onDelete: () -> Void

    @State private var progress: CGFloat = 0
    @State private var showDeleted = false

    var body: some View {
        holdRow
            .onChange(of: isDeleting) { _, deleting in
                guard !deleting else { return }
                progress = 0
                showDeleted = false
            }
    }

    private var holdRow: some View {
        row.modifier(HoldToDelete(
            isEnabled: isDeleting,
            deletedLabel: l10n(.notesDeleted),
            progress: $progress,
            showDeleted: $showDeleted,
            onCommit: onDelete,
            onQuickTap: onOpen
        ))
    }

    private var row: some View {
        Group {
            if group.longestRemainingSeconds() != nil {
                TimelineView(.periodic(from: .now, by: 1)) { context in
                    rowContent(at: context.date)
                }
            } else {
                rowContent(at: nil)
            }
        }
    }

    private func rowContent(at date: Date?) -> some View {
        let longest = date.flatMap { group.longestRemainingSeconds(at: $0) }
        let primary = HoldDelete.textColor(base: appColors.textPrimary, progress: progress)
        let secondary = HoldDelete.textColor(base: appColors.textSecondary, progress: progress)
        return HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(group.title.isEmpty ? l10n(.notesGroupNew) : group.title)
                    .font(AppTypography.rowTitle)
                    .foregroundStyle(primary)
                    .multilineTextAlignment(.leading)
                Text(String(format: l10n(.notesGroupItemsCount), group.items.count))
                    .font(AppTypography.rowSource)
                    .foregroundStyle(secondary)
            }
            Spacer(minLength: 8)
            if let longest {
                Text(shortDuration(longest))
                    .font(AppTypography.rowTitle)
                    .foregroundStyle(secondary)
                    .accessibilityLabel(l10n(.notesDurationAvgLabel))
            }
            if group.isTodoList {
                Image(systemName: "checklist")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(secondary)
                    .accessibilityHidden(true)
            }
            if group.isPinned {
                Image(systemName: "pin.fill")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(secondary)
                    .accessibilityLabel(l10n(.notesPin))
            }
            if !isDeleting {
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(appColors.textSecondary.opacity(0.7))
            }
        }
        .opacity(showDeleted ? 0 : 1)
        .padding(.horizontal, AppSpacing.rowHorizontal)
        .padding(.vertical, AppSpacing.rowVertical)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            ZStack(alignment: .leading) {
                appColors.cardBackground
                if isFresh {
                    appColors.selection.opacity(0.16)
                }
                if progress > 0 {
                    DeleteFill(progress: progress)
                }
            }
            .animation(.easeInOut(duration: 0.45), value: isFresh)
        }
        .contentShape(Rectangle())
    }

    private func shortDuration(_ seconds: TimeInterval) -> String {
        let parts = DurationLabel.short(seconds)
        let unit = l10n(parts.unit == .hours ? .notesDurationHours : .notesDurationMinutes)
        return "\(parts.value) \(unit)"
    }
}
