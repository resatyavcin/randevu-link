import SwiftUI

struct MainView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @EnvironmentObject private var toast: ToastCenter
    @ObservedObject var profileViewModel: ProfileViewModel
    @ObservedObject var notesViewModel: NotesListViewModel
    @Binding var isDarkMode: Bool
    @StateObject private var speech = SpeechListener()
    @State private var mode: BottomBarMode = .notes
    @State private var isListening = false
    @State private var isStarting = false
    @State private var openGroupId: String?
    @State private var hidesListen = false
    @State private var deleteModeActive = false
    @State private var isNamingGroup = false
    @State private var namingGroupId: String?

    var body: some View {
        screen
            .onChange(of: speech.transcript) { _, text in
                if isNamingGroup {
                    applyGroupName(text)
                }
                updateListeningToast(text)
            }
            .onChange(of: hidesListen) { _, _ in
                stopListeningForDuration()
            }
            .onChange(of: speech.failed) { _, failed in
                guard failed else { return }
                isListening = false
                toast.show(l10n(.commonListenFailed))
            }
            .onChange(of: deleteModeActive) { _, active in
                if active {
                    stopListeningForDuration()
                    toast.showPinned(l10n(.notesDeleteMode))
                } else if isListening {
                    toast.updatePinned(currentListeningText())
                } else {
                    toast.dismiss()
                }
            }
            .onChange(of: mode) { _, _ in
                deleteModeActive = false
                cancelNaming()
                stopListeningForDuration()
            }
            .onChange(of: openGroupId) { previous, next in
                if previous != nil, previous != next {
                    stopListeningForDuration()
                }
            }
    }

    private var screen: some View {
        ZStack(alignment: .bottom) {
            pages
            ToastHost(toast: toast)
            bar
        }
    }

    @ViewBuilder
    private var pages: some View {
        switch mode {
        case .focus:
            ProfileView(
                viewModel: profileViewModel,
                notes: notesViewModel,
                isDarkMode: $isDarkMode,
                onOpenGroup: openScheduledGroup
            )
        case .notes:
            NotesListView(
                viewModel: notesViewModel,
                openGroupId: $openGroupId,
                hidesListen: $hidesListen,
                deleteModeActive: $deleteModeActive,
                onBeginDuration: stopListeningForDuration
            )
        case .daily:
            DailyView(
                viewModel: notesViewModel,
                hidesListen: $hidesListen,
                deleteModeActive: $deleteModeActive,
                onBeginDuration: stopListeningForDuration
            )
        }
    }

    private var bar: some View {
        BottomBarView(
            mode: $mode,
            isListening: isListening,
            showsListen: !hidesListen,
            onListen: toggleListening,
            onEnter: enterAction,
            onSample: sampleAction,
            onAdd: addAction
        )
        .padding(.bottom, 8)
        .background {
            appColors.background
                .ignoresSafeArea(edges: .bottom)
        }
    }

    private var addAction: (() -> Void)? {
        guard showAdd else { return nil }
        return beginGroup
    }

    private var enterAction: (() -> Void)? {
        guard isListening else { return nil }
        return { commitLine() }
    }

    private var sampleAction: (() -> Void)? {
        let onNotesList = mode == .notes && openGroupId == nil
        guard isListening, !onNotesList else { return nil }
        return insertSample
    }

    private var showAdd: Bool {
        mode == .notes && openGroupId == nil && !isListening
    }

    private func openScheduledGroup(_ id: String) {
        deleteModeActive = false
        notesViewModel.groupToOpen = id
        mode = .notes
    }

    private func beginGroup() {
        deleteModeActive = false
        mode = .notes
        if isListening {
            let text = speech.stop()
            isListening = false
            if !deleteModeActive {
                toast.dismiss()
            }
            if isNamingGroup {
                finishNaming(with: text)
            } else {
                notesViewModel.finishSpeech(text, openGroupId: openGroupId)
            }
            return
        }
        isNamingGroup = true
        namingGroupId = nil
        startListening()
    }

    private func applyGroupName(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if let namingGroupId {
            notesViewModel.rename(groupId: namingGroupId, title: trimmed)
        } else {
            namingGroupId = notesViewModel.createGroup(title: trimmed)
        }
    }

    private func finishNaming(with text: String) {
        applyGroupName(text)
        isNamingGroup = false
        namingGroupId = nil
    }

    private func cancelNaming() {
        guard isNamingGroup else { return }
        isNamingGroup = false
        namingGroupId = nil
        guard isListening else { return }
        _ = speech.stop()
        isListening = false
        toast.dismiss()
    }

    private func currentListeningText() -> String {
        let trimmed = speech.transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? l10n(.commonListening) : trimmed
    }

    private func updateListeningToast(_ text: String) {
        guard isListening, !deleteModeActive else { return }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        toast.updatePinned(trimmed.isEmpty ? l10n(.commonListening) : trimmed)
    }

    private func restoreListeningToast() {
        guard isListening, !deleteModeActive else { return }
        toast.updatePinned(l10n(.commonListening))
    }

    private func toggleListening() {
        deleteModeActive = false
        if isListening {
            let text = speech.stop()
            isListening = false
            if !deleteModeActive {
                toast.dismiss()
            }
            if isNamingGroup {
                finishNaming(with: text)
            } else if mode == .daily {
                notesViewModel.finishDailySpeech(text)
            } else {
                notesViewModel.finishSpeech(text, openGroupId: openGroupId)
            }
            return
        }
        guard !isStarting else { return }
        if mode != .daily, openGroupId == nil {
            mode = .notes
            notesViewModel.focusMostRecentGroup()
        }
        startListening()
    }

    private func startListening() {
        guard !isStarting else { return }
        isStarting = true
        Task {
            defer { isStarting = false }
            do {
                try await speech.start()
                isListening = true
                toast.showPinned(l10n(.commonListening))
            } catch {
                isListening = false
                isNamingGroup = false
                namingGroupId = nil
                speech.stop()
                toast.show(l10n(.commonListenFailed))
            }
        }
    }

    private func stopListeningForDuration() {
        guard isListening else { return }
        let text = speech.stop()
        isListening = false
        if isNamingGroup {
            finishNaming(with: text)
        }
        if !deleteModeActive {
            toast.dismiss()
        }
    }

    private func insertSample() {
        let sample = "Lorem ipsum dolor si"
        if isNamingGroup {
            applyGroupName(sample)
            return
        }
        if mode == .daily {
            notesViewModel.addDailyLine(sample)
        } else {
            notesViewModel.addSpokenLine(sample, openGroupId: openGroupId)
        }
    }

    private func commitLine() {
        deleteModeActive = false
        let text = speech.consumeTranscript()
        guard !text.isEmpty else { return }
        if isNamingGroup {
            finishNaming(with: text)
            _ = speech.stop()
            isListening = false
            toast.dismiss()
            return
        }
        if mode == .daily {
            notesViewModel.addDailyLine(text)
        } else {
            notesViewModel.addSpokenLine(text, openGroupId: openGroupId)
        }
        restoreListeningToast()
    }

}
