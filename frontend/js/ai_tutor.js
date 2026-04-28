(function() {
    // Inject CSS styles for AI Tutor
    const style = document.createElement('style');
    style.innerHTML = `
        /* General Utility Classes from Tailwind for reference */
        .ai-tutor-fab {
            position: fixed; bottom: 1.5rem; right: 1.5rem; width: auto; height: 4rem;
            background-color: white; border-radius: 9999px; display: flex; align-items: center;
            padding-right: 1.5rem; padding-left: 0.5rem; gap: 0.75rem; z-index: 50;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); cursor: pointer; border: 1px solid #f3f4f6;
            transition: all 0.3s;
        }
        .ai-tutor-fab:hover { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2); transform: translateY(-0.25rem); }
        .ai-tutor-fab-icon {
            width: 3rem; height: 3rem; border-radius: 9999px; background-color: #0b3d2e;
            display: flex; align-items: center; justify-content: center; color: #79a894;
            transition: transform 0.3s;
        }
        .ai-tutor-fab:hover .ai-tutor-fab-icon { transform: scale(1.1); }
        .ai-tutor-fab-text { font-weight: bold; color: #00261b; font-size: 0.875rem; }

        .ai-tutor-window {
            position: fixed; bottom: 6rem; right: 1.5rem; width: 90vw; max-width: 24rem;
            background-color: white; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid #f3f4f6; display: flex; flex-direction: column; z-index: 70;
            transform-origin: bottom right; transform: scale(0); opacity: 0; pointer-events: none;
            transition: all 0.3s;
        }
        .ai-tutor-window.open { transform: scale(1); opacity: 1; pointer-events: auto; }
        
        .ai-header {
            padding: 1rem 1.25rem; background-color: #00261b; color: white; border-top-left-radius: 1.5rem;
            border-top-right-radius: 1.5rem; display: flex; justify-content: space-between; align-items: center;
        }
        .ai-chat-area {
            height: 18rem; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem;
            background-color: #ffffff;
        }
        .ai-message {
            display: flex; align-items: flex-start; gap: 0.75rem; max-width: 85%;
        }
        .ai-message.user { align-self: flex-end; flex-direction: row-reverse; }
        .ai-avatar {
            width: 2rem; height: 2rem; border-radius: 9999px; background-color: #0b3d2e;
            display: flex; align-items: center; justify-content: center; color: #79a894; flex-shrink: 0;
        }
        .ai-bubble {
            padding: 0.75rem; border-radius: 1rem; font-size: 0.8125rem; line-height: 1.5;
        }
        .ai-message.bot .ai-bubble {
            background-color: #f3f4f6; color: #1a1c1c; border-top-left-radius: 0.125rem;
        }
        .ai-message.user .ai-bubble {
            background-color: #00261b; color: white; border-top-right-radius: 0.125rem;
        }
        
        .ai-footer { padding: 0.75rem; border-top: 1px solid #f3f4f6; background-color: white; border-bottom-left-radius: 1.5rem; border-bottom-right-radius: 1.5rem; }
        .ai-input-container { display: flex; align-items: center; gap: 0.5rem; position: relative; }
        .ai-input {
            width: 100%; background-color: #f3f4f6; border: none; border-radius: 9999px;
            padding: 0.75rem 1rem; padding-right: 3rem; font-size: 0.8125rem; outline: none;
        }
        .ai-send-btn {
            position: absolute; right: 0.25rem; width: 2.5rem; height: 2.5rem; border-radius: 9999px;
            background-color: #00261b; color: white; display: flex; align-items: center; justify-content: center;
            border: none; cursor: pointer;
        }

        @keyframes pulse-sm { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        .animate-pulse-sm { animation: pulse-sm 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        
        @keyframes bounce-sm { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); } }
        .animate-bounce-sm { animation: bounce-sm 1s infinite; }

        @media (min-width: 768px) {
            .ai-tutor-fab { bottom: 2.5rem; right: 2.5rem; }
            .ai-tutor-window { bottom: 7rem; right: 2.5rem; width: 24rem; }
        }
    `;
    document.head.appendChild(style);

    // Inject HTML for FAB and Window
    const container = document.createElement('div');
    container.innerHTML = `
        <button id="ai-tutor-btn-global" class="ai-tutor-fab">
            <div class="ai-tutor-fab-icon">
                <span class="material-symbols-outlined animate-pulse-sm" style="color: #b2f746;">smart_toy</span>
            </div>
            <span class="ai-tutor-fab-text">Ask AI Tutor</span>
        </button>
        
        <div id="ai-tutor-window-global" class="ai-tutor-window">
            <div class="ai-header">
                <div style="display: flex; gap: 0.75rem; align-items: center;">
                    <span class="material-symbols-outlined animate-pulse-sm" style="color: #b2f746;">smart_toy</span>
                    <span style="font-weight: bold; font-size: 0.875rem;">AI Tutor</span>
                </div>
                <button id="ai-tutor-close-global" style="background: none; border: none; color: white; cursor: pointer;">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem;">close</span>
                </button>
            </div>
            <div id="ai-tutor-chat-global" class="ai-chat-area">
                <div class="ai-message bot">
                    <div class="ai-avatar"><span class="material-symbols-outlined" style="font-size: 1rem;">smart_toy</span></div>
                    <div class="ai-bubble">Hi! I'm your AI Tutor. Need a helpful hint or have a question about this page? I'm here to help!</div>
                </div>
            </div>
            <div class="ai-footer">
                <form id="ai-tutor-form-global" class="ai-input-container">
                    <input id="ai-chat-input-global" type="text" placeholder="Ask a question..." class="ai-input" autocomplete="off" />
                    <button type="submit" class="ai-send-btn">
                        <span class="material-symbols-outlined" style="font-size: 1rem; font-variation-settings: 'FILL' 1;">send</span>
                    </button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // Logic
    const btn = document.getElementById('ai-tutor-btn-global');
    const win = document.getElementById('ai-tutor-window-global');
    const closeBtn = document.getElementById('ai-tutor-close-global');
    const form = document.getElementById('ai-tutor-form-global');
    const input = document.getElementById('ai-chat-input-global');
    const chat = document.getElementById('ai-tutor-chat-global');

    let aiWindowOpen = false;
    
    function toggleAITutor() {
        aiWindowOpen = !aiWindowOpen;
        if(aiWindowOpen) {
            win.classList.add('open');
            input.focus();
        } else {
            win.classList.remove('open');
        }
    }

    btn.addEventListener('click', toggleAITutor);
    closeBtn.addEventListener('click', toggleAITutor);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if(!text) return;
        
        input.value = '';
        
        // Add User Message
        chat.innerHTML += `
            <div class="ai-message user">
                <div class="ai-bubble">${text.replace(/</g, "&lt;")}</div>
            </div>`;
        chat.scrollTop = chat.scrollHeight;

        // Add Loading bubble
        const typingId = 'typing-' + Date.now();
        chat.innerHTML += `
            <div id="${typingId}" class="ai-message bot">
                <div class="ai-avatar"><span class="material-symbols-outlined" style="font-size: 1rem;">smart_toy</span></div>
                <div class="ai-bubble" style="display: flex; gap: 4px; align-items: center;">
                    <div style="width: 6px; height: 6px; background-color: #9ca3af; border-radius: 50%;" class="animate-bounce-sm"></div>
                    <div style="width: 6px; height: 6px; background-color: #9ca3af; border-radius: 50%; animation-delay: 0.2s;" class="animate-bounce-sm"></div>
                    <div style="width: 6px; height: 6px; background-color: #9ca3af; border-radius: 50%; animation-delay: 0.4s;" class="animate-bounce-sm"></div>
                </div>
            </div>`;
        chat.scrollTop = chat.scrollHeight;

        try {
            const token = localStorage.getItem('amep_token') || 'test-mode';
            const context = "The user is on the " + document.title + " page. Provide helpful assistance related to their query without giving away absolute solutions if they are testing themselves.";
            const res = await fetch(`${window.AMEP_CONFIG.API_URL}/ai/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ question: text, context })
            });
            
            const data = await res.json();
            const typingEl = document.getElementById(typingId);
            if(typingEl) typingEl.remove();
            
            let reply = data.success ? data.answer : "I couldn't reach my server right now, but I'm here to support you!";
            
            chat.innerHTML += `
            <div class="ai-message bot">
                <div class="ai-avatar"><span class="material-symbols-outlined" style="font-size: 1rem;">smart_toy</span></div>
                <div class="ai-bubble">${reply.replace(/\n/g, '<br/>')}</div>
            </div>`;
            chat.scrollTop = chat.scrollHeight;
        } catch(e) {
            console.error(e);
            const typingEl = document.getElementById(typingId);
            if(typingEl) typingEl.remove();
            chat.innerHTML += `
            <div class="ai-message bot">
                <div class="ai-avatar" style="background-color: #fee2e2; color: #dc2626;"><span class="material-symbols-outlined" style="font-size: 1rem;">error</span></div>
                <div class="ai-bubble">Network error. I am having trouble connecting to my central brain. Please check your internet connection!</div>
            </div>`;
            chat.scrollTop = chat.scrollHeight;
        }
    });
})();
