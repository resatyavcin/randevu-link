import SwiftUI

struct NoteItemEditorView: View {
    @Environment(\.appColors) private var appColors
    @EnvironmentObject private var l10n: LocalizationManager
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var store: NotesListViewModel
    let groupId: String
    let itemId: String

    @State private var text = ""
    @State private var styles: [NoteWordStyle] = []
    @State private var selectedIndex: Int?
    @State private var didLoad = false
    @State private var skipNextTextChange = false
    @FocusState private var isWriting: Bool

    private var item: NoteItem? {
        store.group(id: groupId)?.items.first { $0.id == itemId }
    }

    private var words: [(word: String, style: NoteWordStyle)] {
        NoteWords.resolved(text: text, styles: styles, fallbackBold: false, fallbackItalic: false)
    }

    var body: some View {
        ZStack {
            appColors.background
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 20) {
                header

                ZStack {
                    Color.clear
                        .contentShape(Rectangle())
                        .onTapGesture(perform: beginWriting)

                    CenteredWordFlow(spacing: 8, lineSpacing: 12) {
                        ForEach(Array(words.enumerated()), id: \.offset) { index, entry in
                            wordButton(entry.word, style: entry.style, index: index)
                        }
                    }
                    .padding(.horizontal, 8)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(.horizontal, AppSpacing.screenHorizontal)
            .padding(.top, AppSpacing.greetingTop)
            .padding(.bottom, AppSpacing.bottomBarInset)

            TextField("", text: $text)
                .focused($isWriting)
                .opacity(0)
                .frame(width: 0, height: 0)
                .allowsHitTesting(false)
                .accessibilityHidden(true)
        }
        .background {
            PopGestureEnabler()
                .frame(width: 0, height: 0)
        }
        .toolbar(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden(true)
        .onAppear(perform: load)
        .onChange(of: text) { oldText, newText in
            if skipNextTextChange {
                skipNextTextChange = false
                return
            }
            styles = NoteWords.aligned(oldText: oldText, oldStyles: styles, newText: newText)
            if let selectedIndex, selectedIndex >= NoteWords.parts(newText).count {
                self.selectedIndex = nil
            }
            persist()
        }
        .onChange(of: item == nil) { _, missing in
            if missing { dismiss() }
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

            Spacer(minLength: 8)

            formatButton(symbol: "bold", label: l10n(.notesFormatBold), isOn: selectedStyle?.isBold == true) {
                toggleSelected(\.isBold)
            }
            formatButton(symbol: "italic", label: l10n(.notesFormatItalic), isOn: selectedStyle?.isItalic == true) {
                toggleSelected(\.isItalic)
            }
        }
    }

    private var selectedStyle: NoteWordStyle? {
        guard let selectedIndex, words.indices.contains(selectedIndex) else { return nil }
        return words[selectedIndex].style
    }

    private func wordButton(_ word: String, style: NoteWordStyle, index: Int) -> some View {
        Button {
            selectWord(index)
        } label: {
            Text(word)
                .font(.system(size: 28, weight: style.isBold ? .bold : .medium))
                .italic(style.isItalic)
                .foregroundStyle(appColors.textPrimary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(selectedIndex == index ? appColors.selection.opacity(0.18) : Color.clear)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
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
                .background(isOn ? appColors.accent : appColors.controlBackground)
                .clipShape(Circle())
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .disabled(selectedIndex == nil)
        .opacity(selectedIndex == nil ? 0.4 : 1)
        .accessibilityLabel(label)
    }

    private func load() {
        guard !didLoad, let item else { return }
        didLoad = true
        if item.wordStyles.isEmpty, item.isBold || item.isItalic {
            styles = Array(
                repeating: NoteWordStyle(isBold: item.isBold, isItalic: item.isItalic),
                count: NoteWords.parts(item.text).count
            )
        } else {
            styles = item.wordStyles
        }
        if text != item.text {
            skipNextTextChange = true
            text = item.text
        }
        persist()
    }

    private func beginWriting() {
        selectedIndex = nil
        isWriting = true
    }

    private func selectWord(_ index: Int) {
        isWriting = false
        selectedIndex = index
    }

    private func toggleSelected(_ keyPath: WritableKeyPath<NoteWordStyle, Bool>) {
        guard let selectedIndex else { return }
        var next = styles
        while next.count <= selectedIndex {
            next.append(NoteWordStyle())
        }
        next[selectedIndex][keyPath: keyPath].toggle()
        styles = next
        persist()
    }

    private func persist() {
        store.updateItemText(groupId: groupId, itemId: itemId, text: text, wordStyles: styles)
    }
}

private struct CenteredWordFlow: Layout {
    var spacing: CGFloat
    var lineSpacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        let rows = rows(maxWidth: width, subviews: subviews)
        let height = rows.reduce(CGFloat(0)) { $0 + $1.height }
            + lineSpacing * CGFloat(max(0, rows.count - 1))
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = rows(maxWidth: bounds.width, subviews: subviews)
        var y = bounds.minY
        var index = 0
        for row in rows {
            var x = bounds.minX + max(0, (bounds.width - row.width) / 2)
            for size in row.sizes {
                subviews[index].place(
                    at: CGPoint(x: x, y: y),
                    anchor: .topLeading,
                    proposal: ProposedViewSize(size)
                )
                x += size.width + spacing
                index += 1
            }
            y += row.height + lineSpacing
        }
    }

    private struct Row {
        var sizes: [CGSize] = []
        var width: CGFloat = 0
        var height: CGFloat = 0
    }

    private func rows(maxWidth: CGFloat, subviews: Subviews) -> [Row] {
        var rows: [Row] = []
        var current = Row()
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            let nextWidth = current.sizes.isEmpty ? size.width : current.width + spacing + size.width
            if !current.sizes.isEmpty, maxWidth > 0, nextWidth > maxWidth {
                rows.append(current)
                current = Row()
            }
            if current.sizes.isEmpty {
                current.width = size.width
            } else {
                current.width += spacing + size.width
            }
            current.sizes.append(size)
            current.height = max(current.height, size.height)
        }
        if !current.sizes.isEmpty {
            rows.append(current)
        }
        return rows
    }
}
