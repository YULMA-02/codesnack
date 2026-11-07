// CodeSnack - execution.js (original script order preserved)
        /* 정확한 실습실 실행: JS/Python은 격리된 Web Worker, 그 외 언어는 설정된 실행 서버. */
        let pythonRuntimeWorker = null, pythonReady = false, pythonJob = null, runtimeBusy = false;
        function saveRunnerEndpoint() {
            const raw = document.getElementById('runnerEndpoint').value.trim().replace(/\/+$/,'');
            if (raw && !/^https?:\/\//i.test(raw)) return showToast('http:// 또는 https:// 실행 서버 주소를 입력해 주세요.', 'error');
            try { localStorage.setItem('codesnack-runner-endpoint',raw); } catch (_) {}
            updateRuntimeLabel();
            showToast(raw ? '실행 서버 주소를 저장했어요.' : '실행 서버 설정을 해제했어요.', 'success');
        }
        function getRunnerEndpoint() {
            try { return (localStorage.getItem('codesnack-runner-endpoint') || '').trim().replace(/\/+$/,''); } catch (_) { return ''; }
        }
        function updateRuntimeLabel() {
            const badge = document.getElementById('playgroundRuntimeStatus');
            if (!badge) return;
            const studioFile = vscFiles.find(f=>f.id===vscActiveFileId);
            const runtimeLang = studioFile ? getVscFileMeta(studioFile.name).lang : currentLang;
            const local = runtimeLang === 'python' || runtimeLang === 'javascript';
            badge.textContent = local ? '브라우저에서 바로 실행' : (getRunnerEndpoint() ? '전용 실행 환경 사용' : '실행 환경 자동 선택');
            badge.title = local ? '별도의 설정 없이 브라우저에서 실행합니다.' : '실행 버튼을 누르면 지원되는 온라인 컴파일 서비스를 자동으로 찾습니다. 외부 서비스 상황에 따라 실행이 불가능할 수 있습니다.';
        }
        function jsSourceForWorker() {
            return String.raw`
                self.onmessage = async ({data}) => {
                    const lines = [];
                    const print = (...args) => lines.push(args.map(v => {try {return typeof v==='string'?v:JSON.stringify(v);} catch(e){return String(v);}}).join(' '));
                    const console = {log:print, info:print, warn:(...a)=>print('[WARN]',...a), error:(...a)=>print('[ERROR]',...a)};
                    try {
                        const files = Array.isArray(data.files)?data.files:[];
                        const cache = {};
                        const req = (path) => {
                            const target = path.replace(/^\.\//,'');
                            const file = files.find(f=>f.name===target || f.name===target+'.js');
                            if (!file) throw Error('모듈을 찾을 수 없습니다: '+path);
                            if (cache[file.name]) return cache[file.name].exports;
                            const module = {exports:{}}; cache[file.name]=module;
                            const body = file.content.replace(/export\s+default\s+/g,'module.exports = ').replace(/export\s+\{([^}]+)\};?/g,'module.exports = {$1};');
                            (new Function('module','exports','require','console',body))(module,module.exports,req,console);
                            return module.exports;
                        };
                        const main = data.code.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g,'const $1 = require("$2");').replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g,'const {$1} = require("$2");');
                        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                        await (new AsyncFunction('console','require',main))(console,req);
                        self.postMessage({ok:true, stdout:lines.join('\n')});
                    } catch(e){self.postMessage({ok:false, stderr: String(e?.stack || e)});}
                };
            `;
        }
        function runJavaScriptWorker(code, files=[]) {
            return new Promise(resolve => {
                const workerURL = URL.createObjectURL(new Blob([jsSourceForWorker()], {type:'application/javascript'}));
                const worker = new Worker(workerURL);
                URL.revokeObjectURL(workerURL);
                const timer = setTimeout(()=>finish({ok:false,stderr:'실행 제한 시간(5초)을 초과했습니다. 무한 반복문이 있는지 확인해 주세요.'}),5000);
                let finished = false;
                function finish(result){if(finished)return;finished=true;clearTimeout(timer);worker.terminate();resolve(result);}
                worker.onmessage=e=>finish(e.data);
                worker.onerror=e=>finish({ok:false,stderr:'JavaScript 실행 오류: '+e.message});
                worker.postMessage({code,files});
            });
        }
        function pythonSourceForWorker() {
            return String.raw`
                const base = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
                let pyodide = null;
                self.onmessage = async ({data}) => {
                    let stdout=[], stderr=[];
                    try {
                        if (!pyodide){
                            self.postMessage({type:'loading'});
                            importScripts(base+'pyodide.js');
                            pyodide=await loadPyodide({indexURL:base});
                        }
                        pyodide.setStdout({batched:s=>stdout.push(s)});
                        pyodide.setStderr({batched:s=>stderr.push(s)});
                        const files=Array.isArray(data.files)?data.files:[];
                        if(files.length){
                            pyodide.FS.mkdirTree('/home/pyodide/codesnack');
                            for(const file of files){
                                if(!/^[\w.\-]+$/.test(file.name)) continue;
                                pyodide.FS.writeFile('/home/pyodide/codesnack/'+file.name,file.content);
                            }
                            pyodide.runPython("import sys; sys.path.insert(0, '/home/pyodide/codesnack') if '/home/pyodide/codesnack' not in sys.path else None");
                            for (const file of files) {if(file.name.endsWith('.py')){const moduleName=file.name.slice(0,-3);pyodide.runPython('import sys; sys.modules.pop('+JSON.stringify(moduleName)+', None)');}}
                        }
                        await pyodide.loadPackagesFromImports(data.code);
                        const globals=pyodide.runPython("dict(__name__='__main__')");
                        try {await pyodide.runPythonAsync(data.code,{globals});}
                        finally {globals.destroy();}
                        self.postMessage({type:'result',ok:true,stdout:stdout.join('\n'),stderr:stderr.join('\n')});
                    } catch(e){self.postMessage({type:'result',ok:false,stdout:stdout.join('\n'),stderr:stderr.concat(String(e?.message||e)).join('\n')});}
                };
            `;
        }
        function runPythonWorker(code, files=[]) {
            return new Promise(resolve => {
                try {
                    if (!pythonRuntimeWorker) {
                        const url=URL.createObjectURL(new Blob([pythonSourceForWorker()],{type:'application/javascript'}));
                        pythonRuntimeWorker=new Worker(url); URL.revokeObjectURL(url); pythonReady=false;
                    }
                    const worker=pythonRuntimeWorker;
                    let ended=false;
                    const timeout=setTimeout(()=>finish({ok:false,stderr:'Python 실행 시간이 초과되었습니다. 무한 반복문 또는 패키지 로딩을 확인해 주세요.'},true),pythonReady?18000:90000);
                    function finish(result,reset=false){
                        if(ended)return; ended=true; clearTimeout(timeout);
                        worker.removeEventListener('message',onMessage);worker.removeEventListener('error',onError);
                        if(reset){worker.terminate();if(pythonRuntimeWorker===worker){pythonRuntimeWorker=null;pythonReady=false;}}
                        resolve(result);
                    }
                    function onMessage(e){
                        if(e.data.type==='loading'){
                            const out=document.getElementById('vscTerminalOutput');
                            if(out) out.textContent += '\n> Python 실행 환경을 처음 불러오는 중입니다. 인터넷 연결이 필요해요…\n';
                        }
                        if(e.data.type==='result'){pythonReady=true;finish(e.data);}
                    }
                    function onError(e){finish({ok:false,stderr:'Python 실행 환경을 불러올 수 없습니다: '+e.message},true);}
                    worker.addEventListener('message',onMessage);worker.addEventListener('error',onError);
                    worker.postMessage({code,files});
                }catch(e){resolve({ok:false,stderr:'브라우저에서 Python 실행 환경을 시작할 수 없습니다: '+e.message});}
            });
        }
        /* 자동 실행 연결: 별도 주소 입력 없이 실행하고, 설정한 사설 Piston이 있으면 먼저 사용합니다.
           외부 서비스 이용 가능 여부(CORS/인증/호출 한도)는 제공자에 따라 달라집니다. */
        const CODE_RUNNER_WANDBOX = 'https://wandbox.org/api';
        const CODE_RUNNER_JUDGE0 = 'https://ce.judge0.com';
        let wandboxCompilersPromise = null;
        let judge0LanguagesPromise = null;
        let jsZipPromise = null;
        const RUNNER_NAMES = {cpp:'C++', java:'Java', csharp:'C#'};
        function runnerErrorMessage(err) {
            if (err?.name === 'AbortError') return '응답 시간 초과';
            return String(err?.message || err || '연결할 수 없음');
        }
        async function runnerFetchJson(url, options={}, timeoutMs=16000) {
            const controller = new AbortController();
            const timer = setTimeout(()=>controller.abort(),timeoutMs);
            try {
                const response = await fetch(url,{...options,signal:controller.signal});
                let data;
                try { data = await response.json(); } catch(_) { throw new Error('서비스가 정상적인 결과를 보내지 않았어요.'); }
                if(!response.ok) {
                    const msg = typeof data.message==='string' ? data.message : (typeof data.detail==='string' ? data.detail : `서비스 응답 오류 (${response.status})`);
                    throw new Error(msg);
                }
                return data;
            } finally { clearTimeout(timer); }
        }
        function normalizedRunnerFiles(lang,code,files=[]) {
            const mainName = lang==='java' ? 'Main.java' : lang==='csharp' ? 'Program.cs' : 'main.cpp';
            const given = (Array.isArray(files) ? files : []).filter(f=>f && typeof f.name==='string' && typeof f.content==='string');
            return given.length ? given : [{name:mainName,content:code}];
        }
        async function runSavedPistonEndpoint(endpoint,lang,code,files) {
            const langMap={cpp:'c++',java:'java',csharp:'csharp'};
            const url = endpoint.endsWith('/execute') ? endpoint : endpoint+'/execute';
            const payload={language:langMap[lang]||lang,version:'*',files:normalizedRunnerFiles(lang,code,files)};
            const data = await runnerFetchJson(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)},25000);
            if (!data.run) throw new Error('실행 결과 형식이 맞지 않아요.');
            const compileFailed = Boolean(data.compile && data.compile.code !== 0 && data.compile.code != null);
            const stdout = data.run?.stdout || '';
            const stderr = [data.compile?.stderr,data.run?.stderr].filter(Boolean).join('\n');
            const exitCode = data.run?.code ?? data.compile?.code;
            return {ok:!compileFailed && exitCode===0,stdout,stderr,info:'실행 환경: 전용 서버'};
        }
        async function wandboxCompilers() {
            if(!wandboxCompilersPromise) {
                wandboxCompilersPromise = runnerFetchJson(CODE_RUNNER_WANDBOX+'/list.json',{},13000)
                    .then(list=>{if(!Array.isArray(list)) throw Error('컴파일러 목록 형식 오류');return list;})
                    .catch(e=>{wandboxCompilersPromise=null;throw e;});
            }
            return wandboxCompilersPromise;
        }
        async function runWandbox(lang,code,files=[]) {
            const catalog=await wandboxCompilers();
            const known={cpp:['c++','cpp'],java:['java'],csharp:['c#','csharp','c sharp']};
            const list=catalog.filter(c=>known[lang]?.includes(String(c.language||'').toLowerCase()));
            if(!list.length) throw new Error('현재 사용할 수 있는 컴파일러가 없어요.');
            const score=c=>{
                const name=String(c.name||'').toLowerCase();
                let priority=/head|nightly|experimental|trunk/.test(name)?-20:10;
                if(lang==='cpp' && /gcc|g\+\+/.test(name))priority+=5;
                if(lang==='java' && /openjdk|jdk/.test(name))priority+=5;
                if(lang==='csharp' && /mono|dotnet/.test(name))priority+=5;
                return priority;
            };
            list.sort((a,b)=>score(b)-score(a));
            const compiler=list[0];
            const sourceFiles=normalizedRunnerFiles(lang,code,files);
            const source=lang==='csharp' && sourceFiles.length>1 ? combineCSharpFiles(sourceFiles) : code;
            const extra=lang==='csharp' ? [] : sourceFiles.slice(1).map(f=>({file:f.name,code:f.content}));
            const data=await runnerFetchJson(CODE_RUNNER_WANDBOX+'/compile.json',{
                method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({compiler:compiler.name,code:source,codes:extra,stdin:'',save:false})
            },32000);
            if(typeof data.status!=='string' && typeof data.status!=='number') throw Error('실행 결과 형식이 맞지 않아요.');
            return {
                ok:String(data.status)==='0',
                stdout:data.program_output||'',
                stderr:[data.compiler_error,data.program_error].filter(Boolean).join('\n'),
                info:'실행 환경: 자동 연결'
            };
        }
        async function judge0Languages() {
            if(!judge0LanguagesPromise) {
                judge0LanguagesPromise = runnerFetchJson(CODE_RUNNER_JUDGE0+'/languages',{},10000)
                    .then(list => Array.isArray(list) ? list : [])
                    .catch(()=>[]);
            }
            return judge0LanguagesPromise;
        }
        async function pickJudge0Language(lang) {
            const list=await judge0Languages();
            const pick=list.filter(l=>{
                const name=String(l.name||'').toLowerCase();
                return lang==='cpp' ? name.startsWith('c++') : lang==='java' ? /^java\b/.test(name) : name.startsWith('c#');
            });
            if(pick.length) {
                if(lang==='cpp') pick.sort((a,b)=>Number(/gcc/i.test(b.name))-Number(/gcc/i.test(a.name)));
                return pick[0].id;
            }
            return {cpp:54,java:62,csharp:51}[lang]; // Judge0 공개 문서의 기본 언어 번호
        }
        function combineCSharpFiles(files) {
            const directives=new Set(),bodies=[];
            for(const file of files) {
                let source=file.content;
                source=source.replace(/^\s*(using\s+(?:static\s+)?[\w.]+\s*;)\s*$/gm,(_,value)=>{directives.add(value);return '';});
                bodies.push(`// ${file.name}\n${source}`);
            }
            return [...directives].join('\n')+'\n\n'+bodies.join('\n\n');
        }
        function loadRunnerZipLibrary() {
            if(window.JSZip) return Promise.resolve(window.JSZip);
            if(jsZipPromise) return jsZipPromise;
            jsZipPromise = new Promise((resolve,reject)=>{
                const script=document.createElement('script');
                script.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                script.onload=()=>window.JSZip ? resolve(window.JSZip) : reject(new Error('압축 도구를 불러올 수 없어요.'));
                script.onerror=()=>reject(new Error('멀티파일 실행 도구를 불러올 수 없어요.'));
                document.head.appendChild(script);
            }).catch(e=>{jsZipPromise=null;throw e;});
            return jsZipPromise;
        }
        async function buildJudge0MultiFiles(lang,files) {
            const JSZip = await loadRunnerZipLibrary();
            const zip=new JSZip();
            const main=files[0].name.replace(/[^\w.\-]/g,'');
            for(const f of files) {
                if(!/^[\w.\-]+$/.test(f.name)) throw new Error('파일 이름에는 영문자·숫자·점·밑줄만 사용할 수 있어요.');
                zip.file(f.name,f.content);
            }
            const scripts = lang==='cpp'
                ? {compile:'#!/bin/sh\nset -e\ng++ -std=c++17 -O2 -I. *.cpp -o app\n',run:'#!/bin/sh\n./app\n'}
                : {compile:'#!/bin/sh\nset -e\njavac *.java\n',run:'#!/bin/sh\njava '+main.replace(/\.java$/i,'')+'\n'};
            zip.file('compile',scripts.compile);
            zip.file('run',scripts.run);
            return zip.generateAsync({type:'base64'});
        }
        async function runJudge0(lang,code,files) {
            const sourceFiles=normalizedRunnerFiles(lang,code,files);
            const multi=sourceFiles.length>1 && lang!=='csharp';
            const payload=multi
                ? {language_id:89,additional_files:await buildJudge0MultiFiles(lang,sourceFiles)}
                : {language_id:await pickJudge0Language(lang),source_code:lang==='csharp' && sourceFiles.length>1 ? combineCSharpFiles(sourceFiles) : code};
            const submitted=await runnerFetchJson(CODE_RUNNER_JUDGE0+'/submissions/?base64_encoded=false&wait=false',{
                method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
            },16000);
            if(!submitted?.token) throw new Error('실행 접수에 실패했어요.');
            let result;
            for(let attempt=0;attempt<24;attempt++) {
                await new Promise(resolve=>setTimeout(resolve,850));
                result=await runnerFetchJson(CODE_RUNNER_JUDGE0+'/submissions/'+encodeURIComponent(submitted.token)+'?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,exit_code',{},10000);
                if(result?.status?.id>=3) break;
            }
            if(!result?.status || result.status.id<3) throw new Error('실행 대기 시간이 길어졌어요.');
            return {
                ok:result.status.id===3 && (result.exit_code==null || result.exit_code===0),
                stdout:result.stdout||'',
                stderr:[result.compile_output,result.stderr, result.status.id!==3 ? (result.message||result.status.description) : ''].filter(Boolean).join('\n'),
                info:'실행 환경: 자동 연결'
            };
        }
        async function runExternalCode(lang,code,files=[]) {
            const sourceFiles=normalizedRunnerFiles(lang,code,files);
            const custom=getRunnerEndpoint();
            const issues=[];
            // A configured institutional runner takes precedence, but is never required by ordinary users.
            if(custom) {
                try {return await runSavedPistonEndpoint(custom,lang,code,sourceFiles);}
                catch(e){issues.push('전용 환경: '+runnerErrorMessage(e));}
            }
            // Single-file tasks use Wandbox by default; multi-file tasks prefer Judge0.
            const multi = sourceFiles.length>1 && lang!=='csharp';
            const services = multi
                ? [['다중 파일 실행',()=>runJudge0(lang,code,sourceFiles)],['대체 자동 실행',()=>runWandbox(lang,code,sourceFiles)]]
                : [['자동 실행',()=>runWandbox(lang,code,sourceFiles)],['대체 자동 실행',()=>runJudge0(lang,code,sourceFiles)]];
            for(const [name,run] of services) {
                try {return await run();}
                catch(e){issues.push(name+': '+runnerErrorMessage(e));}
            }
            console.warn('[CodeSnack] 자동 실행 서비스 연결 실패:',issues.join(' | '));
            return {ok:false,stderr:'자동 코드 실행 서비스에 연결하지 못했어요. 잠시 후 다시 실행해 주세요. 인터넷 연결 또는 외부 서비스의 일시적인 제한 때문일 수 있어요.\n(코드 문법 오류가 아니라 실행 서비스 연결 문제입니다.)',info:'지원되는 자동 실행 서비스를 사용할 수 없는 상태'};
        }
        async function executeRealCode(lang,code,files=[]) {
            if(lang==='javascript') return runJavaScriptWorker(code,files);
            if(lang==='python') return runPythonWorker(code,files);
            return runExternalCode(lang,code,files);
        }
        function formatExecutionResult(result) {
            const lines=[];
            if(result.stdout) lines.push(result.stdout.trimEnd());
            if(result.stderr) lines.push((result.ok?'[표준 오류] ':'[실행 오류] ')+result.stderr.trimEnd());
            if(result.info) lines.push(result.info);
            if(result.ok && !result.stdout && !result.stderr) lines.push('출력 없이 정상적으로 실행되었습니다.');
            return lines.join('\n') || '결과를 확인할 수 없습니다.';
        }

        function escapeTemplateText(value) {
            return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
        }
        function loadTemplates() {
            const grid = document.getElementById('templateGrid');
            if (!grid) return;
            const all = templateData[currentLang] || [];
            const query = (document.getElementById('templateSearch')?.value || '').trim().toLowerCase();
            const kind = document.getElementById('templateKindFilter')?.value || 'all';
            const matches = all.map((item,idx)=>({...item,idx})).filter(item => {
                if (kind==='multi' && !item.files) return false;
                if (kind==='single' && item.files) return false;
                return !query || [item.title,item.desc,item.tag,...(item.files||[]).map(f=>f.name)].join(' ').toLowerCase().includes(query);
            });
            const count = document.getElementById('templateCount');
            if (count) count.textContent = `${matches.length} / ${all.length}개`;
            grid.innerHTML = matches.length ? matches.map(item => `
                <article class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between gap-3 hover:border-slate-400 dark:hover:border-slate-500 transition">
                    <div>
                        <span class="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${escapeTemplateText(item.tag)}</span>
                        <h3 class="font-extrabold text-base mt-3 mb-1">${escapeTemplateText(item.title)}</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${escapeTemplateText(item.desc)}</p>
                        <div class="template-card-files">${item.files ? item.files.map(f=>`<code>${escapeTemplateText(f.name)}</code>`).join('') : '<code>단일 파일 예제</code>'}</div>
                    </div>
                    <button onclick="useTemplate(${item.idx})" class="w-full text-xs font-bold py-2.5 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">스낵 스튜디오에서 열기 <i class="fa-solid fa-arrow-right ml-1"></i></button>
                </article>
            `).join('') : '<p class="col-span-full text-center text-slate-500 text-sm py-12">조건에 맞는 예제가 없어요. 검색어나 필터를 바꿔보세요.</p>';
        }
        function useTemplate(index) {
            const template = (templateData[currentLang] || [])[index];
            if (!template) return;
            const id = `example-${currentLang}-${index}`;
            const ext = studioLanguageExtension(currentLang);
            const files = template.files || [{name:({java:'Main.java',csharp:'Program.cs',cpp:'main.cpp',javascript:'app.js',python:'main.py'}[currentLang] || `main.${ext}`),content:template.code}];
            openStudioProject(id, template.title, currentLang, files, template.entry || files[0].name);
            showToast(`'${template.title}' 예제를 스낵 스튜디오에서 열었어요.`, 'success');
        }

        async function startRandomBlankQuiz() {
            const lang = currentLang;
            const name = `blank_quiz_${lang}.${studioLanguageExtension(lang)}`;
            const fileId = openStudioSnippet(name,'// AI 빈칸 문제를 만드는 중입니다…');
            const terminal = document.getElementById('vscTerminalOutput');
            terminal.textContent = '> AI가 실전 빈칸 문제를 생성 중입니다…';
            const apiKey = getGeminiApiKey();
            if (!apiKey) {terminal.textContent='> AI 문제 생성에 사용할 API 키를 확인해 주세요.';return;}
            const names={python:'Python',javascript:'JavaScript',cpp:'C++',java:'Java',csharp:'C#'};
            const promptText = `너는 프로그래밍 교사야. ${names[lang]}에서 자주 쓰이는 짧은 실전 예제(10~15줄)를 만들고 핵심 문법 하나를 밑줄 4개(____)로 바꿔줘. JSON으로만 응답해: {"quiz_code":"빈칸 있는 전체 코드", "original_answer":"원래 정답", "explanation":"힌트 및 해설"}`;
            try {
                const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,{
                    method:'POST',headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({contents:[{parts:[{text:promptText}]}],generationConfig:{temperature:.8}})
                });
                if (!res.ok) throw new Error('AI 서버 오류 '+res.status);
                const json=await res.json();
                const raw=json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!raw) throw new Error('AI 응답이 없습니다');
                const data=JSON.parse(raw.replace(/```json/gi,'').replace(/```/g,'').trim());
                if (typeof data.quiz_code!=='string' || !data.quiz_code.includes('____'))throw new Error('문제 형식이 올바르지 않습니다');
                const file=vscFiles.find(f=>f.id===fileId);
                if (!file) throw new Error('생성 중 파일이 닫혔습니다');
                file.content=data.quiz_code;file.isDirty=true;
                studioBlankQuiz={fileId,answer:String(data.original_answer||''),explanation:String(data.explanation||''),initialCode:data.quiz_code};
                renderVscAll();updateStudioQuizNotice();
                document.querySelector('#studioInlineQuizCode .studio-blank-input')?.focus();
                terminal.textContent='> 🎯 코드 속 강조된 입력칸에 정답을 바로 적은 후 [채점하기]를 눌러 보세요.';
                showToast('스튜디오에 빈칸 문제가 생성되었어요.', 'success');
            } catch(e) {
                const file=vscFiles.find(f=>f.id===fileId);
                if(file){file.content=`// 문제 생성에 실패했습니다. 다시 시도해 주세요.\n// ${String(e.message).replace(/\n/g,' ')}`;file.isDirty=true;renderVscAll();}
                terminal.textContent='> AI 문제 생성 실패: '+e.message;
            }
        }

        // 기존 switchTab 함수를 찾아 배열 안에 'path'를 추가하세요.
        // 전역 상태 변수 추가
        let isAiQuizLoaded = false;

        function setLanguage(lang) {
            currentLang = lang;
            document.body.setAttribute('data-lang', lang);
            currentQuizIndex = 0;
            currentTutorialIndex = 0;
            isAiQuizLoaded = false; 

            // 💡 언어가 바뀌면 백그라운드 퀴즈 대기열을 완전히 초기화합니다.
            aiQuizHistory = [];
            currentAiQuizIndex = -1;
            aiQuizGenerationToken++; // 이전 언어의 비동기 응답은 더 이상 화면을 변경할 수 없음
            isGeneratingQuizzes = false;

            document.querySelectorAll('.lang-btn').forEach(btn => {
                if (btn.dataset.lang === lang) {
                    btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'border-slate-300', 'dark:border-slate-600');
                } else {
                    btn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'border-slate-300', 'dark:border-slate-600');
                }
            });

            const langNames = { python: 'Python', javascript: 'JavaScript', cpp: 'C++', java: 'Java', csharp: 'C#' };
            const logoFiles = { python: 'Python.png', javascript: 'JavaScript.png', cpp: 'C++.png', java: 'Java.png', csharp: 'Csharp.png' };
            const codeFile = document.getElementById('tutorialCodeFilename');
            if (codeFile) codeFile.textContent = `example.${{python:'py',javascript:'js',cpp:'cpp',java:'java',csharp:'cs'}[lang]}`;
            const logoImg = document.getElementById('themeLogo');
            if (logoImg && logoFiles[lang]) logoImg.src = logoFiles[lang];

            const aiLangBadge = document.getElementById('aiChatCurrentLangBadge');
            if (aiLangBadge) aiLangBadge.innerText = `현재 언어: ${langNames[lang]}`;
            
            document.getElementById('langTipText').innerText = langTips[lang] || langTips.python;
            loadTutorials();
            
            const quickLang=document.getElementById('studioQuickLang');if(quickLang)quickLang.value=lang;
            updateRuntimeLabel();
            loadTemplates();

            // 🟢 현재 화면이 '퀴즈 탭'에 있다면 즉시 새로운 언어의 퀴즈를 생성합니다!
            const quizView = document.getElementById('view-quiz');
            const mcqView = document.getElementById('quizMcqContainer');
            if (quizView && !quizView.classList.contains('hidden') && mcqView && !mcqView.classList.contains('hidden')) {
                isAiQuizLoaded = true;
                generateAiQuiz();
            }
        }

        // 🟢 퀴즈 화면 전환 제어 함수
        function openMcqQuiz() {
            document.getElementById('quizSelectionMenu').classList.add('hidden');
            document.getElementById('quizMcqContainer').classList.remove('hidden');
            if (aiQuizHistory.length > 0) {
                if (currentAiQuizIndex < 0) currentAiQuizIndex = 0;
                renderCurrentAiQuiz();
            } else {
                isAiQuizLoaded = true;
                generateAiQuiz(); // 데이터가 아직 없으면 즉시 로딩 상태를 보여줍니다.
            }
        }

        function closeMcqQuiz() {
            document.getElementById('quizSelectionMenu').classList.remove('hidden');
            document.getElementById('quizMcqContainer').classList.add('hidden');
        }

        

        function toggleDarkMode() {
            const html = document.documentElement;
            const icon = document.getElementById('themeIcon');
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                icon.className = 'fa-solid fa-moon';
            } else {
                html.classList.add('dark');
                icon.className = 'fa-solid fa-sun';
            }
            try { localStorage.setItem('codesnack-theme', html.classList.contains('dark') ? 'dark' : 'light'); } catch(e) {}
            syncMyPagePreferences();
        }

        

        function dismissTutorialHeading() {
            const tutorialHeading = document.getElementById('tutorialHeroHeading');
            if (tutorialHeading) tutorialHeading.classList.add('hidden');
        }

