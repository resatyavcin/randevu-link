import SwiftUI
import UIKit

struct NoteItemEditorView: View {
    @Environment(\.appColors) private var appColors
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject private var l10n: LocalizationManager
    @ObservedObject var store: NotesListViewModel
    let groupId: String
    let itemId: String
    var onBack: () -> Void = {}

    @State private var text = ""
    @State private var styles: [NoteWordStyle] = []
    @State private var selectedRange = NSRange(location: 0, length: 0)
    @State private var didLoad = false
    @State private var saveTask: Task<Void, Never>?
    @State private var paletteOpen = false
    @State private var ratingOpen = false
    @State private var dragRating: Double?

    private var isDark: Bool { colorScheme == .dark }

    private var item: NoteItem? {
        store.group(id: groupId)?.items.first { $0.id == itemId }
    }

    private var showsTheme: Bool {
        store.group(id: groupId)?.isTodoList != true
    }

    private var selectedWordIndices: [Int] {
        NoteWords.indices(in: text, overlapping: selectedRange)
    }

    var body: some View {
        ZStack {
            appColors.background
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 12) {
                header

                if showsTheme, paletteOpen {
                    colorPalette
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }

                if ratingOpen {
                    ratingPalette
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }

                NoteTextView(
                    text: text,
                    styles: styles,
                    isReady: didLoad,
                    textColor: UIColor(appColors.textPrimary),
                    tint: UIColor(appColors.accent),
                    onTextChange: applyText,
                    onSelectionChange: { selectedRange = $0 }
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(.horizontal, AppSpacing.screenHorizontal)
            .padding(.top, AppSpacing.greetingTop)
            .padding(.bottom, AppSpacing.bottomBarInset)
            .animation(.easeInOut(duration: 0.22), value: paletteOpen)
            .animation(.easeInOut(duration: 0.22), value: ratingOpen)
        }
        .background {
            PopGestureEnabler()
                .frame(width: 0, height: 0)
        }
        .toolbar(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden(true)
        .onAppear(perform: load)
        .onDisappear {
            let currentText = text
            let currentStyles = styles
            let storedText = item?.text
            let storedStyles = item?.wordStyles ?? []
            saveTask?.cancel()
            guard storedText != currentText || storedStyles != currentStyles else { return }
            Task { @MainActor in
                store.updateItemText(
                    groupId: groupId,
                    itemId: itemId,
                    text: currentText,
                    wordStyles: currentStyles
                )
            }
        }
        .onChange(of: item == nil) { _, missing in
            if missing { onBack() }
        }
    }

    private var header: some View {
        HStack(spacing: 8) {
            Button(action: onBack) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(appColors.textPrimary)
                    .frame(width: 40, height: 40)
                    .modifier(JoinedGlass(circle: true, interactive: false))
            }
            .buttonStyle(.plain)
            .accessibilityLabel(l10n(.commonBack))

            Spacer(minLength: 8)

            formatButton(symbol: "bold", label: l10n(.notesFormatBold), isOn: selectionIsOn(\.isBold)) {
                toggleSelected(\.isBold)
            }
            formatButton(symbol: "italic", label: l10n(.notesFormatItalic), isOn: selectionIsOn(\.isItalic)) {
                toggleSelected(\.isItalic)
            }
            if showsTheme {
                blinkButton
            }
            ratingButton
        }
    }

    private var shownRating: Double {
        dragRating ?? item?.rating ?? 0
    }

    private var ratingButton: some View {
        let on = shownRating > 0
        return Button {
            paletteOpen = false
            ratingOpen.toggle()
        } label: {
            Image(systemName: on ? "star.fill" : "star")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(ratingOpen ? appColors.background : (on ? starColor : appColors.textPrimary))
                .frame(width: 40, height: 40)
                .background {
                    if ratingOpen {
                        Circle().fill(appColors.accent)
                    }
                }
                .modifier(JoinedGlass(circle: true, interactive: false))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(l10n(.notesRating))
        .accessibilityAddTraits(ratingOpen ? .isSelected : [])
    }

    private var ratingPalette: some View {
        StarRatingControl(score: shownRating, tint: starColor) { next in
            dragRating = next
        } onEnd: {
            let next = dragRating ?? shownRating
            dragRating = nil
            store.setItemRating(groupId: groupId, itemId: itemId, rating: next)
        }
    }

    private var starColor: Color {
        let theme = showsTheme ? item?.blinkColor : nil
        return theme?.star(isDark: isDark) ?? NoteTodoColor.plainStar(isDark: isDark)
    }

    private var blinkButton: some View {
        let selected = item?.blinkColor
        return Button {
            ratingOpen = false
            paletteOpen.toggle()
        } label: {
            ZStack {
                if let tint = selected?.tint(isDark: isDark) {
                    Circle().fill(tint)
                }
                if selected == nil {
                    Image(systemName: "circle.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(appColors.textPrimary)
                }
            }
            .frame(width: 40, height: 40)
            .overlay {
                if paletteOpen {
                    Circle()
                        .strokeBorder(appColors.textPrimary, lineWidth: 2)
                }
            }
            .modifier(JoinedGlass(circle: true, interactive: false))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(l10n(.notesBlink))
        .accessibilityAddTraits(paletteOpen ? .isSelected : [])
    }

    private var colorPalette: some View {
        HStack(spacing: 14) {
            Spacer(minLength: 0)
            ForEach(NoteTodoColor.allCases) { color in
                colorSwatch(color)
            }
        }
    }

    private func colorSwatch(_ color: NoteTodoColor) -> some View {
        let selected = item?.blinkColor == color
        return Button {
            store.setItemColor(
                groupId: groupId,
                itemId: itemId,
                colorId: selected ? nil : color.rawValue
            )
            paletteOpen = false
        } label: {
            ZStack {
                Circle()
                    .fill(color.tint(isDark: isDark))
                    .frame(width: 34, height: 34)
                if selected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(color.checkmark(isDark: isDark))
                }
            }
            .frame(width: 36, height: 36)
            .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(l10n(color.titleKey))
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func formatButton(
        symbol: String,
        label: String,
        isOn: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(isOn ? appColors.background : appColors.textPrimary)
                .frame(width: 40, height: 40)
                .background {
                    if isOn {
                        Circle().fill(appColors.accent)
                    }
                }
                .modifier(JoinedGlass(circle: true, interactive: false))
        }
        .buttonStyle(.plain)
        .disabled(selectedWordIndices.isEmpty)
        .opacity(selectedWordIndices.isEmpty ? 0.4 : 1)
        .accessibilityLabel(label)
    }

    private func selectionIsOn(_ keyPath: KeyPath<NoteWordStyle, Bool>) -> Bool {
        let indices = selectedWordIndices
        guard !indices.isEmpty else { return false }
        return indices.allSatisfy { index in
            styles.indices.contains(index) && styles[index][keyPath: keyPath]
        }
    }

    private func load() {
        guard !didLoad, let item else { return }
        didLoad = true
        let needsMigration = item.wordStyles.isEmpty && (item.isBold || item.isItalic)
        if needsMigration {
            styles = Array(
                repeating: NoteWordStyle(isBold: item.isBold, isItalic: item.isItalic),
                count: NoteWords.parts(item.text).count
            )
        } else {
            styles = item.wordStyles
        }
        text = item.text
        if needsMigration {
            persist()
        }
    }

    private func applyText(_ newText: String) {
        styles = NoteWords.aligned(oldText: text, oldStyles: styles, newText: newText)
        text = newText
        scheduleSave()
    }

    private func toggleSelected(_ keyPath: WritableKeyPath<NoteWordStyle, Bool>) {
        let indices = selectedWordIndices
        guard !indices.isEmpty else { return }
        var next = styles
        let count = NoteWords.parts(text).count
        while next.count < count {
            next.append(NoteWordStyle())
        }
        let turnOn = !indices.allSatisfy { next[$0][keyPath: keyPath] }
        for index in indices {
            next[index][keyPath: keyPath] = turnOn
        }
        styles = next
        scheduleSave()
    }

    private func scheduleSave() {
        saveTask?.cancel()
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 400_000_000)
            guard !Task.isCancelled else { return }
            persist()
        }
    }

    private func persist() {
        saveTask?.cancel()
        guard let item else { return }
        guard item.text != text || item.wordStyles != styles else { return }
        store.updateItemText(
            groupId: groupId,
            itemId: itemId,
            text: text,
            wordStyles: styles,
            reflectInList: false
        )
    }
}

private struct StarRatingControl: View {
    var score: Double
    var tint: Color
    var onChange: (Double) -> Void
    var onEnd: () -> Void

    var body: some View {
        HStack(spacing: 0) {
            Spacer(minLength: 0)
            HStack(spacing: 2) {
                ForEach(0..<5, id: \.self) { index in
                    Image(systemName: symbol(for: index))
                        .font(.system(size: 26, weight: .semibold))
                        .foregroundStyle(tint)
                        .frame(width: 40, height: 44)
                }
            }
            .overlay {
                GeometryReader { geo in
                    Color.clear
                        .contentShape(Rectangle())
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { drag in
                                    onChange(value(at: drag.location.x, width: geo.size.width))
                                }
                                .onEnded { _ in
                                    onEnd()
                                }
                        )
                }
            }
            .accessibilityElement()
            .accessibilityLabel(Text("\(score)"))
            .accessibilityAdjustableAction { direction in
                let delta: Double = direction == .increment ? 0.5 : -0.5
                onChange(min(5, max(0, score + delta)))
                onEnd()
            }
        }
    }

    private func symbol(for index: Int) -> String {
        let start = Double(index)
        if score >= start + 1 { return "star.fill" }
        if score >= start + 0.5 { return "star.leadinghalf.filled" }
        return "star"
    }

    private func value(at x: CGFloat, width: CGFloat) -> Double {
        let star = width / 5
        guard star > 0 else { return 0 }
        if x < star * 0.28 { return 0 }
        let index = min(4, max(0, Int(x / star)))
        let local = x - CGFloat(index) * star
        let next = local < star / 2 ? Double(index) + 0.5 : Double(index) + 1
        return min(5, next)
    }
}

private struct NoteTextView: UIViewRepresentable {
    var text: String
    var styles: [NoteWordStyle]
    var isReady: Bool
    var textColor: UIColor
    var tint: UIColor
    var onTextChange: (String) -> Void
    var onSelectionChange: (NSRange) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> CenteredTextView {
        let view = CenteredTextView()
        view.delegate = context.coordinator
        view.backgroundColor = .clear
        view.textAlignment = .center
        view.tintColor = tint
        view.textColor = textColor
        view.font = NoteRichText.baseFont
        view.typingAttributes = NoteRichText.typingAttributes(
            text: "",
            styles: [],
            selection: NSRange(location: 0, length: 0),
            color: textColor
        )
        view.textContainer.lineFragmentPadding = 0
        view.textContainerInset = UIEdgeInsets(top: 0, left: 0, bottom: 0, right: 0)
        view.keyboardDismissMode = .interactive
        view.autocorrectionType = .yes
        return view
    }

