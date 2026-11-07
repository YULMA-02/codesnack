import SwiftUI
import WebKit
import UIKit

// GitHub Pages의 CodeSnack 사이트를 그대로 앱 안에 표시합니다.
private enum CodeSnackSite {
    static let startURL = URL(string: "https://yulma-02.github.io/codesnack/")!
    static let allowedHost = "yulma-02.github.io"
}

@MainActor
final class BrowserState: ObservableObject {
    @Published var isLoading = true
    @Published var errorMessage: String? = nil
    weak var webView: WKWebView?

    func retry() {
        errorMessage = nil
        isLoading = true
        webView?.load(URLRequest(url: CodeSnackSite.startURL, cachePolicy: .reloadIgnoringLocalCacheData))
    }
}

struct ContentView: View {
    @StateObject private var browser = BrowserState()

    var body: some View {
        ZStack {
            Color(red: 0.973, green: 0.961, blue: 0.925)
                .ignoresSafeArea()

            CodeSnackWebView(browser: browser)

            if let error = browser.errorMessage {
                VStack(spacing: 14) {
                    Image(systemName: "wifi.exclamationmark")
                        .font(.system(size: 33, weight: .medium))
                        .foregroundColor(Color(red: 0.21, green: 0.30, blue: 0.90))
                    Text("CodeSnack에 연결할 수 없어요")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(red: 0.13, green: 0.14, blue: 0.25))
                    Text(error)
                        .font(.system(size: 13))
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                    Button(action: browser.retry) {
                        Text("다시 연결하기")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 13)
                            .background(Color(red: 0.21, green: 0.30, blue: 0.90))
                            .clipShape(Capsule())
                    }
                }
                .padding(28)
                .frame(maxWidth: 330)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                .shadow(color: .black.opacity(0.08), radius: 20, y: 6)
                .padding(22)
            } else if browser.isLoading {
                VStack(spacing: 12) {
                    ProgressView()
                        .tint(Color(red: 0.21, green: 0.30, blue: 0.90))
                    Text("CodeSnack 연결 중…")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.secondary)
                }
                .padding(24)
                .background(.regularMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
        }
        .preferredColorScheme(.light) // 사이트 자체의 다크 모드 기능은 웹 안에서 사용
    }
}

struct CodeSnackWebView: UIViewRepresentable {
    @ObservedObject var browser: BrowserState

    func makeCoordinator() -> Coordinator { Coordinator(browser: browser) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default() // 앱 내 로그인/학습 기록을 저장하는 영구 저장소
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.allowsInlineMediaPlayback = true

        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.allowsBackForwardNavigationGestures = true
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.973, green: 0.961, blue: 0.925, alpha: 1)
        view.scrollView.backgroundColor = view.backgroundColor

        let refresh = UIRefreshControl()
        refresh.addTarget(context.coordinator, action: #selector(Coordinator.refresh), for: .valueChanged)
        view.scrollView.refreshControl = refresh

        context.coordinator.webView = view
        browser.webView = view
        view.load(URLRequest(url: CodeSnackSite.startURL, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 30))
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // 상태가 바뀌어도 WKWebView를 새로 생성하지 않아서 로그인 세션과 화면이 유지됩니다.
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var browser: BrowserState
        weak var webView: WKWebView?

        init(browser: BrowserState) { self.browser = browser }

        @objc func refresh() { webView?.reload() }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            browser.errorMessage = nil
            browser.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            browser.isLoading = false
            webView.scrollView.refreshControl?.endRefreshing()
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            showError(error, in: webView)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            showError(error, in: webView)
        }

        private func showError(_ error: Error, in webView: WKWebView) {
            webView.scrollView.refreshControl?.endRefreshing()
            // 링크 이동 취소(-999)는 일반적인 사용자 조작이므로 오류로 보지 않습니다.
            if (error as NSError).code == NSURLErrorCancelled { return }
            browser.isLoading = false
            browser.errorMessage = "인터넷 연결을 확인한 뒤 다시 시도해 주세요."
        }

        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }

            // 동일 사이트의 탐색은 앱 안에서, 외부 웹사이트는 Safari에서 열립니다.
            if navigationAction.targetFrame?.isMainFrame == true,
               let scheme = url.scheme?.lowercased(),
               (scheme == "https" || scheme == "http"),
               url.host?.lowercased() != CodeSnackSite.allowedHost {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView,
                     createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction,
                     windowFeatures: WKWindowFeatures) -> WKWebView? {
            guard navigationAction.targetFrame == nil, let url = navigationAction.request.url else { return nil }
            if url.host?.lowercased() == CodeSnackSite.allowedHost {
                webView.load(URLRequest(url: url))
            } else {
                UIApplication.shared.open(url)
            }
            return nil
        }

        // CodeSnack의 파일 관리나 퀴즈 삭제에 사용되는 confirm()/prompt() 지원
        private func topController() -> UIViewController? {
            let window = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first(where: { $0.isKeyWindow })
            var controller = window?.rootViewController
            while let presented = controller?.presentedViewController { controller = presented }
            return controller
        }

        func webView(_ webView: WKWebView,
                     runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping () -> Void) {
            guard let presenter = topController() else { completionHandler(); return }
            let alert = UIAlertController(title: "CodeSnack", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler() })
            presenter.present(alert, animated: true)
        }

        func webView(_ webView: WKWebView,
                     runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping (Bool) -> Void) {
            guard let presenter = topController() else { completionHandler(false); return }
            let alert = UIAlertController(title: "CodeSnack", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "취소", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "확인", style: .default) { _ in completionHandler(true) })
            presenter.present(alert, animated: true)
        }

        func webView(_ webView: WKWebView,
                     runJavaScriptTextInputPanelWithPrompt prompt: String,
                     defaultText: String?,
                     initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping (String?) -> Void) {
            guard let presenter = topController() else { completionHandler(nil); return }
            let alert = UIAlertController(title: "CodeSnack", message: prompt, preferredStyle: .alert)
            alert.addTextField { field in field.text = defaultText }
            alert.addAction(UIAlertAction(title: "취소", style: .cancel) { _ in completionHandler(nil) })
            alert.addAction(UIAlertAction(title: "확인", style: .default) { _ in
                completionHandler(alert.textFields?.first?.text)
            })
            presenter.present(alert, animated: true)
        }
    }
}
