import SwiftUI

struct BiteLesson: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let minutes: Int
    let symbol: String
    let concept: String
    let code: String
    let takeaway: String
}

struct LearningView: View {
    let openWebsite: (SiteRoute, String?) -> Void
    let switchTab: (AppTab) -> Void
    @State private var language: String = "python"
    @AppStorage("codesnack.mobile.completedLessonIDs") private var completedRaw: String = ""
    @State private var selectedLesson: BiteLesson?

    private var completed: Set<String> { Set(completedRaw.split(separator: ",").map(String.init)) }
    private var currentLessons: [BiteLesson] {
        switch language {
        case "javascript":
            return [
                BiteLesson(id: "js-variable", title: "변수와 자료형", subtitle: "let과 const로 값 저장하기", minutes: 5, symbol: "curlybraces", concept: "변수는 값을 담는 이름표예요. JavaScript에서는 변경 가능한 값은 let, 다시 할당하지 않을 값은 const를 사용합니다.", code: "const name = 'CodeSnack';\nlet level = 1;\nconsole.log(name, level);", takeaway: "const는 다시 할당할 수 없고, let은 다시 할당할 수 있어요."),
                BiteLesson(id: "js-if", title: "조건문", subtitle: "if, else로 선택하기", minutes: 6, symbol: "arrow.triangle.branch", concept: "조건문은 조건이 참인지 거짓인지에 따라 다른 코드를 실행합니다.", code: "const score = 90;\nif (score >= 80) {\n  console.log('잘했어요!');\n} else {\n  console.log('다시 도전!');\n}", takeaway: "비교에는 ===처럼 엄격한 비교 연산자를 사용해 보세요."),
                BiteLesson(id: "js-loop", title: "반복문", subtitle: "for로 반복하기", minutes: 7, symbol: "repeat", concept: "for문은 초기값, 조건식, 증가식을 통해 코드를 여러 번 실행합니다.", code: "for (let i = 1; i <= 3; i++) {\n  console.log(i);\n}", takeaway: "반복을 멈추는 조건이 있는지 확인하세요.")
            ]
        case "python":
            return [
                BiteLesson(id: "py-variable", title: "변수와 자료형", subtitle: "값을 이름으로 저장하기", minutes: 5, symbol: "chevron.left.forwardslash.chevron.right", concept: "변수는 데이터를 저장하고 다시 사용할 수 있게 해 주는 이름입니다. Python은 변수에 값을 대입할 때 = 기호를 사용해요.", code: "name = 'CodeSnack'\nage = 17\nprint(name, age)", takeaway: "문자열은 따옴표로 감싸고 숫자는 그대로 적어요."),
                BiteLesson(id: "py-if", title: "조건문", subtitle: "if, else로 판단하기", minutes: 7, symbol: "arrow.triangle.branch", concept: "조건문은 조건이 맞을 때와 아닐 때 실행할 코드를 구분합니다. Python에서는 들여쓰기가 중요해요.", code: "score = 90\nif score >= 80:\n    print('잘했어요!')\nelse:\n    print('다시 도전!')", takeaway: "if문 마지막에는 콜론(:)을 붙이고 블록을 들여써요."),
                BiteLesson(id: "py-loop", title: "반복문", subtitle: "for, while 이해하기", minutes: 8, symbol: "repeat", concept: "반복문은 같은 작업을 여러 번 실행해요. range(3)은 0, 1, 2를 차례로 만듭니다.", code: "for i in range(3):\n    print(i)", takeaway: "range(3)은 3이 아니라 0부터 2까지의 값이에요.")
            ]
        default: return []
        }
    }

    private var progressPercent: Int {
        let keys = ["py-variable", "py-if", "py-loop", "js-variable", "js-if", "js-loop"]
        return Int(Double(keys.filter { completed.contains($0) }.count) / Double(keys.count) * 100)
    }

    private let languages: [(id: String, title: String, emoji: String)] = [
        ("python", "Python", "🐍"), ("javascript", "JavaScript", "⚡"),
        ("cpp", "C++", "⌘"), ("java", "Java", "☕"), ("csharp", "C#", "#")
    ]

