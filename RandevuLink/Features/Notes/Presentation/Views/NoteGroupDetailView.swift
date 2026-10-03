import SwiftUI
import UIKit

struct NoteGroupDetailView: View {
    @Environment(\.appColors) private var appColors
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject private var l10n: LocalizationManager
    @ObservedObject var store: NotesListViewModel
    @StateObject private var viewModel: NoteGroupDetailViewModel
    @Binding var isDeleting: Bool
    var onBeginDuration: () -> Void = {}
    var onOpenItem: (String) -> Void = { _ in }
    var onBack: () -> Void = {}

    @State private var title = ""
    @State private var pinnedHeight: CGFloat = 96
    @State private var durationItem: NoteItem?
    @State private var renameTask: Task<Void, Never>?
    @FocusState private var titleFocused: Bool

    init(
        store: NotesListViewModel,
        groupId: String,
        isDeleting: Binding<Bool>,
        onBeginDuration: @escaping () -> Void,
        onOpenItem: @escaping (String) -> Void,
        onBack: @escaping () -> Void = {}
    ) {
        self.store = store
        self.onBeginDuration = onBeginDuration
        self.onOpenItem = onOpenItem
        self.onBack = onBack
        _isDeleting = isDeleting
        _viewModel = StateObject(wrappedValue: NoteGroupDetailViewModel(groupId: groupId, store: store))
    }

