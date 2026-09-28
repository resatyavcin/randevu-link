import SwiftUI

private enum DailyRoute: Hashable {
    case editor(String)
}

struct DailyView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @ObservedObject var viewModel: NotesListViewModel
    @Binding var hidesListen: Bool
    @Binding var deleteModeActive: Bool
    var onBeginDuration: () -> Void = {}

    @State private var path = NavigationPath()
    @State private var selectedDay = DayKey.id(for: Date())
    @State private var visibleMonth = Calendar.current.date(
        from: Calendar.current.dateComponents([.year, .month], from: Date())
    ) ?? Date()
    @State private var isDeleting = false
    @State private var durationItem: NoteItem?

    private let gap: CGFloat = 6

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                appColors.background
                    .ignoresSafeArea()

                VStack(alignment: .leading, spacing: 14) {
                    header
                        .padding(.horizontal, AppSpacing.screenHorizontal)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 14) {
                            heatmap
                            dayHeading
                            notesBlock
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, AppSpacing.screenHorizontal)
                        .padding(.top, 4)
                        .padding(.bottom, AppSpacing.bottomBarInset)
                    }
                    .screenScroll()
                    .edgeFade(top: 10)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .padding(.top, AppSpacing.greetingTop)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: DailyRoute.self) { route in
                switch route {
                case .editor(let itemId):
                    NoteItemEditorView(store: viewModel, groupId: selectedDay, itemId: itemId)
                }
            }
        }
        .onAppear {
            viewModel.load()
            hidesListen = path.count > 0
        }
        .onDisappear {
            hidesListen = false
            isDeleting = false
            deleteModeActive = false
        }
        .onChange(of: path.count) { _, count in
            hidesListen = count > 0
        }
        .onChange(of: isDeleting) { _, deleting in
            guard deleteModeActive != deleting else { return }
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) {
                deleteModeActive = deleting
            }
        }
        .onChange(of: deleteModeActive) { _, active in
            if !active { isDeleting = false }
        }
        .onChange(of: todayCount) { old, new in
            guard new > old else { return }
            selectedDay = DayKey.id(for: Date())
            visibleMonth = monthStart(Date())
        }
        .sheet(item: $durationItem) { item in
            DurationKeypadSheet(noteText: item.text) { seconds in
                viewModel.startTimer(groupId: selectedDay, itemId: item.id, seconds: seconds)
            }
            .environmentObject(l10n)
            .presentationDetents([.height(280)])
            .presentationDragIndicator(.hidden)
        }
    }

    private var todayCount: Int {
        viewModel.dayGroups.first { $0.id == DayKey.id(for: Date()) }?.items.count ?? 0
    }

    private var items: [NoteItem] {
        viewModel.dayGroups.first { $0.id == selectedDay }?.items ?? []
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            Text(l10n(.dailyTitle))
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(appColors.textPrimary)
                .lineLimit(1)
            Spacer(minLength: 8)
            if isDeleting || !items.isEmpty {
                SelectionBar(
                    isDeleting: isDeleting,
                    deleteTitle: l10n(.commonDelete),
                    cancelTitle: l10n(.commonCancel),
                    onDelete: { isDeleting = true },
                    onCancel: { isDeleting = false }
                )
            }
        }
        .frame(minHeight: 40)
    }

    private var dayHeading: some View {
        Text(dayTitle(selectedDay))
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(appColors.textPrimary)
    }

    @ViewBuilder
    private var notesBlock: some View {
        if items.isEmpty {
            Text(l10n(.dailyEmpty))
                .font(AppTypography.subtitle)
                .foregroundStyle(appColors.textSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            VStack(spacing: AppSpacing.rowGap) {
                ForEach(items) { item in
                    NoteItemRow(
                        item: item,
                        isFresh: viewModel.freshItemId == item.id,
                        doneHint: l10n(.notesDetailItemDone),
                        durationHint: l10n(.notesDurationHint),
                        deletedLabel: l10n(.notesDeleted),
                        finishedItemIDs: viewModel.finishedItemIDs,
                        isDeleting: isDeleting,
                        onToggle: { viewModel.toggleDone(groupId: selectedDay, itemId: item.id) },
                        onDuration: {
                            onBeginDuration()
                            durationItem = item
                        },
                        onDelete: { deleteItem(item.id) },
                        onOpen: {
                            if isDeleting { isDeleting = false }
                            path.append(DailyRoute.editor(item.id))
                        }
                    )
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
        }
    }

    private func deleteItem(_ id: String) {
        withAnimation(.easeInOut(duration: 0.28)) {
            viewModel.deleteItem(groupId: selectedDay, itemId: id)
        }
        if viewModel.dayGroups.first(where: { $0.id == selectedDay })?.items.isEmpty ?? true {
            isDeleting = false
        }
    }

    private func dayTitle(_ id: String) -> String {
        guard let date = DayKey.date(from: id) else { return id }
        return RelativeDay.title(
            for: date,
            locale: Locale(identifier: l10n.language.localeIdentifier),
            today: l10n(.dailyToday),
            yesterday: l10n(.dailyYesterday),
            tomorrow: l10n(.dailyTomorrow)
        )
    }

    private var heatmap: some View {
        VStack(alignment: .leading, spacing: 10) {
            monthBar
            weekdayHeader
            VStack(spacing: gap) {
                ForEach(monthRows) { row in
                    HStack(spacing: gap) {
                        ForEach(row.slots) { slot in
                            slotCell(slot)
                        }
                    }
                }
            }
            .animation(.easeInOut(duration: 0.2), value: visibleMonth)
            legend
        }
    }

    private var monthBar: some View {
        HStack(spacing: 8) {
            monthButton(systemName: "chevron.left", enabled: true) {
                shiftMonth(by: -1)
            }
            Spacer(minLength: 0)
            Text(monthTitle)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(appColors.textPrimary)
            Spacer(minLength: 0)
            monthButton(systemName: "chevron.right", enabled: !isCurrentMonth) {
                shiftMonth(by: 1)
            }
        }
    }

    private func monthButton(systemName: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(appColors.textPrimary.opacity(enabled ? 1 : 0.28))
                .frame(width: 36, height: 36)
                .background(appColors.controlBackground)
                .clipShape(Circle())
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
    }

    private var weekdayHeader: some View {
        let symbols = mondayCalendar.shortWeekdaySymbols
        return HStack(spacing: gap) {
            ForEach(0..<7, id: \.self) { row in
                Text(symbols[(row + 1) % 7])
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(appColors.textSecondary)
                    .frame(maxWidth: .infinity)
            }
        }
    }

    @ViewBuilder
    private func slotCell(_ slot: MonthSlot) -> some View {
        switch slot {
        case .blank:
            Color.clear
                .aspectRatio(1, contentMode: .fit)
        case .day(let day):
            Button {
                selectedDay = day.id
            } label: {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(fill(day.count).opacity(day.isFuture ? 0.45 : 1))
                    .aspectRatio(1, contentMode: .fit)
                    .overlay {
                        if day.id == selectedDay {
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .strokeBorder(appColors.textPrimary, lineWidth: 1.5)
                        }
                    }
            }
            .buttonStyle(.plain)
            .accessibilityLabel(dayTitle(day.id))
        }
    }

    private var legend: some View {
        HStack(spacing: 4) {
            Spacer(minLength: 0)
            Text(l10n(.dailyLess))
            ForEach(0..<5, id: \.self) { level in
                RoundedRectangle(cornerRadius: 3, style: .continuous)
                    .fill(fill(level))
                    .frame(width: 12, height: 12)
            }
            Text(l10n(.dailyMore))
        }
        .font(.system(size: 11, weight: .medium))
        .foregroundStyle(appColors.textSecondary)
    }

    private func fill(_ count: Int) -> Color {
        switch count {
        case ..<1: return appColors.controlBackground
        case 1: return appColors.textPrimary.opacity(0.28)
        case 2: return appColors.textPrimary.opacity(0.48)
        case 3: return appColors.textPrimary.opacity(0.7)
        default: return appColors.textPrimary
        }
    }

    private var mondayCalendar: Calendar {
        var calendar = Calendar.current
        calendar.locale = Locale(identifier: l10n.language.localeIdentifier)
        calendar.firstWeekday = 2
        return calendar
    }

    private var monthTitle: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: l10n.language.localeIdentifier)
        formatter.setLocalizedDateFormatFromTemplate("LLLL yyyy")
        return formatter.string(from: visibleMonth)
    }

    private var isCurrentMonth: Bool {
        mondayCalendar.isDate(visibleMonth, equalTo: Date(), toGranularity: .month)
    }

    private func monthStart(_ date: Date) -> Date {
        let calendar = mondayCalendar
        return calendar.date(from: calendar.dateComponents([.year, .month], from: date)) ?? date
    }

    private func shiftMonth(by value: Int) {
        let calendar = mondayCalendar
        guard let next = calendar.date(byAdding: .month, value: value, to: visibleMonth) else { return }
        if value > 0, next > monthStart(Date()) { return }
        visibleMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: next)) ?? next
    }

    private var monthRows: [MonthRow] {
        let calendar = mondayCalendar
        let start = monthStart(visibleMonth)
        guard let dayRange = calendar.range(of: .day, in: .month, for: start) else { return [] }
        let weekday = calendar.component(.weekday, from: start)
        let leading = (weekday + 5) % 7
        let today = calendar.startOfDay(for: Date())
        let counts = Dictionary(uniqueKeysWithValues: viewModel.dayGroups.map { ($0.id, $0.items.count) })

        var slots: [MonthSlot] = (0..<leading).map { MonthSlot.blank($0) }
        for day in dayRange {
            guard let date = calendar.date(byAdding: .day, value: day - 1, to: start) else { continue }
            let id = DayKey.id(for: date, calendar: calendar)
            slots.append(.day(HeatDay(
                id: id,
                date: date,
                count: counts[id] ?? 0,
                isFuture: calendar.startOfDay(for: date) > today
            )))
        }
        let remainder = slots.count % 7
        if remainder != 0 {
            slots.append(contentsOf: (0..<(7 - remainder)).map { MonthSlot.blank(leading + 40 + $0) })
        }
        return stride(from: 0, to: slots.count, by: 7).map { index in
            MonthRow(id: index, slots: Array(slots[index..<min(index + 7, slots.count)]))
        }
    }
}

private struct MonthRow: Identifiable {
    let id: Int
    let slots: [MonthSlot]
}

private enum MonthSlot: Identifiable {
    case blank(Int)
    case day(HeatDay)

    var id: String {
        switch self {
        case .blank(let index):
            return "blank-\(index)"
        case .day(let day):
            return day.id
        }
    }
}

private struct HeatDay: Identifiable {
    let id: String
    let date: Date
    let count: Int
    let isFuture: Bool
}
