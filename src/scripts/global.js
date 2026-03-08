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