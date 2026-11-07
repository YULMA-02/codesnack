/* CodeSnack modular bootstrap.
 * Page fragments load before the original scripts, so DOM IDs and onclick handlers remain valid.
 * For local use, start an HTTP server (see README.md); file:// blocks fetch().
 */
(function () {
  'use strict';
  const pageFiles = ["home.html", "learning-path.html", "tutorial.html", "quiz.html", "ai-tutor.html", "studio.html", "examples.html", "auth.html", "mypage.html"];
  const scriptFiles = ["data.js", "learning.js", "quiz-creator.js", "ai-tutor.js", "quiz.js", "execution.js", "navigation.js", "account.js", "studio.js", "init.js"];
  const main = document.querySelector('main.cs-main');
  const loading = document.getElementById('cs-loading');
  const allowedTabs = new Set(['home','tutorial','quiz','ai-chat','vscode','templates','auth','mypage','path']);
  function loadScript(path) {
    return new Promise((resolve,reject)=>{
      const node=document.createElement('script');
      node.src='js/'+path;
      node.async=false;
      node.onload=resolve;
      node.onerror=()=>reject(new Error('기능 파일 로드 실패: '+path));
      document.body.appendChild(node);
    });
  }
  async function run() {
    if (location.protocol==='file:') {
      throw new Error('이 프로젝트는 분리된 페이지 파일을 사용합니다. run_windows.bat 또는 run_mac.command를 실행해 로컬 웹 서버로 열어 주세요.');
    }
    const responses=await Promise.all(pageFiles.map(name=>fetch('pages/'+name,{cache:'no-cache'})));
    const failed=responses.findIndex(r=>!r.ok);
    if(failed>=0) throw new Error('페이지 파일을 불러오지 못했습니다: pages/'+pageFiles[failed]);
    const fragments=await Promise.all(responses.map(r=>r.text()));
    // Main uses direct section children for existing tab routing and CSS selectors.
    main.innerHTML=fragments.join('\n');
    for (const file of scriptFiles) await loadScript(file);
    if (typeof initializeCodeSnack !== 'function') throw new Error('앱 초기화 기능이 없습니다.');
    initializeCodeSnack();
    const hashTab=decodeURIComponent(location.hash.replace(/^#/,''));
    if(allowedTabs.has(hashTab) && hashTab!=='home') switchTab(hashTab);
    window.addEventListener('hashchange',()=>{
      const tab=decodeURIComponent(location.hash.replace(/^#/,''));
      if(allowedTabs.has(tab)) switchTab(tab);
    });
    window.codesnackPagesReady=true;
    document.dispatchEvent(new Event('codesnack:ready'));
  }
  run().catch(err=>{
    console.error('CodeSnack 시작 오류:',err);
    if(loading){
      loading.style.display='block';
      loading.innerHTML='<strong>페이지를 시작하지 못했습니다.</strong><p></p>';
      loading.querySelector('p').textContent=err.message;
    }else{
      const box=document.createElement('div');box.className='cs-modular-loading';box.textContent=err.message;main.appendChild(box);
    }
  });
})();
