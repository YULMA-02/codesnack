/* CodeSnack Android v1.0.2: one continuous My Page scroll in the existing WebView. */
function installCodeSnackProfileShell() {
    'use strict';
    var view = document.getElementById('view-mypage');
    if (!view || view.querySelector('.cs-android-profile')) return;
    var shell = view.querySelector('.mp-shell');
    if (!shell) return;

    var dashboard = document.createElement('div');
    dashboard.className = 'cs-android-profile';
    dashboard.innerHTML = [
      '<div class="cs-android-profile-intro">',
        '<div class="cs-android-profile-eyebrow">MY CODESNACK</div>',
        '<div class="cs-android-profile-identity">',
          '<div class="cs-android-profile-avatar" aria-hidden="true">{ }</div>',
          '<div class="cs-android-profile-user">',
            '<strong id="cs-android-profile-name">나의 CodeSnack</strong>',
            '<span>오늘도 차곡차곡, 나의 코딩 기록</span>',
          '</div>',
          '<a id="cs-android-profile-login" href="codesnack://auth" aria-label="로그인 또는 회원가입">로그인</a>',
        '</div>',
      '</div>',
      '<div class="cs-android-stat-row" aria-label="내 학습 통계">',
        '<div class="cs-android-stat cs-android-stat-xp">',
          '<span class="cs-android-stat-caption">★ &nbsp;누적 경험치</span>',
          '<strong id="cs-android-stat-xp">—</strong>',
          '<span class="cs-android-stat-footer">지금까지 모은 XP</span>',
        '</div>',
        '<div class="cs-android-stat cs-android-stat-streak">',
          '<span class="cs-android-stat-caption">⚡ &nbsp;연속 학습</span>',
          '<strong id="cs-android-stat-streak">—</strong>',
          '<span class="cs-android-stat-footer">하루 한 입의 꾸준함</span>',
        '</div>',
      '</div>',
      '<div class="cs-android-account-heading">',
        '<h2>계정 설정</h2>',
        '<p>프로필과 학습 활동을 관리해요</p>',
      '</div>',
      '<nav class="cs-android-account-nav" aria-label="마이페이지 메뉴">',
        '<button type="button" class="is-active" data-cs-section="profile" aria-pressed="true">내 정보</button>',
        '<button type="button" data-cs-section="learning" aria-pressed="false">학습 기록</button>',
        '<button type="button" data-cs-section="quizzes" aria-pressed="false">내 퀴즈</button>',
        '<button type="button" data-cs-section="role" aria-pressed="false">수업</button>',
        '<button type="button" data-cs-section="preferences" aria-pressed="false">화면 설정</button>',
      '</nav>'
    ].join('');
    view.insertBefore(dashboard, shell);

    var footer = document.createElement('div');
    footer.className = 'cs-android-profile-footer';
    footer.innerHTML = '<button type="button" class="cs-android-logout">로그아웃</button>';
    shell.insertAdjacentElement('afterend', footer);
    footer.querySelector('button').addEventListener('click', function() {
        if (typeof window.handleLogout === 'function') window.handleLogout();
    });

    var labels = {
      profile: '내 정보', learning: '학습 기록', quizzes: '내 퀴즈',
      role: '수업', preferences: '화면 설정'
    };
    function select(section) {
        if (!Object.prototype.hasOwnProperty.call(labels, section)) return;
        if (typeof window.switchMyPageSection === 'function') window.switchMyPageSection(section);
        refreshSelected();
    }
    function refreshSelected() {
        dashboard.querySelectorAll('[data-cs-section]').forEach(function(button) {
            var section = button.getAttribute('data-cs-section');
            var panel = view.querySelector('[data-mp-panel="' + section + '"]');
            var active = !!panel && panel.classList.contains('is-active');
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }
    dashboard.querySelector('.cs-android-account-nav').addEventListener('click', function(event) {
        var button = event.target.closest('[data-cs-section]');
        if (button) select(button.getAttribute('data-cs-section'));
    });

    var inputs = [
        ['profileNickname', 'cs-android-profile-name', '나의 CodeSnack'],
        ['myPageXP', 'cs-android-stat-xp', '—'],
        ['myPageStreak', 'cs-android-stat-streak', '—']
    ];
    function syncStats() {
        inputs.forEach(function(parts) {
            var source = document.getElementById(parts[0]);
            var target = document.getElementById(parts[1]);
            if (!target) return;
            var value = source ? (source.textContent || '').trim() : '';
            target.textContent = value && value !== '사용자' ? value : parts[2];
        });
        var account = document.getElementById('profileUserId');
        var loggedIn = !!account && !!account.textContent.trim() && account.textContent.trim() !== '-';
        var login = document.getElementById('cs-android-profile-login');
        if (login) login.style.display = loggedIn ? 'none' : 'inline-flex';
        footer.style.display = loggedIn ? 'flex' : 'none';
    }
    inputs.map(function(parts) { return document.getElementById(parts[0]); })
      .concat([document.getElementById('profileUserId')])
      .filter(Boolean)
      .forEach(function(source) {
          new MutationObserver(syncStats).observe(source, {childList:true,subtree:true,characterData:true});
      });
    view.querySelectorAll('[data-mp-panel]').forEach(function(panel) {
        new MutationObserver(refreshSelected).observe(panel,{attributes:true,attributeFilter:['class','hidden']});
    });
    syncStats();
    refreshSelected();
    // Login data may arrive after Firebase auth resolves; lightweight sync while page is foreground.
    window.addEventListener('pageshow', syncStats);
}
