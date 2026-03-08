const el1 = document.getElementById('type-text-1');
const el2 = document.getElementById('type-text-2');

if (el1 && el2) {
  // 💡 表示したい文章のリスト（normal: 黒い文字, highlight: 緑色になる文字）
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
      // 【バックスペースで消す時の動き】
      if (charIndexHighlight > 0) {
        // まず緑色の文字から消していく
        charIndexHighlight--;
        el2.textContent = currentPhrase.highlight.substring(0, charIndexHighlight);
        setTimeout(typeFullSentence, 30); // 消すスピード（ダダダッと早く）
      } else if (charIndexNormal > 0) {
        // 緑色が消え終わったら、黒い文字を消していく
        charIndexNormal--;
        el1.textContent = currentPhrase.normal.substring(0, charIndexNormal);
        setTimeout(typeFullSentence, 30); // 消すスピード
      } else {
        // 全部消え終わったら、次の文章のタイピングへ！
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(typeFullSentence, 500); // 次を打ち始める前の「間（ま）」
      }
    } else {
      // 【タイピングして打つ時の動き】
      if (charIndexNormal < currentPhrase.normal.length) {
        // まず黒い文字を打つ
        charIndexNormal++;
        el1.textContent = currentPhrase.normal.substring(0, charIndexNormal);
        setTimeout(typeFullSentence, 60); // 打つスピード
      } else if (charIndexHighlight < currentPhrase.highlight.length) {
        // 次に緑色の文字を打つ
        charIndexHighlight++;
        el2.textContent = currentPhrase.highlight.substring(0, charIndexHighlight);
        setTimeout(typeFullSentence, 80); // 強調部分は少しタメて打つ
      } else {
        // 全文を打ち終わったら、読ませるために一時停止してから消し始める
        isDeleting = true;
        setTimeout(typeFullSentence, 2500); // 完成した文章を表示しておく時間（2.5秒）
      }
    }
  }

  // 画像がフワッと出終わる頃にアニメーション開始
  setTimeout(typeFullSentence, 800);
}

// スマホ用ハンバーガーメニューの開閉ロジック
const btn = document.getElementById('mobile-menu-btn');
const menu = document.getElementById('mobile-menu');
const links = document.querySelectorAll('.mobile-link');

if (btn && menu) {
  // ボタンをクリックしたら、透明度・位置・クリック判定を切り替える
  btn.addEventListener('click', () => {
    menu.classList.toggle('opacity-0');
    menu.classList.toggle('-translate-y-4');
    menu.classList.toggle('pointer-events-none');
  });

  // リンクをクリックしたら、メニューを閉じる（初期状態に戻す）
  links.forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none');
    });
  });
}