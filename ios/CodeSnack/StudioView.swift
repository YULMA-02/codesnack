import SwiftUI

// The editor is the main view. No promotional popup/card is displayed above it.
struct StudioView: View {
    let openWebsite: (SiteRoute, String?) -> Void
    @StateObject private var session = WebSession(route: .studio)

    var body: some View {
        VStack(spacing: 0) {
            SnackBrandHeader(subtitle: "스낵 스튜디오", trailingSymbol: "arrow.clockwise") { session.reload() }
            HStack(spacing: 7) {
                actionButton("새 파일", systemImage: "plus", filled: false) {
                    session.execute("if (typeof createNewVscFile === 'function') createNewVscFile();")
                }
                actionButton("저장", systemImage: "square.and.arrow.down", filled: false) {
                    session.execute("if (typeof saveVscWorkspace === 'function') saveVscWorkspace();")
                }
                Spacer(minLength: 0)
                Menu {
                    Button(role: .destructive) {
                        session.execute("if (typeof resetStudioCurrentFile === 'function') resetStudioCurrentFile();")
                    } label: {
                        Label("현재 파일 초기화", systemImage: "arrow.counterclockwise")
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(SnackStyle.ink)
                        .frame(width: 37, height: 37)
                        .background(.white.opacity(0.86), in: Circle())
                }
                actionButton("실행", systemImage: "play.fill", filled: true) {
                    session.execute("if (typeof runVscCurrentFile === 'function') runVscCurrentFile();")
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 8)
            WebPanelFrame(session: session)
                .clipShape(UnevenRoundedRectangle(topLeadingRadius: 22, topTrailingRadius: 22))
        }
    }

    private func actionButton(_ title: String, systemImage: String, filled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: systemImage)
                Text(title)
            }
            .font(.system(size: 12, weight: .bold))
            .foregroundStyle(filled ? Color.white : SnackStyle.ink)
            .padding(.horizontal, 14)
            .frame(height: 37)
            .background(filled ? SnackStyle.blue : Color.white.opacity(0.87), in: Capsule())
        }
        .buttonStyle(.plain)
    }
}
