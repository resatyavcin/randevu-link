import SwiftUI

struct ProfileView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @ObservedObject var viewModel: ProfileViewModel
    @ObservedObject var notes: NotesListViewModel
    @Binding var isDarkMode: Bool
    var onOpenGroup: (String) -> Void = { _ in }

    var body: some View {
        ZStack {
            appColors.background
                .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.sectionGap) {
                    if let profile = viewModel.profile {
                        TimelineView(.periodic(from: .now, by: 1)) { context in
                            let schedule = scheduledNotes(at: context.date)
                            VStack(alignment: .leading, spacing: AppSpacing.sectionGap) {
                                GreetingHeaderView(
                                    greeting: String(format: l10n(.profileGreeting), profile.greeting),
                                    subtitle: schedule.today.isEmpty ? l10n(.profileSubtitle) : ""
                                )
                                .padding(.bottom, AppSpacing.headerToSections - AppSpacing.sectionGap)

                                dueSection(
                                    title: l10n(.profileDueToday),
                                    notes: schedule.today,
                                    showsBadge: true
                                )
                                dueSection(
                                    title: l10n(.profileDueTomorrow),
                                    notes: schedule.tomorrow,
                                    showsBadge: false
                                )
                                dueSection(
                                    title: l10n(.profileDueLater),
                                    notes: schedule.later,
                                    showsBadge: false
                                )
                            }
                        }

                        AppearanceSectionView(isDarkMode: $isDarkMode)
                        LanguageSectionView()
                    }
                }
                .padding(.horizontal, AppSpacing.screenHorizontal)
                .padding(.bottom, AppSpacing.bottomBarInset)
            }
            .screenScroll()
        }
        .onAppear {
            viewModel.load()
            notes.load()
        }
    }

    @ViewBuilder
    private func dueSection(title: String, notes: [ScheduledNote], showsBadge: Bool) -> some View {
        if !notes.isEmpty {
            VStack(alignment: .leading, spacing: AppSpacing.sectionToCard) {
                SectionHeaderView(title: title, count: notes.count, showsBadge: showsBadge)

                VStack(spacing: AppSpacing.rowGap) {
                    ForEach(notes) { note in
                        Button {
                            onOpenGroup(note.groupId)
                        } label: {
                            ProfileRowCard(title: note.title, source: note.source)
                                .background(appColors.cardBackground)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
            }
        }
    }

    private func scheduledNotes(at date: Date) -> DueSchedule {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: date)
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: start) ?? start
        let dayAfter = calendar.date(byAdding: .day, value: 2, to: start) ?? tomorrow
        var schedule = DueSchedule()

        for group in notes.groups {
            let source = group.title.isEmpty ? l10n(.notesGroupNew) : group.title
            for item in group.items {
                guard !item.isDone, let timer = item.timer, !timer.isFinished(at: date) else { continue }
                let endsAt = timer.startedAt.addingTimeInterval(timer.durationSeconds)
                let note = ScheduledNote(
                    id: item.id,
                    groupId: group.id,
                    title: item.text,
                    source: source,
                    endsAt: endsAt
                )
                if endsAt >= dayAfter {
                    schedule.later.append(note)
                } else if endsAt >= tomorrow {
                    schedule.tomorrow.append(note)
                } else {
                    schedule.today.append(note)
                }
            }
        }

        schedule.today.sort { $0.endsAt < $1.endsAt }
        schedule.tomorrow.sort { $0.endsAt < $1.endsAt }
        schedule.later.sort { $0.endsAt < $1.endsAt }
        return schedule
    }
}

private struct ScheduledNote: Identifiable {
    let id: String
    let groupId: String
    let title: String
    let source: String
    let endsAt: Date
}

private struct DueSchedule {
    var today: [ScheduledNote] = []
    var tomorrow: [ScheduledNote] = []
    var later: [ScheduledNote] = []
}

#Preview {
    let container = AppContainer()
    ProfileView(
        viewModel: container.makeProfileViewModel(),
        notes: container.makeNotesListViewModel(),
        isDarkMode: .constant(false)
    )
    .environmentObject(LocalizationManager())
}