    func updateUIView(_ uiView: CenteredTextView, context: Context) {
        context.coordinator.parent = self
        uiView.tintColor = tint
        let stylesChanged = context.coordinator.appliedStyles != styles
        let needsApply = uiView.text != text || stylesChanged
        if needsApply {
            let range = uiView.selectedRange
            context.coordinator.isApplying = true
            uiView.attributedText = NoteRichText.make(text: text, styles: styles, color: textColor)
            context.coordinator.appliedText = text
            context.coordinator.appliedStyles = styles
            context.coordinator.isApplying = false
            if context.coordinator.didFocus {
                let length = (uiView.text as NSString).length
                let location = min(range.location, length)
                let span = min(range.length, length - location)
                uiView.selectedRange = NSRange(location: location, length: span)
            }
        } else {
            context.coordinator.appliedText = text
        }
        uiView.typingAttributes = NoteRichText.typingAttributes(
            text: text,
            styles: styles,
            selection: uiView.selectedRange,
            color: textColor
        )
        focusWhenWide(uiView, coordinator: context.coordinator)
    }

    @MainActor
    private func focusWhenWide(_ uiView: CenteredTextView, coordinator: Coordinator) {
        guard isReady, !coordinator.didFocus else {
            uiView.focusWhenWide = nil
            return
        }
        if uiView.bounds.width > 0 {
            uiView.focusWhenWide = nil
            applyFocus(uiView, coordinator: coordinator)
            return
        }
        uiView.focusWhenWide = { [weak uiView] in
            guard let uiView else { return }
            applyFocus(uiView, coordinator: coordinator)
        }
    }

