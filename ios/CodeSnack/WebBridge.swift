import SwiftUI
import WebKit
import UIKit

extension Notification.Name {
    static let codesnackAccountNeedsRefresh = Notification.Name("codesnack.account.needsRefresh")
}

// Existing CodeSnack features remain on the GitHub Pages origin.
// The native shell changes presentation only and never stores API keys.
enum SiteRoute: String {
    case tutorial = "tutorial"
    case quiz = "quiz"
    case studio = "vscode"
    case tutor = "ai-chat"
    case profile = "mypage"
    case examples = "templates"
    case roadmap = "path"
    case auth = "auth"
}

struct WebsiteDestination: Identifiable {
    let id = UUID()
    let route: SiteRoute
    let language: String?
    init(route: SiteRoute, language: String? = nil) {
        self.route = route
        self.language = language
    }
}

enum SnackSite {
    static let home = URL(string: "https://yulma-02.github.io/codesnack/")!
    static let host = "yulma-02.github.io"
}

@MainActor
final class WebSession: ObservableObject {
    @Published var loading = true
    @Published var routeReady = false
    @Published var failed = false
    @Published var nickname = ""
    @Published var xp = ""
    @Published var streak = ""
    @Published var solved = ""
    weak var webView: WKWebView?
    let route: SiteRoute
    let language: String?

    init(route: SiteRoute, language: String? = nil) {
        self.route = route
        self.language = language
    }

    func reload() {
        failed = false
        loading = true
        routeReady = false
        webView?.reload()
    }

    func execute(_ script: String) {
        // Called only for user-initiated actions; gracefully waits for asynchronous page modules.
        let guarded = """
        (function(){
            var command = \(Self.javascriptString(script));
            var attempts = 0;
            function invoke(){
                try {
                    if (typeof window.switchTab === 'function' && document.getElementById('view-\(route.rawValue)')) {
                        (0,eval)(command);
                        return;
                    }
                } catch(e) { console.warn('CodeSnack mobile action:',e); return; }
                if (++attempts < 45) setTimeout(invoke, 200);
            }
            invoke();
        })();
        """
        webView?.evaluateJavaScript(guarded, completionHandler: nil)
    }

    func goToSection(_ section: String) {
        let allowed = ["profile", "learning", "role", "quizzes", "preferences"]
        guard allowed.contains(section) else { return }
        execute("if (typeof switchMyPageSection === 'function') switchMyPageSection(\(Self.javascriptString(section))); ")
    }

    func navigate() {
        // Web pages are loaded from the GitHub Pages origin so login and data persist.
        // Hide the HTML until its asynchronous page modules are ready AND the target
        // section is visible. This prevents a flash of the site's home screen.
        let script = """
        (function(){
           if (window.__csNativeRoutingStarted) return;
           window.__csNativeRoutingStarted = true;
           var route = \(Self.javascriptString(route.rawValue));
           var lang = \(Self.javascriptString(language ?? ""));
           var attempts = 0;
           function post(data) {
             try { window.webkit.messageHandlers.csBridge.postMessage(data); }
             catch(e) { console.warn('Native bridge:',e); }
           }
           function apply() {
             var view = document.getElementById('view-' + route);
             var hasModularBootstrap = !!document.querySelector('script[src*="bootstrap.js"]');
             var siteReady = hasModularBootstrap ? window.codesnackPagesReady === true : document.readyState === 'complete';
             if (siteReady && typeof window.switchTab === 'function' && view) {
               try {
                 if (lang && typeof window.setLanguage === 'function') window.setLanguage(lang);
                 window.switchTab(route);
                 if (route === 'mypage' && typeof window.switchMyPageSection === 'function') {
                   window.switchMyPageSection('profile');
                 }
                 document.body.dataset.csMobileRoute = route;
                 window.scrollTo(0, 0);
                 // Only reveal the document after the destination has been selected.
                 document.documentElement.classList.add('cs-native-ready');
                 post({kind:'ready'});
                 if (route === 'mypage') {
                   var ids=['profileNickname','myPageXP','myPageStreak','myPageSolvedCount'];
                   var get=function(id){ return (document.getElementById(id)?.textContent||'').trim(); };
                   var sync=function(){
                     post({kind:'profile',nickname:get(ids[0]),xp:get(ids[1]),streak:get(ids[2]),solved:get(ids[3])});
                   };
                   sync();
                   var observer = new MutationObserver(sync);
                   ids.forEach(function(id){
                     var el = document.getElementById(id);
                     if(el) observer.observe(el,{childList:true,characterData:true,subtree:true});
                   });
                   setTimeout(sync, 750);
                   setTimeout(sync, 2200);
                 }
                 return;
               } catch(e) { console.warn('CodeSnack native navigation failed:',e); }
             }
             if (++attempts < 120) { setTimeout(apply, 160); }
             else { post({kind:'routeError'}); }
           }
           apply();
        })();
        """
        webView?.evaluateJavaScript(script, completionHandler: nil)
    }