    private var group: NoteGroup? {
        store.group(id: viewModel.groupId)
    }

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        ZStack(alignment: .top) {
            appColors.background
                .ignoresSafeArea()

            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        titleField
                        if group?.isTodoList == true {
                            sinkRow
                        }
                        ForEach(itemSections) { section in
                            VStack(alignment: .leading, spacing: 10) {
                                Text(section.title)
                                    .font(.system(size: 17, weight: .semibold))
                                    .foregroundStyle(appColors.textPrimary)
                                    .transition(.opacity)
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
                                            blinkTint: showsTheme ? item.blinkColor?.tint(isDark: isDark) : nil,
                                            showsTheme: showsTheme,
                                            allowsCompletion: group?.isTodoList == true,
                                            onToggle: { toggleItem(item.id) },
                                            onDuration: {
                                                onBeginDuration()
                                                durationItem = item
                                            },
                                            onDelete: { deleteItem(item.id) },
                                            onOpen: {
                                                if isDeleting {
                                                    endModes()
                                                }
                                                onOpenItem(item.id)
                                            }
                                        )
                                        .noteArrival(from: .action, isFresh: store.freshItemId == item.id)
                                    }
                                }
                                .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
                                .animation(NoteMotion.settle, value: section.items.map(\.id))
                            }
                        }
                    }
                    .padding(.horizontal, AppSpacing.screenHorizontal)
                    .padding(.top, pinnedHeight + 8)
                    .padding(.bottom, AppSpacing.bottomBarInset)
                }
                .screenScroll()
                .scrollDismissesKeyboard(.interactively)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .onChange(of: store.freshItemId) { _, id in
                    guard let id, group?.items.contains(where: { $0.id == id }) == true else { return }
                    withAnimation(NoteMotion.settle) {
                        proxy.scrollTo(id, anchor: UnitPoint(x: 0.5, y: 0.16))
                    }
                }
            }

            statusScrim
            pinnedHeader
        }
        .background {
            PopGestureEnabler()
                .frame(width: 0, height: 0)
        }
        .toolbar(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden(true)
        .onDisappear {
            let latest = title
            renameTask?.cancel()
            endModes()
            Task { @MainActor in
                viewModel.rename(title: latest)
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

    private func endModes() {
        isDeleting = false
    }

    private var showsTheme: Bool {
        group?.isTodoList != true
    }

    private var itemSections: [DayBucket<NoteItem>] {
        guard let group else { return [] }
        return DayBuckets.group(displayItems(group), date: \.createdAt, title: dayTitle)
    }

    private func displayItems(_ group: NoteGroup) -> [NoteItem] {
        guard group.isTodoList, group.sinkCompleted else { return group.items }
        return group.items.sorted { lhs, rhs in
            let leftDay = DayKey.id(for: lhs.createdAt)
            let rightDay = DayKey.id(for: rhs.createdAt)
            if leftDay != rightDay { return leftDay > rightDay }
            if lhs.isDone != rhs.isDone { return !lhs.isDone }
            if lhs.isDone {
                let left = lhs.completedAt ?? lhs.createdAt
                let right = rhs.completedAt ?? rhs.createdAt
                if left != right { return left < right }
                return lhs.id < rhs.id
            }
            if lhs.createdAt != rhs.createdAt { return lhs.createdAt > rhs.createdAt }
            return lhs.id > rhs.id
        }
    }

    private func toggleItem(_ id: String) {
        guard group?.isTodoList == true else { return }
        withAnimation(.easeInOut(duration: 0.28)) {
            viewModel.toggleDone(itemId: id)
        }
    }

    private var sinkRow: some View {
        let isOn = group?.sinkCompleted ?? false
        return Button {
            withAnimation(.easeInOut(duration: 0.28)) {
                viewModel.setSinkCompleted(!isOn)
            }
        } label: {
            HStack(spacing: 12) {
                Text(l10n(.notesGroupSinkCompleted))
                    .font(AppTypography.rowTitle)
                    .foregroundStyle(appColors.textPrimary)
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 8)
                AppSwitch(isOn: .constant(isOn))
            }
            .padding(.horizontal, AppSpacing.rowHorizontal)
            .padding(.vertical, 10)
            .background(appColors.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
            .contentShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(isDeleting)
        .accessibilityLabel(l10n(.notesGroupSinkCompleted))
        .accessibilityAddTraits(.isToggle)
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
            endModes()
        }
    }

    private var statusScrim: some View {
        LinearGradient(
            stops: [
                .init(color: appColors.background, location: 0),
                .init(color: appColors.background.opacity(0.85), location: 0.55),
                .init(color: appColors.background.opacity(0), location: 1)
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .frame(height: 64)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .ignoresSafeArea(edges: .top)
        .allowsHitTesting(false)
    }

    private var pinnedHeader: some View {
        header
            .padding(.horizontal, AppSpacing.screenHorizontal)
            .padding(.top, 4)
            .padding(.bottom, 4)
            .frame(maxWidth: .infinity, alignment: .leading)
            .onGeometryChange(for: CGFloat.self) { proxy in
                proxy.size.height
            } action: { height in
                guard abs(pinnedHeight - height) > 0.5 else { return }
                pinnedHeight = height
            }
    }

    private var titleField: some View {
        TextField(l10n(.notesGroupNew), text: $title, axis: .vertical)
            .font(.system(size: 28, weight: .bold))
            .foregroundStyle(appColors.textPrimary)
            .tint(appColors.textPrimary)
            .background(FieldCaretTint(color: UIColor(appColors.textPrimary)))
            .lineLimit(1...6)
            .focused($titleFocused)
            .submitLabel(.done)
            .disabled(isDeleting)
            .frame(maxWidth: .infinity, alignment: .leading)
            .onSubmit(flushRename)
            .onChange(of: title) { _, newTitle in
                let singleLine = newTitle.replacingOccurrences(of: "\n", with: " ")
                if singleLine != newTitle {
                    title = singleLine
                    return
                }
                scheduleRename(singleLine)
            }
    }

    private func scheduleRename(_ value: String) {
        renameTask?.cancel()
        renameTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 350_000_000)
            guard !Task.isCancelled else { return }
            viewModel.rename(title: value, reflectInList: false)
        }
    }

    private func flushRename() {
        renameTask?.cancel()
        renameTask = nil
        viewModel.rename(title: title)
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 8) {
            Button(action: onBack) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(appColors.textPrimary)
                    .frame(width: 44, height: 44)
                    .contentShape(Circle())
                    .modifier(JoinedGlass(circle: true, interactive: false))
            }
            .buttonStyle(.plain)
            .accessibilityLabel(l10n(.commonBack))

            Spacer(minLength: 8)

            trailingControls
        }
    }

    private var showsMore: Bool {
        isDeleting || !(group?.items.isEmpty ?? true)
    }

    private var trailingControls: some View {
        HStack(spacing: 0) {
            Button {
                viewModel.setPinned(!(group?.isPinned ?? false))
            } label: {
                Image(systemName: (group?.isPinned ?? false) ? "pin.fill" : "pin")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(appColors.textPrimary)
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(l10n((group?.isPinned ?? false) ? .notesUnpin : .notesPin))

            if showsMore {
                moreMenu
            }
        }
        .background {
            Color.clear
                .modifier(JoinedGlass(circle: !showsMore, interactive: false))
                .allowsHitTesting(false)
        }
    }

    private var moreMenu: some View {
        Menu {
            if isDeleting {
                Button(l10n(.commonCancel), action: endModes)
            } else {
                Button(l10n(.commonDelete), role: .destructive, action: beginDelete)
            }
        } label: {
            Image(systemName: "ellipsis")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(appColors.textPrimary)
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(l10n(.notesMore))
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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let item: NoteItem
    var isFresh = false
    let doneHint: String
    let durationHint: String
    let deletedLabel: String
    let finishedItemIDs: [String]
    var isDeleting: Bool
    var blinkTint: Color? = nil
    var showsTheme = true
    var allowsCompletion = false
    var onToggle: () -> Void
    var onDuration: () -> Void
    var onDelete: () -> Void
    var onOpen: () -> Void

    @State private var glow = false
    @State private var shownDone = false
    @State private var deleteProgress: CGFloat = 0
    @State private var showDeleted = false

    private var ratingMarks: [(index: Int, half: Bool)] {
        guard item.rating > 0 else { return [] }
        let full = Int(item.rating)
        let hasHalf = item.rating - Double(full) >= 0.5
        var marks: [(index: Int, half: Bool)] = (0..<full).map { ($0, false) }
        if hasHalf {
            marks.append((full, true))
        }
        return marks
    }

    private var marksDone: Bool {
        allowsCompletion && item.isDone
    }

    var body: some View {
        accessible
            .onAppear {
                shownDone = marksDone
            }
            .onChange(of: item.isDone) { _, done in
                withAnimation(.easeInOut(duration: 0.4)) {
                    shownDone = allowsCompletion && done
                }
            }
            .onChange(of: isDeleting) { _, deleting in
                guard !deleting else { return }
                deleteProgress = 0
                showDeleted = false
            }
            .onChange(of: finishedItemIDs) { _, ids in
                guard ids.contains(item.id) else { return }
                flash()
            }
    }

    @ViewBuilder
    private var accessible: some View {
        if allowsCompletion {
            interactive
                .accessibilityElement(children: .combine)
                .accessibilityHint(item.isDone ? doneHint : durationHint)
                .accessibilityAction(named: Text(doneHint)) {
                    guard !isDeleting else { return }
                    onToggle()
                }
        } else {
            interactive
                .accessibilityElement(children: .combine)
                .accessibilityHint(durationHint)
        }
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
                .padding(.leading, AppSpacing.rowHorizontal)
                .padding(.trailing, ratingMarks.isEmpty ? AppSpacing.rowHorizontal : 12 + CGFloat(ratingMarks.count) * 12)
                .padding(.top, AppSpacing.rowVertical)
                .padding(.bottom, ratingMarks.isEmpty ? AppSpacing.rowVertical : 22)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .bottomTrailing) {
            if !ratingMarks.isEmpty, !showDeleted {
                HStack(spacing: 2) {
                    ForEach(ratingMarks, id: \.index) { mark in
                        NoteThemeStar(color: showsTheme ? item.blinkColor : nil, size: 10, half: mark.half)
                    }
                }
                .padding(.trailing, 10)
                .padding(.bottom, 7)
            }
        }
        .scaleEffect(glow ? 1.015 : 1)
        .contentShape(Rectangle())
    }

    @ViewBuilder
    private var timerLayer: some View {
        if let timer = item.timer, !marksDone, !timer.isFinished() {
            TimelineView(.periodic(from: .now, by: 1)) { context in
                timerBackground(progress: timer.progress(at: context.date))
            }
        } else {
            timerBackground(progress: 0)
        }
    }

    private func timerBackground(progress: Double) -> some View {
        ZStack(alignment: .leading) {
            appColors.cardBackground

            if showsTheme, let blinkTint {
                ThemePulseTint(color: blinkTint, reduceMotion: reduceMotion)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

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
            visual.modifier(SwipeToComplete(
                isEnabled: true,
                completes: allowsCompletion,
                isDone: item.isDone,
                onCommit: onToggle,
                onTap: onOpen,
                onLongPress: {
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

private struct FieldCaretTint: UIViewRepresentable {
    var color: UIColor

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.isUserInteractionEnabled = false
        view.backgroundColor = .clear
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        guard context.coordinator.applied?.isEqual(color) != true else { return }
        context.coordinator.applied = color
        DispatchQueue.main.async {
            guard let root = uiView.superview else { return }
            apply(color, in: root)
        }
    }

    final class Coordinator {
        var applied: UIColor?
    }

    private func apply(_ color: UIColor, in view: UIView) {
        if let textView = view as? UITextView {
            textView.tintColor = color
        }
        for subview in view.subviews {
            apply(color, in: subview)
        }
    }
}

private struct ThemePulseTint: UIViewRepresentable {
    var color: Color
    var reduceMotion: Bool

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.isUserInteractionEnabled = false
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        uiView.backgroundColor = UIColor(color)
        let key = "theme-pulse"
        if reduceMotion {
            uiView.layer.removeAnimation(forKey: key)
            uiView.alpha = 0.14
            return
        }
        uiView.alpha = 1
        guard uiView.layer.animation(forKey: key) == nil else { return }
        let animation = CABasicAnimation(keyPath: "opacity")
        animation.fromValue = 0.10
        animation.toValue = 0.26
        animation.duration = 0.9
        animation.autoreverses = true
        animation.repeatCount = .infinity
        animation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        uiView.layer.add(animation, forKey: key)
    }
}

