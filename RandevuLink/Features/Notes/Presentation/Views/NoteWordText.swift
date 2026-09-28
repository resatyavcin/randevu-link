import SwiftUI

enum NoteWordText {
    static func attributed(_ item: NoteItem, size: CGFloat) -> AttributedString {
        let words = NoteWords.resolved(
            text: item.text,
            styles: item.wordStyles,
            fallbackBold: item.isBold,
            fallbackItalic: item.isItalic
        )
        var result = AttributedString()
        for (index, entry) in words.enumerated() {
            if index > 0 {
                result += AttributedString(" ")
            }
            var part = AttributedString(entry.word)
            var font = Font.system(size: size, weight: entry.style.isBold ? .bold : .medium)
            if entry.style.isItalic {
                font = font.italic()
            }
            part.font = font
            result += part
        }
        return result
    }
}