    static func javascriptString(_ value: String) -> String {
        guard let data = try? JSONEncoder().encode(value),
              let result = String(data: data, encoding: .utf8) else { return "\"\"" }
        return result
    }
}

struct CodeSnackWebPanel: UIViewRepresentable {
    @ObservedObject var session: WebSession
    var fullSite: Bool = false

    func makeCoordinator() -> Coordinator { Coordinator(session: session) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default() // Existing login + localStorage persist across tabs/relaunches.
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.allowsInlineMediaPlayback = true
        config.userContentController.add(context.coordinator, name: "csBridge")
        if !fullSite {
            // A tiny preflight stylesheet blocks the initial home-page flash.
            // WKUserScript executes before the site's first paint.
            let route = WebSession.javascriptString(session.route.rawValue)
            let startup = """
            (function(){
              document.documentElement.classList.add('cs-native-boot');
              var style = document.createElement('style');
              style.textContent = 'html.cs-native-boot:not(.cs-native-ready) body { visibility:hidden !important; }';
              document.documentElement.appendChild(style);
              document.addEventListener('DOMContentLoaded', function(){
                document.body.dataset.csMobileRoute = \(route);
              }, {once:true});
            })();
            """
            config.userContentController.addUserScript(WKUserScript(source: startup, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        if !fullSite {
            config.userContentController.addUserScript(WKUserScript(source: MobileWebCSS.script, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        }

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.995, green: 0.983, blue: 0.975, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.scrollView.bounces = true
        context.coordinator.webView = webView
        session.webView = webView
        // Hash routing lets CodeSnack's own bootstrap select the target directly.
        let targetURL = URL(string: SnackSite.home.absoluteString + "#" + session.route.rawValue) ?? SnackSite.home
        webView.load(URLRequest(url: targetURL, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 35))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) { }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        let session: WebSession
        weak var webView: WKWebView?
        init(session: WebSession) { self.session = session }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let value = message.body as? [String: Any], let kind = value["kind"] as? String else { return }
            switch kind {
            case "ready":
                session.routeReady = true
                session.loading = false
                session.failed = false
            case "routeError":
                session.routeReady = false
                session.loading = false
                session.failed = true
            case "profile":
                session.nickname = value["nickname"] as? String ?? ""
                session.xp = value["xp"] as? String ?? ""
                session.streak = value["streak"] as? String ?? ""
                session.solved = value["solved"] as? String ?? ""
            default: break
            }
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            session.loading = true
            session.routeReady = false
            session.failed = false
        }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            session.loading = false
            session.failed = false
            session.navigate()
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { handle(error) }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { handle(error) }
        private func handle(_ error: Error) {
            if (error as NSError).code == NSURLErrorCancelled { return }
            session.loading = false
            session.routeReady = false
            session.failed = true
        }
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else { decisionHandler(.allow); return }
            let scheme = url.scheme?.lowercased() ?? ""
            if (scheme == "https" || scheme == "http"), navigationAction.targetFrame?.isMainFrame == true,
               url.host?.lowercased() != SnackSite.host {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            guard navigationAction.targetFrame == nil, let url = navigationAction.request.url else { return nil }
            if url.host?.lowercased() == SnackSite.host { webView.load(URLRequest(url: url)) }
            else { UIApplication.shared.open(url) }
            return nil
        }
        private func topController() -> UIViewController? {
            let window = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first(where: { $0.isKeyWindow })
            var result = window?.rootViewController
            while let presented = result?.presentedViewController { result = presented }
            return result
        }
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            guard let top = topController() else { completionHandler(); return }
            let alert = UIAlertController(title: "CodeSnack", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler() })
            top.present(alert, animated: true)
        }
        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            guard let top = topController() else { completionHandler(false); return }
            let alert = UIAlertController(title: "CodeSnack", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "취소", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler(true) })
            top.present(alert, animated: true)
        }
        func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String,
                     defaultText: String?, initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping (String?) -> Void) {
            guard let top = topController() else { completionHandler(nil); return }
            let alert = UIAlertController(title: "CodeSnack", message: prompt, preferredStyle: .alert)
            alert.addTextField { $0.text = defaultText }
            alert.addAction(UIAlertAction(title: "취소", style: .cancel) { _ in completionHandler(nil) })
            alert.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler(alert.textFields?.first?.text) })
            top.present(alert, animated: true)
        }
    }
}

