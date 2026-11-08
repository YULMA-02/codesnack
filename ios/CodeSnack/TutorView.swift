import SwiftUI

struct TutorView: View {
    @StateObject private var session = WebSession(route: .tutor)
    @State private var compactHeader = false

    private let prompts: [(label: String, question: String, symbol: String)] = [
        ("for문은 언제 사용하나요?", "반복문과 for문을 초보자도 이해하기 쉽게 알려줘", "chevron.left.forwardslash.chevron.right"),
        ("Python 리스트 사용법", "Python 리스트를 간단한 예제와 함께 설명해줘", "list.bullet"),
        ("오류가 나는 이유", "코드에서 오류가 났을 때 해결하는 방법을 알려줘", "ladybug")
    ]

    var body: some View {
        VStack(spacing: 0) {
            SnackBrandHeader(subtitle: "AI 튜터", trailingSymbol: "arrow.clockwise") {
                session.execute("if (typeof clearChatHistory === 'function') clearChatHistory();")
                compactHeader = false
            }
            if !compactHeader {
                VStack(alignment: .leading, spacing: 11) {
                    HStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("코딩이 궁금할 땐,\nAI 튜터에게 물어보세요!")
                                .font(.system(size: 20, weight: .heavy))
                                .foregroundStyle(SnackStyle.ink)
                                .fixedSize(horizontal: false, vertical: true)
                            Text("개념 설명부터 코드 디버깅까지\n차근차근 쉽게 도와드려요.")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(SnackStyle.muted)
                        }
                        Spacer(minLength: 2)
                        ZStack {
                            Circle().fill(.white.opacity(0.55)).frame(width: 72, height: 72)
                            Image(systemName: "sparkles.rectangle.stack.fill")
                                .font(.system(size: 36))
                                .foregroundStyle(SnackStyle.blue)
                        }
                        .frame(width: 76)
                    }
                    Text("이런 질문은 어때요?")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(SnackStyle.ink)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 7) {
                            ForEach(prompts.indices, id: \.self) { i in
                                Button {
                                    session.execute("if (typeof sendQuickQuestion === 'function') sendQuickQuestion(\(WebSession.javascriptString(prompts[i].question)));")
                                    withAnimation { compactHeader = true }
                                } label: {
                                    HStack(spacing: 5) {
                                        Image(systemName: prompts[i].symbol).foregroundStyle(SnackStyle.blue)
                                        Text(prompts[i].label).foregroundStyle(SnackStyle.ink)
                                    }
                                    .font(.system(size: 11, weight: .semibold))
                                    .padding(.horizontal, 11).padding(.vertical, 9)
                                    .background(.white.opacity(0.87), in: Capsule())
                                }.buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(15)
                .background(LinearGradient(colors: [SnackStyle.lavenderSoft, SnackStyle.lavender.opacity(0.8)], startPoint: .leading, endPoint: .trailing), in: RoundedRectangle(cornerRadius: 22))
                .padding(.horizontal, 18)
                .padding(.bottom, 12)
            } else {
                HStack {
                    Label("CodeSnack AI와 대화 중", systemImage: "sparkles")
                        .font(.system(size: 12, weight: .semibold)).foregroundStyle(SnackStyle.ink)
                    Spacer()
                    Button("추천 질문") { withAnimation { compactHeader = false } }
                        .font(.system(size: 11, weight: .bold))
                }
                .padding(.horizontal, 23)
                .padding(.vertical, 8)
            }
            WebPanelFrame(session: session)
                .background(.white.opacity(0.7))
                .clipShape(UnevenRoundedRectangle(topLeadingRadius: 20, topTrailingRadius: 20))
        }
    }
}
