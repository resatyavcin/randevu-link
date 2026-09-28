import SwiftUI

struct EdgeFade: ViewModifier {
    @Environment(\.appColors) private var appColors
    var top: CGFloat = 20
    var bottom: CGFloat = AppSpacing.bottomBarInset

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
            .overlay(alignment: .bottom) {
                LinearGradient(
                    stops: [
                        .init(color: appColors.background.opacity(0), location: 0),
                        .init(color: appColors.background, location: 0.22),
                        .init(color: appColors.background, location: 1)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(maxWidth: .infinity)
                .frame(height: bottom)
                .allowsHitTesting(false)
            }
    }
}

extension View {
    func edgeFade(top: CGFloat = 20, bottom: CGFloat = AppSpacing.bottomBarInset) -> some View {
        modifier(EdgeFade(top: top, bottom: bottom))
    }

    func screenScroll() -> some View {
        scrollIndicators(.hidden)
            .scrollBounceBehavior(.basedOnSize, axes: .vertical)
    }
}
