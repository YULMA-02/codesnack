import Foundation

// Scoped presentation tweaks are injected ONLY inside the iOS WKWebView.
// They do not change the existing GitHub Pages website's CSS or business logic.
enum MobileWebCSS {
    static let script = #"""
    (function () {
      if (document.getElementById('codesnack-mobile-overrides')) return;
      var style = document.createElement('style');
      style.id = 'codesnack-mobile-overrides';
      style.textContent = `
       html,body { width:100%!important; max-width:100%!important; overscroll-behavior-x:none!important; }
       body.cs-app { display:block!important; background:#fffaf9!important; min-height:100dvh!important; }
       .cs-header,.cs-mobile-nav,.cs-desktop-nav,.cs-language-bar,#langRibbon,.cs-streak,.cs-theme-toggle,
       .cs-site-footer { display:none!important; }
       .cs-main { display:block!important; width:100%!important; max-width:none!important; min-width:0!important; min-height:100dvh!important; padding:0!important; margin:0!important; }
       .cs-main > section { width:100%!important; max-width:100%!important; margin:0!important; }
       #toastNotification { bottom:18px!important; z-index:9999!important; }

       /* Mobile studio: project selector, editor, runner, output on a single column. */
       body[data-cs-mobile-route="vscode"] #view-vscode {padding:3px 0 0!important;}
       #view-vscode .studio-intro,#view-vscode .studio-bottom-note,
       #view-vscode .studio-appbrand,#view-vscode .studio-rail,
       #view-vscode .studio-statusbar,#view-vscode .studio-runner-panel {display:none!important;}
       #view-vscode .studio-project-toolbar {display:flex!important; flex-direction:column!important; align-items:stretch!important;
          gap:8px!important; margin:0 8px 10px!important; padding:7px 10px!important; border-radius:18px!important; background:#fff!important;}
       #view-vscode .studio-project-chooser {min-width:0!important; width:100%!important;}
       #view-vscode .studio-project-chooser select {max-width:100%!important;}
       #view-vscode .studio-quick-tools {display:none!important;}
       #view-vscode .studio-surface {margin:0 8px!important; width:calc(100% - 16px)!important; max-width:none!important;
          min-height:0!important; overflow:hidden!important; border-radius:20px!important;}
       #view-vscode .studio-appbar {height:auto!important; min-height:45px!important; padding:6px!important;
          gap:0!important; flex-wrap:wrap!important;}
       #view-vscode .studio-appactions {display:flex!important; width:100%!important; flex-wrap:nowrap!important; overflow:auto!important; gap:5px!important;}
       #view-vscode .studio-appactions .studio-tool-btn {font-size:10px!important; padding:7px!important; white-space:nowrap!important;}
       #view-vscode .studio-appactions .studio-execute {font-size:11px!important; padding:8px 10px!important; white-space:nowrap!important;}
       #view-vscode .studio-body {display:block!important; min-height:0!important; height:auto!important;}
       #view-vscode .studio-explorer {display:none!important;}
       #view-vscode .studio-editorpane {display:block!important; min-width:0!important; width:100%!important; max-width:none!important;}
       #view-vscode .studio-tabs {height:41px!important; max-width:100vw!important; overflow:auto!important;}
       #view-vscode .studio-breadcrumb {height:32px!important; padding:0 9px!important; overflow:hidden!important;}
       #view-vscode .studio-codepane {height:41dvh!important; min-height:235px!important; max-height:450px!important; overflow:hidden!important;}
       #view-vscode .studio-code-editor,#view-vscode #vscCodeEditor {font-size:13px!important; line-height:1.6!important;
          min-height:225px!important; white-space:pre!important; -webkit-text-size-adjust:100%!important;}
       #view-vscode .studio-line-numbers {font-size:12px!important; line-height:1.73!important;}
       #view-vscode .studio-terminal {height:160px!important; min-height:150px!important; max-height:240px!important; overflow:auto!important;}
       #view-vscode .studio-terminal-output {height:115px!important; overflow:auto!important; font-size:12px!important;}
       #view-vscode .studio-quiz-notice {margin:8px!important;}

       /* Chat: the native app provides the header, question chips, and tab bar. */
       body[data-cs-mobile-route="ai-chat"] #view-ai-chat {min-height:100dvh!important; height:100dvh!important;
          padding:0!important; margin:0!important; background:transparent!important;}
       #view-ai-chat .cs-chat-sidebar,#view-ai-chat .cs-chat-window-header {display:none!important;}
       #view-ai-chat .cs-chat-layout {display:block!important; width:100%!important; max-width:none!important;
          min-height:100dvh!important; height:100dvh!important; padding:0!important; margin:0!important;}
       #view-ai-chat .cs-chat-window {display:flex!important; flex-direction:column!important; height:100dvh!important;
          min-height:0!important; width:100%!important; max-width:none!important; border:none!important; border-radius:0!important;
          box-shadow:none!important; margin:0!important; background:transparent!important;}
       #view-ai-chat .cs-chat-messages {display:block!important; flex:1 1 0!important; min-height:0!important;
          height:auto!important; width:100%!important; overflow-y:auto!important; padding:15px 14px!important;}
       #view-ai-chat .cs-chat-empty {padding:22px 12px!important;}
       #view-ai-chat .cs-chat-empty-symbol {transform:scale(.75)!important; margin-bottom:0!important;}
       #view-ai-chat .cs-chat-empty h3 {font-size:21px!important;}
       #view-ai-chat .cs-chat-starter-grid {grid-template-columns:1fr!important; max-width:100%!important;}
       #view-ai-chat .cs-chat-composer {flex:0 0 auto!important; width:100%!important; padding:10px 12px 13px!important;
          background:#fffaf9!important; border-top:1px solid rgba(45,47,95,.06)!important;}
       #view-ai-chat .cs-chat-composer-hint {display:none!important;}
       #view-ai-chat .cs-chat-composer-field {border-radius:20px!important;}
       #view-ai-chat .cs-chat-composer textarea {font-size:15px!important; min-height:33px!important;}

       /* My page: horizontal native section pills above actual website account data. */
       body[data-cs-mobile-route="mypage"] #view-mypage {padding:0 7px!important; min-height:0!important;}
       #view-mypage .mp-sidebar {display:none!important;}
       #view-mypage .mp-shell {display:block!important; width:100%!important; max-width:none!important; min-width:0!important;
          margin:0!important; padding:0!important; gap:0!important;}
       #view-mypage .mp-content {width:100%!important; max-width:none!important; min-width:0!important; padding:0!important;}
       #view-mypage .mp-panel {width:100%!important; max-width:none!important; padding:3px 0 18px!important; margin:0!important;}
       #view-mypage .mp-panel-heading {padding:11px!important; margin-bottom:8px!important;}
       #view-mypage .mp-panel-heading h1 {font-size:21px!important;}
       #view-mypage .mp-subcard {border-radius:20px!important; padding:15px!important;}
       #view-mypage .mp-stat-grid {display:grid!important; grid-template-columns:1fr 1fr!important; gap:8px!important;}
       #view-mypage .mp-stat-card {min-width:0!important; padding:14px!important;}
       #view-mypage .mp-inline-form {display:flex!important; flex-direction:column!important; align-items:stretch!important; gap:9px!important;}
       #view-mypage input {font-size:16px!important; max-width:100%!important;}
       #view-mypage .mp-hint-card {display:none!important;}

       /* Learning, quiz, roadmap, and examples when launched from native sheet. */
       body[data-cs-mobile-route="tutorial"] #view-tutorial,
       body[data-cs-mobile-route="quiz"] #view-quiz,
       body[data-cs-mobile-route="templates"] #view-templates,
       body[data-cs-mobile-route="path"] #view-path,
       body[data-cs-mobile-route="auth"] #view-auth {padding:15px!important; max-width:100%!important;}
      `;
      document.head.appendChild(style);
    })();
    """#
}
