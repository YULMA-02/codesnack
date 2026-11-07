// CodeSnack - quiz.js (original script order preserved)
        /* 퀴즈 정답 해설 (Gemini 3.8 Flash) */
        async function fetchAIExplanation(quiz, selectedVal) {
            const explanationBox = document.getElementById('aiExplanationBox');
            const explanationContent = document.getElementById('aiExplanationContent');
            const hintBadge = document.getElementById('hintStatusBadge');

            explanationBox.classList.remove('hidden');
            if (isHintUsed) hintBadge.classList.remove('hidden');
            else hintBadge.classList.add('hidden');

            explanationContent.innerHTML = `
                <div class="flex items-center space-x-2 text-sky-500">
                    <i class="fa-solid fa-circle-notch animate-spin"></i>
                    <span>AI 튜터가 정답 해설을 생성하고 있습니다...</span>
                </div>
            `;

            const fullCode = `${quiz.codePrefix}${selectedVal}${quiz.codeSuffix}`;
            const promptText = `프로그래밍 언어: ${currentLang}\n문제: ${quiz.title}\n코드:\n${fullCode}\n\n사용자가 정답 '${selectedVal === "" ? "빈칸" : selectedVal}'을 선택했습니다. 왜 정답인지 초보자가 쉽게 이해하도록 2~3문장으로 한국어 설명해줘.`;

            const apiKey = getGeminiApiKey();
            if (!apiKey) {
                explanationContent.innerText = "정답입니다! 🎉 (AI 상세 해설을 보려면 AI Q&A 메뉴에서 Gemini API 키를 설정해주세요.)";
                return;
            }

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
                        systemInstruction: {
                            parts: [{ text: "너는 코딩 입문자를 가르치는 AI 프로그래밍 튜터야. 정답 이유를 2~3문장으로 명확히 설명해줘." }]
                        }
                    })
                });

                const data = await response.json();
                const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (aiText) {
                    explanationContent.innerHTML = `<p class="whitespace-pre-line">${aiText.trim()}</p>`;
                } else {
                    explanationContent.innerText = "정답입니다! 올바른 문법을 선택하셨습니다.";
                }
            } catch (err) {
                explanationContent.innerText = "정답입니다! 축하합니다. 🎉";
            }
        }

        /* 퀴즈 로직 */
        /* =========================================
           Gemini AI 무한 퀴즈 생성 로직
           ========================================= */
        let currentAiQuizAnswer = "";
        let selectedAiOption = null;

        async function generateAiQuiz() {
            const apiKey = getGeminiApiKey();
            const contentArea = document.getElementById('dynamicQuizContentArea');
            const formArea = document.getElementById('dynamicQuizFormArea');
            const footerArea = document.getElementById('quizActionFooter');
            const explanationBox = document.getElementById('aiExplanationBox');

            formArea.classList.add('hidden');
            footerArea.classList.add('hidden');
            explanationBox.classList.add('hidden');
            selectedAiOption = null;
            
            contentArea.innerHTML = `
                <div class="text-center py-16 flex flex-col items-center">
                    <i class="fa-solid fa-circle-notch text-4xl text-sky-500 animate-spin mb-4"></i>
                    <p class="text-sm font-bold text-slate-600 dark:text-slate-300">AI가 내 진도에 맞는 퀴즈를 만드는 중입니다...</p>
                </div>
            `;

            const langNames = { python: 'Python', javascript: 'JavaScript', cpp: 'C++', java: 'Java', csharp: 'C#' };
            const promptText = `
                너는 코딩 선생님이야. 학생이 현재 '${langNames[currentLang]}' 언어의 '${streak}일차'를 배우고 있어.
                초보자가 풀 수 있는 객관식(4지선다) 빈칸 채우기 프로그래밍 퀴즈 1개를 만들어줘.
                조건:
                1. 코드 안에 '____' (밑줄 4개)로 빈칸을 뚫을 것.
                2. 보기는 반드시 4개.
                3. 반드시 아래 JSON 형식으로만 대답할 것.
                {"title": "퀴즈 제목", "desc": "문제 설명", "code": "코드 문자열 (빈칸 포함, 줄바꿈은 \\n)", "options": ["보기1", "보기2", "보기3", "보기4"], "answer": "정답 텍스트"}
            `;

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: { temperature: 0.7 } })
                });

                const data = await response.json();
                let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim(); 
                
                const quizJson = JSON.parse(aiText);
                currentAiQuizAnswer = quizJson.answer;
                
                contentArea.innerHTML = `
                    <h3 class="text-lg font-extrabold mb-2">${quizJson.title}</h3>
                    <p class="text-sm text-slate-600 dark:text-slate-300 mb-6">${quizJson.desc}</p>
                    <div class="bg-slate-950 rounded-xl p-4 font-mono text-sm text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre-wrap leading-relaxed">${quizJson.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                `;

                const optionsContainer = document.getElementById('aiQuizOptionsContainer');
                optionsContainer.innerHTML = quizJson.options.map((opt, idx) => `
                    <button onclick="selectAiOption(this, '${opt.replace(/'/g, "\\'")}')" class="ai-option-btn text-left px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition text-sm font-bold text-slate-700 dark:text-slate-300">
                        ${idx + 1}. <code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400">${opt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
                    </button>
                `).join('');

                formArea.classList.remove('hidden');
                footerArea.classList.remove('hidden');
                footerArea.classList.add('flex');
            } catch (err) {
                contentArea.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fa-solid fa-triangle-exclamation text-3xl text-rose-500 mb-3"></i>
                        <p class="text-sm font-bold">퀴즈 생성에 실패했습니다.</p>
                        <button onclick="generateAiQuiz()" class="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold shadow-sm">다시 시도</button>
                    </div>
                `;
            }
        }

        function selectAiOption(btnElement, selectedValue) {
            document.querySelectorAll('.ai-option-btn').forEach(btn => btn.classList.remove('border-sky-500', 'bg-sky-50', 'dark:bg-sky-900/30', 'ring-2', 'ring-sky-200'));
            btnElement.classList.add('border-sky-500', 'bg-sky-50', 'dark:bg-sky-900/30', 'ring-2', 'ring-sky-200');
            selectedAiOption = selectedValue;
        }

        /* =========================================
           Gemini AI 백그라운드 무한 퀴즈 생성 로직
           ========================================= */
        let aiQuizHistory = [];
        let currentAiQuizIndex = -1;
        let isGeneratingQuizzes = false; // 백그라운드 생성 중인지 확인하는 변수
        let aiQuizGenerationToken = 0; // 언어 변경 시 이전 퀴즈 생성 작업 무효화

        function generateAiQuiz() {
            // 이미 첫 퀴즈가 띄워져 있다면 무시 (언어 변경이나 최초 1회만 실행됨)
            if (aiQuizHistory.length > 0) return;

            const contentArea = document.getElementById('dynamicQuizContentArea');
            document.getElementById('dynamicQuizFormArea').classList.add('hidden');
            document.getElementById('quizActionFooter').classList.add('hidden');
            document.getElementById('aiExplanationBox').classList.add('hidden');
            
            contentArea.innerHTML = `
                <div class="text-center py-16 flex flex-col items-center">
                    <i class="fa-solid fa-circle-notch text-4xl text-sky-500 animate-spin mb-4"></i>
                    <p class="text-sm font-bold text-slate-600 dark:text-slate-300">AI가 내 진도에 맞는 첫 퀴즈를 만들고 있습니다...</p>
                    <p class="text-xs text-slate-400 mt-2">잠시 기다려주세요!</p>
                </div>
            `;
            
            preloadQuizzes(); // 백그라운드 로딩 가동
        }

        function showAiQuizLoadError() {
            // 요청 실패 시 무한 로딩 대신 다시 시도 가능한 화면을 제공합니다.
            if (aiQuizHistory.length > 0 || document.getElementById('quizMcqContainer').classList.contains('hidden')) return;
            document.getElementById('dynamicQuizFormArea').classList.add('hidden');
            document.getElementById('quizActionFooter').classList.add('hidden');
            document.getElementById('dynamicQuizContentArea').innerHTML = `
                <div class="py-12 text-center">
                    <div style="width:44px;height:44px;border-radius:12px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;margin:0 auto 18px"><i class="fa-solid fa-plug-circle-xmark"></i></div>
                    <h3 style="font-size:18px;color:var(--ink);font-weight:750;margin-bottom:9px">퀴즈를 불러오지 못했어요.</h3>
                    <p style="font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:21px">AI 서버 연결이나 API 설정을 확인한 후 다시 시도해 주세요.</p>
                    <button onclick="generateAiQuiz()" style="background:var(--ink);color:var(--surface);font-size:12px;font-weight:700;border:0;border-radius:7px;padding:11px 17px">다시 시도하기</button>
                </div>`;
            isAiQuizLoaded = false;
        }

        // 🌟 핵심: 퀴즈를 10개까지 뒤에서 조용히 미리 만들어두는 함수
        async function preloadQuizzes() {
            if (isGeneratingQuizzes) return;
            isGeneratingQuizzes = true;
            const generationToken = ++aiQuizGenerationToken;

            const apiKey = getGeminiApiKey();
            const langNames = { python: 'Python', javascript: 'JavaScript', cpp: 'C++', java: 'Java', csharp: 'C#' };
            const loadingLang = currentLang; // 로딩 도중 언어를 바꾸면 중단하기 위함

            // 대기열에 10개가 찰 때까지 반복 생성
            const targetCount = Math.max(10, currentAiQuizIndex + 4);
            while (aiQuizHistory.length < targetCount) {
                if (generationToken !== aiQuizGenerationToken || currentLang !== loadingLang) break; 

                // AI가 매번 다른 문제를 내도록 난수(시드)를 줍니다.
                const randomSeed = Math.floor(Math.random() * 10000); 

                const promptText = `
                    너는 코딩 선생님이야. 학생이 현재 '${langNames[currentLang]}' 언어의 '${streak}일차'를 배우고 있어. (랜덤 시드: ${randomSeed})
                    초보자가 풀 수 있는 객관식(4지선다) 빈칸 채우기 프로그래밍 퀴즈 1개를 만들어줘.
                    
                    엄격한 조건:
                    1. 'print'나 콘솔 출력 문제만 내지 말고 변수, 연산자, 조건문(if), 반복문(for/while), 리스트/배열, 함수 등 다양한 기초 주제 중 하나를 무작위로 골라 출제해.
                    2. 코드 안에 '____' (밑줄 4개)로 빈칸을 하나 뚫을 것.
                    3. 보기는 반드시 4개이며, 정답이 항상 1번이 되지 않도록 1~4번 위치 중 랜덤하게 정답을 섞어서 배치할 것.
                    4. 반드시 아래 JSON 형식으로만 대답할 것.
                    {"title": "퀴즈 제목", "desc": "문제 설명", "code": "전체 코드 문자열 (빈칸 포함, 줄바꿈은 \\n)", "options": ["보기1", "보기2", "보기3", "보기4"], "answer": "정답 텍스트"}
                `;

                try {
                    // 생성 API가 멈추면 다음 문제 버튼도 기다리게 되므로 요청 시간을 제한합니다.
                    const generationController = new AbortController();
                    const generationTimeout = setTimeout(() => generationController.abort(), 18000);
                    let response;
                    try {
                        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
                            method: 'POST',
                            signal: generationController.signal,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: { temperature: 0.8 } })
                        });
                    } finally {
                        clearTimeout(generationTimeout);
                    }

                    const data = await response.json();
                    let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!response.ok || !aiText) throw new Error(data.error?.message || '퀴즈 응답을 읽을 수 없습니다.');
                    if(aiText) {
                        aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim(); 
                        const quizJson = JSON.parse(aiText);
                        
                        // 언어가 그대로라면 대기열에 저장
                        if (generationToken === aiQuizGenerationToken && currentLang === loadingLang) {
                            aiQuizHistory.push({
                                data: quizJson,
                                selectedOption: null,
                                explanation: null,
                                isSubmitted: false
                            });

                            // 만약 빈 화면에서 첫 번째 문제를 기다리고 있었다면 즉시 화면에 뿌림
                            if (currentAiQuizIndex === -1) {
                                currentAiQuizIndex = 0;
                                renderCurrentAiQuiz();
                            }
                            const nextBtn = document.getElementById('nextAiQuizBtn');
                            if (nextBtn && aiQuizHistory.length > currentAiQuizIndex + 1) {
                                nextBtn.disabled = false;
                                nextBtn.innerHTML = '다음 문제 <i class="fa-solid fa-arrow-right"></i>';
                            }
                        }
                    }
                } catch (err) {
                    if (generationToken !== aiQuizGenerationToken) break;
                    console.error("백그라운드 퀴즈 생성 에러", err);
                    if (aiQuizHistory.length > 0) {
                        const nextBtn = document.getElementById('nextAiQuizBtn');
                        if (nextBtn && currentAiQuizIndex === aiQuizHistory.length - 1) {
                            nextBtn.disabled = false;
                            nextBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> 다음 문제 다시 시도';
                        }
                    } else {
                        showAiQuizLoadError();
                    }
                    break; // 오류 시 무한 재시도 방지
                }
                
                // API 속도 제한(Rate Limit)에 걸리지 않도록 1.5초 쉬었다가 다음 문제 생성
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            if (generationToken === aiQuizGenerationToken) isGeneratingQuizzes = false;
        }

        function escapeAiQuizText(value) {
            return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
        }

        function renderCurrentAiQuiz() {
            const quizState = aiQuizHistory[currentAiQuizIndex];
            if (!quizState) return;

            const quizJson = quizState.data;
            document.getElementById('dynamicQuizContentArea').innerHTML = `
                <h3 class="text-lg font-extrabold mb-2">${escapeAiQuizText(quizJson.title)}</h3>
                <p class="text-sm text-slate-600 dark:text-slate-300 mb-6">${escapeAiQuizText(quizJson.desc)}</p>
                <div class="bg-slate-950 rounded-xl p-4 font-mono text-sm text-emerald-400 overflow-x-auto border border-slate-800 whitespace-pre-wrap leading-relaxed">${escapeAiQuizText(quizJson.code)}</div>
            `;

            document.getElementById('aiQuizOptionsContainer').innerHTML = quizJson.options.map((opt, idx) => {
                const selected = quizState.selectedOption === opt;
                const btnClass = selected ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 ring-2 ring-sky-200' : 'border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30';
                return `<button type="button" data-ai-option-index="${idx}" class="ai-option-btn text-left px-4 py-3 rounded-xl border-2 transition text-sm font-bold text-slate-700 dark:text-slate-300 ${btnClass}" ${quizState.isSubmitted ? 'disabled' : ''}>
                    ${idx + 1}. <code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400">${escapeAiQuizText(opt)}</code>
                </button>`;
            }).join('');
            document.querySelectorAll('#aiQuizOptionsContainer [data-ai-option-index]').forEach(button => {
                button.addEventListener('click', () => selectAiOption(quizJson.options[Number(button.dataset.aiOptionIndex)]));
            });

            document.getElementById('dynamicQuizFormArea').classList.remove('hidden');
            const footer = document.getElementById('quizActionFooter');
            footer.classList.remove('hidden');
            footer.classList.add('flex');
            document.getElementById('prevAiQuizBtn').classList.toggle('hidden', currentAiQuizIndex === 0);

            const nextBtn = document.getElementById('nextAiQuizBtn');
            nextBtn.disabled = false;
            nextBtn.classList.toggle('hidden', !quizState.isSubmitted);
            nextBtn.innerHTML = '다음 문제 <i class="fa-solid fa-arrow-right"></i>';
            const submitBtn = document.getElementById('submitAiQuizBtn');
            const explanationBox = document.getElementById('aiExplanationBox');
            submitBtn.disabled = Boolean(quizState.isSubmitted);
            submitBtn.innerHTML = quizState.isSubmitted ? '<i class="fa-solid fa-check"></i> 채점 완료' : '정답 확인하기';
            submitBtn.classList.toggle('hidden', Boolean(quizState.isSubmitted));
            explanationBox.classList.toggle('hidden', !quizState.isSubmitted);
            if (quizState.isSubmitted) {
                document.getElementById('aiExplanationContent').innerHTML = quizState.explanation || '<p>해설을 불러오는 중이에요. 다음 문제로 먼저 이동해도 됩니다.</p>';
            }
        }

        function selectAiOption(selectedValue) {
            const quizState = aiQuizHistory[currentAiQuizIndex];
            if (!quizState || quizState.isSubmitted) return;
            quizState.selectedOption = selectedValue;
            renderCurrentAiQuiz();
        }

        function prevAiQuiz() {
            if (currentAiQuizIndex > 0) {
                currentAiQuizIndex--;
                renderCurrentAiQuiz();
            }
        }

        function nextAiQuiz() {
            const current = aiQuizHistory[currentAiQuizIndex];
            if (!current || !current.isSubmitted) return showToast('먼저 정답을 확인해 주세요.', 'error');
            if (currentAiQuizIndex < aiQuizHistory.length - 1) {
                currentAiQuizIndex++;
                renderCurrentAiQuiz();
            } else {
                // 다음 문제가 준비되지 않아도 현재 화면을 유지하고 재시도를 허용합니다.
                const nextBtn = document.getElementById('nextAiQuizBtn');
                nextBtn.disabled = false;
                nextBtn.innerHTML = isGeneratingQuizzes
                    ? '<i class="fa-solid fa-hourglass-half"></i> 새 문제 준비 중 · 다시 확인'
                    : '<i class="fa-solid fa-rotate-right"></i> 다음 문제 불러오기';
                if (!isGeneratingQuizzes) preloadQuizzes();
                else showToast('새 문제를 생성하고 있어요. 잠시 뒤 다시 눌러 주세요.', 'info');
            }
            if (aiQuizHistory.length - currentAiQuizIndex < 5 && !isGeneratingQuizzes) preloadQuizzes();
        }

        async function submitAiQuizAnswer() {
            const quizState = aiQuizHistory[currentAiQuizIndex];
            if (!quizState || quizState.isSubmitted) return;
            if (!quizState.selectedOption) return showToast('정답 보기를 먼저 선택해 주세요!', 'error');

            // 정답 판정은 이미 제공받은 답안으로 즉시 처리하며 AI 해설을 기다리지 않습니다.
            const isCorrect = String(quizState.selectedOption).trim() === String(quizState.data.answer).trim();
            quizState.isSubmitted = true;
            const correctText = escapeAiQuizText(quizState.data.answer);
            quizState.explanation = `<p>${isCorrect ? '정답입니다!' : '아쉽지만 오답입니다.'} 정답은 <strong>${correctText}</strong>입니다.</p><p class="mt-2 text-xs" style="color:var(--muted)">AI 튜터의 추가 해설을 불러오는 중이에요. 다음 문제로 바로 넘어갈 수 있습니다.</p>`;
            renderCurrentAiQuiz();

            if (isCorrect) {
                if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
                xp += 50;
                solvedQuizzesCount += 1;
                document.getElementById('userXP').innerText = xp;
                try { recordStudyActivity(); autoSaveUserData(); } catch(e) { console.warn('학습 기록 저장 실패:', e); }
                showToast('정답입니다! +50 XP 획득 🍪', 'success');
            } else {
                showToast('아쉽네요, 틀렸습니다.', 'error');
            }

            // 네트워크가 느리거나 응답이 없을 때에도 채점 및 다음 버튼은 계속 사용할 수 있습니다.
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${getGeminiApiKey()}`, {
                    method: 'POST', signal: controller.signal,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: `진짜 정답은 '${quizState.data.answer}' 이고 학생 제출답안은 '${quizState.selectedOption}'이야. 정답 여부를 알려주고, 왜 그런지 초보자가 이해하기 쉽게 2문장으로 설명해줘.` }] }] })
                });
                if (!response.ok) throw new Error(`AI 해설 서버 응답: ${response.status}`);
                const data = await response.json();
                const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                quizState.explanation = explanation
                    ? `<p class="whitespace-pre-line">${escapeAiQuizText(explanation)}</p>`
                    : `<p>${isCorrect ? '정답입니다!' : '오답입니다.'} 정답은 <strong>${correctText}</strong>입니다.</p>`;
            } catch(e) {
                console.warn('AI 퀴즈 해설 연결 실패:', e);
                quizState.explanation = `<p>${isCorrect ? '정답입니다!' : '오답입니다.'} 정답은 <strong>${correctText}</strong>입니다.</p><p class="mt-2 text-xs" style="color:var(--muted)">추가 AI 해설을 불러오지 못했지만, 채점은 정상 완료됐습니다.</p>`;
            } finally {
                clearTimeout(timeoutId);
                // 응답이 늦게 와도 이미 이동한 다른 문제의 화면을 덮어쓰지 않습니다.
                if (aiQuizHistory[currentAiQuizIndex] === quizState) {
                    document.getElementById('aiExplanationContent').innerHTML = quizState.explanation;
                }
            }
        }

        
        // 마이페이지 왼쪽 메뉴 전환: 기존 대시보드 데이터와 고정 ID는 보존합니다.
        let activeMyPageSection = 'profile';
        function switchMyPageSection(target) {
            const allowed=['profile','learning','role','quizzes','preferences'];
            if(!allowed.includes(target))target='profile';
            activeMyPageSection=target;
            document.querySelectorAll('#view-mypage [data-mp-panel]').forEach(panel=>{
                const visible=panel.dataset.mpPanel===target;
                panel.classList.toggle('is-active',visible);
                panel.hidden=!visible;
            });
            document.querySelectorAll('#view-mypage [data-mp-target]').forEach(btn=>{
                const active=btn.dataset.mpTarget===target;
                btn.classList.toggle('active',active);
                btn.setAttribute('aria-pressed',String(active));
            });
            if(target==='learning')renderMyPageLanguageProgress();
            if(target==='preferences')syncMyPagePreferences();
        }
        function renderMyPageLanguageProgress() {
            const holder=document.getElementById('mpLanguageProgress');
            if(!holder)return;
            const names={python:'Python',javascript:'JavaScript',cpp:'C++',java:'Java',csharp:'C#'};
            holder.innerHTML=Object.keys(names).map(lang=>{
                const total=(tutorialData[lang]||[]).length;
                const completed=(learningProgress?.completed?.[lang]||[]).length;
                const pct=total?Math.max(0,Math.min(100,Math.round(100*completed/total))):0;
                return `<div class="mp-progress-item"><div class="mp-progress-meta"><span>${names[lang]}</span><strong>${completed} / ${total} 단원 · ${pct}%</strong></div><div class="mp-progress-track"><span style="width:${pct}%"></span></div></div>`;
            }).join('');
        }
        async function saveMyPageNickname(event) {
            if(event)event.preventDefault();
            if(!currentUser?.uid)return showToast('먼저 로그인해 주세요.','error');
            const input=document.getElementById('mpNicknameInput');
            const nickname=(input?.value||'').trim();
            if(nickname.length<2 || nickname.length>24)return showToast('표시 이름은 2~24자로 입력해 주세요.','error');
            const button=event?.currentTarget?.querySelector('[type=submit]');
            if(button)button.disabled=true;
            try {
                await window.setDoc(window.doc(window.firebaseDb,'users',currentUser.uid),{nickname},{merge:true});
                currentUser.nickname=nickname;
                updateUIForAuth();
                showToast('표시 이름을 변경했어요.','success');
            }catch(err){showToast('이름 저장에 실패했어요. 다시 시도해 주세요.','error');}
            finally{if(button)button.disabled=false;}
        }
        function syncMyPagePreferences(){
            const dark=document.documentElement.classList.contains('dark');
            document.querySelectorAll('#view-mypage [data-mp-theme]').forEach(btn=>{
                const isActive=btn.dataset.mpTheme===(dark?'dark':'light');
                btn.classList.toggle('active',isActive);
                btn.setAttribute('aria-pressed',String(isActive));
            });
        }
        function chooseMyPageTheme(mode){
            if(!['light','dark'].includes(mode))return;
            if(document.documentElement.classList.contains('dark')!==(mode==='dark'))toggleDarkMode();
            syncMyPagePreferences();
        }

        function updateMyPageUI() {
            if (!currentUser) return;
            document.getElementById('profileNickname').innerText = currentUser.nickname || '사용자';
            document.getElementById('profileUserId').innerText = currentUser.id || '-';
            const profileInput=document.getElementById('mpNicknameInput');
            if(profileInput && document.activeElement!==profileInput)profileInput.value=currentUser.nickname || '';
            const profileRoleText=document.getElementById('mpProfileRoleText');
            if(profileRoleText)profileRoleText.textContent=({teacher:'선생님 계정',student:'학생 계정',general:'일반 계정'})[currentUser.role||'general'];
            document.getElementById('myPageXP').innerText = `${xp} XP`;
            document.getElementById('myPageStreak').innerText = `${computeStreak(learningProgress.activityDays)}일째`;
            document.getElementById('myPageSolvedCount').innerText = `${solvedQuizzesCount} 문제`;

            const roleBadge = document.getElementById('profileRoleBadge');
            const roleIcon = document.getElementById('profileRoleIcon');
            const role = currentUser.role || 'general';

            if (role === 'teacher') {
                roleBadge.innerText = '선생님 계정';
                roleBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30';
                if (roleIcon) roleIcon.className = 'fa-solid fa-chalkboard-user';
            } else if (role === 'student') {
                roleBadge.innerText = '학생 계정';
                roleBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30';
                if (roleIcon) roleIcon.className = 'fa-solid fa-user-graduate';
            } else {
                roleBadge.innerText = '일반인 계정';
                roleBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
                if (roleIcon) roleIcon.className = 'fa-solid fa-user-astronaut';
            }

            renderRoleDashboard();
            loadMyQuizzesFromDB(); // 기존 퀴즈 데이터 관리 유지
            if(activeMyPageSection==='learning')renderMyPageLanguageProgress();
            if(activeMyPageSection==='preferences')syncMyPagePreferences();
        }
        

        function updateUIForAuth() {
            document.getElementById('userXP').innerText = xp;
            refreshLearningIndicators();
            const authNav = document.getElementById('authNavButtons');
            const myPageNavBtn = document.getElementById('nav-mypage');

            if (currentUser) {
                myPageNavBtn.classList.remove('hidden');
                authNav.innerHTML = `
                    <button onclick="switchTab('mypage')" class="whitespace-nowrap shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition text-xs font-bold">
                        <i class="fa-solid fa-user text-emerald-500"></i>
                        <span>${currentUser.nickname}</span>
                    </button>
                `;
                updateMyPageUI();
            } else {
                myPageNavBtn.classList.add('hidden');
                authNav.innerHTML = `
                    <button id="nav-auth-btn" onclick="switchTab('auth')" class="whitespace-nowrap shrink-0 dynamic-bg dynamic-hover-bg text-slate-900 px-3 py-1.5 rounded-xl text-xs font-black shadow transition flex items-center gap-1.5">
                        <i class="fa-solid fa-right-to-bracket"></i>
                        <span>로그인/가입</span>
                    </button>
                `;
            }
        }

        

        