    @MainActor
    private func applyFocus(_ uiView: CenteredTextView, coordinator: Coordinator) {
        guard isReady, !coordinator.didFocus else { return }
        guard uiView.bounds.width > 0 else {
            uiView.focusWhenWide = { [weak uiView] in
                guard let uiView else { return }
                applyFocus(uiView, coordinator: coordinator)
            }
            return
        }
        coordinator.didFocus = true
        let length = (uiView.text as NSString).length
        let end = NSRange(location: length, length: 0)
        uiView.becomeFirstResponder()
        uiView.selectedRange = end
        uiView.scrollRangeToVisible(end)
    }

    final class Coordinator: NSObject, UITextViewDelegate {
        var parent: NoteTextView
        var appliedText = ""
        var appliedStyles: [NoteWordStyle] = []
        var didFocus = false
        var isApplying = false

        init(parent: NoteTextView) {
            self.parent = parent
        }

        func textViewDidChange(_ textView: UITextView) {
            guard !isApplying else { return }
            parent.onTextChange(textView.text ?? "")
        }

        func textViewDidChangeSelection(_ textView: UITextView) {
            parent.onSelectionChange(textView.selectedRange)
        }
    }
}

private final class CenteredTextView: UITextView {
    private var keyboardOverlap: CGFloat = 0
    var focusWhenWide: (@MainActor () -> Void)?