    var body: some View {
        VStack(spacing: 0) {
            SnackBrandHeader(subtitle: "", trailingSymbol: "person.crop.circle") { switchTab(.profile) }
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    intro
                    progressCard
                    languageSelector
                    recommendation
                    lessonsBlock
                    quickActions
                    Text("짧고 맛있는 코딩 학습, CodeSnack")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(SnackStyle.muted)
                        .frame(maxWidth: .infinity)
                        .padding(.bottom, 12)
                }
                .padding(.horizontal, 21)
                .padding(.top, 14)
                .padding(.bottom, 16)
            }
        }
        .sheet(item: $selectedLesson) { lesson in
            LessonSheet(lesson: lesson, isCompleted: completed.contains(lesson.id), markComplete: { mark(lesson.id) }, openStudio: { switchTab(.studio) })
        }
    }

    private var intro: some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(alignment: .leading, spacing: 8) {
                Text("오늘도\n한 입, 코딩해볼까요?")
                    .font(.system(size: 28, weight: .heavy))
                    .tracking(-1.4)
                    .lineSpacing(3)
                    .foregroundStyle(SnackStyle.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text("짧고 맛있는 코딩 학습, CodeSnack")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(SnackStyle.muted)
            }
            Spacer(minLength: 0)
            ZStack {
                Circle().fill(SnackStyle.lavenderSoft).frame(width: 100, height: 100)
                Image("BrandMark")
                    .resizable().scaledToFit()
                    .frame(width: 75, height: 75)
                    .clipShape(RoundedRectangle(cornerRadius: 21))
                    .rotationEffect(.degrees(-7))
                    .shadow(color: SnackStyle.blue.opacity(0.13), radius: 12, y: 8)
                Image(systemName: "sparkle").font(.system(size: 19, weight: .bold))
                    .foregroundStyle(SnackStyle.blue).offset(x: 44, y: -44)
            }
            .frame(width: 100, height: 110)
        }
        .padding(.vertical, 8)
    }

    private var progressCard: some View {
        SnackCard {
            HStack(spacing: 13) {
                Image(systemName: "star.hexagon.fill")
                    .font(.system(size: 30))
                    .foregroundStyle(SnackStyle.brightBlue)
                    .frame(width: 42)
                VStack(alignment: .leading, spacing: 5) {
                    HStack {
                        Text("앱 속 미니 학습").font(.system(size: 12, weight: .medium)).foregroundStyle(SnackStyle.muted)
                        Spacer()
                        Text("\(progressPercent)%").font(.system(size: 15, weight: .heavy)).foregroundStyle(SnackStyle.ink)
                    }
                    Text("\(completed.count)개 단원 완료").font(.system(size: 17, weight: .bold)).foregroundStyle(SnackStyle.ink)
                    GeometryReader { proxy in
                        ZStack(alignment: .leading) {
                            Capsule().fill(SnackStyle.lavender).opacity(0.65)
                            Capsule().fill(LinearGradient(colors: [SnackStyle.brightBlue, SnackStyle.blue], startPoint: .leading, endPoint: .trailing))
                                .frame(width: proxy.size.width * CGFloat(progressPercent) / 100.0)
                        }
                    }
                    .frame(height: 8)
                }
            }
        }
    }

    private var languageSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(languages, id: \.id) { lang in
                    Button {
                        withAnimation(.easeOut(duration: 0.18)) { language = lang.id }
                    } label: {
                        HStack(spacing: 5) {
                            Text(lang.emoji).font(.system(size: 14))
                            Text(lang.title).font(.system(size: 12, weight: .bold))
                        }
                        .foregroundStyle(language == lang.id ? .white : SnackStyle.ink)
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .background(language == lang.id ? SnackStyle.blue : Color.white.opacity(0.83), in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var recommendation: some View {
        Button {
            if let lesson = currentLessons.first { selectedLesson = lesson }
            else { openWebsite(.tutorial, language) }
        } label: {
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 24)
                    .fill(LinearGradient(colors: [SnackStyle.lavenderSoft, SnackStyle.lavender], startPoint: .leading, endPoint: .bottomTrailing))
                HStack(alignment: .bottom, spacing: 6) {
                    VStack(alignment: .leading, spacing: 8) {
                        SnackLabel(text: "오늘의 추천", color: SnackStyle.lime)
                        Text(language == "python" ? "Python으로\n첫 프로그램 만들기" : language == "javascript" ? "JavaScript로\n첫 코드 만들기" : "\(languages.first(where: { $0.id == language })?.title ?? "코딩")\n학습 시작하기")
                            .font(.system(size: 21, weight: .heavy))
                            .foregroundStyle(SnackStyle.ink)
                            .multilineTextAlignment(.leading)
                        Text("작은 코드부터 차근차근 시작해요")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(SnackStyle.ink.opacity(0.8))
                    }
                    Spacer(minLength: 3)
                    ZStack {
                        Circle().fill(.white.opacity(0.35)).frame(width: 75, height: 75)
                        Image(systemName: "chevron.left.forwardslash.chevron.right")
                            .font(.system(size: 30, weight: .bold))
                            .foregroundStyle(SnackStyle.blue)
                            .rotationEffect(.degrees(-6))
                        Circle().fill(.white).frame(width: 34, height: 34)
                            .overlay(Image(systemName: "play.fill").font(.system(size: 13)).foregroundStyle(SnackStyle.blue))
                            .offset(x: 32, y: 33)
                    }
                    .frame(width: 86, height: 100)
                }
                .padding(19)
            }
            .frame(height: 173)
        }
        .buttonStyle(.plain)
    }

    private var lessonsBlock: some View {
        VStack(alignment: .leading, spacing: 12) {
            SnackSectionHeading(title: "한 입에 배우는 코딩", accessory: "전체 학습") { openWebsite(.tutorial, language) }
            if currentLessons.isEmpty {
                SnackCard {
                    VStack(alignment: .leading, spacing: 9) {
                        Text("\(languages.first(where: { $0.id == language })?.title ?? "선택한 언어") 배우기")
                            .font(.system(size: 16, weight: .bold)).foregroundStyle(SnackStyle.ink)
                        Text("이 언어의 전체 강의는 CodeSnack 웹 학습 화면에서 이어서 볼 수 있어요.")
                            .font(.system(size: 12)).foregroundStyle(SnackStyle.muted)
                        SnackPrimaryButton(title: "강의 열기", symbol: "book.closed.fill") { openWebsite(.tutorial, language) }
                    }
                }
            } else {
                HStack(alignment: .top, spacing: 8) {
                    ForEach(currentLessons.indices, id: \.self) { index in
                        let item = currentLessons[index]
                        Button { selectedLesson = item } label: {
                            VStack(alignment: .leading, spacing: 11) {
                                Image(systemName: item.symbol)
                                    .font(.system(size: 23, weight: .medium))
                                    .foregroundStyle(index == 1 ? Color(red: 0.63, green: 0.76, blue: 0.09) : SnackStyle.blue)
                                    .frame(height: 30)
                                Text(item.title)
                                    .font(.system(size: 13, weight: .heavy))
                                    .foregroundStyle(SnackStyle.ink)
                                    .fixedSize(horizontal: false, vertical: true)
                                Text("◷ \(item.minutes)분")
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(SnackStyle.muted)
                                if completed.contains(item.id) {
                                    Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                                        .font(.system(size: 11))
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(13)
                            .frame(minHeight: 138, alignment: .topLeading)
                            .background(Color.white.opacity(0.87), in: RoundedRectangle(cornerRadius: 19))
                            .shadow(color: SnackStyle.ink.opacity(0.035), radius: 8, y: 3)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 11) {
            SnackSectionHeading(title: "빠른 접근")
            HStack(spacing: 10) {
                Button { openWebsite(.quiz, language) } label: {
                    quickActionCard(symbol: "trophy.fill", title: "퀴즈", subtitle: "배운 내용을 점검해요", tint: SnackStyle.lavenderSoft)
                }.buttonStyle(.plain)
                Button { openWebsite(.examples, language) } label: {
                    quickActionCard(symbol: "chevron.left.forwardslash.chevron.right", title: "코드 예제", subtitle: "보고, 실행해요", tint: SnackStyle.lime.opacity(0.75))
                }.buttonStyle(.plain)
            }
        }
    }

    private func quickActionCard(symbol: String, title: String, subtitle: String, tint: Color) -> some View {
        HStack(spacing: 9) {
            Image(systemName: symbol).foregroundStyle(SnackStyle.blue).font(.system(size: 20))
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.system(size: 13, weight: .heavy))
                Text(subtitle).font(.system(size: 10)).lineLimit(2)
            }
            .foregroundStyle(SnackStyle.ink)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .frame(minHeight: 73)
        .background(tint, in: RoundedRectangle(cornerRadius: 18))
    }

    private func mark(_ id: String) {
        var values = completed
        values.insert(id)
        completedRaw = values.sorted().joined(separator: ",")
    }
}

struct LessonSheet: View {
    @Environment(\.dismiss) private var dismiss
    let lesson: BiteLesson
    let isCompleted: Bool
    let markComplete: () -> Void
    let openStudio: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 10) {
                        SnackLabel(text: "5분 학습 · CodeSnack")
                        Text(lesson.title)
                            .font(.system(size: 30, weight: .heavy)).foregroundStyle(SnackStyle.ink)
                        Text(lesson.subtitle)
                            .foregroundStyle(SnackStyle.muted)
                    }
                    SnackCard {
                        Text("핵심 개념").font(.system(size: 16, weight: .bold)).padding(.bottom, 5)
                        Text(lesson.concept).font(.system(size: 15)).lineSpacing(5)
                    }
                    VStack(alignment: .leading, spacing: 10) {
                        Text("이렇게 작성해요").font(.system(size: 17, weight: .bold)).foregroundStyle(SnackStyle.ink)
                        Text(lesson.code)
                            .font(.system(size: 13, design: .monospaced))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(17)
                            .background(SnackStyle.ink, in: RoundedRectangle(cornerRadius: 20))
                            .textSelection(.enabled)
                    }
                    SnackCard {
                        Label("기억해요!", systemImage: "lightbulb.fill")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(SnackStyle.blue)
                        Text(lesson.takeaway).font(.system(size: 14)).padding(.top, 4)
                    }
                    SnackPrimaryButton(title: isCompleted ? "학습 완료 ✓" : "학습 완료로 표시", symbol: "checkmark.circle") {
                        markComplete(); dismiss()
                    }
                }
                .padding(22)
            }
            .background(SnackCanvas())
            .navigationTitle("한 입 학습")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("닫기") { dismiss() } } }
        }
    }
}
