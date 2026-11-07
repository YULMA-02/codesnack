// CodeSnack - navigation.js (original script order preserved)
        function switchTab(tab) {
            const currentView = document.querySelector('.cs-main > section:not(.hidden)');
            if (currentView && currentView.id !== `view-${tab}`) window.scrollTo(0, 0);
            // 메인 섹션 라우팅
            ['home', 'tutorial', 'quiz', 'ai-chat', 'vscode', 'templates', 'auth', 'mypage', 'path'].forEach(t => {
                const view = document.getElementById(`view-${t}`);
                const btn = document.getElementById(`nav-${t}`);
                if (t === tab) {
                    if (view) view.classList.remove('hidden');
                    if (btn) { btn.classList.add('dynamic-text', 'bg-slate-100', 'dark:bg-slate-800'); btn.classList.remove('text-slate-600', 'dark:text-slate-300'); }
                } else {
                    if (view) view.classList.add('hidden');
                    if (btn) { btn.classList.remove('dynamic-text', 'bg-slate-100', 'dark:bg-slate-800'); btn.classList.add('text-slate-600', 'dark:text-slate-300'); }
                }
            });

            document.querySelectorAll('.cs-mobile-nav [data-tab]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tab);
            });

            // VS Code 탭 진입 시 워크스페이스 렌더링
            const langRibbon = document.getElementById('langRibbon');
            if (langRibbon) langRibbon.classList.toggle('hidden', tab === 'vscode' || tab === 'home' || tab === 'mypage');
            if (tab === 'vscode') initVscWorkspace();
            if (tab === 'mypage') switchMyPageSection(activeMyPageSection);

            // 퀴즈 탭 클릭 시: 무조건 '퀴즈 선택 화면(카드 4개)'을 먼저 보여주도록 초기화
            if (tab === 'quiz') {
                document.getElementById('quizSelectionMenu').classList.remove('hidden');
                document.getElementById('quizMcqContainer').classList.add('hidden');
                document.getElementById('quizCreatorContainer').classList.add('hidden');
                document.getElementById('communityQuizzesContainer').classList.add('hidden');
                
                // 퀴즈 선택 화면에서는 API를 호출하지 않습니다.
                // 객관식 카드 선택 시 openMcqQuiz()가 생성 및 로딩을 시작합니다.
            }
        }
    
        // 👇 이 위치에 코드를 넣어주세요.
        function switchAuthTab(tab) {
            const loginForm = document.getElementById('form-login');
            const signupForm = document.getElementById('form-signup');
            const loginBtn = document.getElementById('tab-login-btn');
            const signupBtn = document.getElementById('tab-signup-btn');

            if (tab === 'login') {
                loginForm.classList.remove('hidden');
                signupForm.classList.add('hidden');
                loginBtn.classList.add('border-emerald-500', 'dynamic-border', 'text-slate-900', 'dark:text-slate-100');
                loginBtn.classList.remove('border-transparent', 'text-slate-400');
                signupBtn.classList.add('border-transparent', 'text-slate-400');
                signupBtn.classList.remove('border-emerald-500', 'dynamic-border', 'text-slate-900', 'dark:text-slate-100');
            } else {
                loginForm.classList.add('hidden');
                signupForm.classList.remove('hidden');
                signupBtn.classList.add('border-emerald-500', 'dynamic-border', 'text-slate-900', 'dark:text-slate-100');
                signupBtn.classList.remove('border-transparent', 'text-slate-400');
                loginBtn.classList.add('border-transparent', 'text-slate-400');
                loginBtn.classList.remove('border-emerald-500', 'dynamic-border', 'text-slate-900', 'dark:text-slate-100');
            }
        }

        function togglePasswordVisibility(inputId, isChecked) {
            const input = document.getElementById(inputId);
            input.type = isChecked ? 'text' : 'password';
        }



        function showToast(msg, type = "success") {
            const toast = document.getElementById('toastNotification');
            const toastMsg = document.getElementById('toastMessage');
            const toastIcon = document.getElementById('toastIcon');

            toastMsg.innerText = msg;
            if (type === "success") {
                toastIcon.className = "fa-solid fa-circle-check text-emerald-400 text-xl";
            } else if (type === "error") {
                toastIcon.className = "fa-solid fa-circle-xmark text-rose-400 text-xl";
            } else {
                toastIcon.className = "fa-solid fa-circle-info text-sky-400 text-xl";
            }

            toast.classList.remove('translate-y-24', 'opacity-0');
            setTimeout(() => {
                toast.classList.add('translate-y-24', 'opacity-0');
            }, 2500);
        }

