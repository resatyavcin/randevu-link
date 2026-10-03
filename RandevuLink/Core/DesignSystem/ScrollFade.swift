import SwiftUI

struct EdgeFade: ViewModifier {
    @Environment(\.appColors) private var appColors
    var top: CGFloat = 20

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .top) {
                LinearGradient(
                    stops: [
                        .init(color: appColors.background, location: 0),
                        .init(color: appColors.background, location: 0.82),
                        .init(color: appColors.background.opacity(0), location: 1)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(maxWidth: .infinity)
                .frame(height: top)
                .allowsHitTesting(false)
            }
    }
}

extension View {
    func edgeFade(top: CGFloat = 20) -> some View {
        modifier(EdgeFade(top: top))
    }

    func screenScroll() -> some View {
        scrollIndicators(.hidden)
            .scrollBounceBehavior(.basedOnSize, axes: .vertical)
    }
}