struct WebsiteSheet: View {
    @Environment(\.dismiss) private var dismiss
    let destination: WebsiteDestination
    @StateObject private var session: WebSession

    init(destination: WebsiteDestination) {
        self.destination = destination
        _session = StateObject(wrappedValue: WebSession(route: destination.route, language: destination.language))
    }

    var body: some View {
        NavigationStack {
            WebPanelFrame(session: session, fullSite: false)
                .navigationTitle(label)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) { Button("닫기") { dismiss() } }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { session.reload() } label: { Image(systemName: "arrow.clockwise") }
                            .accessibilityLabel("새로고침")
                    }
                }
        }
        .presentationDragIndicator(.visible)
    }

    private var label: String {
        switch destination.route {
        case .tutorial: return "전체 학습"
        case .quiz: return "퀴즈"
        case .studio: return "스낵 스튜디오"
        case .tutor: return "AI 튜터"
        case .profile: return "마이페이지"
        case .examples: return "코드 예제"
        case .roadmap: return "학습 로드맵"
        case .auth: return "로그인 · 가입"
        }
    }
}

struct WebPanelFrame: View {
    @ObservedObject var session: WebSession
    var fullSite = false

    var body: some View {
        ZStack {
            SnackStyle.cream
            CodeSnackWebPanel(session: session, fullSite: fullSite)
                .opacity(session.routeReady ? 1 : 0)

            if !session.routeReady && !session.failed {
                VStack(spacing: 10) {
                    ProgressView().tint(SnackStyle.blue)
                    Text("화면을 불러오는 중")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(SnackStyle.muted)
                }
                .accessibilityLabel("CodeSnack 화면을 불러오는 중")
            }

            if session.failed {
                VStack(spacing: 14) {
                    Image(systemName: "wifi.exclamationmark")
                        .font(.system(size: 27, weight: .medium))
                        .foregroundStyle(SnackStyle.blue)
                    Text("화면을 불러오지 못했어요")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(SnackStyle.ink)
                    Text("네트워크 연결을 확인하고 다시 시도해 주세요.")
                        .font(.system(size: 12))
                        .foregroundStyle(SnackStyle.muted)
                        .multilineTextAlignment(.center)
                    SnackPrimaryButton(title: "다시 연결", symbol: "arrow.clockwise") { session.reload() }
                }
                .padding(23)
                .background(.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 23))
                .padding(20)
            }
        }
        .animation(.easeOut(duration: 0.18), value: session.routeReady)
        .background(SnackStyle.cream)
    }
}
