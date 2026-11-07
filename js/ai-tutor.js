// CodeSnack - ai-tutor.js (original script order preserved)
        async function handleAiChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('aiQuestionInput');
            const question = input.value.trim();
            if (!question) return;

            const apiKey = getGeminiApiKey();
            if (!apiKey) {
                showToast("상단의 Gemini API 키를 입력 후 저장해 주세요!", "error");
                return;
            }

            appendChatMessage("user", question);
            input.value = "";
            resizeChatComposer(input);

            const loadingMsgId = appendChatMessage("ai", "AI 튜터가 답변을 생성하고 있습니다...", true);

            const langNames = { python: 'Python', javascript: 'JavaScript', cpp: 'C++', java: 'Java', csharp: 'C#' };
            const systemInstructionText = `너는 코드 학습 플랫폼 'CodeSnack'의 유능하고 친절한 AI 프로그래밍 튜터야. 현재 사용자가 선택한 언어는 ${langNames[currentLang]}이야. 초보자도 이해하기 쉽도록 답변하되, 절대로 길어지지 않게 핵심만 3~4문장 이내로 짧고 간결하게 답변해줘.`;

            // gemini-3.8-flash 모델 사용
            // 기존: gemini-3.8-flash -> 변경: gemini-1.5-flash
            // 기존: gemini-1.5-flash
// 변경: gemini-2.5-flash
// handleAiChatSubmit 및 fetchAIExplanation 내부
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: question }] }],
                        systemInstruction: { parts: [{ text: systemInstructionText }] }
                    })
                });

                const data = await response.json();

                if (data.error) {
                    updateChatMessage(loadingMsgId, `⚠️ 오류 발생: ${data.error.message || 'API 키를 확인해주세요.'}`);
                    return;
                }

                const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (aiReply) {
                    updateChatMessage(loadingMsgId, aiReply);
                } else {
                    updateChatMessage(loadingMsgId, "답변을 생성하지 못했습니다. 다시 질문해 주세요.");
                }
            } catch (err) {
                updateChatMessage(loadingMsgId, `네트워크 오류 또는 API 연결 실패: ${err.message}`);
            }
        }

        function sendQuickQuestion(promptText) {
            document.getElementById('aiQuestionInput').value = promptText;
            handleAiChatSubmit(new Event('submit'));
        }

        let csChatMessageCounter = 0;

        function resizeChatComposer(field) {
            if (!field) return;
            field.style.height = 'auto';
            field.style.height = Math.min(field.scrollHeight, 132) + 'px';
        }

        function handleChatComposerKeydown(event) {
            if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
                event.preventDefault();
                document.getElementById('csChatForm')?.requestSubmit();
            }
        }

        function csChatEscape(text) {
            return String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
        }

        function csChatFormat(text) {
            const codeBlocks = [];
            let safe = csChatEscape(text);
            safe = safe.replace(/```([a-zA-Z0-9+#._-]*)\s*\n([\s\S]*?)```/g, (_full, language, code) => {
                const placeholder = 'CSCHATCODEPLACEHOLDER' + codeBlocks.length + 'END';
                codeBlocks.push(`<div class="cs-chat-code-block"><div class="cs-chat-code-head"><span><i class="fa-solid fa-code" aria-hidden="true"></i> ${language || 'code'}</span></div><pre><code>${code.replace(/^\n+|\n+$/g,'')}</code></pre></div>`);
                return placeholder;
            });
            safe = safe.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
            safe = safe.replace(/`([^`\n]+)`/g, '<code class="cs-chat-inline-code">$1</code>');
            safe = safe.replace(/\n/g, '<br>');
            safe = safe.replace(/CSCHATCODEPLACEHOLDER(\d+)END/g, (_full, i) => codeBlocks[Number(i)] || '');
            return safe;
        }

        function appendChatMessage(sender, text, isLoading = false) {
            const container = document.getElementById('aiChatMessages');
            const empty = document.getElementById('csChatEmpty');
            if (empty) empty.classList.add('hidden');
            const isAi = sender === 'ai';
            const msg = document.createElement('div');
            msg.id = 'cs-chat-msg-' + (++csChatMessageCounter);
            msg.className = 'cs-chat-message ' + (isAi ? 'cs-chat-message-ai' : 'cs-chat-message-user');
            msg.innerHTML = `<div class="cs-chat-message-avatar" aria-hidden="true">${isAi ? 'AI' : '나'}</div><div class="cs-chat-message-main"><div class="cs-chat-message-meta">${isAi ? 'CodeSnack AI' : '나'}</div><div class="cs-chat-bubble"></div></div>`;
            const bubble = msg.querySelector('.cs-chat-bubble');
            if (isLoading) {
                bubble.classList.add('cs-chat-loading');
                bubble.innerHTML = '<span class="cs-chat-loading-dot"></span><span class="cs-chat-loading-dot"></span><span class="cs-chat-loading-dot"></span><span class="cs-chat-loading-copy">답변을 작성하고 있어요...</span>';
            } else if (isAi) {
                bubble.innerHTML = csChatFormat(text);
            } else {
                bubble.textContent = String(text ?? '');
            }
            container.appendChild(msg);
            container.scrollTop = container.scrollHeight;
            return msg.id;
        }

        function updateChatMessage(msgId, newText) {
            const bubble = document.getElementById(msgId)?.querySelector('.cs-chat-bubble');
            if (bubble) {
                bubble.classList.remove('cs-chat-loading');
                bubble.innerHTML = csChatFormat(newText);
            }
            const container = document.getElementById('aiChatMessages');
            if (container) container.scrollTop = container.scrollHeight;
        }

        function clearChatHistory() {
            const container = document.getElementById('aiChatMessages');
            if (!container) return;
            container.querySelectorAll('.cs-chat-message').forEach(el => el.remove());
            let empty = document.getElementById('csChatEmpty');
            if (empty) empty.classList.remove('hidden');
            const input = document.getElementById('aiQuestionInput');
            if (input) { input.value = ''; resizeChatComposer(input); }
            showToast('새 대화를 시작했어요.', 'info');
        }

