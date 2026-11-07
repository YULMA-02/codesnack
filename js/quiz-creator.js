// CodeSnack - quiz-creator.js (original script order preserved)
// ==========================================
        // 🔥 신규 기능: 유저 퀴즈 제작 및 커뮤니티
        // ==========================================

        // ==========================================
        // 🔥 유저 퀴즈 제작, 수정, 삭제 및 커뮤니티 기능
        // ==========================================
        let editingQuizId = null; // 현재 수정 중인 퀴즈의 문서 ID
        let cachedCommunityQuizzes = []; // 커뮤니티 퀴즈 목록 캐시
        let cachedMyQuizzes = []; // 내 퀴즈 목록 캐시

        // Quiz creator: always reflect current language and live input in a safe text preview.
        function updateQuizCreatorUI() {
            const codeInput = document.getElementById('cqCode');
            if (!codeInput) return;
            const languageNames = {python:'Python',javascript:'JavaScript',cpp:'C++',java:'Java',csharp:'C#'};
            const fileExt = {python:'py',javascript:'js',cpp:'cpp',java:'java',csharp:'cs'};
            const languageName = languageNames[currentLang] || currentLang;
            const badge = document.getElementById('cqLanguageBadge');
            if (badge) badge.textContent = languageName;
            const filename = document.getElementById('cqCodeFilename');
            if (filename) filename.textContent = 'quiz.' + (fileExt[currentLang] || 'txt');
            const code = codeInput.value;
            const count = code.split('____').length - 1;
            const status = document.getElementById('cqBlankStatus');
            if (status) {
                status.classList.toggle('is-valid',count > 0);
                status.innerHTML = count > 0 ? '<i class="fa-solid fa-check-circle" aria-hidden="true"></i> 빈칸 '+count+'개 확인' : '<i class="fa-regular fa-circle" aria-hidden="true"></i> 빈칸을 입력해 주세요';
            }
            const title = document.getElementById('cqTitle')?.value.trim() || '';
            const previewTitle = document.getElementById('cqPreviewTitle');
            if (previewTitle) previewTitle.textContent = title || '문제 제목이 여기에 표시돼요.';
            const previewCode = document.getElementById('cqPreviewCode');
            if (previewCode) previewCode.textContent = code || '코드를 입력하면 이곳에서 미리 볼 수 있어요.';
        }

        function fillQuizCreatorExample() {
            const fields = ['cqTitle','cqCode','cqAnswer','cqHint'].map(id=>document.getElementById(id));
            if (fields.some(field=>field?.value.trim()) && !confirm('작성 중인 내용 대신 예제 문제를 채울까요?')) return;
            const samples = {
              python: ['반복문으로 간식 이름 출력하기', 'for i in range(3):\n    ____("CodeSnack")', 'print', '화면에 글자를 출력할 때 사용하는 함수예요.'],
              javascript: ['콘솔에 메시지 출력하기', 'for (let i = 0; i < 3; i++) {\n    console.____("CodeSnack");\n}', 'log', '브라우저 콘솔에 값을 출력하는 메서드예요.'],
              cpp: ['C++ 출력 스트림 사용하기', '#include <iostream>\nint main() {\n    std::____ << "CodeSnack" << std::endl;\n    return 0;\n}', 'cout', '표준 출력 스트림의 이름이에요.'],
              java: ['Java로 문자열 출력하기', 'public class Main {\n    public static void main(String[] args) {\n        System.out.____("CodeSnack");\n    }\n}', 'println', '출력한 뒤 줄을 바꾸는 메서드예요.'],
              csharp: ['C#에서 메시지 출력하기', 'using System;\nclass Program {\n    static void Main() {\n        Console.____("CodeSnack");\n    }\n}', 'WriteLine', '콘솔에 한 줄을 출력하는 메서드예요.']
            };
            const sample = samples[currentLang] || samples.python;
            fields.forEach((field,idx)=>{if(field)field.value=sample[idx];});
            updateQuizCreatorUI();
            fields[0]?.focus();
        }

        function openQuizCreator(isEditMode = false) {
            if (!currentUser) return showToast("퀴즈를 출제하거나 수정하려면 먼저 로그인해주세요!", "error");
            document.getElementById('quizSelectionMenu').classList.add('hidden');
            document.getElementById('quizMcqContainer').classList.add('hidden');
            document.getElementById('communityQuizzesContainer').classList.add('hidden');
            document.getElementById('quizCreatorContainer').classList.remove('hidden');
            document.getElementById('cqFeedbackBox').classList.add('hidden');

            // 일반 생성 모드로 열었을 때는 입력창 초기화
            if (!isEditMode) {
                editingQuizId = null;
                document.getElementById('cqTitle').value = '';
                document.getElementById('cqCode').value = '';
                document.getElementById('cqAnswer').value = '';
                document.getElementById('cqHint').value = '';
                document.getElementById('cqSubmitBtn').innerText = 'AI 검증 및 문제 은행 등록하기';
            }
            updateQuizCreatorUI();
        }

        function openCommunityQuizzes() {
            document.getElementById('quizSelectionMenu').classList.add('hidden');
            document.getElementById('quizMcqContainer').classList.add('hidden');
            document.getElementById('quizCreatorContainer').classList.add('hidden');
            document.getElementById('communityQuizzesContainer').classList.remove('hidden');
            loadCommunityQuizzesFromDB();
        }

        function closeCustomMenus() {
            editingQuizId = null;
            document.getElementById('cqTitle').value = '';
            document.getElementById('cqCode').value = '';
            document.getElementById('cqAnswer').value = '';
            document.getElementById('cqHint').value = '';
            document.getElementById('cqSubmitBtn').innerText = 'AI 검증 및 문제 은행 등록하기';
            updateQuizCreatorUI();

            document.getElementById('quizCreatorContainer').classList.add('hidden');
            document.getElementById('communityQuizzesContainer').classList.add('hidden');
            document.getElementById('quizSelectionMenu').classList.remove('hidden');
        }

        // 1) AI 검사 후 Firebase DB에 신규 등록 또는 수정 업데이트
        async function verifyAndSaveQuiz() {
            if (!currentUser) return showToast("로그인이 필요합니다.", "error");

            const title = document.getElementById('cqTitle').value.trim();
            const code = document.getElementById('cqCode').value.trim();
            const answer = document.getElementById('cqAnswer').value.trim();
            const hint = document.getElementById('cqHint').value.trim();

            if (!title || !code || !answer) return showToast("제목, 코드, 정답은 필수 항목입니다.", "error");
            if (!code.includes('____')) return showToast("문제 코드에 반드시 빈칸(____)을 1개 이상 뚫어주세요!", "error");

            const btn = document.getElementById('cqSubmitBtn');
            const feedbackBox = document.getElementById('cqFeedbackBox');
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> AI가 코드를 꼼꼼히 검증 중입니다...';
            feedbackBox.classList.add('hidden');

            const apiKey = getGeminiApiKey();
            const promptText = `
                너는 시니어 개발자야. 현재 유저가 ${currentLang} 언어로 빈칸 퀴즈를 출제했어.
                
                [유저 출제 코드 (빈칸 포함)]:
                \`\`\`
                ${code}
                \`\`\`
                [유저가 의도한 정답]: ${answer}

                이 정답을 빈칸(____) 자리에 넣었을 때, 문법적으로 에러가 발생하지 않고 정상 작동하는 올바른 코드인지 평가해줘.
                만약 오류가 있다면 어떤 부분이 잘못되었는지 친절하게 알려줘.
                
                반드시 아래 JSON 형식으로 응답할 것:
                {"isValid": true 또는 false, "feedback": "통과 여부 및 오류 이유 설명"}
            `;

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: { temperature: 0.1 } })
                });

                const data = await response.json();
                let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text.replace(/```json/gi, '').replace(/```/g, '').trim(); 
                const result = JSON.parse(aiText);

                if (result.isValid) {
                    if (editingQuizId) {
                        // 🔥 수정 모드: 기존 문서 업데이트
                        await window.updateDoc(window.doc(window.firebaseDb, "user_quizzes", editingQuizId), {
                            language: currentLang,
                            title: title,
                            code: code,
                            answer: answer,
                            hint: hint,
                            updatedAt: new Date().toISOString()
                        });
                        showToast("✅ 퀴즈가 성공적으로 수정되었습니다!", "success");
                    } else {
                        // 🔥 신규 등록 모드: 새 문서 추가
                        await window.addDoc(window.collection(window.firebaseDb, "user_quizzes"), {
                            language: currentLang,
                            title: title,
                            code: code,
                            answer: answer,
                            hint: hint,
                            authorId: currentUser.id,
                            authorUid: currentUser.uid || '',
                            authorName: currentUser.nickname,
                            createdAt: new Date().toISOString()
                        });
                        showToast("🎉 완벽합니다! AI 검증을 통과하여 문제 은행에 등록되었습니다.", "success");
                    }

                    closeCustomMenus();
                    loadMyQuizzesFromDB();
                } else {
                    feedbackBox.innerHTML = `<strong>❌ 코드에 문제가 있어요:</strong><br>${result.feedback}`;
                    feedbackBox.classList.remove('hidden');
                    showToast("AI 검증에 실패했습니다. 피드백을 확인해주세요.", "error");
                }
            } catch (err) {
                console.error(err);
                showToast("검증 서버 통신에 실패했습니다.", "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = editingQuizId ? 'AI 검증 및 퀴즈 수정 완료하기' : 'AI 검증 및 문제 은행 등록하기';
            }
        }

        // 내 퀴즈인지 판별하는 헬퍼 함수
        function isMyQuizItem(q) {
            if (!currentUser) return false;
            return (q.authorId && q.authorId === currentUser.id) ||
                   (q.authorUid && q.authorUid === currentUser.uid) ||
                   (q.authorId && q.authorId === currentUser.uid);
        }

        // 2) 커뮤니티 퀴즈 목록 불러오기 (내가 만든 문제는 수정/삭제 버튼 표시)
        async function loadCommunityQuizzesFromDB() {
            const listContainer = document.getElementById('communityQuizList');
            listContainer.innerHTML = `<div class="text-center col-span-full py-10"><i class="fa-solid fa-spinner animate-spin text-2xl text-rose-400"></i><p class="mt-2 text-sm text-slate-400">DB에서 문제들을 불러오고 있습니다...</p></div>`;

            try {
                const querySnapshot = await window.getDocs(window.collection(window.firebaseDb, "user_quizzes"));
                cachedCommunityQuizzes = [];
                
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.language === currentLang) {
                        cachedCommunityQuizzes.push({ id: docSnap.id, ...data });
                    }
                });

                if (cachedCommunityQuizzes.length === 0) {
                    listContainer.innerHTML = `<div class="col-span-full text-center py-8 text-slate-400 text-sm">아직 등록된 유저 퀴즈가 없습니다. 첫 번째 출제자가 되어보세요!</div>`;
                    return;
                }

                listContainer.innerHTML = cachedCommunityQuizzes.map((q, idx) => {
                    const isMine = isMyQuizItem(q);
                    return `
                        <div class="bg-slate-900 rounded-xl p-5 border border-slate-700/60 flex flex-col justify-between hover:border-rose-500/50 transition">
                            <div>
                                <div class="flex justify-between items-start mb-2 gap-2">
                                    <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400">유저 출제</span>
                                    <span class="text-[10px] text-slate-500">출제자: ${q.authorName}</span>
                                </div>
                                <h4 class="font-extrabold text-base mt-2 mb-4 text-white">${q.title}</h4>
                            </div>
                            <div class="space-y-2">
                                <button onclick="solveCommunityQuizByIndex(${idx})" class="w-full text-xs font-bold py-2 rounded-lg border border-slate-600 hover:bg-slate-700 text-slate-200 transition">
                                    실습실로 불러와서 풀기
                                </button>
                                ${isMine ? `
                                <div class="flex items-center gap-2 pt-1">
                                    <button onclick="startEditQuiz('${q.id}')" class="flex-1 text-xs font-bold py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-slate-950 border border-sky-500/20 transition">
                                        <i class="fa-solid fa-pen mr-1"></i>수정
                                    </button>
                                    <button onclick="deleteUserQuiz('${q.id}')" class="flex-1 text-xs font-bold py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition">
                                        <i class="fa-solid fa-trash mr-1"></i>삭제
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('');

            } catch (err) {
                console.error(err);
                listContainer.innerHTML = `<div class="col-span-full text-center py-8 text-rose-400 text-sm">데이터베이스를 불러오는데 실패했습니다.</div>`;
            }
        }

        // 3) 마이페이지에서 내가 만든 모든 퀴즈 불러오기
        async function loadMyQuizzesFromDB() {
            const listContainer = document.getElementById('myQuizzesList');
            if (!listContainer || !currentUser) return;

            listContainer.innerHTML = `<div class="text-center py-6 text-xs text-slate-400"><i class="fa-solid fa-spinner animate-spin mr-1.5"></i>내 퀴즈 목록을 불러오는 중...</div>`;

            try {
                const querySnapshot = await window.getDocs(window.collection(window.firebaseDb, "user_quizzes"));
                cachedMyQuizzes = [];

                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (isMyQuizItem(data)) {
                        cachedMyQuizzes.push({ id: docSnap.id, ...data });
                    }
                });

                if (cachedMyQuizzes.length === 0) {
                    listContainer.innerHTML = `<div class="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">아직 직접 출제한 퀴즈가 없습니다. [퀴즈] 탭에서 나만의 문제를 만들어보세요!</div>`;
                    return;
                }

                listContainer.innerHTML = cachedMyQuizzes.map(q => `
                    <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">${q.language}</span>
                                <h4 class="font-extrabold text-sm">${q.title}</h4>
                            </div>
                            <p class="text-xs text-slate-400 mt-1 font-mono">정답: <span class="text-emerald-400 font-bold">${q.answer}</span></p>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <button onclick="startEditQuiz('${q.id}')" class="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-slate-950 border border-sky-500/20 text-xs font-bold transition">
                                <i class="fa-solid fa-pen mr-1"></i>수정
                            </button>
                            <button onclick="deleteUserQuiz('${q.id}')" class="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-xs font-bold transition">
                                <i class="fa-solid fa-trash mr-1"></i>삭제
                            </button>
                        </div>
                    </div>
                `).join('');
            } catch (err) {
                console.error(err);
                listContainer.innerHTML = `<div class="text-center py-4 text-xs text-rose-400">내 퀴즈 목록을 불러오지 못했습니다.</div>`;
            }
        }

        // 4) 퀴즈 수정 모드로 열기
        async function startEditQuiz(quizId) {
            if (!currentUser) return showToast("로그인이 필요합니다.", "error");

            try {
                const docSnap = await window.getDoc(window.doc(window.firebaseDb, "user_quizzes", quizId));
                if (!docSnap.exists()) return showToast("해당 퀴즈를 찾을 수 없습니다.", "error");

                const data = docSnap.data();
                editingQuizId = quizId;

                if (data.language && data.language !== currentLang) {
                    setLanguage(data.language);
                }

                switchTab('quiz');
                openQuizCreator(true);

                document.getElementById('cqTitle').value = data.title || '';
                document.getElementById('cqCode').value = data.code || '';
                document.getElementById('cqAnswer').value = data.answer || '';
                document.getElementById('cqHint').value = data.hint || '';
                document.getElementById('cqSubmitBtn').innerText = 'AI 검증 및 퀴즈 수정 완료하기';
                updateQuizCreatorUI();

                showToast("퀴즈 수정 모드로 전환되었습니다. 내용을 수정한 뒤 버튼을 눌러주세요!", "info");
            } catch (err) {
                console.error(err);
                showToast("퀴즈 정보를 불러오는데 실패했습니다.", "error");
            }
        }

        // 5) 퀴즈 영구 삭제하기
        async function deleteUserQuiz(quizId) {
            if (!currentUser) return showToast("로그인이 필요합니다.", "error");
            if (!confirm("정말 이 퀴즈를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) return;

            try {
                await window.deleteDoc(window.doc(window.firebaseDb, "user_quizzes", quizId));
                showToast("퀴즈가 삭제되었습니다. 🗑️", "info");
                loadMyQuizzesFromDB();
                const commContainer = document.getElementById('communityQuizzesContainer');
                if (commContainer && !commContainer.classList.contains('hidden')) {
                    loadCommunityQuizzesFromDB();
                }
            } catch (err) {
                console.error(err);
                showToast("퀴즈 삭제 실패: " + err.message, "error");
            }
        }

        // 6) 커뮤니티 퀴즈를 실습실로 불러와 풀기
        function solveCommunityQuizByIndex(idx) {
            const q = cachedCommunityQuizzes[idx];
            if (!q) return;
            solveCommunityQuiz(q.code, q.answer, q.hint);
        }

        function solveCommunityQuiz(code, answer, hint) {
            openStudioSnippet(`community_${currentLang}.${studioLanguageExtension(currentLang)}`,code,{
                answer:answer || '', explanation:hint || '출제자가 제공한 힌트가 없어요.',initialCode:code
            });
            showToast('커뮤니티 빈칸 문제를 스낵 스튜디오로 불러왔어요.', 'info');
        }

