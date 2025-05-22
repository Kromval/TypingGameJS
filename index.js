import {
  initGame,
  gameLoop,
  resetGame,
  tryMatch,
  setPaused,
  score,
  lives
} from './game.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas       = document.getElementById('gameCanvas');
  const inputField   = document.getElementById('inputField');
  const startOverlay = document.getElementById('startScreen');
  const pauseOverlay = document.getElementById('pauseScreen');
  const overOverlay  = document.getElementById('overScreen');
  const themeToggle  = document.getElementById('themeToggle');
  const statsSpan    = document.getElementById('overStats');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const livesDisplay = document.getElementById('livesDisplay');
  const explosionContainer = document.getElementById('explosionContainer');

  let enteredCount = 0;
  let isPausedLocal = false;

  const scoreSound = new Audio('sounds/score.mp3');
  scoreSound.volume = 0.25;

  initGame(canvas);

  function applyTheme(theme) {
    document.body.classList.remove('light-theme','dark-theme');
    document.body.classList.add(`${theme}-theme`);
    themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    localStorage.setItem('theme', theme);
  }
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme);
  } else {
    applyTheme(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  themeToggle.addEventListener('click', () => {
    applyTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark');
  });

  const show = el => el.classList.remove('hidden');
  const hide = el => el.classList.add('hidden');

  function startGame() {
    hide(startOverlay);
    hide(overOverlay);
    inputField.value = '';
    inputField.disabled = false;
    inputField.focus();
    enteredCount = 0;
    resetGame();
    gameLoop();
  }

  function togglePause() {
    if (!startOverlay.classList.contains('hidden') || !overOverlay.classList.contains('hidden')) return;
    isPausedLocal = !isPausedLocal;
    setPaused(isPausedLocal);
    if (isPausedLocal) {
      show(pauseOverlay);
      inputField.disabled = true;
    } else {
      hide(pauseOverlay);
      inputField.disabled = false;
      inputField.focus();
    }
  }
  function onGameOver() {
    inputField.disabled = true;
    statsSpan.textContent = `Введено слов: ${enteredCount}, Очков: ${score}`;
    show(overOverlay);
  }
  window.addEventListener('gameover', onGameOver);

  function updateStatsUI() {
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${lives}`;
  }
  function uiLoop() {
    updateStatsUI();
    requestAnimationFrame(uiLoop);
  }
  uiLoop();

  // Проверка ввода
  inputField.addEventListener('input', () => {
    const val = inputField.value.trim();
    if (!val) return;
    if (tryMatch(val)) {
      enteredCount++;
      scoreSound.currentTime = 0;
      scoreSound.play();
      inputField.value = '';
      inputField.focus();
    }
  });

  // Пауза
  inputField.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      togglePause();
    }
  });

  // SPACE для старта / рестарта / выхода из паузы
  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      if (!startOverlay.classList.contains('hidden')) {
        startGame();
      } else if (!overOverlay.classList.contains('hidden')) {
        startGame();
      } else if (isPausedLocal) {
        togglePause();
      }
      e.preventDefault();
    }
  });

  inputField.addEventListener('blur', () => {
    const onStart = !startOverlay.classList.contains('hidden');
    const onOver  = !overOverlay.classList.contains('hidden');
    if (!onStart && !onOver && !isPausedLocal) {
      inputField.focus();
    }
  });

  window.addEventListener('trigger-explosion', e => {
  const { x, y } = e.detail;
  explosionContainer.style.left = `${x}px`;
  explosionContainer.style.top  = `${y}px`;
  explosionContainer.classList.remove('hidden');

  setTimeout(() => {
    explosionContainer.classList.add('hidden');
  }, 1000);
});

  hide(pauseOverlay);
  hide(overOverlay);
  show(startOverlay);
});
