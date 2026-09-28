import SwiftUI

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

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                appColors.background
                    .ignoresSafeArea()

                VStack(alignment: .leading, spacing: 20) {
                    header
                        .padding(.horizontal, AppSpacing.screenHorizontal)

                    ScrollView {
                        VStack(alignment: .leading, spacing: AppSpacing.sectionGap) {
                            if viewModel.groups.isEmpty {
                                Text(l10n(.notesEmpty))
                                    .font(AppTypography.subtitle)
                                    .foregroundStyle(appColors.textSecondary)
                                    .frame(maxWidth: .infinity)
                                    .padding(.top, 40)
                            } else {
                                groupsBlock
                            }
                        }
                        .padding(.horizontal, AppSpacing.screenHorizontal)
                        .padding(.top, 20)
                        .padding(.bottom, AppSpacing.bottomBarInset)
                    }
                    .screenScroll()
                    .edgeFade()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .padding(.top, AppSpacing.greetingTop)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
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
                            path.append(NotesRoute.editor(groupId: groupId, itemId: itemId))
                        }
                    )
                case .editor(let groupId, let itemId):
                    NoteItemEditorView(store: viewModel, groupId: groupId, itemId: itemId)
                }
            }
        }
        .onAppear {
            viewModel.load()
            hidesListen = path.count > 1
        }
        .onDisappear {
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
            hidesListen = count > 1
            if count == 0 {
                openGroupId = nil
            } else {
                endDeleteModes()
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
        if openGroupId != id {
            openGroupId = id
            path.append(NotesRoute.group(id))
        }
        viewModel.consumeGroupToOpen()
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

    private func openGroup(_ id: String) {
        endDeleteModes()
        openGroupId = id
        path.append(NotesRoute.group(id))
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
                    VStack(spacing: AppSpacing.rowGap) {
                        ForEach(section.items) { group in
                            NoteGroupRow(
                                group: group,
                                isFresh: viewModel.freshGroupId == group.id,
                                isDeleting: listDeleting,
                                onOpen: { openGroup(group.id) },
                                onDelete: { deleteGroup(group.id) }
                            )
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
                }
            }
        }
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
