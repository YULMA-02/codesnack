// CodeSnack - studio.js (original script order preserved)
/* =========================================
           🔥 VS Code 스튜디오 (웹 IDE) 핵심 로직
           ========================================= */
        const VSC_STORAGE_KEY = 'codesnack_vscode_files_v1';
        let vscFiles = [];
        let vscOpenTabs = [];
        let vscActiveFileId = null;
        let isVscInitialized = false;

        // 초기 기본 제공 파일 목록 (클래스 연동 예제 포함)
        const defaultVscFiles = [
            {
                id: 'file-1',
                name: 'models.py',
                content: '# [models.py] 다른 파일에서 불러와 사용할 클래스 정의\nclass SnackUser:\n    def __init__(self, name, level):\n        self.name = name\n        self.level = level\n\n    def greet(self):\n        return f"안녕하세요! Lv.{self.level} {self.name}님, 멀티파일 연동 성공입니다!"',
                isDirty: false
            },
            {
                id: 'file-2',
                name: 'main.py',
                content: '# [main.py] models.py 파일의 SnackUser 클래스를 import하여 실행합니다.\nfrom models import SnackUser\n\nuser1 = SnackUser("코딩왕", 99)\nprint(user1.greet())',
                isDirty: false
            },
            {
                id: 'file-3',
                name: 'mathUtils.js',
                content: '// [mathUtils.js] 다른 JS 파일로 내보낼 클래스/함수\nclass Calculator {\n    add(a, b) { return a + b; }\n    multiply(a, b) { return a * b; }\n}\nmodule.exports = Calculator;',
                isDirty: false
            },
            {
                id: 'file-4',
                name: 'app.js',
                content: '// [app.js] mathUtils.js 파일을 불러와(require) 실행합니다.\nconst Calculator = require("./mathUtils.js");\n\nconst calc = new Calculator();\nconsole.log("더하기 결과:", calc.add(10, 20));\nconsole.log("곱하기 결과:", calc.multiply(5, 6));',
                isDirty: false
            }
        ];

        // 간편 실습: 기존 실습실의 새 코드 작성과 초기화 기능을 스튜디오 안에서 제공.
        const studioStarterCode = {
            python: 'def greet(name):\n    return f"안녕하세요, {name}!"\n\nprint(greet("CodeSnack"))',
            javascript: 'const greet = name => `안녕하세요, ${name}!`;\nconsole.log(greet("CodeSnack"));',
            cpp: '#include <iostream>\nint main() {\n    std::cout << "Hello, CodeSnack!\\n";\n    return 0;\n}',
            java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeSnack!");\n    }\n}',
            csharp: 'using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, CodeSnack!");\n    }\n}'
        };
        function createStudioScratchFile() {
            const lang=document.getElementById('studioQuickLang')?.value||currentLang;
            const names={python:'practice.py',javascript:'practice.js',cpp:'main.cpp',java:'Main.java',csharp:'Program.cs'};
            const template=studioStarterCode[lang]||'';
            openStudioSnippet(names[lang],template);
            showToast('새 실습 파일을 만들었어요. 코드를 자유롭게 수정하고 실행해 보세요.','success');
        }
        function resetStudioCurrentFile() {
            const active=vscFiles.find(f=>f.id===vscActiveFileId);
            if(!active)return showToast('먼저 파일을 열어 주세요.','info');
            if(!confirm(`'${active.name}' 파일의 코드를 초기 상태로 되돌릴까요? 현재 편집 내용은 사라져요.`))return;
            let source='';
            const match=/^example-(python|javascript|cpp|java|csharp)-(\d+)$/.exec(studioWorkspaceId);
            if(match){
                const item=templateData[match[1]]?.[Number(match[2])];
                const sample=item?.files?.find(f=>f.name===active.name);
                if(sample)source=sample.content;
                else if(item?.code)source=item.code;
            } else {
                const lang=getVscFileMeta(active.name).lang;
                source=studioStarterCode[lang]||'';
            }
            active.content=source;active.isDirty=true;
            if(studioBlankQuiz?.fileId===active.id)studioBlankQuiz=null;
            renderVscAll();updateStudioQuizNotice();
            showToast('현재 파일을 초기화했어요.','info');
        }

        // 예제별 독립 작업공간. 기존 사용자의 VSC_STORAGE_KEY 데이터는 그대로 유지합니다.
        const STUDIO_PROJECT_LIST_KEY = 'codesnack-studio-project-list-v1';
        const STUDIO_ACTIVE_KEY = 'codesnack-studio-active-v1';
        let studioWorkspaceId = (()=>{try{return localStorage.getItem(STUDIO_ACTIVE_KEY)||'personal';}catch(e){return 'personal';}})();
        let studioBlankQuiz = null;
        const studioLanguageExtension = lang => ({python:'py',javascript:'js',cpp:'cpp',java:'java',csharp:'cs'}[lang]||'txt');
        function studioStorageKey(id=studioWorkspaceId) {return id==='personal'?VSC_STORAGE_KEY:VSC_STORAGE_KEY+'__'+id;}
        function studioProjectList(){try{return JSON.parse(localStorage.getItem(STUDIO_PROJECT_LIST_KEY)||'[]')||[];}catch(e){return [];}}
        function rememberStudioProject(id,title,lang){
            const items=studioProjectList().filter(p=>p.id!==id);
            items.push({id,title,lang});
            localStorage.setItem(STUDIO_PROJECT_LIST_KEY,JSON.stringify(items));
        }
        function studioInitialFiles(){
            if(studioWorkspaceId==='personal')return defaultVscFiles;
            const project=studioProjectList().find(p=>p.id===studioWorkspaceId);
            const match=/^example-(python|javascript|cpp|java|csharp)-(\d+)$/.exec(studioWorkspaceId);
            if(match){
                const lang=match[1],item=templateData[lang]?.[Number(match[2])];
                if(item){const raw=item.files||[{name:({python:'main.py',javascript:'app.js',cpp:'main.cpp',java:'Main.java',csharp:'Program.cs'}[lang]),content:item.code}];
                    return raw.map((f,i)=>({id:'example-'+lang+'-'+match[2]+'-'+i,name:f.name,content:f.content,isDirty:false}));}
            }
            return project ? [{id:'file-'+Date.now(),name:'notes.txt',content:'',isDirty:false}] : defaultVscFiles;
        }
        function renderStudioProjectSelector(){
            const dropdown=document.getElementById('studioProjectSelector');
            if(!dropdown)return;
            const projects=studioProjectList();
            dropdown.innerHTML='<option value="personal">내 작업공간 (기존 파일)</option>'+projects.map(p=>`<option value="${p.id}">${escapeTemplateText(p.title)} · ${p.lang.toUpperCase()}</option>`).join('');
            if(studioWorkspaceId!=='personal' && !projects.some(p=>p.id===studioWorkspaceId))studioWorkspaceId='personal';
            dropdown.value=studioWorkspaceId;
            const name=document.getElementById('studioWorkspaceName');
            if(name) name.textContent=studioWorkspaceId==='personal'?'내 작업공간':projects.find(p=>p.id===studioWorkspaceId)?.title||'예제 프로젝트';
        }
        function switchStudioProject(id){
            if(id===studioWorkspaceId)return;
            if(isVscInitialized)saveVscWorkspace(false);
            studioBlankQuiz=null;
            studioWorkspaceId=id;
            localStorage.setItem(STUDIO_ACTIVE_KEY,id);
            isVscInitialized=false;
            initVscWorkspace();
            updateStudioQuizNotice();
            document.getElementById('vscTerminalOutput').textContent='> '+(id==='personal'?'기존 개인 작업공간을 불러왔어요.':'예제 프로젝트를 불러왔어요. 파일을 선택하고 [실행]을 누르세요.');
        }
        function openStudioProject(id,title,lang,files,entry){
            rememberStudioProject(id,title,lang);
            // 최초 설치 때만 원본 프로젝트를 생성. 이후 편집한 예제는 별도 저장.
            if(!localStorage.getItem(studioStorageKey(id))){
                const ordered=[...files].sort((a,b)=>(a.name===entry?-1:b.name===entry?1:0));
                const initial=ordered.map((f,i)=>({id:id+'-file-'+i,name:f.name,content:f.content,isDirty:false}));
                localStorage.setItem(studioStorageKey(id),JSON.stringify(initial));
            }
            switchTab('vscode');
            switchStudioProject(id);
            const item=templateData[lang]?.find(x=>x.title===title);
            const entryName=entry||item?.entry;
            if(entryName){const f=vscFiles.find(x=>x.name===entryName);if(f)selectVscFile(f.id);}
        }
        function openStudioSnippet(name,code,quiz=null){
            switchTab('vscode');
            switchStudioProject('personal');
            initVscWorkspace();
            const base=name.replace(/\.[^.]+$/,''), ext=(name.match(/\.[^.]+$/)||[''])[0];
            let finalName=name, i=2;
            while(vscFiles.some(f=>f.name.toLowerCase()===finalName.toLowerCase()))finalName=base+'_'+i++ +ext;
            const file={id:'snippet-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:finalName,content:code,isDirty:true};
            vscFiles.push(file);
            vscActiveFileId=file.id;
            if(!vscOpenTabs.includes(file.id))vscOpenTabs.push(file.id);
            studioBlankQuiz=quiz?{...quiz,fileId:file.id}:null;
            renderVscAll();
            updateStudioQuizNotice();
            document.getElementById('vscTerminalOutput').textContent='> '+(quiz?'코드 안의 빈칸에 답을 입력한 뒤 [채점하기]를 누르세요.':'코드를 불러왔어요. [실행] 버튼으로 결과를 확인해 보세요.');
            return file.id;
        }
        // 문제의 ____를 편집기 내부의 실제 입력칸으로 표시합니다.
        // 정답을 입력하기 전에는 원본 파일의 코드가 변경되지 않습니다.
        function renderStudioInlineQuiz(){
            const pane=document.querySelector('#view-vscode .studio-codepane');
            const display=document.getElementById('studioInlineQuizCode');
            if(!pane||!display)return;
            const quiz=studioBlankQuiz;
            const selected=Boolean(quiz && quiz.fileId===vscActiveFileId && quiz.initialCode?.includes('____'));
            pane.classList.toggle('studio-quiz-active',selected);
            display.replaceChildren();
            if(!selected)return;
            const parts=quiz.initialCode.split('____');
            const count=parts.length-1;
            if(!Array.isArray(quiz.filledValues))quiz.filledValues=[];
            const lineNumbers=document.getElementById('vscLineNumbers');
            display.onscroll=()=>{if(lineNumbers)lineNumbers.scrollTop=display.scrollTop;};
            for(let i=0;i<parts.length;i++){
                display.appendChild(document.createTextNode(parts[i]));
                if(i>=count)continue;
                const input=document.createElement('input');
                input.type='text';
                input.className='studio-blank-input';
                input.placeholder='입력';
                input.autocomplete='off';input.spellcheck=false;
                input.setAttribute('aria-label',`코드 빈칸 ${i+1}번 정답`);
                input.value=quiz.filledValues[i]||'';
                const adjustWidth=()=>{input.style.width=Math.min(34,Math.max(7,input.value.length+2))+'ch';};
                adjustWidth();
                input.addEventListener('input',()=>{quiz.filledValues[i]=input.value;adjustWidth();});
                input.addEventListener('keydown',e=>{
                    if(e.key==='Enter'&&!e.isComposing){e.preventDefault();runVscCurrentFile();}
                });
                display.appendChild(input);
            }
        }
        function getStudioQuizCompletedCode(){
            if(!studioBlankQuiz)return '';
            const pieces=studioBlankQuiz.initialCode.split('____');
            const answers=studioBlankQuiz.filledValues||[];
            return pieces.map((piece,index)=>piece+(index<pieces.length-1?(answers[index]||''):'' )).join('');
        }
        function updateStudioQuizNotice(){
            const notice=document.getElementById('studioQuizNotice'),button=document.getElementById('vscRunBtn');
            if(!notice)return;
            const selected=studioBlankQuiz && studioBlankQuiz.fileId===vscActiveFileId;
            notice.classList.toggle('hidden',!selected);
            if(selected){
                notice.replaceChildren();
                const help=document.createElement('strong');help.className='studio-quiz-help-label';help.textContent='🎯 코드 속 빈칸에 바로 정답을 입력하세요.';
                const hint=document.createElement('span');hint.className='studio-quiz-hint';hint.textContent='힌트: '+(studioBlankQuiz.explanation||'문법을 생각해 보세요.');
                const cancel=document.createElement('button');cancel.type='button';cancel.textContent='퀴즈 끝내기';
                cancel.onclick=()=>{studioBlankQuiz=null;updateStudioQuizNotice();};
                notice.append(help,hint,cancel);
            }
            renderStudioInlineQuiz();
            if(button)button.innerHTML=selected?'<i class="fa-solid fa-check text-[10px]"></i> 채점하기':'<i class="fa-solid fa-play text-[10px]"></i> 실행 (Run)';
        }
        async function gradeStudioBlankQuiz(file){
            const quiz=studioBlankQuiz, terminal=document.getElementById('vscTerminalOutput');
            if(!quiz || quiz.fileId!==file.id)return;
            const values=quiz.filledValues||[];
            const blanks=quiz.initialCode.split('____').length-1;
            if(values.length<blanks || Array.from({length:blanks},(_,i)=>values[i]).some(v=>!String(v||'').trim())){
                terminal.textContent+='\n> ❌ 코드 안의 정답 입력칸에 답을 입력해 주세요.\n';
                [...document.querySelectorAll('#studioInlineQuizCode .studio-blank-input')].find(input=>!input.value.trim())?.focus();
                return;
            }
            const completedCode=getStudioQuizCompletedCode();
            const expected=quiz.initialCode.split('____').join(quiz.answer);
            const normalize=x=>x.replace(/\r\n/g,'\n').trim();
            let accepted=normalize(completedCode)===normalize(expected),feedback='모범 답안과 정확히 일치해요.';
            if(!accepted){
                try{
                    const prompt=`코드 빈칸 채우기 채점. 원래 정답 조각: ${quiz.answer}\n원본 빈칸 코드:\n${quiz.initialCode}\n학습자 완성 코드:\n${completedCode}\n논리적으로 동작하는 코드면 정답으로 인정. JSON만: {"isCorrect":true,"feedback":"짧은 한국어 해설"}`;
                    const gradeController = new AbortController();
                    const gradeTimeout = setTimeout(() => gradeController.abort(), 12000);
                    let response;
                    try {
                        response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${getGeminiApiKey()}`,{
                            method:'POST',signal:gradeController.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.1}})});
                    } finally {
                        clearTimeout(gradeTimeout);
                    }
                    if(!response.ok)throw Error('HTTP '+response.status);
                    const data=await response.json();
                    const raw=data.candidates?.[0]?.content?.parts?.[0]?.text||'';
                    const result=JSON.parse(raw.replace(/```json/gi,'').replace(/```/g,'').trim());
                    accepted=Boolean(result.isCorrect);feedback=String(result.feedback||'해설 없음');
                }catch(e){terminal.textContent+='\n> 채점 서버에 연결하지 못했어요. 다시 시도해 주세요: '+e.message+'\n';return;}
            }
            terminal.textContent+='\n> '+(accepted?'✅ 정답입니다!':'❌ 아직 정답이 아닙니다.')+'\n> '+feedback+'\n';
            if(accepted){
                file.content=completedCode;file.isDirty=true;
                recordStudyActivity();studioBlankQuiz=null;renderVscAll();
                if(typeof confetti==='function')confetti({particleCount:40,spread:45,origin:{y:.7}});
            }
            terminal.scrollTop=terminal.scrollHeight;
        }

        // 1. 워크스페이스 초기화 및 로컬 스토리지 불러오기
        function initVscWorkspace() {
            if (isVscInitialized) return;
            isVscInitialized = true;

            const saved = localStorage.getItem(studioStorageKey());
            try {
                vscFiles = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(studioInitialFiles()));
                if (!Array.isArray(vscFiles)) throw Error('올바르지 않은 작업공간');
            } catch(e) {
                vscFiles = JSON.parse(JSON.stringify(studioInitialFiles()));
            }

            if (vscFiles.length > 0) {
                vscOpenTabs = [vscFiles[0].id];
                vscActiveFileId = vscFiles[0].id;
            }

            renderVscAll();
        }

        // 파일 확장자별 아이콘 및 언어 판별
        function getVscFileMeta(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            if (ext === 'py') return { icon: 'fa-brands fa-python text-sky-400', lang: 'python' };
            if (ext === 'js') return { icon: 'fa-brands fa-js text-yellow-400', lang: 'javascript' };
            if (ext === 'cpp' || ext === 'c' || ext === 'h') return { icon: 'fa-solid fa-code text-blue-400', lang: 'cpp' };
            if (ext === 'java') return { icon: 'fa-brands fa-java text-orange-400', lang: 'java' };
            if (ext === 'cs') return { icon: 'fa-solid fa-hashtag text-purple-400', lang: 'csharp' };
            if (ext === 'html') return { icon: 'fa-brands fa-html5 text-orange-500', lang: 'html' };
            if (ext === 'css') return { icon: 'fa-brands fa-css3-alt text-sky-500', lang: 'css' };
            if (ext === 'json') return { icon: 'fa-solid fa-brackets-curly text-amber-400', lang: 'json' };
            if (ext === 'md') return { icon: 'fa-solid fa-circle-info text-sky-300', lang: 'markdown' };
            return { icon: 'fa-regular fa-file-lines text-slate-400', lang: 'plaintext' };
        }

        // 2. 전체 UI 렌더링 (사이드바 목록 + 탭바 + 에디터)
        function renderVscAll() {
            renderVscSidebar();
            renderVscTabs();
            renderVscEditorContent();
            document.getElementById('vscStatusFileCount').innerText = `파일 ${vscFiles.length}개`;
            renderStudioProjectSelector();updateStudioQuizNotice();updateRuntimeLabel();
        }

        function renderVscSidebar() {
            const listEl = document.getElementById('vscFileList');
            if (!listEl) return;

            if (vscFiles.length === 0) {
                listEl.innerHTML = `<div class="px-4 py-6 text-center text-slate-500">파일이 없습니다.<br>[새 파일]을 눌러 생성하세요.</div>`;
                return;
            }

            listEl.innerHTML = vscFiles.map(file => {
                const meta = getVscFileMeta(file.name);
                const isActive = file.id === vscActiveFileId;
                return `
                    <div onclick="selectVscFile('${file.id}')" class="group px-3 py-1.5 flex items-center justify-between cursor-pointer transition ${isActive ? 'bg-[#37373d] text-white font-semibold' : 'text-[#cccccc] hover:bg-[#2a2d2e]'}">
                        <div class="flex items-center space-x-2 truncate">
                            <i class="${meta.icon} w-4 text-center"></i>
                            <span class="truncate">${file.name}</span>
                            ${file.isDirty ? '<span class="text-amber-400 text-[10px]">●</span>' : ''}
                        </div>
                        <div class="hidden group-hover:flex items-center space-x-1.5 text-slate-400">
                            <button onclick="renameVscFile('${file.id}', event)" class="hover:text-white" title="이름 변경"><i class="fa-solid fa-pen text-[10px]"></i></button>
                            <button onclick="deleteVscFile('${file.id}', event)" class="hover:text-rose-400" title="삭제"><i class="fa-solid fa-trash text-[10px]"></i></button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderVscTabs() {
            const tabBar = document.getElementById('vscTabBar');
            if (!tabBar) return;

            tabBar.innerHTML = vscOpenTabs.map(tabId => {
                const file = vscFiles.find(f => f.id === tabId);
                if (!file) return '';
                const meta = getVscFileMeta(file.name);
                const isActive = file.id === vscActiveFileId;
                return `
                    <div onclick="selectVscFile('${file.id}')" class="px-3 py-2 flex items-center space-x-2 text-xs cursor-pointer border-r border-[#1e1e1e] transition shrink-0 ${isActive ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]' : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#2a2d2e]'}">
                        <i class="${meta.icon}"></i>
                        <span>${file.name}</span>
                        <span class="text-[10px] ${file.isDirty ? 'text-amber-400' : 'hidden'}">●</span>
                        <button onclick="closeVscTab('${file.id}', event)" class="ml-1 hover:bg-[#3e3e42] rounded px-1 text-[10px] text-slate-400 hover:text-white">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                `;
            }).join('');
        }

        function renderVscEditorContent() {
            const editor = document.getElementById('vscCodeEditor');
            const breadcrumb = document.getElementById('vscBreadcrumbFile');
            const statusLang = document.getElementById('vscStatusLang');
            const activeFile = vscFiles.find(f => f.id === vscActiveFileId);

            if (!activeFile) {
                editor.value = '';
                editor.disabled = true;
                breadcrumb.innerText = '선택된 파일 없음';
                statusLang.innerText = 'NONE';
                updateVscLineNumbers();
                return;
            }

            editor.disabled = false;
            editor.value = activeFile.content;
            breadcrumb.innerText = activeFile.name;
            statusLang.innerText = getVscFileMeta(activeFile.name).lang;
            updateVscLineNumbers();
            updateVscSaveStatusUI();
        }

        // 3. 줄 번호 계산 및 스크롤 동기화
        function updateVscLineNumbers() {
            const editor = document.getElementById('vscCodeEditor');
            const lineNumbers = document.getElementById('vscLineNumbers');
            if (!editor || !lineNumbers) return;

            const lines = editor.value.split('\n').length;
            let html = '';
            for (let i = 1; i <= lines; i++) {
                html += i + '<br>';
            }
            lineNumbers.innerHTML = html;

            // 커서 위치 표시 업데이트
            const textUpToCursor = editor.value.substring(0, editor.selectionStart);
            const currentLine = textUpToCursor.split('\n').length;
            const currentCol = textUpToCursor.split('\n').pop().length + 1;
            const posEl = document.getElementById('vscCursorPos');
            if (posEl) posEl.innerText = `Ln ${currentLine}, Col ${currentCol}`;
        }

        function syncVscScroll() {
            const editor = document.getElementById('vscCodeEditor');
            const lineNumbers = document.getElementById('vscLineNumbers');
            if (editor && lineNumbers) {
                lineNumbers.scrollTop = editor.scrollTop;
            }
        }

        // 4. 에디터 타이핑 및 단축키(Tab, Ctrl+S) 처리
        function handleVscEditorInput() {
            const activeFile = vscFiles.find(f => f.id === vscActiveFileId);
            if (!activeFile) return;

            const editor = document.getElementById('vscCodeEditor');
            activeFile.content = editor.value;
            activeFile.isDirty = true;

            updateVscLineNumbers();
            renderVscSidebar();
            renderVscTabs();
            updateVscSaveStatusUI();
        }

        function handleVscEditorKeydown(e) {
            const editor = document.getElementById('vscCodeEditor');

            // Tab 키 누르면 공백 4칸 삽입
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 4;
                handleVscEditorInput();
            }

            // Ctrl+S 또는 Cmd+S 로 즉시 저장
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                saveVscWorkspace();
            }

            setTimeout(updateVscLineNumbers, 10);
        }

        function updateVscSaveStatusUI() {
            const statusEl = document.getElementById('vscSaveStatus');
            const hasDirty = vscFiles.some(f => f.isDirty);
            if (hasDirty) {
                statusEl.innerText = '● 저장되지 않은 변경사항 있음 (Ctrl+S)';
                statusEl.className = 'text-[10px] text-amber-400';
            } else {
                statusEl.innerText = '● 모든 변경사항 저장됨';
                statusEl.className = 'text-[10px] text-emerald-400';
            }
        }

        // 5. 파일 선택 / 탭 닫기 / 새 파일 / 이름변경 / 삭제
        function selectVscFile(fileId) {
            vscActiveFileId = fileId;
            if (!vscOpenTabs.includes(fileId)) {
                vscOpenTabs.push(fileId);
            }
            renderVscAll();
        }

        function closeVscTab(fileId, event) {
            if (event) event.stopPropagation();
            vscOpenTabs = vscOpenTabs.filter(id => id !== fileId);
            if (vscActiveFileId === fileId) {
                vscActiveFileId = vscOpenTabs.length > 0 ? vscOpenTabs[vscOpenTabs.length - 1] : null;
            }
            renderVscAll();
        }

        function createNewVscFile() {
            const extMap = { python: '.py', javascript: '.js', cpp: '.cpp', java: '.java', csharp: '.cs' };
            const defaultName = `untitled_${vscFiles.length + 1}${extMap[currentLang] || '.py'}`;
            const fileName = prompt("새 파일 이름을 입력하세요 (예: test.py, script.js):", defaultName);
            if (!fileName || !fileName.trim()) return;

            const cleanName = fileName.trim();
            if (vscFiles.some(f => f.name.toLowerCase() === cleanName.toLowerCase())) {
                return showToast("이미 존재하는 파일 이름입니다!", "error");
            }

            const newFile = {
                id: 'file-' + Date.now(),
                name: cleanName,
                content: `# ${cleanName}\n\n`,
                isDirty: true
            };

            vscFiles.push(newFile);
            vscOpenTabs.push(newFile.id);
            vscActiveFileId = newFile.id;
            renderVscAll();
            showToast(`'${cleanName}' 파일이 생성되었습니다.`, "info");
        }

        function renameVscFile(fileId, event) {
            if (event) event.stopPropagation();
            const target = vscFiles.find(f => f.id === fileId);
            if (!target) return;

            const newName = prompt("변경할 파일 이름을 입력하세요:", target.name);
            if (!newName || !newName.trim() || newName.trim() === target.name) return;

            target.name = newName.trim();
            target.isDirty = true;
            renderVscAll();
            showToast("파일 이름이 변경되었습니다.", "info");
        }

        function deleteVscFile(fileId, event) {
            if (event) event.stopPropagation();
            const target = vscFiles.find(f => f.id === fileId);
            if (!target) return;

            if (!confirm(`정말 '${target.name}' 파일을 삭제하시겠습니까?`)) return;

            vscFiles = vscFiles.filter(f => f.id !== fileId);
            vscOpenTabs = vscOpenTabs.filter(id => id !== fileId);
            if (vscActiveFileId === fileId) {
                vscActiveFileId = vscOpenTabs.length > 0 ? vscOpenTabs[0] : (vscFiles[0]?.id || null);
                if (vscActiveFileId && !vscOpenTabs.includes(vscActiveFileId)) {
                    vscOpenTabs.push(vscActiveFileId);
                }
            }
            saveVscWorkspace(false);
            renderVscAll();
            showToast(`'${target.name}' 파일이 삭제되었습니다.`, "info");
        }

        // 6. 저장 / 불러오기 / 내보내기(다운로드) / 초기화
        function saveVscWorkspace(showAlert = true) {
            vscFiles.forEach(f => f.isDirty = false);
            localStorage.setItem(studioStorageKey(), JSON.stringify(vscFiles));
            renderVscAll();
            updateVscSaveStatusUI();
            if (showAlert) showToast("워크스페이스의 모든 파일이 저장되었습니다! 💾", "success");
        }

        function importLocalVscFiles(event) {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    const existing = vscFiles.find(f => f.name === file.name);
                    if (existing) {
                        existing.content = content;
                        existing.isDirty = true;
                        vscActiveFileId = existing.id;
                        if (!vscOpenTabs.includes(existing.id)) vscOpenTabs.push(existing.id);
                    } else {
                        const newFile = {
                            id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                            name: file.name,
                            content: content,
                            isDirty: true
                        };
                        vscFiles.push(newFile);
                        vscOpenTabs.push(newFile.id);
                        vscActiveFileId = newFile.id;
                    }
                    renderVscAll();
                    showToast(`'${file.name}' 파일을 성공적으로 불러왔습니다! 📂`, "success");
                };
                reader.readAsText(file);
            });

            event.target.value = ''; // 동일 파일 재선택 허용
        }

        function exportCurrentVscFile() {
            const activeFile = vscFiles.find(f => f.id === vscActiveFileId);
            if (!activeFile) return showToast("내보낼 파일이 선택되지 않았습니다.", "error");

            const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = activeFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast(`'${activeFile.name}' 파일을 내 PC로 내보냈습니다! 📥`, "success");
        }

        function toggleVscSidebar() {
            const sidebar = document.getElementById('vscSidebar');
            if (sidebar) sidebar.classList.toggle('hidden');
        }

        function resetVscWorkspace() {
            if (!confirm("모든 파일을 초기 기본 상태로 되돌리시겠습니까?")) return;
            localStorage.removeItem(studioStorageKey());
            isVscInitialized = false;
            initVscWorkspace();
            showToast("워크스페이스가 초기화되었습니다.", "info");
        }

        function clearVscTerminal() {
            document.getElementById('vscTerminalOutput').innerText = 'PS C:\\CodeSnack\\workspace> ';
        }

        // 7. 스낵 스튜디오: 실제 실행 결과 표시 (AI 추정 출력 금지)
        async function runVscCurrentFile() {
            const activeFile=vscFiles.find(f=>f.id===vscActiveFileId);
            if(!activeFile)return showToast('실행할 파일을 선택해 주세요.','error');
            if(!activeFile.content.trim())return showToast('코드를 먼저 입력해 주세요.','error');
            if(runtimeBusy)return showToast('이전 코드가 아직 실행 중입니다.','info');
            const terminal=document.getElementById('vscTerminalOutput'),button=document.getElementById('vscRunBtn');
            runtimeBusy=true;if(button)button.disabled=true;
            try{
                if(studioBlankQuiz && studioBlankQuiz.fileId===activeFile.id){
                    terminal.textContent+='\n> 채점 중…';
                    await gradeStudioBlankQuiz(activeFile);
                    return;
                }
                const lang=getVscFileMeta(activeFile.name).lang;
                if(!['python','javascript','cpp','java','csharp'].includes(lang)){
                    terminal.textContent+='\n> '+activeFile.name+' 파일은 실행할 수 없어요. 실행 가능한 소스 코드 파일을 선택하세요.\n';return;
                }
                terminal.textContent+=`\nPS C:\\CodeSnack\\workspace> run ${activeFile.name}\n[실제 실행 중…]\n`;
                const allFiles=vscFiles.filter(f=>getVscFileMeta(f.name).lang===lang || (lang==='cpp' && /\\.hpp?$/.test(f.name))).map(f=>({name:f.name,content:f.content}));
                // Entry file first: compilers use the first source as main entry.
                const files=[{name:activeFile.name,content:activeFile.content},...allFiles.filter(f=>f.name!==activeFile.name)];
                if (!['python','javascript'].includes(lang)) terminal.textContent += '> 실행 환경을 자동으로 연결하는 중…\n';
                const result=await executeRealCode(lang,activeFile.content,files);
                terminal.textContent+=formatExecutionResult(result)+'\nPS C:\\CodeSnack\\workspace> ';
                if(result.ok)recordStudyActivity();
            }catch(e){terminal.textContent+='\n실행 실패: '+e.message+'\n';}
            finally{runtimeBusy=false;if(button)button.disabled=false;terminal.scrollTop=terminal.scrollHeight;}
        }
