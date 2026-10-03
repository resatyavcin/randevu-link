import SwiftUI

enum NoteArrivalOrigin {
    /// Unfolds downward from the name field above the list.
    case field
    /// Rises into place from the listen or enter action below.
    case action
}

enum NoteMotion {
    static let settle = Animation.easeInOut(duration: 0.28)
}

private struct NoteArrival: ViewModifier {
    var isFresh: Bool
    var origin: NoteArrivalOrigin
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var settled: Bool

    init(isFresh: Bool, origin: NoteArrivalOrigin) {
        self.isFresh = isFresh
        self.origin = origin
        _settled = State(initialValue: !isFresh)
    }

    @ViewBuilder
    func body(content: Content) -> some View {
        let shown = settled || !isFresh || reduceMotion
        let row = content
            .opacity(shown ? 1 : 0)
            .scaleEffect(shown ? 1 : closedScale, anchor: anchor)
            .offset(y: shown ? 0 : travel)
        if isFresh {
            row.task(id: isFresh) {
                await reveal()
            }
        } else {
            row
        }
    }

    private func reveal() async {
        guard isFresh, !settled else { return }
        guard !reduceMotion else {
            settled = true
            return
        }
        // Let the list ease open one frame, then the row settles into that space.
        try? await Task.sleep(nanoseconds: 16_000_000)
        guard !Task.isCancelled, isFresh, !settled else { return }
        withAnimation(NoteMotion.settle) {
            settled = true
        }
    }

    private var anchor: UnitPoint {
        origin == .field ? .top : .bottom
    }

    private var travel: CGFloat {
        origin == .field ? -8 : 16
    }

    private var closedScale: CGFloat {
        origin == .field ? 0.9 : 0.92
    }
}

extension View {
    func noteArrival(from origin: NoteArrivalOrigin, isFresh: Bool) -> some View {
        modifier(NoteArrival(isFresh: isFresh, origin: origin))
            .zIndex(isFresh ? 1 : 0)
            .transition(.asymmetric(insertion: .identity, removal: .opacity))
    }
}
