import AVFoundation
import Speech

enum SpeechListenerError: Error, Sendable {
    case denied
    case unavailable
}

@MainActor
final class SpeechListener: ObservableObject {
    @Published private(set) var transcript = ""
    @Published private(set) var failed = false

    private var recognizer: SFSpeechRecognizer?

    init(language: AppLanguage = .stored) {
        recognizer = SFSpeechRecognizer(locale: language.speechLocale)
    }

    func use(language: AppLanguage) {
        let locale = language.speechLocale
        guard recognizer?.locale.identifier(.bcp47) != locale.identifier(.bcp47) else { return }
        recognizer = SFSpeechRecognizer(locale: locale)
        guard isListening else { return }
        if recognizer?.isAvailable == true {
            startRecognition()
        } else {
            stop()
            failed = true
        }
    }

    private let capture = Capture()
    private let feed = AudioFeed()
    private var task: SFSpeechRecognitionTask?
    private var isListening = false
    private var generation = 0
    private var committed = ""
    private var partial = ""
    private var heardInTask = false
    private var failureCount = 0

    func start() async throws {
        guard !isListening else { return }
        if failed {
            failed = false
        }
        guard await Self.requestPermissions() else { throw SpeechListenerError.denied }
        guard let recognizer, recognizer.isAvailable else { throw SpeechListenerError.unavailable }

        // Session and engine startup block for a long time. Keep that off the
        // main thread so a Listen redirect can render before recognition begins.
        try await capture.activate(feed: feed)
        await Task.yield()

        isListening = true
        failureCount = 0
        clearText()
        startRecognition()
    }

    func consumeTranscript() -> String {
        let text = Self.join(committed, partial)
        clearText()
        if isListening {
            startRecognition()
        }
        return text
    }

    @discardableResult
    func stop() -> String {
        let text = Self.join(committed, partial)
        guard isListening else { return text }
        isListening = false
        generation += 1
        task?.cancel()
        task = nil
        feed.finish()
        capture.deactivate()
        clearText()
        return text
    }

    private func startRecognition() {
        guard isListening, let recognizer else { return }
        generation += 1
        let token = generation
        task?.cancel()
        heardInTask = false

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        request.taskHint = .dictation
        request.addsPunctuation = true
        feed.use(request)

        task = Self.recognize(with: recognizer, request: request) { [weak self] text, finished, hardFailure in
            Task { @MainActor in
                self?.receive(text: text, finished: finished, hardFailure: hardFailure, token: token)
            }
        }
    }

    private func receive(text: String?, finished: Bool, hardFailure: Bool, token: Int) {
        guard isListening, token == generation else { return }

        if let text {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                partial = trimmed
                heardInTask = true
            }
        }

        if finished {
            committed = Self.join(committed, partial)
            partial = ""
            failureCount = hardFailure && !heardInTask ? failureCount + 1 : 0
        }

        transcript = Self.join(committed, partial)

        guard finished else { return }
        if failureCount >= 3 {
            stop()
            failed = true
        } else {
            startRecognition()
        }
    }

    private func clearText() {
        committed = ""
        partial = ""
        guard !transcript.isEmpty else { return }
        transcript = ""
    }

    /// Audio session and engine work, serialized off the main thread.
    private final class Capture: @unchecked Sendable {
        private let engine = AVAudioEngine()
        private let queue = DispatchQueue(label: "randevulink.speech.audio")

        func activate(feed: AudioFeed) async throws {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, any Error>) in
                queue.async {
                    do {
                        try self.activateSync(feed: feed)
                        continuation.resume()
                    } catch {
                        continuation.resume(throwing: error)
                    }
                }
            }
        }

        func deactivate() {
            queue.async {
                self.stopEngine()
            }
        }

        private func stopEngine() {
            engine.stop()
            engine.inputNode.removeTap(onBus: 0)
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }

        private func activateSync(feed: AudioFeed) throws {
            let session = AVAudioSession.sharedInstance()
            do {
                try session.setCategory(.record, mode: .measurement, options: .duckOthers)
                try session.setActive(true, options: .notifyOthersOnDeactivation)
            } catch {
                throw SpeechListenerError.unavailable
            }

            let input = engine.inputNode
            let format = input.outputFormat(forBus: 0)
            guard format.sampleRate > 0, format.channelCount > 0 else {
                try? session.setActive(false, options: .notifyOthersOnDeactivation)
                throw SpeechListenerError.unavailable
            }

            SpeechListener.installTap(on: input, format: format, feed: feed)
            engine.prepare()
            do {
                try engine.start()
            } catch {
                input.removeTap(onBus: 0)
                try? session.setActive(false, options: .notifyOthersOnDeactivation)
                throw SpeechListenerError.unavailable
            }
        }
    }

    private nonisolated static func join(_ lhs: String, _ rhs: String) -> String {
        [lhs, rhs]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: " ")
    }

    private nonisolated static func requestPermissions() async -> Bool {
        let status = await withCheckedContinuation {
            (continuation: CheckedContinuation<SFSpeechRecognizerAuthorizationStatus, Never>) in
            SFSpeechRecognizer.requestAuthorization { continuation.resume(returning: $0) }
        }
        guard status == .authorized else { return false }
        return await AVAudioApplication.requestRecordPermission()
    }

    private nonisolated static func installTap(
        on input: AVAudioInputNode,
        format: AVAudioFormat,
        feed: AudioFeed
    ) {
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            feed.append(buffer)
        }
    }

    private nonisolated static func recognize(
        with recognizer: SFSpeechRecognizer,
        request: SFSpeechAudioBufferRecognitionRequest,
        onUpdate: @escaping @Sendable (String?, Bool, Bool) -> Void
    ) -> SFSpeechRecognitionTask {
        recognizer.recognitionTask(with: request) { result, error in
            let nsError = error as NSError?
            let noSpeech = nsError?.domain == "kAFAssistantErrorDomain" && nsError?.code == 1110
            onUpdate(
                result?.bestTranscription.formattedString,
                (result?.isFinal ?? false) || error != nil,
                error != nil && !noSpeech
            )
        }
    }
}

private final class AudioFeed: @unchecked Sendable {
    private let lock = NSLock()
    private var request: SFSpeechAudioBufferRecognitionRequest?

    func use(_ newRequest: SFSpeechAudioBufferRecognitionRequest) {
        lock.withLock {
            request?.endAudio()
            request = newRequest
        }
    }

    func append(_ buffer: AVAudioPCMBuffer) {
        lock.withLock {
            request?.append(buffer)
        }
    }

    func finish() {
        lock.withLock {
            request?.endAudio()
            request = nil
        }
    }
}
