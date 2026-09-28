import SwiftUI
import UIKit

struct NoteGroupDetailView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var store: NotesListViewModel
    @StateObject private var viewModel: NoteGroupDetailViewModel
    @Binding var isDeleting: Bool
    var onBeginDuration: () -> Void = {}
    var onOpenItem: (String) -> Void = { _ in }

    @State private var title = ""
    @State private var durationItem: NoteItem?
    @FocusState private var titleFocused: Bool

    init(
        store: NotesListViewModel,
        groupId: String,
        isDeleting: Binding<Bool>,
        onBeginDuration: @escaping () -> Void,
        onOpenItem: @escaping (String) -> Void
    ) {
        self.store = store
        self.onBeginDuration = onBeginDuration
        self.onOpenItem = onOpenItem
        _isDeleting = isDeleting
        _viewModel = StateObject(wrappedValue: NoteGroupDetailViewModel(groupId: groupId, store: store))
    }

    private var group: NoteGroup? {
        store.group(id: viewModel.groupId)
    }

    var body: some View {
        ZStack {
            appColors.background
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 20) {
                header
                    .padding(.horizontal, AppSpacing.screenHorizontal)

                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        ForEach(itemSections) { section in
                            VStack(alignment: .leading, spacing: 10) {
                                Text(section.title)
                                    .font(.system(size: 17, weight: .semibold))
                                    .foregroundStyle(appColors.textPrimary)
                                VStack(spacing: AppSpacing.rowGap) {
                                    ForEach(section.items) { item in
                                        NoteItemRow(
                                            item: item,
                                            isFresh: store.freshItemId == item.id,
                                            doneHint: l10n(.notesDetailItemDone),
                                            durationHint: l10n(.notesDurationHint),
                                            deletedLabel: l10n(.notesDeleted),
                                            finishedItemIDs: store.finishedItemIDs,
                                            isDeleting: isDeleting,
                                            onToggle: { viewModel.toggleDone(itemId: item.id) },
                                            onDuration: {
                                                onBeginDuration()
                                                durationItem = item
                                            },
                                            onDelete: { deleteItem(item.id) },
                                            onOpen: {
                                                if isDeleting {
                                                    endDelete()
                                                }
                                                onOpenItem(item.id)
                                            }
                                        )
                                    }
                                }
                                .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
                            }
                        }
                    }
                    .padding(.horizontal, AppSpacing.screenHorizontal)
                    .padding(.top, 20)
                    .padding(.bottom, AppSpacing.bottomBarInset)
                }
                .screenScroll()
                .edgeFade()
                .scrollDismissesKeyboard(.interactively)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(.top, AppSpacing.greetingTop)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .background {
            PopGestureEnabler()
                .frame(width: 0, height: 0)
        }
        .toolbar(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden(true)
        .onDisappear {
            if isDeleting {
                isDeleting = false
            }
        }
        .onAppear {
            if title.isEmpty, let group {
                title = group.title
            }
        }
        .sheet(item: $durationItem) { item in
            DurationKeypadSheet(noteText: item.text) { seconds in
                viewModel.startTimer(itemId: item.id, seconds: seconds)
            }
            .environmentObject(l10n)
            .presentationDetents([.height(280)])
            .presentationDragIndicator(.hidden)
        }
    }

    private func beginDelete() {
        titleFocused = false
        isDeleting = true
    }

    private func endDelete() {
        isDeleting = false
    }

    private var itemSections: [DayBucket<NoteItem>] {
        guard let group else { return [] }
        return DayBuckets.group(group.items, date: \.createdAt, title: dayTitle)
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

    private func deleteItem(_ id: String) {
        withAnimation(.easeInOut(duration: 0.28)) {
            viewModel.deleteItem(itemId: id)
        }
        if store.group(id: viewModel.groupId)?.items.isEmpty ?? true {
            endDelete()
        }
    }

    private var header: some View {
        HStack(spacing: 8) {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(appColors.textPrimary)
                    .frame(width: 40, height: 40)
                    .background(appColors.controlBackground)
                    .clipShape(Circle())
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(l10n(.commonBack))

            TextField(l10n(.notesGroupNew), text: $title)
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(appColors.textPrimary)
                .focused($titleFocused)
                .submitLabel(.done)
                .disabled(isDeleting)
                .onSubmit { viewModel.rename(title: title) }
                .onChange(of: title) { _, newTitle in
                    viewModel.rename(title: newTitle)
                }

            Button {
                viewModel.setPinned(!(group?.isPinned ?? false))
            } label: {
                Image(systemName: (group?.isPinned ?? false) ? "pin.fill" : "pin")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(appColors.textPrimary)
                    .frame(width: 36, height: 36)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(l10n((group?.isPinned ?? false) ? .notesUnpin : .notesPin))

            if isDeleting || !(group?.items.isEmpty ?? true) {
                SelectionBar(
                    isDeleting: isDeleting,
                    deleteTitle: l10n(.commonDelete),
                    cancelTitle: l10n(.commonCancel),
                    onDelete: beginDelete,
                    onCancel: endDelete
                )
            }
        }
    }

}

struct PopGestureEnabler: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> Controller {
        Controller()
    }

    func updateUIViewController(_ uiViewController: Controller, context: Context) {}

    final class Controller: UIViewController {
        private let gestureDelegate = PopGestureDelegate()

        override func viewDidLoad() {
            super.viewDidLoad()
            view.backgroundColor = .clear
            view.isUserInteractionEnabled = false
        }

        override func viewDidAppear(_ animated: Bool) {
            super.viewDidAppear(animated)
            guard let navigation = navigationController else { return }
            gestureDelegate.navigation = navigation
            navigation.interactivePopGestureRecognizer?.isEnabled = true
            navigation.interactivePopGestureRecognizer?.delegate = gestureDelegate
        }
    }
}

