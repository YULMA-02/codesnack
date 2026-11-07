// CodeSnack - account.js (original script order preserved)
        /* =========================================
           🔥 3가지 계정(일반인/학생/선생님) & 클래스/과제 관리 로직
           ========================================= */
        function toggleRoleFields(role) {
            document.getElementById('signup-role').value = role;
            const codeField = document.getElementById('teacherCodeField');
            if (role === 'student') {
                codeField.classList.remove('hidden');
            } else {
                codeField.classList.add('hidden');
            }
        }

        async function handleSignup(e) {
            e.preventDefault();
            const role = document.getElementById('signup-role').value || 'general';
            const teacherCodeInput = document.getElementById('signup-teacher-code').value.trim().toUpperCase();
            const nickname = document.getElementById('signup-nickname').value.trim();
            const idInput = document.getElementById('signup-id').value.trim();
            const password = document.getElementById('signup-password').value;

            if (!nickname || !idInput || !password) {
                showToast("모든 필수 항목을 입력해주세요.", "error");
                return;
            }

            if (password.length < 6) {
                showToast("비밀번호는 6자리 이상으로 입력해주세요!", "error");
                return;
            }

            const email = idInput + "@codesnack.com";
            const classCode = role === 'teacher' ? 'TCH-' + Math.random().toString(36).substring(2, 6).toUpperCase() : '';

            try {
                const userCredential = await window.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
                const user = userCredential.user;

                const initialData = {
                    uid: user.uid,
                    nickname: nickname,
                    id: idInput,
                    role: role,
                    classCode: classCode,
                    teacherCode: role === 'student' ? teacherCodeInput : '',
                    xp: 0,
                    streak: 0,
                    solvedCount: 0,
                    learningProgress: { completed: {}, activityDays: [] }
                };

                await window.setDoc(window.doc(window.firebaseDb, "users", user.uid), initialData);

                currentUser = { ...initialData };
                xp = 0;
                streak = 0;
                solvedQuizzesCount = 0;
                loadLearningProgress(currentUser);

                updateUIForAuth();
                const roleLabel = role === 'teacher' ? '선생님' : role === 'student' ? '학생' : '일반인';
                showToast(`환영합니다, ${nickname}님! (${roleLabel} 계정 가입 완료) 🎉`, "success");
                switchTab('mypage');

                document.getElementById('signup-nickname').value = "";
                document.getElementById('signup-id').value = "";
                document.getElementById('signup-password').value = "";
                document.getElementById('signup-teacher-code').value = "";
            } catch (error) {
                console.error("회원가입 에러:", error);
                if (error.code === 'auth/email-already-in-use') {
                    showToast("이미 존재하는 아이디입니다.", "error");
                } else {
                    showToast("오류 발생: " + error.message, "error");
                }
            }
        }

        async function handleLogin(e) {
            e.preventDefault();
            const idInput = document.getElementById('login-id').value.trim();
            const email = idInput + "@codesnack.com";
            const password = document.getElementById('login-password').value;
            const keepSignedIn = document.getElementById('login-remember-me').checked;

            try {
                // 로그인 전에 저장 기간을 지정해야 선택이 실제 인증 상태에 적용됩니다.
                await window.setAuthPersistence(
                    window.firebaseAuth,
                    keepSignedIn ? window.browserLocalPersistence : window.browserSessionPersistence
                );
                const cred = await window.signInWithEmailAndPassword(window.firebaseAuth, email, password);
                const docSnap = await window.getDoc(window.doc(window.firebaseDb, "users", cred.user.uid));
                if (docSnap.exists()) {
                    currentUser = { ...docSnap.data(), uid: cred.user.uid };
                    xp = currentUser.xp || 0;
                    solvedQuizzesCount = currentUser.solvedCount || 0;
                    loadLearningProgress(currentUser);
                }
                updateUIForAuth();
                showToast("로그인 성공! 🎉", "success");
                switchTab('mypage');
            } catch (error) {
                console.error("로그인 오류:", error);
                if (['auth/unsupported-persistence-type', 'auth/web-storage-unsupported', 'auth/operation-not-supported-in-this-environment'].includes(error?.code)) {
                    showToast("이 브라우저에서는 로그인 상태를 저장할 수 없어요. 브라우저 설정을 확인해주세요.", "error");
                } else {
                    showToast("로그인 실패: 아이디나 비밀번호를 확인해주세요.", "error");
                }
            }
        }

        async function handleLogout() {
            try {
                await window.signOut(window.firebaseAuth);
                currentUser = null;
                xp = 0;
                solvedQuizzesCount = 0;
                loadLearningProgress();
                updateUIForAuth();
                showToast("성공적으로 로그아웃되었습니다.", "info");
                switchTab('tutorial');
            } catch (error) {
                showToast("로그아웃 실패: " + error.message, "error");
            }
        }

        async function autoSaveUserData() {
            if (!currentUser || !currentUser.uid) return;
            currentUser.xp = xp;
            currentUser.streak = computeStreak(learningProgress.activityDays);
            currentUser.learningProgress = learningProgress;
            currentUser.solvedCount = solvedQuizzesCount;
            
            try {
                await window.setDoc(window.doc(window.firebaseDb, "users", currentUser.uid), {
                    xp: currentUser.xp,
                    streak: currentUser.streak,
                    learningProgress: currentUser.learningProgress,
                    solvedCount: currentUser.solvedCount
                }, { merge: true });
                updateMyPageUI();
            } catch (error) {
                console.error("데이터 저장 실패:", error);
            }
        }

        // 역할별 마이페이지 대시보드 렌더링
        function renderRoleDashboard() {
            const container = document.getElementById('roleDashboardContainer');
            if (!container || !currentUser) return;

            const role = currentUser.role || 'general';

            if (role === 'teacher') {
                container.innerHTML = `
                    <div class="space-y-6">
                        <!-- 선생님 초대 코드 카드 -->
                        <div class="p-4 sm:p-5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">CLASS CODE</span>
                                <h4 class="font-extrabold text-base text-slate-900 dark:text-white mt-1">선생님 전용 학생 연동 코드</h4>
                                <p class="text-xs text-slate-400 mt-0.5">학생이 회원가입 또는 마이페이지에서 아래 코드를 입력하면 내 학생 목록에 즉시 연동됩니다.</p>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <span id="teacherClassCodeText" class="px-4 py-2 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-300 font-mono font-black text-base select-all">${currentUser.classCode || '생성중...'}</span>
                                <button onclick="copyTeacherCode()" class="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition">복사</button>
                            </div>
                        </div>

                        <!-- 과제 출제 & 연동 학생 목록 그리드 -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- 새 과제 출제 폼 -->
                            <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                                <h4 class="font-extrabold text-sm flex items-center gap-2 text-slate-900 dark:text-white">
                                    <i class="fa-solid fa-pen-to-square text-emerald-400"></i> 학생들에게 새 과제 내기
                                </h4>
                                <input type="text" id="assignTitle" placeholder="과제 제목 (예: 파이썬 for문으로 구구단 작성하기)" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-purple-500">
                                <textarea id="assignContent" rows="3" placeholder="과제 설명 및 달성 조건을 적어주세요." class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-purple-500 resize-none"></textarea>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <label class="text-[11px] text-slate-500 dark:text-slate-400">학습 언어
                                    <select id="assignLanguage" class="block w-full mt-1 p-2 rounded border border-slate-600 bg-slate-950 text-white text-xs"><option value="any">언어 자유</option><option value="python">Python</option><option value="javascript">JavaScript</option><option value="cpp">C++</option><option value="java">Java</option><option value="csharp">C#</option></select>
                                  </label>
                                  <label class="text-[11px] text-slate-500 dark:text-slate-400">마감일 (선택)
                                    <input id="assignDueDate" type="date" class="block w-full mt-1 p-2 rounded border border-slate-600 bg-slate-950 text-white text-xs">
                                  </label>
                                </div>
                                <button onclick="createAssignment()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition shadow">
                                    <i class="fa-solid fa-paper-plane mr-1"></i> 과제 등록 및 배포하기
                                </button>
                            </div>

                            <!-- 연동된 학생 관리 리스트 -->
                            <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
                                <div>
                                    <div class="flex items-center justify-between mb-3">
                                        <h4 class="font-extrabold text-sm flex items-center gap-2 text-slate-900 dark:text-white">
                                            <i class="fa-solid fa-users text-sky-400"></i> 연동된 학생 관리 및 학습 현황
                                        </h4>
                                        <button onclick="loadTeacherDashboardData()" class="text-xs text-slate-400 hover:text-white"><i class="fa-solid fa-rotate-right"></i> 새로고침</button>
                                    </div>
                                    <div id="teacherStudentsList" class="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
                                        <div class="text-slate-400 py-4 text-center">학생 목록을 불러오는 중...</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 출제한 과제 및 학생별 진행상황 확인 -->
                        <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                            <h4 class="font-extrabold text-sm mb-3 flex items-center gap-2 text-white">
                                <i class="fa-solid fa-list-check text-amber-400"></i> 출제한 과제 및 학생 달성 현황
                            </h4>
                            <div id="teacherAssignmentsProgressList" class="space-y-3 text-xs">
                                <div class="text-slate-400 py-4 text-center">과제 진행 상황을 불러오는 중...</div>
                            </div>
                        </div>
                    </div>
                `;
                loadTeacherDashboardData();

            } else if (role === 'student') {
                container.innerHTML = `
                    <div class="space-y-6">
                        <!-- 선생님 코드 연동 박스 -->
                        <div class="p-4 sm:p-5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">TEACHER LINK</span>
                                <h4 class="font-extrabold text-base text-slate-900 dark:text-white mt-1">내 선생님 클래스 코드 연동</h4>
                                <p class="text-xs text-slate-400 mt-0.5">현재 연결된 선생님 코드: <strong class="font-mono text-sky-400">${currentUser.teacherCode || '미연동'}</strong></p>
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="text" id="updateTeacherCodeInput" value="${currentUser.teacherCode || ''}" placeholder="선생님 코드 (예: TCH-AB12)" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white uppercase outline-none focus:border-sky-400">
                                <button onclick="linkTeacherCode()" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs transition whitespace-nowrap">코드 연동</button>
                            </div>
                        </div>

                        <!-- 선생님이 내주신 과제 목록 -->
                        <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="font-extrabold text-sm flex items-center gap-2 text-slate-900 dark:text-white">
                                    <i class="fa-solid fa-clipboard-list text-amber-400"></i> 선생님이 출제한 과제 목록
                                </h4>
                                <button onclick="loadStudentAssignments()" class="text-xs text-slate-400 hover:text-white"><i class="fa-solid fa-rotate-right"></i> 새로고침</button>
                            </div>
                            <div id="studentAssignmentsList" class="space-y-3">
                                <div class="text-center py-6 text-xs text-slate-400">과제를 불러오는 중입니다...</div>
                            </div>
                        </div>
                    </div>
                `;
                loadStudentAssignments();

            } else {
                container.innerHTML = `
                    <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p class="text-xs text-slate-400">현재 <strong>일반인 계정</strong>으로 이용 중입니다. 마이페이지에서 언제든 학생 또는 선생님 모드로 전환할 수 있습니다.</p>
                        <div class="flex gap-2 shrink-0">
                            <button onclick="switchUserRole('student')" class="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold hover:bg-sky-500 hover:text-slate-950 transition">학생 계정으로 전환</button>
                            <button onclick="switchUserRole('teacher')" class="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold hover:bg-purple-500 hover:text-white transition">선생님 계정으로 전환</button>
                        </div>
                    </div>
                `;
            }
        }

        async function switchUserRole(newRole) {
            if (!currentUser || !currentUser.uid) return;
            const classCode = (newRole === 'teacher' && !currentUser.classCode)
                ? 'TCH-' + Math.random().toString(36).substring(2, 6).toUpperCase()
                : (currentUser.classCode || '');

            currentUser.role = newRole;
            currentUser.classCode = classCode;
            await window.setDoc(window.doc(window.firebaseDb, "users", currentUser.uid), {
                role: newRole,
                classCode: classCode
            }, { merge: true });

            updateMyPageUI();
            showToast(`${newRole === 'teacher' ? '선생님' : '학생'} 계정으로 전환되었습니다!`, "success");
        }

        function copyTeacherCode() {
            if (!currentUser?.classCode) return;
            navigator.clipboard.writeText(currentUser.classCode);
            showToast(`클래스 코드(${currentUser.classCode})가 복사되었습니다! 📋`, "success");
        }

        async function linkTeacherCode() {
            if (!currentUser || !currentUser.uid) return;
            const newCode = document.getElementById('updateTeacherCodeInput').value.trim().toUpperCase();
            if (!newCode) return showToast("선생님 코드를 입력해주세요.", "error");

            try {
                const users = await window.getDocs(window.collection(window.firebaseDb,'users'));
                let found = false;
                users.forEach(userDoc=>{const teacher = userDoc.data(); if(teacher.role==='teacher'&&teacher.classCode===newCode)found=true;});
                if(!found)return showToast('해당 코드로 등록된 선생님을 찾을 수 없어요.','error');
                currentUser.teacherCode = newCode;
                await window.setDoc(window.doc(window.firebaseDb, "users", currentUser.uid), {
                    teacherCode: newCode
                }, { merge: true });
                showToast(`선생님 코드(${newCode}) 연동이 완료되었습니다! 🎉`, "success");
                renderRoleDashboard();
            } catch (err) {
                showToast("코드 연동 실패: " + err.message, "error");
            }
        }


        /* 학생 답안 제출 → 선생님 검토/피드백 → 승인 시 XP (Firestore submissions 컬렉션) */
        const assignmentLangNames = {any:'언어 자유',python:'Python',javascript:'JavaScript',cpp:'C++',java:'Java',csharp:'C#'};
        function escapeAssignmentHTML(value) {
            return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        }
        function submissionStatusLabel(status) {
            return ({approved:'승인 완료',submitted:'검토 대기',revision:'수정 요청',legacy:'이전 방식 완료'})[status] || '미제출';
        }
        function submissionStatusClass(status) {
            return ({approved:'text-emerald-600 dark:text-emerald-400',submitted:'text-sky-600 dark:text-sky-400',revision:'text-amber-600 dark:text-amber-400',legacy:'text-purple-600 dark:text-purple-400'})[status] || 'text-slate-500';
        }
        function formatAssignmentDate(stamp) {
            if (!stamp) return '';
            const date = new Date(stamp);
            return isNaN(date.getTime()) ? '' : date.toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
        }
        async function createAssignment() {
            if (!currentUser || currentUser.role !== 'teacher') return;
            const title=document.getElementById('assignTitle').value.trim();
            const content=document.getElementById('assignContent').value.trim();
            const language=document.getElementById('assignLanguage').value;
            const dueDate=document.getElementById('assignDueDate').value;
            if(!title || !content) return showToast('과제 제목과 설명을 입력해 주세요.','error');
            if(dueDate && dueDate<localDateKey())return showToast('마감일은 오늘 이후로 선택해 주세요.','error');
            try {
                await window.addDoc(window.collection(window.firebaseDb,'assignments'),{
                    teacherId:currentUser.uid, teacherName:currentUser.nickname,
                    classCode:currentUser.classCode,title,content,language,dueDate,
                    completedStudentIds:[],createdAt:new Date().toISOString()
                });
                document.getElementById('assignTitle').value='';
                document.getElementById('assignContent').value='';
                document.getElementById('assignDueDate').value='';
                document.getElementById('assignLanguage').value='any';
                showToast('과제가 등록되었어요. 학생 제출물을 기다려 주세요.','success');
                loadTeacherDashboardData();
            }catch(err){showToast('과제 등록 실패: '+err.message,'error');}
        }
        async function loadTeacherDashboardData() {
            const studentsBox=document.getElementById('teacherStudentsList');
            const assignmentsBox=document.getElementById('teacherAssignmentsProgressList');
            if (!studentsBox || !assignmentsBox || currentUser?.role!=='teacher') return;
            try {
                const [usersSnap,assignSnap,submitSnap]=await Promise.all([
                    window.getDocs(window.collection(window.firebaseDb,'users')),
                    window.getDocs(window.collection(window.firebaseDb,'assignments')),
                    window.getDocs(window.collection(window.firebaseDb,'submissions'))
                ]);
                const students=[];usersSnap.forEach(d=>{const v=d.data();if(v.role==='student'&&v.teacherCode===currentUser.classCode)students.push({uid:d.id,...v});});
                const assignments=[];assignSnap.forEach(d=>{const v=d.data();if(v.teacherId===currentUser.uid && v.classCode===currentUser.classCode)assignments.push({docId:d.id,...v});});
                assignments.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
                const submissions=[];submitSnap.forEach(d=>{const v=d.data();if(v.teacherId===currentUser.uid && v.classCode===currentUser.classCode)submissions.push({docId:d.id,...v});});
                const byAssignment=new Map();
                for(const sub of submissions){
                    if(!byAssignment.has(sub.assignmentId))byAssignment.set(sub.assignmentId,[]);
                    byAssignment.get(sub.assignmentId).push(sub);
                }
                if(!students.length){
                    studentsBox.innerHTML='<p class="text-slate-500 py-5 text-center">아직 연동된 학생이 없어요. 상단 클래스 코드를 학생에게 알려주세요.</p>';
                }else{
                    studentsBox.innerHTML=students.map(student=>{
                        const approvedCount=assignments.filter(a=> (byAssignment.get(a.docId)||[]).some(sub=>sub.studentId===student.uid && sub.status==='approved') || (a.completedStudentIds||[]).includes(student.uid)).length;
                        return `<div class="p-3 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                            <div class="flex justify-between gap-2"><strong class="text-slate-900 dark:text-white">${escapeAssignmentHTML(student.nickname)}</strong><span class="text-xs text-emerald-600 dark:text-emerald-400">${approvedCount}/${assignments.length}건 완료</span></div>
                            <p class="text-[11px] text-slate-500 mt-1">${escapeAssignmentHTML(student.id)} · ${Number(student.xp||0)} XP · ${computeStreak(student.learningProgress?.activityDays||[])}일 연속 학습</p>
                        </div>`;
                    }).join('');
                }
                if(!assignments.length){assignmentsBox.innerHTML='<p class="text-slate-500 p-4 text-center">아직 출제한 과제가 없어요.</p>';return;}
                assignmentsBox.innerHTML=assignments.map(a=>{
                    const records=byAssignment.get(a.docId)||[];
                    const approved=records.filter(r=>r.status==='approved').length;
                    const pending=records.filter(r=>r.status==='submitted').length;
                    const legacy=(a.completedStudentIds||[]).filter(uid=>!records.some(s=>s.studentId===uid)).length;
                    const submissionHtml=records.sort((x,y)=>String(y.submittedAt||'').localeCompare(String(x.submittedAt||''))).map(sub=>{
                        const reviewed=sub.status==='approved', status=submissionStatusLabel(sub.status);
                        const identity=students.find(student=>student.uid===sub.studentId);
                        const inputId=`feedback_${sub.docId}`;
                        return `<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-3 mt-3 space-y-2">
                            <div class="flex flex-wrap items-center justify-between gap-1"><strong class="text-sm text-slate-900 dark:text-white">${escapeAssignmentHTML(identity?.nickname||sub.studentName||'학생')}</strong><span class="font-bold ${submissionStatusClass(sub.status)}">${status}</span></div>
                            <p class="text-slate-500 text-[11px]">제출 ${escapeAssignmentHTML(formatAssignmentDate(sub.submittedAt))} · ${escapeAssignmentHTML(assignmentLangNames[sub.language]||sub.language||'언어 자유')}</p>
                            ${sub.answer?`<div class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-xs"><b>설명:</b> ${escapeAssignmentHTML(sub.answer)}</div>`:''}
                            ${sub.code?`<pre class="p-3 rounded bg-slate-950 text-emerald-300 overflow-x-auto whitespace-pre-wrap text-[11px]">${escapeAssignmentHTML(sub.code)}</pre>`:''}
                            <label class="block text-[11px] text-slate-500">선생님 피드백</label>
                            <textarea id="${inputId}" rows="2" placeholder="잘한 점, 보완할 점을 입력해 주세요." class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 p-2 text-xs text-slate-900 dark:text-white">${escapeAssignmentHTML(sub.feedback||'')}</textarea>
                            <div class="flex gap-2 flex-wrap">
                                <button onclick="reviewSubmission('${sub.docId}','approved')" ${reviewed?'disabled':''} class="px-3 py-2 text-xs font-bold bg-emerald-600 text-white rounded disabled:opacity-40">${reviewed?'승인됨 (+100 XP)':'승인하기 (+100 XP)'}</button>
                                <button onclick="reviewSubmission('${sub.docId}','revision')" ${reviewed?'disabled':''} class="px-3 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded disabled:opacity-40">수정 요청</button>
                            </div>
                        </div>`;
                    }).join('');
                    const notSubmitted=students.filter(st=>!records.some(r=>r.studentId===st.uid)&&!(a.completedStudentIds||[]).includes(st.uid)).map(st=>st.nickname);
                    return `<div class="p-4 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 space-y-2">
                        <div class="flex flex-wrap justify-between gap-2"><h5 class="font-extrabold text-sm text-slate-900 dark:text-white">${escapeAssignmentHTML(a.title)}</h5><span class="font-bold text-emerald-600 dark:text-emerald-400">승인 ${approved+legacy}/${students.length} · 검토 ${pending}</span></div>
                        <p class="text-slate-600 dark:text-slate-400 whitespace-pre-wrap text-xs">${escapeAssignmentHTML(a.content)}</p>
                        <p class="text-slate-500 text-[11px]">${escapeAssignmentHTML(assignmentLangNames[a.language||'any'])} ${a.dueDate?' · 마감 '+escapeAssignmentHTML(a.dueDate):''}</p>
                        ${notSubmitted.length?`<p class="text-[11px] text-rose-500">미제출: ${escapeAssignmentHTML(notSubmitted.join(', '))}</p>`:''}
                        ${legacy?'<p class="text-[11px] text-purple-500">※ 기존 방식으로 완료 처리된 내역이 포함돼요.</p>':''}
                        ${submissionHtml || '<p class="text-slate-500 text-xs">아직 검토할 답안이 없어요.</p>'}
                    </div>`;
                }).join('');
            }catch(err){console.error('Teacher dashboard load error:',err);studentsBox.innerHTML='<p class="text-rose-500">학생 목록을 불러오지 못했어요.</p>';assignmentsBox.innerHTML='<p class="text-rose-500">과제와 제출물을 불러오지 못했어요. Firestore 데이터 접근 설정을 확인해 주세요.</p>';}
        }
        async function loadStudentAssignments() {
            const container=document.getElementById('studentAssignmentsList');
            if(!container || currentUser?.role!=='student')return;
            if(!currentUser.teacherCode){container.textContent='선생님 코드를 연동하면 과제가 표시돼요.';return;}
            try {
                const [assignSnap,subSnap,userSnap]=await Promise.all([
                    window.getDocs(window.collection(window.firebaseDb,'assignments')),
                    window.getDocs(window.collection(window.firebaseDb,'submissions')),
                    window.getDoc(window.doc(window.firebaseDb,'users',currentUser.uid))
                ]);
                if(userSnap.exists()){
                    xp=Number(userSnap.data().xp||0); currentUser.xp=xp;
                    document.getElementById('userXP').textContent=xp;
                    const myXP=document.getElementById('myPageXP');if(myXP)myXP.textContent=xp+' XP';
                }
                const assignments=[];assignSnap.forEach(d=>{const a=d.data();if(a.classCode===currentUser.teacherCode)assignments.push({docId:d.id,...a});});
                assignments.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
                const submissions=new Map();subSnap.forEach(d=>{const x=d.data();if(x.studentId===currentUser.uid)submissions.set(x.assignmentId,{docId:d.id,...x});});
                if(!assignments.length){container.textContent='아직 출제된 과제가 없어요.';return;}
                container.innerHTML=assignments.map(a=>{
                    const sub=submissions.get(a.docId);
                    const legacy=!sub&&(a.completedStudentIds||[]).includes(currentUser.uid);
                    const status=legacy?'legacy':(sub?.status||'new');
                    const editable=!legacy && status!=='approved' && status!=='submitted';
                    const lang=a.language&&a.language!=='any'?a.language:(sub?.language||currentLang);
                    const langOptions=Object.entries(assignmentLangNames).filter(([key])=>key!=='any').map(([key,name])=>`<option value="${key}" ${lang===key?'selected':''}>${name}</option>`).join('');
                    const deadlinePassed=a.dueDate&&a.dueDate<localDateKey();
                    return `<div class="p-4 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2"><h5 class="font-bold text-sm text-slate-900 dark:text-white">${escapeAssignmentHTML(a.title)}</h5><span class="text-xs font-bold ${submissionStatusClass(status)}">${submissionStatusLabel(status)}</span></div>
                        <p class="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">${escapeAssignmentHTML(a.content)}</p>
                        <p class="text-[11px] text-slate-500">${escapeAssignmentHTML(assignmentLangNames[a.language||'any'])}${a.dueDate?' · 마감 '+escapeAssignmentHTML(a.dueDate)+(deadlinePassed?' (기한 지남)':''):''}</p>
                        ${legacy?'<p class="text-xs text-purple-500">이 과제는 예전 완료 방식으로 처리되었어요. 기존 기록을 유지합니다.</p>':`
                        <label class="text-xs text-slate-600 dark:text-slate-300 block">학습 언어
                            <select id="submissionLang_${a.docId}" ${!editable||a.language&&a.language!=='any'?'disabled':''} class="block w-full mt-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 text-xs text-slate-900 dark:text-white">${langOptions}</select>
                        </label>
                        <label class="text-xs text-slate-600 dark:text-slate-300 block">풀이 설명 / 답안
                            <textarea id="submissionAnswer_${a.docId}" ${!editable?'readonly':''} rows="3" placeholder="어떻게 해결했는지 적어주세요." class="w-full mt-1 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white">${escapeAssignmentHTML(sub?.answer||'')}</textarea>
                        </label>
                        <label class="text-xs text-slate-600 dark:text-slate-300 block">작성한 코드 (선택)
                            <textarea id="submissionCode_${a.docId}" ${!editable?'readonly':''} rows="6" placeholder="작성한 코드를 붙여 넣으세요. 코드를 제출하는 과제라면 여기에 입력하세요." spellcheck="false" class="font-mono w-full mt-1 p-2 rounded bg-slate-950 border border-slate-700 text-xs text-emerald-300">${escapeAssignmentHTML(sub?.code||'')}</textarea>
                        </label>
                        ${sub?.feedback?`<p class="p-3 text-xs rounded bg-amber-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap"><b>선생님 피드백</b>\n${escapeAssignmentHTML(sub.feedback)}</p>`:''}
                        <button onclick="completeAssignment('${a.docId}')" ${!editable?'disabled':''} class="px-4 py-2 rounded bg-emerald-600 text-white text-xs font-bold disabled:bg-slate-400 dark:disabled:bg-slate-700">${status==='revision'?'수정해서 다시 제출':'과제 답안 제출하기'}</button>
                        ${status==='submitted'?'<p class="text-xs text-sky-600 dark:text-sky-400">선생님 검토를 기다리고 있어요. 검토 후 새로고침해 주세요.</p>':''}
                        ${status==='approved'?'<p class="text-xs text-emerald-600 dark:text-emerald-400">승인 완료! 첫 승인 시 100 XP가 지급돼요.</p>':''}
                        `}
                    </div>`;
                }).join('');
            }catch(err){console.error('Student assignment load error:',err);container.innerHTML='<p class="text-rose-500 text-xs">과제 또는 제출물을 불러올 수 없어요. 새로고침하거나 데이터 접근 설정을 확인해 주세요.</p>';}
        }
        async function completeAssignment(assignmentId) {
            if(currentUser?.role!=='student'||!currentUser.uid)return showToast('학생 계정으로 로그인해 주세요.','error');
            const answer=document.getElementById('submissionAnswer_'+assignmentId)?.value.trim()||'';
            const code=document.getElementById('submissionCode_'+assignmentId)?.value.trim()||'';
            const language=document.getElementById('submissionLang_'+assignmentId)?.value||currentLang;
            if(!answer&&!code)return showToast('풀이 설명이나 코드를 작성한 뒤 제출해 주세요.','error');
            try {
                const assignmentRef=window.doc(window.firebaseDb,'assignments',assignmentId);
                const assignSnap=await window.getDoc(assignmentRef);
                if(!assignSnap.exists()||assignSnap.data().classCode!==currentUser.teacherCode)return showToast('연동된 클래스의 과제가 아닙니다.','error');
                const submissionRef=window.doc(window.firebaseDb,'submissions',`${assignmentId}_${currentUser.uid}`);
                const before=await window.getDoc(submissionRef);
                if(before.exists() && ['approved','submitted'].includes(before.data().status))return showToast('검토 중이거나 이미 승인된 과제입니다.','info');
                const a=assignSnap.data();
                await window.setDoc(submissionRef,{
                    assignmentId, teacherId:a.teacherId, classCode:a.classCode,
                    studentId:currentUser.uid, studentName:currentUser.nickname,
                    language:a.language&&a.language!=='any'?a.language:language,
                    answer,code,status:'submitted',feedback:'',submittedAt:new Date().toISOString(),
                    rewardGranted:false
                },{merge:true});
                recordStudyActivity();
                showToast('답안을 제출했어요. 선생님이 검토하면 상태가 바뀝니다.','success');
                await loadStudentAssignments();
            }catch(err){showToast('과제 제출 실패: '+err.message,'error');}
        }
        async function reviewSubmission(submissionId,newStatus) {
            if(currentUser?.role!=='teacher')return;
            const feedback=document.getElementById('feedback_'+submissionId)?.value.trim()||'';
            if(newStatus==='revision'&&!feedback)return showToast('수정 요청 이유를 적어 주세요.','error');
            try {
                const ref=window.doc(window.firebaseDb,'submissions',submissionId);
                await window.runTransaction(window.firebaseDb,async tx=>{
                    const snapshot=await tx.get(ref);
                    if(!snapshot.exists())throw new Error('제출물이 존재하지 않습니다.');
                    const sub=snapshot.data();
                    if(sub.teacherId!==currentUser.uid || sub.classCode!==currentUser.classCode)throw new Error('해당 반의 제출물이 아닙니다.');
                    if(sub.status==='approved')throw new Error('이미 승인된 과제는 다시 처리할 수 없습니다.');
                    // Read all documents before writing anything in this transaction.
                    const studentRef=window.doc(window.firebaseDb,'users',sub.studentId);
                    const studentSnapshot=newStatus==='approved'?await tx.get(studentRef):null;
                    if(newStatus==='approved'&&!studentSnapshot.exists())throw new Error('학생 계정을 찾을 수 없습니다.');
                    tx.update(ref,{status:newStatus,feedback,reviewedAt:new Date().toISOString(),reviewerId:currentUser.uid,rewardGranted:newStatus==='approved'});
                    if(newStatus==='approved'&&!sub.rewardGranted)tx.update(studentRef,{xp:Number(studentSnapshot.data().xp||0)+100});
                });
                showToast(newStatus==='approved'?'과제를 승인하고 학생에게 100 XP를 지급했어요.':'수정 요청을 보냈어요.','success');
                await loadTeacherDashboardData();
            }catch(err){showToast('과제 검토 실패: '+err.message,'error');}
        }
