import SwiftUI

struct StudioView: View {
    let openWebsite: (SiteRoute, String?) -> Void
    @StateObject private var session = WebSession(route: .studio)
    @State private var showingMore = false

    var body: some View {
        VStack(spacing: 0) {
            SnackBrandHeader(subtitle: "스낵 스튜디오", trailingSymbol: "arrow.clockwise") { session.reload() }
            VStack(spacing: 10) {
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text("언제든지, 가볍게 코딩해요")
                            .font(.system(size: 19, weight: .heavy))
                            .foregroundStyle(SnackStyle.ink)
                        Text("작성하고, 실행하고, 바로 확인하는 나만의 공간")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(SnackStyle.muted)
                    }
                    Spacer(minLength: 0)
                    Image(systemName: "chevron.left.forwardslash.chevron.right")
                        .font(.system(size: 28, weight: .heavy))
                        .foregroundStyle(SnackStyle.blue)
                        .frame(width: 57, height: 57)
                        .background(SnackStyle.lavenderSoft, in: RoundedRectangle(cornerRadius: 18))
                }
                HStack(spacing: 8) {
                    toolButton("새 파일", symbol: "plus.square.on.square") {
                        session.execute("if (typeof createNewVscFile === 'function') createNewVscFile();")
                    }
                    toolButton("저장", symbol: "square.and.arrow.down") {
                        session.execute("if (typeof saveVscWorkspace === 'function') saveVscWorkspace();")
                    }
                    toolButton("초기화", symbol: "arrow.counterclockwise") {
                        session.execute("if (typeof resetStudioCurrentFile === 'function') resetStudioCurrentFile();")
                    }
                    Button {
                        session.execute("if (typeof runVscCurrentFile === 'function') runVscCurrentFile();")
                    } label: {
                        Label("실행", systemImage: "play.fill")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14).padding(.vertical, 11)
                            .background(SnackStyle.blue, in: Capsule())
                    }.buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 21)
            .padding(.top, 8)
            .padding(.bottom, 12)

            WebPanelFrame(session: session)
                .clipShape(UnevenRoundedRectangle(topLeadingRadius: 16, topTrailingRadius: 16))
        }
    }

    private func toolButton(_ title: String, symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: symbol)
                Text(title)
            }
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(SnackStyle.ink)
            .padding(.horizontal, 10).padding(.vertical, 11)
            .background(.white.opacity(0.9), in: Capsule())
        }
        .buttonStyle(.plain)
    }
}
