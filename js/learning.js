// CodeSnack - learning.js (original script order preserved)
        /* API 키 관련 */
function getGeminiApiKey() {
    return "AQ.Ab8RN6I63odfqAwdJiCptVKBdNkmyPI6c2yyVrIz1ZqxEzVquA";
}

    
        


        /* 학습 기록 v2: 단원 완료와 실제 활동 날짜로만 진도/연속일 계산 */
        let learningProgress = { completed: {}, activityDays: [] };
        const LEARNING_KEY_PREFIX = 'codesnack-learning-v2-';
        function localDateKey(date = new Date()) {
            return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        }
        function readLocalProgress(uid) {
            try { return JSON.parse(localStorage.getItem(LEARNING_KEY_PREFIX+(uid || 'guest')) || 'null'); } catch (_) { return null; }
        }
        function normalizeLearningProgress(raw) {
            const completed = {};
            for (const lang of Object.keys(tutorialData)) {
                const known = new Set(tutorialData[lang].map(item => item.id));
                completed[lang] = [...new Set(Array.isArray(raw?.completed?.[lang]) ? raw.completed[lang] : [])].filter(id => known.has(id));
            }
            const activityDays = [...new Set(Array.isArray(raw?.activityDays) ? raw.activityDays : [])]
                .filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x) && x <= localDateKey()).sort();
            return {completed, activityDays};
        }
        function loadLearningProgress(profile = null) {
            const uid = profile?.uid || 'guest';
            learningProgress = normalizeLearningProgress(profile?.learningProgress || readLocalProgress(uid));
            refreshLearningIndicators();
        }
        function persistLearningProgress() {
            try { localStorage.setItem(LEARNING_KEY_PREFIX+(currentUser?.uid || 'guest'), JSON.stringify(learningProgress)); } catch (_) {}
            if (currentUser) autoSaveUserData();
        }
        function computeStreak(days) {
            const set = new Set(days), today = new Date();
            let cursor = new Date(today.getFullYear(),today.getMonth(),today.getDate());
            if (!set.has(localDateKey(cursor))) cursor.setDate(cursor.getDate()-1);
            let count = 0;
            while (set.has(localDateKey(cursor))) { count++; cursor.setDate(cursor.getDate()-1); }
            return count;
        }
        function refreshLearningIndicators() {
            streak = computeStreak(learningProgress.activityDays);
            const setText = (id, value) => {const el = document.getElementById(id); if (el) el.textContent = value;};
            setText('userStreak', streak);
            setText('userXP', xp);
            setText('pathCurrentStreak', learningProgress.activityDays.length);
            setText('myPageStreak', `${streak}일째`);
            const list = tutorialData[currentLang] || [];
            const completed = learningProgress.completed[currentLang] || [];
            setText('tutorialProgressCount', `${String(completed.length).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}`);
            const bar = document.getElementById('tutorialProgressBar');
            if (bar) bar.style.width = `${list.length ? Math.round(completed.length/list.length*100) : 0}%`;
            const item = list[currentTutorialIndex];
            const done = !!item && completed.includes(item.id);
            setText('tutorialCompletionText', done ? '이 단원은 학습 완료로 기록되었어요.' : '학습을 마치면 완료를 눌러주세요.');
            const btn = document.getElementById('completeTutorialBtn');
            if (btn) { btn.disabled = done; btn.classList.toggle('is-complete',done); btn.innerHTML = done ? '✓ 학습 완료' : '<i class="fa-solid fa-check"></i> 이 단원 학습 완료'; }
        }
        function recordStudyActivity() {
            const today = localDateKey();
            if (!learningProgress.activityDays.includes(today)) {
                learningProgress.activityDays.push(today);
                learningProgress.activityDays.sort();
                refreshLearningIndicators();
                persistLearningProgress();
            } else {
                refreshLearningIndicators();
            }
        }
        function markTutorialComplete() {
            const lesson = (tutorialData[currentLang] || [])[currentTutorialIndex];
            if (!lesson) return;
            const completed = learningProgress.completed[currentLang] || (learningProgress.completed[currentLang] = []);
            if (completed.includes(lesson.id)) return;
            completed.push(lesson.id);
            recordStudyActivity();
            persistLearningProgress();
            loadTutorials();
            showToast('학습 완료! 실제 진도에 반영했어요. 🎉', 'success');
        }

        /* 튜토리얼 관련 기능 (W3Schools 스타일) */
        function loadTutorials() {
            const list = tutorialData[currentLang] || tutorialData['python'];
            const sidebarList = document.getElementById('tutorialSidebarMenuList');
            const langNames = { python: 'Python', javascript: 'JavaScript', cpp: 'C++', java: 'Java', csharp: 'C#' };

            document.getElementById('tutorialSidebarTitle').innerText = `${langNames[currentLang]} 튜토리얼`;

            sidebarList.innerHTML = list.map((item, idx) => `
                <button onclick="selectTutorialTopic(${idx})" class="w-full text-left px-3 py-2 rounded-xl transition ${idx === currentTutorialIndex ? 'dynamic-bg text-slate-900 font-black shadow' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300'}">
                    ${item.title} ${(learningProgress.completed[currentLang] || []).includes(item.id) ? '<i class="fa-solid fa-check ml-auto" aria-label="완료"></i>' : ''}
                </button>
            `).join('');

            renderCurrentTutorial();
        }

        function selectTutorialTopic(index) {
            currentTutorialIndex = index;
            loadTutorials();
        }
        /* =========================================
           학습 로드맵 (Path) 렌더링 기능
           ========================================= */
        function openLearningPath() {
            switchTab('path');
            document.getElementById('pathCurrentStreak').innerText = learningProgress.activityDays.length;
            renderLearningPath();
        }

        function renderLearningPath() {
            const container = document.getElementById('learningPathContainer');
            const totalDays = 15; // 전체 일수
            let html = '';

            for(let i = 1; i <= totalDays; i++) {
                const activeDays = learningProgress.activityDays.length;
                const isCompleted = i <= activeDays;
                const isCurrent = i === activeDays + 1;
                const isLocked = i > activeDays + 1;      

                let nodeClass = '';
                let iconClass = '';

                // Vercel 스타일 노드 디자인 
                if (isCompleted) {
                    nodeClass = 'roadmap-node complete';
                    iconClass = 'fa-solid fa-check text-xl';
                } else if (isCurrent) {
                    nodeClass = 'roadmap-node current';
                    iconClass = 'fa-solid fa-play text-xl ml-1';
                } else {
                    nodeClass = 'roadmap-node locked';
                    iconClass = 'fa-solid fa-lock text-lg';
                }

                let marginOffset = i % 2 === 0 ? 'translate-y-4' : '-translate-y-4';

                // 연결선 그리기 (모던하게 얇은 선으로)
                let lineHtml = '';
                if (i < totalDays) {
                    const lineBg = i < learningProgress.activityDays.length ? 'bg-white/30' : 'bg-slate-800';
                    lineHtml = `<div class="w-10 sm:w-16 h-1 ${lineBg} mx-2 shrink-0 transition-colors duration-300 ${marginOffset}"></div>`;
                }

                html += `
                    <div class="flex flex-col items-center justify-center shrink-0 w-28 py-8">
                        <div class="flex flex-col items-center relative group cursor-pointer ${marginOffset}" onclick="handlePathClick(${i})">
                            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 ${nodeClass}">
                                <i class="${iconClass}"></i>
                            </div>
                            <span class="mt-4 font-semibold text-sm roadmap-caption ${isCurrent ? 'current' : ''}">${i}번째 학습일</span>
                        </div>
                    </div>
                    ${lineHtml}
                `;
            }
            container.innerHTML = html;
            
            setTimeout(() => {
                const scrollPos = Math.min(15,learningProgress.activityDays.length) * 140; 
                container.scrollTo({ left: scrollPos - window.innerWidth/3, behavior: 'smooth' });
            }, 100);
        }

        // 아이콘을 눌렀을 때의 동작
        function handlePathClick(day) {
            const dates = learningProgress.activityDays;
            if (day <= dates.length) {
                showToast(`${day}번째 활동 기록: ${dates[day-1]} · 학습하기로 이동해요.`, 'info');
                switchTab('tutorial');
            } else {
                showToast('단원 완료나 실제 코드 실행으로 학습한 날을 기록할 수 있어요.', 'info');
                switchTab('tutorial');
            }
        }
        function renderCurrentTutorial() {
            const list = tutorialData[currentLang] || tutorialData['python'];
            const item = list[currentTutorialIndex] || list[0];
            const langNames = { python: 'Python', javascript: 'JavaScript', cpp: 'C++', java: 'Java', csharp: 'C#' };

            document.getElementById('tutorialTopicBadge').innerText = `${langNames[currentLang]} -${item.badge || '튜토리얼'}`;
            document.getElementById('tutorialTopicTitle').innerText = item.title;
            document.getElementById('tutorialTopicBody').innerHTML = item.body;
            document.getElementById('tutorialTopicCode').innerText = item.code;
            const progressCount = document.getElementById('tutorialProgressCount');
            const progressBar = document.getElementById('tutorialProgressBar');
            refreshLearningIndicators();

            document.getElementById('prevTutorialBtn').disabled = currentTutorialIndex === 0;
            document.getElementById('nextTutorialBtn').disabled = currentTutorialIndex === list.length - 1;
        }

        function navigateTutorial(direction) {
            const list = tutorialData[currentLang] || tutorialData['python'];
            const newIdx = currentTutorialIndex + direction;
            if (newIdx >= 0 && newIdx < list.length) {
                currentTutorialIndex = newIdx;
                loadTutorials();
            }
        }

        function openTutorialInPlayground() {
            const item = (tutorialData[currentLang] || tutorialData.python)[currentTutorialIndex];
            if (item?.code) {
                openStudioSnippet(`lesson_${currentLang}.${studioLanguageExtension(currentLang)}`,item.code);
                showToast('학습 코드가 스낵 스튜디오에서 열렸어요.', 'info');
            }
        }

        function askAiAboutCurrentTutorial() {
            const list = tutorialData[currentLang] || tutorialData['python'];
            const item = list[currentTutorialIndex];
            switchTab('ai-chat');
            const qInput = document.getElementById('aiQuestionInput');
            qInput.value = `[${currentLang.toUpperCase()} 튜토리얼 - ${item.title}] 에 대해 이해가 잘 안 돼요. 쉬운 예시와 함께 친절하게 설명해 주세요!`;
            qInput.focus();
        }
