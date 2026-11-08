import SwiftUI
import UIKit

enum AppTab: Int, CaseIterable, Identifiable, Hashable {
    case learn, studio, tutor, profile

    var id: Int { rawValue }
    var title: String {
        switch self {
        case .learn: return "학습하기"
        case .studio: return "스낵 스튜디오"
        case .tutor: return "AI 튜터"
        case .profile: return "마이페이지"
        }
    }
    var symbol: String {
        switch self {
        case .learn: return "book.closed.fill"
        case .studio: return "chevron.left.forwardslash.chevron.right"
        case .tutor: return "sparkles"
        case .profile: return "person.crop.circle"
        }
    }
}

struct ContentView: View {
    @State private var tab: AppTab = .learn
    @State private var visited: Set<AppTab> = [.learn]
    @State private var keyboardVisible = false
    @State private var webSheet: WebsiteDestination?

    var body: some View {
        ZStack {
            SnackCanvas()
            // Keep visited tabs mounted so in-progress studio edits and AI chats survive tab changes.
            tabLayer(.learn) {
                LearningView(openWebsite: showWeb, switchTab: selectTab)
            }
            if visited.contains(.studio) {
                tabLayer(.studio) { StudioView(openWebsite: showWeb) }
            }
            if visited.contains(.tutor) {
                tabLayer(.tutor) { TutorView() }
            }
            if visited.contains(.profile) {
                tabLayer(.profile) { ProfileView(openWebsite: showWeb) }
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if !keyboardVisible {
                SnackTabBar(selected: $tab)
                    .padding(.horizontal, 18)
                    .padding(.top, 6)
                    .padding(.bottom, 4)
            }
        }
        .onChange(of: tab) { newTab in visited.insert(newTab) }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)) { _ in
            keyboardVisible = true
        }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)) { _ in
            keyboardVisible = false
        }
        .sheet(item: $webSheet, onDismiss: {
            NotificationCenter.default.post(name: .codesnackAccountNeedsRefresh, object: nil)
        }) { dest in
            WebsiteSheet(destination: dest)
        }
        .preferredColorScheme(.light)
        .tint(SnackStyle.blue)
    }

    private func tabLayer<Content: View>(_ item: AppTab, @ViewBuilder content: () -> Content) -> some View {
        content()
            .opacity(tab == item ? 1 : 0)
            .allowsHitTesting(tab == item)
            .accessibilityHidden(tab != item)
            .zIndex(tab == item ? 1 : 0)
    }

    private func showWeb(_ route: SiteRoute, _ language: String?) {
        webSheet = WebsiteDestination(route: route, language: language)
    }
    private func selectTab(_ tab: AppTab) {
        withAnimation(.easeInOut(duration: 0.22)) { self.tab = tab }
    }
}

struct SnackTabBar: View {
    @Binding var selected: AppTab

    var body: some View {
        HStack(spacing: 2) {
            ForEach(AppTab.allCases) { tab in
                Button {
                    withAnimation(.spring(response: 0.31, dampingFraction: 0.84)) { selected = tab }
                    UISelectionFeedbackGenerator().selectionChanged()
                } label: {
                    VStack(spacing: 5) {
                        Image(systemName: tab.symbol)
                            .font(.system(size: 20, weight: selected == tab ? .bold : .medium))
                            .frame(height: 22)
                        Text(tab.title)
                            .font(.system(size: 10, weight: selected == tab ? .heavy : .medium))
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                    }
                    .foregroundStyle(selected == tab ? SnackStyle.blue : SnackStyle.ink)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background {
                        if selected == tab {
                            Capsule().fill(SnackStyle.blue.opacity(0.12))
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(tab.title)
                .accessibilityAddTraits(selected == tab ? .isSelected : [])
            }
        }
        .padding(6)
        .snackGlass(radius: 34)
        .shadow(color: SnackStyle.ink.opacity(0.09), radius: 20, y: 8)
    }
}