final class PopGestureDelegate: NSObject, UIGestureRecognizerDelegate {
    weak var navigation: UINavigationController?

    func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        guard let navigation, navigation.viewControllers.count > 1 else { return false }
        guard let pan = gestureRecognizer as? UIPanGestureRecognizer else { return true }
        return pan.velocity(in: pan.view).x > 0
    }
}

struct NoteItemRow: View {
    @Environment(\.appColors) private var appColors
    let item: NoteItem
    var isFresh = false
    let doneHint: String
    let durationHint: String
    let deletedLabel: String
    let finishedItemIDs: [String]
    var isDeleting: Bool
    var onToggle: () -> Void
    var onDuration: () -> Void
    var onDelete: () -> Void
    var onOpen: () -> Void

    @State private var glow = false
    @State private var shownDone = false
    @State private var suppressTap = false
    @State private var singleTap: Task<Void, Never>?
    @State private var deleteProgress: CGFloat = 0
    @State private var showDeleted = false

    var body: some View {
        interactive
            .onAppear { shownDone = item.isDone }
            .onChange(of: item.isDone) { _, done in
                withAnimation(.easeInOut(duration: 0.4)) {
                    shownDone = done
                }
            }
            .onChange(of: isDeleting) { _, deleting in
                singleTap?.cancel()
                guard !deleting else { return }
                deleteProgress = 0
                showDeleted = false
            }
            .onChange(of: finishedItemIDs) { _, ids in
                guard ids.contains(item.id) else { return }
                flash()
            }
            .accessibilityElement(children: .combine)
            .accessibilityHint(item.isDone ? doneHint : durationHint)
    }

    private var visual: some View {
        ZStack(alignment: .leading) {
            timerLayer
                .overlay(alignment: .leading) {
                    if deleteProgress > 0 {
                        DeleteFill(progress: deleteProgress)
                            .allowsHitTesting(false)
                    }
                }

            noteText
                .opacity(showDeleted ? 0 : 1)
                .padding(.horizontal, AppSpacing.rowHorizontal)
                .padding(.vertical, AppSpacing.rowVertical)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .scaleEffect(glow ? 1.015 : 1)
        .contentShape(Rectangle())
    }

    @ViewBuilder
    private var timerLayer: some View {
        if let timer = item.timer, !item.isDone, !timer.isFinished() {
            TimelineView(.periodic(from: .now, by: 1.0 / 30.0)) { context in
                timerBackground(progress: timer.progress(at: context.date))
            }
        } else {
            timerBackground(progress: 0)
        }
    }

    private func timerBackground(progress: Double) -> some View {
        ZStack(alignment: .leading) {
            appColors.cardBackground

            appColors.selection.opacity(isFresh ? 0.16 : 0)
                .animation(.easeInOut(duration: 0.45), value: isFresh)

            appColors.positive.opacity(shownDone ? 0.12 : 0)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            if progress > 0 {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        appColors.accent.opacity(shownDone ? 0 : 0.14)
                        appColors.positive.opacity(shownDone ? 0.38 : 0)
                    }
                    .frame(width: max(0, geo.size.width * progress))
                }
            }

            appColors.positive.opacity(glow ? 0.62 : 0)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    @ViewBuilder
    private var interactive: some View {
        if isDeleting {
            visual.modifier(HoldToDelete(
                isEnabled: true,
                deletedLabel: deletedLabel,
                progress: $deleteProgress,
                showDeleted: $showDeleted,
                onCommit: onDelete,
                onQuickTap: onOpen
            ))
        } else {
            visual.modifier(NoteRowGestures(
                onSingleTap: openAfterDelay,
                onDoubleTap: {
                    singleTap?.cancel()
                    UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
                    onToggle()
                },
                onLongPress: {
                    singleTap?.cancel()
                    suppressTap = true
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    onDuration()
                }
            ))
        }
    }

    private var noteText: some View {
        Text(NoteWordText.attributed(item, size: 16))
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundStyle(noteColor)
    }

    private var noteColor: Color {
        let base = shownDone ? appColors.positive : appColors.textPrimary
        return HoldDelete.textColor(base: base, progress: deleteProgress)
    }

    private func openAfterDelay() {
        if suppressTap {
            suppressTap = false
            return
        }
        singleTap?.cancel()
        singleTap = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 170_000_000)
            guard !Task.isCancelled else { return }
            onOpen()
        }
    }

    private func flash() {
        withAnimation(.easeOut(duration: 0.12)) {
            glow = true
        }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 220_000_000)
            withAnimation(.easeInOut(duration: 0.75)) {
                glow = false
            }
        }
    }
}

private struct NoteRowGestures: ViewModifier {
    var onSingleTap: () -> Void
    var onDoubleTap: () -> Void
    var onLongPress: () -> Void

    func body(content: Content) -> some View {
        content
            .onTapGesture(count: 2, perform: onDoubleTap)
            .onTapGesture(count: 1, perform: onSingleTap)
            .onLongPressGesture(minimumDuration: 0.45, perform: onLongPress)
    }
}
