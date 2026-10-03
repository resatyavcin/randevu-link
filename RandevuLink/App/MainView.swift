import SwiftUI

struct MainView: View {
    @EnvironmentObject private var l10n: LocalizationManager
    @EnvironmentObject private var timeZones: TimeZoneStore
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

    var body: some View {
        screen
            .onChange(of: speech.transcript) { _, text in
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
            .onChange(of: deleteModeActive) { _, _ in
                presentModeToast()
            }
            .onChange(of: mode) { _, _ in
                deleteModeActive = false
                stopListeningForDuration()
            }
            .onChange(of: openGroupId) { previous, next in
                if previous != nil, previous != next {
                    stopListeningForDuration()
                }
            }
            .onChange(of: l10n.language) { _, language in
                speech.use(language: language)
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
        }
    }

    private var bar: some View {
        BottomBarView(
            mode: $mode,
            isListening: isListening,
            showsListen: !hidesListen,
            onListen: toggleListening,
            onStamp: stampAction,
            onEnter: enterAction,
            onSample: sampleAction
        )
        .padding(.bottom, 8)
    }

    private var stampAction: (() -> Void)? {
        guard mode == .notes, let groupId = openGroupId, !hidesListen else { return nil }
        return { insertStamp(groupId: groupId) }
    }

    private func insertStamp(groupId: String) {
        let locale = Locale(identifier: l10n.language.localeIdentifier)
        notesViewModel.addItem(groupId: groupId, text: timeZones.stamp(locale: locale))
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

    private func openScheduledGroup(_ id: String) {
        deleteModeActive = false
        notesViewModel.groupToOpen = id
        mode = .notes
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
        if isListening {
            let text = speech.stop()
            isListening = false
            if !deleteModeActive {
                toast.dismiss()
            }
            notesViewModel.finishSpeech(text, openGroupId: openGroupId)
            return
        }
        guard !isStarting else { return }
        let redirects = openGroupId == nil
        var transaction = Transaction(animation: nil)
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            deleteModeActive = false
            if redirects {
                mode = .notes
                notesViewModel.focusMostRecentGroup()
            }
            isStarting = true
        }
        Task { @MainActor in
            if redirects {
                await Task.yield()
            }
            await beginListening()
        }
    }

    private func beginListening() async {
        defer { isStarting = false }
        do {
            try await speech.start()
            isListening = true
            toast.showPinned(l10n(.commonListening))
        } catch {
            isListening = false
            speech.stop()
            toast.show(l10n(.commonListenFailed))
        }
    }

    private func presentModeToast() {
        if deleteModeActive {
            stopListeningForDuration()
            toast.showPinned(l10n(.notesDeleteMode))
        } else if isListening {
            toast.updatePinned(currentListeningText())
        } else {
            toast.dismiss()
        }
    }

    private func stopListeningForDuration() {
        guard isListening else { return }
        _ = speech.stop()
        isListening = false
        if !deleteModeActive {
            toast.dismiss()
        }
    }

    private func insertSample() {
        let sample = "Lorem ipsum dolor si"
        notesViewModel.addSpokenLine(sample, openGroupId: openGroupId)
    }

    private func commitLine() {
        deleteModeActive = false
        let text = speech.consumeTranscript()
        guard !text.isEmpty else { return }
        notesViewModel.addSpokenLine(text, openGroupId: openGroupId)
        restoreListeningToast()
    }

}