    override init(frame: CGRect, textContainer: NSTextContainer?) {
        super.init(frame: frame, textContainer: textContainer)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(keyboardFrameChanged(_:)),
            name: UIResponder.keyboardWillChangeFrameNotification,
            object: nil
        )
    }

    required init?(coder: NSCoder) {
        nil
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let visible = max(0, bounds.height - keyboardOverlap)
        let top = max(0, (visible - contentSize.height) / 2)
        if abs(contentInset.top - top) > 0.5 || abs(contentInset.bottom - keyboardOverlap) > 0.5 {
            contentInset = UIEdgeInsets(top: top, left: 0, bottom: keyboardOverlap, right: 0)
        }
        guard bounds.width > 0, let pending = focusWhenWide else { return }
        focusWhenWide = nil
        Task { @MainActor in
            pending()
        }
    }

    @objc private func keyboardFrameChanged(_ note: Notification) {
        guard let frame = note.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
              let window else { return }
        let inView = convert(frame, from: window)
        keyboardOverlap = max(0, bounds.maxY - inView.minY)
        setNeedsLayout()
    }
}

private enum NoteRichText {
    static let size: CGFloat = 28
    static let baseFont = UIFont.systemFont(ofSize: size, weight: .medium)

    static func typingAttributes(
        text: String,
        styles: [NoteWordStyle],
        selection: NSRange,
        color: UIColor
    ) -> [NSAttributedString.Key: Any] {
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = .center
        let index = wordIndex(in: text, at: selection.location)
        let style = index.flatMap { styles.indices.contains($0) ? styles[$0] : nil } ?? NoteWordStyle()
        return [
            .font: font(style),
            .foregroundColor: color,
            .paragraphStyle: paragraph
        ]
    }

    static func make(text: String, styles: [NoteWordStyle], color: UIColor) -> NSAttributedString {
        let result = NSMutableAttributedString(string: text, attributes: typingAttributes(
            text: text,
            styles: styles,
            selection: NSRange(location: 0, length: 0),
            color: color
        ))
        let ns = text as NSString
        var search = 0
        for (index, word) in NoteWords.parts(text).enumerated() {
            let found = ns.range(
                of: word,
                range: NSRange(location: search, length: ns.length - search)
            )
            guard found.location != NSNotFound else { continue }
            let style = styles.indices.contains(index) ? styles[index] : NoteWordStyle()
            result.addAttribute(.font, value: font(style), range: found)
            search = found.location + found.length
        }
        return result
    }

    private static func wordIndex(in text: String, at location: Int) -> Int? {
        let ns = text as NSString
        var search = 0
        for (index, word) in NoteWords.parts(text).enumerated() {
            let found = ns.range(of: word, range: NSRange(location: search, length: ns.length - search))
            guard found.location != NSNotFound else { continue }
            let end = found.location + found.length
            if location <= end { return index }
            search = end
        }
        return nil
    }

    private static func font(_ style: NoteWordStyle) -> UIFont {
        let weight: UIFont.Weight = style.isBold ? .bold : .medium
        let base = UIFont.systemFont(ofSize: size, weight: weight)
        guard style.isItalic else { return base }
        guard let descriptor = base.fontDescriptor.withSymbolicTraits(.traitItalic) else {
            return base
        }
        return UIFont(descriptor: descriptor, size: size)
    }
}
