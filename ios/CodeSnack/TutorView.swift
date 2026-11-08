import SwiftUI

// Opens the actual AI chat immediately; no extra welcome popup before the conversation.
struct TutorView: View {
    @StateObject private var session = WebSession(route: .tutor)
    private let prompts: [(text: String, question: String)] = [
        ("for문 알려줘", "반복문과 for문을 초보자도 이해하기 쉽게 알려줘"),
        ("Python 리스트", "Python 리스트를 간단한 예제와 함께 설명해줘"),
        ("오류 해결", "코드에서 오류가 났을 때 해결하는 방법을 알려줘")
    ]

    var body: some View {
        VStack(spacing: 0) {
            SnackBrandHeader(subtitle: "AI 튜터", trailingSymbol: "arrow.clockwise") { session.reload() }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(prompts.indices, id: \.self) { i in
                        Button {
                            session.execute("if (typeof sendQuickQuestion === 'function') sendQuickQuestion(\(WebSession.javascriptString(prompts[i].question)));")
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "sparkle")
                                    .foregroundStyle(SnackStyle.blue)
                                Text(prompts[i].text)
                                    .foregroundStyle(SnackStyle.ink)
                            }
                            .font(.system(size: 12, weight: .semibold))
                            .padding(.horizontal, 13)
                            .frame(height: 35)
                            .background(.white.opacity(0.88), in: Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 18)
            }
            .padding(.bottom, 9)
            WebPanelFrame(session: session)
                .clipShape(UnevenRoundedRectangle(topLeadingRadius: 22, topTrailingRadius: 22))
        }
    }
}
