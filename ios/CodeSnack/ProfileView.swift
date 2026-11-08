import SwiftUI

struct ProfileView: View {
    let openWebsite: (SiteRoute, String?) -> Void
    @StateObject private var session = WebSession(route: .profile)
    @State private var section = "profile"

    private let sections: [(key: String, label: String, icon: String)] = [
        ("profile", "내 정보", "person"),
        ("learning", "학습 기록", "chart.bar"),
        ("quizzes", "내 퀴즈", "list.bullet.clipboard"),
        ("role", "수업", "person.2"),
        ("preferences", "설정", "gearshape")
    ]

    var body: some View {
        VStack(spacing: 0) {
            SnackBrandHeader(subtitle: "마이페이지", trailingSymbol: "arrow.clockwise") { session.reload() }
            SnackCard(padding: 14) {
                HStack(spacing: 13) {
                    Image("BrandMark")
                        .resizable().scaledToFit()
                        .frame(width: 58, height: 58)
                        .clipShape(RoundedRectangle(cornerRadius: 19))
                    VStack(alignment: .leading, spacing: 5) {
                        Text(session.nickname.isEmpty || session.nickname == "사용자" ? "내 CodeSnack 계정" : session.nickname)
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundStyle(SnackStyle.ink)
                        Text("학습 기록과 나의 활동을 확인해요")
                            .font(.system(size: 11)).foregroundStyle(SnackStyle.muted)
                    }
                    Spacer(minLength: 0)
                    Button {
                        openWebsite(.auth, nil)
                    } label: {
                        Image(systemName: "person.crop.circle.badge.checkmark")
                            .foregroundStyle(SnackStyle.blue)
                            .font(.system(size: 22))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("로그인 및 계정 확인")
                }
                if !session.xp.isEmpty && !session.streak.isEmpty {
                    HStack(spacing: 8) {
                        metric("누적 경험치", session.xp, icon: "star.fill", tint: SnackStyle.lavenderSoft)
                        metric("연속 학습", session.streak, icon: "bolt.fill", tint: SnackStyle.lime)
                    }
                    .padding(.top, 9)
                }
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 12)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 7) {
                    ForEach(sections, id: \.key) { item in
                        Button {
                            withAnimation(.easeOut(duration: 0.2)) { section = item.key }
                            session.goToSection(item.key)
                        } label: {
                            HStack(spacing: 5) {
                                Image(systemName: item.icon)
                                Text(item.label)
                            }
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(section == item.key ? .white : SnackStyle.ink)
                            .padding(.horizontal, 12).padding(.vertical, 11)
                            .background(section == item.key ? SnackStyle.blue : .white.opacity(0.91), in: Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 19)
            }
            .padding(.bottom, 9)

            WebPanelFrame(session: session)
                .clipShape(UnevenRoundedRectangle(topLeadingRadius: 18, topTrailingRadius: 18))
        }
    }

    private func metric(_ label: String, _ value: String, icon: String, tint: Color) -> some View {
        HStack(spacing: 7) {
            Image(systemName: icon).foregroundStyle(SnackStyle.blue)
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.system(size: 10)).foregroundStyle(SnackStyle.muted)
                Text(value).font(.system(size: 12, weight: .bold)).foregroundStyle(SnackStyle.ink)
            }
            Spacer(minLength: 0)
        }
        .padding(9)
        .frame(maxWidth: .infinity)
        .background(tint, in: RoundedRectangle(cornerRadius: 15))
    }
}
