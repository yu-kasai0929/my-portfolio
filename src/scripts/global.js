const el1 = document.getElementById('type-text-1');
const el2 = document.getElementById('type-text-2');

// タイピングアニメーション
if (el1 && el2) {
  const phrases = [
    { normal: "Hello, I'm ", highlight: "Yu Kasai" },
    { normal: "I am a ", highlight: "Backend Engineer" },
    { normal: "I'm from ", highlight: "Hokkaido" },
    { normal: "My hobby is ", highlight: "playing games" },
    { normal: "and ", highlight: "watching baseball games" }
  ];
  
  let phraseIndex = 0;
  let charIndexNormal = 0;
  let charIndexHighlight = 0;
  let isDeleting = false;

  function typeFullSentence() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      if (charIndexHighlight > 0) {
        charIndexHighlight--;
        el2.textContent = currentPhrase.highlight.substring(0, charIndexHighlight);
        setTimeout(typeFullSentence, 30);
      } else if (charIndexNormal > 0) {
        charIndexNormal--;
        el1.textContent = currentPhrase.normal.substring(0, charIndexNormal);
        setTimeout(typeFullSentence, 30);
      } else {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(typeFullSentence, 500);
      }
    } else {
      if (charIndexNormal < currentPhrase.normal.length) {
        charIndexNormal++;
        el1.textContent = currentPhrase.normal.substring(0, charIndexNormal);
        setTimeout(typeFullSentence, 60);
      } else if (charIndexHighlight < currentPhrase.highlight.length) {
        charIndexHighlight++;
        el2.textContent = currentPhrase.highlight.substring(0, charIndexHighlight);
        setTimeout(typeFullSentence, 80);
      } else {
        isDeleting = true;
        setTimeout(typeFullSentence, 2500);
      }
    }
  }

  setTimeout(typeFullSentence, 800);
}

// スマホ用ハンバーガーメニューの開閉ロジック
const btn = document.getElementById('mobile-menu-btn');
const menu = document.getElementById('mobile-menu');
const links = document.querySelectorAll('.mobile-link');

if (btn && menu) {
  btn.addEventListener('click', () => {
    menu.classList.toggle('opacity-0');
    menu.classList.toggle('-translate-y-4');
    menu.classList.toggle('pointer-events-none');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none');
    });
  });
}

const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.remove('opacity-0', 'translate-y-10');
      entry.target.classList.add('opacity-100', 'translate-y-0');
      
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

const revealTargets = document.querySelectorAll('.reveal-target');
revealTargets.forEach(target => {
  observer.observe(target);
});

const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnIcon = document.getElementById('btn-icon');
const formSuccess = document.getElementById('form-success');
const closeSuccessBtn = document.getElementById('close-success-btn');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalText = btnText.innerText;
    btnText.innerText = '送信中...';
    btnIcon.classList.add('hidden');
    submitBtn.disabled = true;

    const formData = new FormData(contactForm);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        contactForm.reset();
        formSuccess.classList.remove('hidden');
      } else {
        alert('送信に失敗しました。時間をおいて再度お試しください。');
      }
    } catch (error) {
      alert('通信エラーが発生しました。ネットワーク環境をご確認ください。');
    } finally {
      btnText.innerText = originalText;
      btnIcon.classList.remove('hidden');
      submitBtn.disabled = false;
    }
  });
}

if (closeSuccessBtn) {
  closeSuccessBtn.addEventListener('click', () => {
    formSuccess.classList.add('hidden');
  });
}


// AIアシスタント チャット機能
const chatToggleBtn = document.getElementById('ai-chat-toggle');
const chatCloseBtn = document.getElementById('ai-chat-close');
const chatWindow = document.getElementById('ai-chat-window');
const chatForm = document.getElementById('ai-chat-form');
const chatInput = document.getElementById('ai-chat-input');
const chatMessages = document.getElementById('ai-chat-messages');
const chatSubmitBtn = document.getElementById('ai-chat-submit');

if (chatToggleBtn && chatWindow) {
  // チャットウィンドウの開閉
  const toggleChat = () => {
    chatWindow.classList.toggle('hidden');
    chatWindow.classList.toggle('flex');
    if (!chatWindow.classList.contains('hidden')) {
      if (window.innerWidth >= 768) {
        chatInput.focus();
      }
    }
  };

  chatToggleBtn.addEventListener('click', toggleChat);
  chatCloseBtn.addEventListener('click', toggleChat);

  // 画面に吹き出しを追加する関数
  const appendMessage = (text, isUser) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
    
    const bubble = document.createElement('div');
    bubble.className = `px-4 py-2 text-sm max-w-[85%] shadow-sm leading-relaxed ${
      isUser 
        ? 'bg-[#556b2f] text-white rounded-2xl rounded-tr-sm' 
        : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm'
    }`;
    bubble.innerHTML = text.replace(/\n/g, '<br>'); // 改行を<br>タグに変換
    
    msgDiv.appendChild(bubble);
    chatMessages.appendChild(msgDiv);
    
    // 一番下まで自動スクロール
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  // メッセージ送信（APIとの通信）
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // 1. ユーザーの入力を画面に表示して、入力欄を空にする
    appendMessage(message, true);
    chatInput.value = '';
    
    // 2. 通信中はボタンと入力をブロック
    chatInput.disabled = true;
    chatSubmitBtn.disabled = true;

    // 3. AIが考え中（タイピング風アニメーション）を表示
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'flex justify-start';
    loadingDiv.innerHTML = `
      <div class="bg-white border border-slate-200 text-slate-400 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
        <div class="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
        <div class="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
      </div>`;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      // 4. 先ほど作ったAPI（Vertex AI）へリクエストを投げる
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      });

      const data = await response.json();
      
      // 考え中アニメーションを消す
      document.getElementById(loadingId).remove();

      if (response.ok && data.reply) {
        // 5. AIからの回答を画面に表示！
        appendMessage(data.reply, false);
      } else {
        appendMessage('申し訳ありません、エラーが発生しました。（APIの設定をご確認ください）', false);
      }
    } catch (error) {
      document.getElementById(loadingId).remove();
      appendMessage('通信エラーが発生しました。ネットワーク環境をご確認ください。', false);
    } finally {
      chatInput.disabled = false;
      chatSubmitBtn.disabled = false;
      if (window.innerWidth >= 768) {
        chatInput.focus();
      }
    }
  });
}