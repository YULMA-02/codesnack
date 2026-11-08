import SwiftUI

// Account-first profile: real totals from the signed-in CodeSnack web account,
// followed directly by editable account settings, not another dashboard.
struct ProfileView: View {
    let openWebsite: (SiteRoute, String?) -> Void
    @StateObject private var session = WebSession(route: .profile)
    @State private var currentSection = "profile"

    private let sections: [(key: String, name: String, symbol: String)] = [
        ("profile", "계정 정보", "person.crop.circle"),
        ("preferences", "화면 설정", "slider.horizontal.3"),
        ("learning", "학습 기록", "chart.bar.xaxis"),
        ("quizzes", "내 퀴즈", "checkmark.square"),
        ("role", "수업 및 역할", "person.2")
    ]

    var body: some View {
        VStack(spacing: 0) {
            SnackBrandHeader(subtitle: "마이페이지", trailingSymbol: "arrow.clockwise") { session.reload() }

            VStack(alignment: .leading, spacing: 15) {
                HStack(alignment: .center, spacing: 12) {
                    Image("BrandMark")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 47, height: 47)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    VStack(alignment: .leading, spacing: 4) {
                        Text(displayName)
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundStyle(SnackStyle.ink)
                            .lineLimit(1)
                        Text("오늘의 작은 성장이 쌓이고 있어요")
                            .font(.system(size: 12))
                            .foregroundStyle(SnackStyle.muted)
                    }
                    Spacer(minLength: 4)
                    Button { openWebsite(.auth, nil) } label: {
                        Image(systemName: "person.crop.circle.badge.checkmark")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(SnackStyle.blue)
                            .frame(width: 39, height: 39)
                            .background(.white.opacity(0.78), in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("로그인과 계정 확인")
                }

                HStack(spacing: 10) {
                    statTile(title: "누적 경험치", value: session.xp.isEmpty ? "—" : session.xp,
                             symbol: "star.fill", tint: SnackStyle.lavenderSoft, accent: SnackStyle.blue)
                    statTile(title: "연속 학습", value: session.streak.isEmpty ? "—" : session.streak,
                             symbol: "flame.fill", tint: SnackStyle.lime, accent: SnackStyle.ink)
                }
            }
            .padding(.horizontal, 19)
            .padding(.bottom, 20)

            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("계정 설정")
                        .font(.system(size: 19, weight: .bold, design: .rounded))
                        .foregroundStyle(SnackStyle.ink)
                    Text("CodeSnack 계정과 나의 활동 관리")
                        .font(.system(size: 11))
                        .foregroundStyle(SnackStyle.muted)
                }
                Spacer()
                Menu {
                    ForEach(sections, id: \.key) { item in
                        Button {
                            currentSection = item.key
                            session.goToSection(item.key)
                            UISelectionFeedbackGenerator().selectionChanged()
                        } label: {
                            Label(item.name, systemImage: item.symbol)
                        }
                    }
                } label: {
                    HStack(spacing: 6) {
                        Text(sectionTitle).lineLimit(1)
                        Image(systemName: "chevron.up.chevron.down").font(.system(size: 10, weight: .bold))
                    }
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(SnackStyle.blue)
                    .padding(.horizontal, 13)
                    .padding(.vertical, 10)
                    .background(SnackStyle.lavenderSoft, in: Capsule())
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 13)

            WebPanelFrame(session: session)
                .clipShape(UnevenRoundedRectangle(topLeadingRadius: 24, topTrailingRadius: 24))
        }
        .onReceive(NotificationCenter.default.publisher(for: .codesnackAccountNeedsRefresh)) { _ in
            session.reload()
        }
    }

    private var displayName: String {
        let name = session.nickname.trimmingCharacters(in: .whitespacesAndNewlines)
        return name.isEmpty || name == "사용자" ? "나의 CodeSnack" : name
    }

    private var sectionTitle: String {
        sections.first(where: { $0.key == currentSection })?.name ?? "계정 정보"
    }

    private func statTile(title: String, value: String, symbol: String, tint: Color, accent: Color) -> some View {
        VStack(alignment: .leading, spacing: 11) {
            HStack(spacing: 7) {
                Image(systemName: symbol)
                    .foregroundStyle(accent)
                Text(title)
                    .foregroundStyle(SnackStyle.muted)
                Spacer(minLength: 0)
            }
            .font(.system(size: 12, weight: .semibold))
            Text(value)
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .foregroundStyle(SnackStyle.ink)
                .contentTransition(.numericText())
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .padding(17)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint, in: RoundedRectangle(cornerRadius: 23, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}
