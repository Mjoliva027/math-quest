/**
 * Math Quest - Main Application Controller (Mobile-Optimized & Touch-Enabled)
 * Handles gameplay loop, touch swipe gestures, mobile drawer, Boss Battles, and 12x12 Matrix.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // APP STATE
  // =========================================================================
  const state = {
    // Current Configuration
    mode: 'blitz', // 'blitz' | 'boss' | 'survival' | 'flashcards' | 'mistake_drill'
    operation: 'multiply',
    difficulty: 'medium',
    customTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    blitzDuration: 30,
    inputStyle: 'choice', // 'choice' | 'direct'

    // Active Quiz/Survival Round State
    currentProblem: null,
    score: 0,
    streak: 0,
    maxStreak: 0,
    correctCount: 0,
    totalCount: 0,
    hearts: 3,
    timeLeft: 30,
    timerInterval: null,
    directInputVal: '',
    roundMistakes: [],
    isEvaluating: false,
    isFeverActive: false,

    // Flashcard State & Touch Gestures
    flashcardDeck: [],
    flashcardIndex: 0,
    isCardFlipped: false,
    touchStartX: 0,
    touchStartY: 0,
    touchDeltaX: 0,
    touchDeltaY: 0,
    isSwiping: false,

    // Boss Battle State
    currentBoss: null,
    bossHp: 100,
    bossMaxHp: 100,
    playerHp: 100,
    playerMaxHp: 100,
    bossTurnTime: 12,
    bossTimerInterval: null,

    // Matrix Explorer State
    matrixTab: '1-6', // '1-6' | '7-12' | 'all'
    selectedMatrixRow: 7,
    selectedMatrixCol: 8,
  };

  // =========================================================================
  // DOM REFERENCES
  // =========================================================================
  // Navigation & Controls
  const btnNavLogo = document.getElementById('btn-nav-logo');
  const btnBgmToggle = document.getElementById('btn-bgm-toggle');
  const bgmIconWrapper = document.getElementById('bgm-icon-wrapper');
  const btnSpeechToggle = document.getElementById('btn-speech-toggle');
  const speechIconWrapper = document.getElementById('speech-icon-wrapper');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIconWrapper = document.getElementById('sound-icon-wrapper');
  const btnSoundToggleMobile = document.getElementById('btn-sound-toggle-mobile');
  const soundIconMobileWrapper = document.getElementById('sound-icon-mobile-wrapper');
  const btnStatsModal = document.getElementById('btn-stats-modal');
  const btnMatrixToggle = document.getElementById('btn-matrix-toggle');
  const btnMobileMenu = document.getElementById('btn-mobile-menu');
  const modalMobileMenu = document.getElementById('modal-mobile-menu');
  const btnCloseMobileMenu = document.getElementById('btn-close-mobile-menu');
  const navPlayerLevel = document.getElementById('nav-player-level');
  const navPlayerTitle = document.getElementById('nav-player-title');
  const navPlayerIcon = document.getElementById('nav-player-icon');
  const navXPBar = document.getElementById('nav-xp-bar');
  const navXPText = document.getElementById('nav-xp-text');

  // Mobile Menu Items
  const btnMenuMatrix = document.getElementById('btn-menu-matrix');
  const btnMenuStats = document.getElementById('btn-menu-stats');
  const btnMenuBgm = document.getElementById('btn-menu-bgm');
  const menuBgmIconWrapper = document.getElementById('menu-bgm-icon-wrapper');
  const menuBgmStatus = document.getElementById('menu-bgm-status');
  const btnMenuSpeech = document.getElementById('btn-menu-speech');
  const menuSpeechIconWrapper = document.getElementById('menu-speech-icon-wrapper');
  const menuSpeechStatus = document.getElementById('menu-speech-status');
  const btnMenuReset = document.getElementById('btn-menu-reset');

  // Views
  const viewLobby = document.getElementById('view-lobby');
  const viewQuiz = document.getElementById('view-quiz');
  const viewBoss = document.getElementById('view-boss');
  const viewFlashcards = document.getElementById('view-flashcards');
  const viewResults = document.getElementById('view-results');

  // Lobby Elements
  const lobbyStatStreak = document.getElementById('lobby-stat-streak');
  const lobbyStatAccuracy = document.getElementById('lobby-stat-accuracy');
  const lobbyStatBlitz = document.getElementById('lobby-stat-blitz');
  const lobbyStatBoss = document.getElementById('lobby-stat-boss');
  const lobbyMistakesAlert = document.getElementById('lobby-mistakes-alert');
  const lobbyMistakesCount = document.getElementById('lobby-mistakes-count');
  const btnDrillMistakes = document.getElementById('btn-drill-mistakes');
  const btnClearMistakes = document.getElementById('btn-clear-mistakes');
  const modeCards = document.querySelectorAll('.mode-card');
  const durationBtns = document.querySelectorAll('.duration-btn');
  const opBtns = document.querySelectorAll('.op-btn');
  const diffBtns = document.querySelectorAll('.diff-btn');
  const customTablesWrapper = document.getElementById('custom-tables-wrapper');
  const tableChipsContainer = document.getElementById('table-chips-container');
  const tablePresetBtns = document.querySelectorAll('.table-preset-btn');
  const inputStyleChoice = document.getElementById('input-style-choice');
  const inputStyleDirect = document.getElementById('input-style-direct');
  const btnStartGame = document.getElementById('btn-start-game');

  // Quiz Arena Elements
  const quizFeverWrapper = document.getElementById('quiz-fever-wrapper');
  const quizStreakCount = document.getElementById('quiz-streak-count');
  const quizFlameIcon = document.getElementById('quiz-flame-icon');
  const quizMultiplierBadge = document.getElementById('quiz-multiplier-badge');
  const hudTimerContainer = document.getElementById('hud-timer-container');
  const hudTimerVal = document.getElementById('hud-timer-val');
  const hudHeartsContainer = document.getElementById('hud-hearts-container');
  const hudScoreVal = document.getElementById('hud-score-val');
  const btnQuizExit = document.getElementById('btn-quiz-exit');
  const quizCard = document.getElementById('quiz-card');
  const quizOpSymbol = document.getElementById('quiz-op-symbol');
  const quizOpTitle = document.getElementById('quiz-op-title');
  const btnQuizSpeak = document.getElementById('btn-quiz-speak');
  const quizEquationText = document.getElementById('quiz-equation-text');
  const quizHintText = document.getElementById('quiz-hint-text');
  const quizVisualArrayWrapper = document.getElementById('quiz-visual-array-wrapper');
  const quizVisualLabel = document.getElementById('quiz-visual-label');
  const quizVisualDots = document.getElementById('quiz-visual-dots');
  const quizFloatingContainer = document.getElementById('quiz-floating-container');
  const inputContainerChoice = document.getElementById('input-container-choice');
  const choiceBtns = document.querySelectorAll('.choice-btn');
  const inputContainerDirect = document.getElementById('input-container-direct');
  const directDisplayVal = document.getElementById('direct-display-val');
  const numpadBtns = document.querySelectorAll('.numpad-btn');

  // Boss Battle Arena Elements
  const bossName = document.getElementById('boss-name');
  const bossTitleDesc = document.getElementById('boss-title-desc');
  const bossAvatarWrapper = document.getElementById('boss-avatar-wrapper');
  const bossAvatarIcon = document.getElementById('boss-avatar-icon');
  const bossHpText = document.getElementById('boss-hp-text');
  const bossHpBar = document.getElementById('boss-hp-bar');
  const playerHpText = document.getElementById('player-hp-text');
  const bossTurnTimer = document.getElementById('boss-turn-timer');
  const bossEquationText = document.getElementById('boss-equation-text');
  const bossCombatEffectsContainer = document.getElementById('boss-combat-effects-container');
  const btnBossExit = document.getElementById('btn-boss-exit');
  const bossChoiceBtns = document.querySelectorAll('.boss-choice-btn');

  // Flashcards Elements
  const fcProgressText = document.getElementById('fc-progress-text');
  const btnFcExit = document.getElementById('btn-fc-exit');
  const fcFlipCard = document.getElementById('fc-flip-card');
  const fcCardInner = document.getElementById('fc-card-inner');
  const fcFrontEquation = document.getElementById('fc-front-equation');
  const fcBackEquation = document.getElementById('fc-back-equation');
  const fcBackAnswer = document.getElementById('fc-back-answer');
  const fcBackHint = document.getElementById('fc-back-hint');
  const fcVisualDotsContainer = document.getElementById('fc-visual-dots-container');
  const btnFcLearning = document.getElementById('btn-fc-learning');
  const btnFcMastered = document.getElementById('btn-fc-mastered');

  // Results Arena Elements
  const resultsTitle = document.getElementById('results-title');
  const resultsSubtitle = document.getElementById('results-subtitle');
  const resultsScore = document.getElementById('results-score');
  const resultsStreak = document.getElementById('results-streak');
  const resultsAccuracy = document.getElementById('results-accuracy');
  const resultsXP = document.getElementById('results-xp');
  const resultsLevelUpBanner = document.getElementById('results-levelup-banner');
  const resultsLevelUpNum = document.getElementById('results-levelup-num');
  const resultsMistakesContainer = document.getElementById('results-mistakes-container');
  const resultsMistakesList = document.getElementById('results-mistakes-list');
  const btnResultsDrill = document.getElementById('btn-results-drill');
  const btnResultsReplay = document.getElementById('btn-results-replay');
  const btnResultsLobby = document.getElementById('btn-results-lobby');

  // 12x12 Matrix Modal Elements
  const modalMatrix = document.getElementById('modal-matrix');
  const btnCloseMatrix = document.getElementById('btn-close-matrix');
  const btnMatrixCloseAction = document.getElementById('btn-matrix-close-action');
  const matrixTabBtns = document.querySelectorAll('.matrix-tab-btn');
  const matrixGridContainer = document.getElementById('matrix-grid-container');
  const matrixInfoFactors = document.getElementById('matrix-info-factors');
  const matrixInfoProduct = document.getElementById('matrix-info-product');
  const matrixInfoStatus = document.getElementById('matrix-info-status');
  const btnMatrixDrillRow = document.getElementById('btn-matrix-drill-row');

  // Career Stats Modal Elements
  const modalStats = document.getElementById('modal-stats');
  const btnCloseStats = document.getElementById('btn-close-stats');
  const btnModalCloseAction = document.getElementById('btn-modal-close-action');
  const modalLevelIcon = document.getElementById('modal-level-icon');
  const modalLevelTitle = document.getElementById('modal-level-title');
  const modalLevelNum = document.getElementById('modal-level-num');
  const modalXPBar = document.getElementById('modal-xp-bar');
  const modalXPNeeded = document.getElementById('modal-xp-needed');
  const statTotalAnswered = document.getElementById('stat-total-answered');
  const statAccuracyRate = document.getElementById('stat-accuracy-rate');
  const statHighestStreak = document.getElementById('stat-highest-streak');
  const statBossDefeated = document.getElementById('stat-boss-defeated');
  const recordBlitz30 = document.getElementById('record-blitz-30');
  const recordBlitz60 = document.getElementById('record-blitz-60');
  const recordBlitz120 = document.getElementById('record-blitz-120');
  const btnResetData = document.getElementById('btn-reset-data');

  // =========================================================================
  // INITIALIZATION & UI SYNC
  // =========================================================================
  function init() {
    renderTableChips();
    updateAudioIcons();
    syncPlayerHUD();
    syncLobbyStats();
    buildMatrixGrid();
    setupTouchSwipeGestures();
    attachEventListeners();
  }

  // Vector SVG Icon Definitions for Reactive Controls
  const SVG_ICONS = {
    soundOn: `<svg class="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    soundOff: `<svg class="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>`,
    bgmOn: `<svg class="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    bgmOff: `<svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M9 18V5l12-2v7"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    speechOn: `<svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>`,
    speechOff: `<svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  };

  function updateAudioIcons() {
    const isMuted = SoundEngine.isMuted();
    const soundHtml = isMuted ? SVG_ICONS.soundOff : SVG_ICONS.soundOn;
    if (soundIconWrapper) soundIconWrapper.innerHTML = soundHtml;
    if (soundIconMobileWrapper) soundIconMobileWrapper.innerHTML = soundHtml;

    const isBgmMuted = SoundEngine.isBgmMuted();
    const bgmHtml = isBgmMuted ? SVG_ICONS.bgmOff : SVG_ICONS.bgmOn;
    if (bgmIconWrapper) bgmIconWrapper.innerHTML = bgmHtml;
    if (menuBgmIconWrapper) menuBgmIconWrapper.innerHTML = bgmHtml;
    if (menuBgmStatus) menuBgmStatus.textContent = isBgmMuted ? 'Off' : 'Active';

    const isSpeech = SoundEngine.isSpeechEnabled();
    const speechHtml = isSpeech ? SVG_ICONS.speechOn : SVG_ICONS.speechOff;
    if (speechIconWrapper) speechIconWrapper.innerHTML = speechHtml;
    if (menuSpeechIconWrapper) menuSpeechIconWrapper.innerHTML = speechHtml;
    if (menuSpeechStatus) menuSpeechStatus.textContent = isSpeech ? 'Active' : 'Off';
  }

  function syncPlayerHUD() {
    const data = StorageManager.getData();
    const info = StorageManager.getLevelInfo(data.xp);

    navPlayerLevel.textContent = `Lvl ${info.level}`;
    if (navPlayerTitle) navPlayerTitle.textContent = info.title;
    if (navPlayerIcon) navPlayerIcon.innerHTML = info.icon;
    navXPBar.style.width = `${info.progressPercent}%`;
    navXPText.textContent = `${info.xp} XP`;
  }

  function syncLobbyStats() {
    const stats = StorageManager.getStats();
    lobbyStatStreak.textContent = stats.highestStreak;
    lobbyStatAccuracy.textContent = `${stats.accuracy}%`;
    lobbyStatBlitz.textContent = stats.highScores.blitz_30 || stats.highScores.blitz_60 || 0;
    lobbyStatBoss.textContent = stats.bossStats ? stats.bossStats.totalBeaten : 0;

    const mistakes = StorageManager.getMistakes();
    if (mistakes.length > 0) {
      lobbyMistakesAlert.classList.remove('hidden');
      lobbyMistakesCount.textContent = mistakes.length;
    } else {
      lobbyMistakesAlert.classList.add('hidden');
    }
  }

  function renderTableChips() {
    tableChipsContainer.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `table-chip py-2 px-1.5 rounded-xl text-xs font-bold font-mono transition-all border active:scale-95 ${
        state.customTables.includes(i)
          ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
      }`;
      chip.textContent = `${i}×`;
      chip.dataset.table = i;

      chip.addEventListener('click', () => {
        SoundEngine.playClick();
        const num = parseInt(chip.dataset.table, 10);
        if (state.customTables.includes(num)) {
          if (state.customTables.length > 1) {
            state.customTables = state.customTables.filter(n => n !== num);
          }
        } else {
          state.customTables.push(num);
          state.customTables.sort((a, b) => a - b);
        }
        renderTableChips();
      });

      tableChipsContainer.appendChild(chip);
    }
  }

  // =========================================================================
  // VIEW SWITCHING
  // =========================================================================
  function showView(viewId) {
    [viewLobby, viewQuiz, viewBoss, viewFlashcards, viewResults].forEach(el => {
      el.classList.add('hidden');
    });

    const target = document.getElementById(viewId);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo(0, 0); // Reset scroll on view change
    }

    if (viewId === 'view-lobby') {
      disableFeverMode();
      syncPlayerHUD();
      syncLobbyStats();
    }
  }

  // =========================================================================
  // GAME LAUNCHER
  // =========================================================================
  function startGame(customMode = null) {
    if (customMode) {
      state.mode = customMode;
    }

    state.score = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.correctCount = 0;
    state.totalCount = 0;
    state.hearts = 3;
    state.roundMistakes = [];
    state.isEvaluating = false;
    state.directInputVal = '';
    disableFeverMode();

    if (state.mode === 'boss') {
      startBossBattle();
    } else if (state.mode === 'flashcards') {
      startFlashcards();
    } else {
      startQuiz();
    }
  }

  // =========================================================================
  // FEVER MODE CONTROLLER
  // =========================================================================
  function checkFeverMode() {
    if (state.streak >= 5 && !state.isFeverActive) {
      state.isFeverActive = true;
      quizFeverWrapper.classList.add('fever-active');
      SoundEngine.playFever();
      SoundEngine.setFeverMode(true);
      Confetti.burst(40);
      spawnFloatingXP('🔥 FEVER MODE! (3.5x pts)');
    } else if (state.streak < 5 && state.isFeverActive) {
      disableFeverMode();
    }
  }

  function disableFeverMode() {
    state.isFeverActive = false;
    if (quizFeverWrapper) {
      quizFeverWrapper.classList.remove('fever-active');
    }
    SoundEngine.setFeverMode(false);
  }

  // =========================================================================
  // VISUAL DOT ARRAY (AREA MODEL) RENDERER
  // =========================================================================
  function renderVisualDotGrid(container, num1, num2) {
    container.innerHTML = '';
    const arrayInfo = MathEngine.generateVisualArray(num1, num2);

    for (let r = 0; r < arrayInfo.rows; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'flex gap-1 items-center justify-center';

      for (let c = 0; c < arrayInfo.cols; c++) {
        const dot = document.createElement('div');
        dot.className = 'array-dot cursor-pointer';
        dot.title = `Row ${r + 1}, Col ${c + 1}`;
        dot.addEventListener('mouseenter', () => SoundEngine.playClick());
        rowDiv.appendChild(dot);
      }
      container.appendChild(rowDiv);
    }
  }

  // =========================================================================
  // QUIZ ENGINE (Speed Blitz & Survival)
  // =========================================================================
  function startQuiz() {
    showView('view-quiz');

    if (state.mode === 'blitz') {
      hudTimerContainer.classList.remove('hidden');
      hudHeartsContainer.classList.add('hidden');
      state.timeLeft = state.blitzDuration;
      hudTimerVal.textContent = state.timeLeft;
      startBlitzTimer();
    } else if (state.mode === 'survival') {
      hudTimerContainer.classList.add('hidden');
      hudHeartsContainer.classList.remove('hidden');
      renderHearts();
    } else if (state.mode === 'mistake_drill') {
      hudTimerContainer.classList.add('hidden');
      hudHeartsContainer.classList.add('hidden');
    }

    updateScoreDisplay();
    updateStreakDisplay();
    setupInputLayout();
    loadNextProblem();
  }

  function setupInputLayout() {
    if (state.inputStyle === 'choice') {
      inputContainerChoice.classList.remove('hidden');
      inputContainerDirect.classList.add('hidden');
    } else {
      inputContainerChoice.classList.add('hidden');
      inputContainerDirect.classList.remove('hidden');
      updateDirectInputDisplay();
    }
  }

  function startBlitzTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      hudTimerVal.textContent = state.timeLeft;

      if (state.timeLeft <= 5 && state.timeLeft > 0) {
        SoundEngine.playTick();
        hudTimerVal.classList.add('text-rose-400');
      }

      if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        endGame('Time Up!');
      }
    }, 1000);
  }

  function renderHearts() {
    hudHeartsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const isAlive = i < state.hearts;
      const span = document.createElement('span');
      span.className = isAlive ? 'text-rose-500' : 'text-slate-700 opacity-40';
      span.innerHTML = `<svg class="w-4 h-4 sm:w-5 sm:h-5 ${isAlive ? 'fill-rose-500' : ''}" viewBox="0 0 24 24" fill="${isAlive ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
      hudHeartsContainer.appendChild(span);
    }
  }

  function loadNextProblem() {
    state.isEvaluating = false;
    state.directInputVal = '';
    updateDirectInputDisplay();

    if (state.mode === 'mistake_drill') {
      const mistakes = StorageManager.getMistakes();
      if (mistakes.length === 0) {
        endGame('Mistakes Mastered!');
        return;
      }
      const m = mistakes[0];
      state.currentProblem = {
        ...m,
        options: MathEngine.generateProblem({
          operation: m.operation,
          difficulty: state.difficulty,
        }).options,
      };
      if (!state.currentProblem.options.includes(m.answer)) {
        state.currentProblem.options[0] = m.answer;
        state.currentProblem.options.sort(() => Math.random() - 0.5);
      }
    } else {
      state.currentProblem = MathEngine.generateProblem({
        operation: state.operation,
        difficulty: state.difficulty,
        customTables: state.operation === 'multiply' ? state.customTables : [],
      });
    }

    quizOpSymbol.textContent = state.currentProblem.symbol;
    quizOpTitle.textContent = capitalize(state.currentProblem.operation);
    quizEquationText.textContent = state.currentProblem.equation;
    quizHintText.textContent = '';

    if (SoundEngine.isSpeechEnabled()) {
      SoundEngine.speakEquation(state.currentProblem.num1, state.currentProblem.operation, state.currentProblem.num2);
    }

    if (state.currentProblem.operation === 'multiply' && state.currentProblem.num1 <= 12 && state.currentProblem.num2 <= 12) {
      quizVisualArrayWrapper.classList.remove('hidden');
      quizVisualLabel.classList.remove('text-emerald-400', 'text-rose-400');
      quizVisualLabel.textContent = `${state.currentProblem.num1} × ${state.currentProblem.num2} = ?`;
      renderVisualDotGrid(quizVisualDots, state.currentProblem.num1, state.currentProblem.num2);
    } else {
      quizVisualArrayWrapper.classList.add('hidden');
    }

    if (state.inputStyle === 'choice') {
      choiceBtns.forEach((btn, index) => {
        const val = state.currentProblem.options[index];
        const valSpan = btn.querySelector('.choice-val');
        valSpan.textContent = val !== undefined ? val : '';
        btn.dataset.answer = val;
      });
    }
  }

  function handleAnswerSubmit(playerAnswer) {
    if (state.isEvaluating || !state.currentProblem) return;
    state.isEvaluating = true;
    state.totalCount++;

    const isCorrect = Number(playerAnswer) === state.currentProblem.answer;

    if (state.currentProblem.operation === 'multiply') {
      StorageManager.recordMatrixAttempt(state.currentProblem.num1, state.currentProblem.num2, isCorrect);
    }

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  }

  function handleCorrectAnswer() {
    state.correctCount++;
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);

    checkFeverMode();

    const multiplier = getMultiplier(state.streak);
    const basePoints = state.difficulty === 'hard' ? 25 : state.difficulty === 'medium' ? 15 : 10;
    const gainedScore = Math.round(basePoints * multiplier);
    state.score += gainedScore;

    const earnedXP = Math.round(5 * multiplier);
    StorageManager.addXP(earnedXP);

    if (state.streak >= 3) {
      SoundEngine.playStreak(state.streak);
      if (state.streak % 5 === 0) {
        Confetti.burst(35);
      }
    } else {
      SoundEngine.playCorrect();
    }

    spawnFloatingXP(`+${gainedScore} pts! ${multiplier > 1 ? `(${multiplier}x)` : ''}`);

    // Reveal answer on visual area model if active
    if (state.currentProblem.operation === 'multiply') {
      quizVisualLabel.textContent = `${state.currentProblem.num1} × ${state.currentProblem.num2} = ${state.currentProblem.answer} ✓`;
      quizVisualLabel.classList.add('text-emerald-400');
    }

    quizCard.classList.remove('animate-shake');
    quizCard.classList.add('animate-correct');
    setTimeout(() => quizCard.classList.remove('animate-correct'), 320);

    if (state.mode === 'mistake_drill') {
      StorageManager.removeMistake(state.currentProblem.equation);
    }

    updateScoreDisplay();
    updateStreakDisplay();
    syncPlayerHUD();

    setTimeout(loadNextProblem, 320);
  }

  function handleIncorrectAnswer() {
    state.streak = 0;
    disableFeverMode();
    updateStreakDisplay();
    SoundEngine.playWrong();

    StorageManager.recordMistake(state.currentProblem);
    state.roundMistakes.push({ ...state.currentProblem });

    // Reveal answer on visual area model if active
    if (state.currentProblem.operation === 'multiply') {
      quizVisualLabel.textContent = `${state.currentProblem.num1} × ${state.currentProblem.num2} = ${state.currentProblem.answer}`;
      quizVisualLabel.classList.add('text-rose-400');
    }

    if (state.currentProblem.hint) {
      quizHintText.textContent = `💡 Hint: ${state.currentProblem.hint}`;
    }

    quizCard.classList.remove('animate-correct');
    quizCard.classList.add('animate-shake');
    setTimeout(() => quizCard.classList.remove('animate-shake'), 400);

    if (state.mode === 'survival') {
      state.hearts--;
      renderHearts();
      if (state.hearts <= 0) {
        setTimeout(() => endGame('Out of Lives!'), 500);
        return;
      }
    }

    setTimeout(loadNextProblem, 900);
  }

  function getMultiplier(streak) {
    if (state.isFeverActive) return 3.5;
    if (streak >= 10) return 3.0;
    if (streak >= 6) return 2.0;
    if (streak >= 3) return 1.5;
    return 1.0;
  }

  function updateScoreDisplay() {
    hudScoreVal.textContent = state.score;
  }

  function updateStreakDisplay() {
    quizStreakCount.textContent = state.streak;
    const mult = getMultiplier(state.streak);

    if (mult > 1) {
      quizMultiplierBadge.classList.remove('hidden');
      quizMultiplierBadge.textContent = `x${mult}`;
    } else {
      quizMultiplierBadge.classList.add('hidden');
    }

    if (state.streak >= 3) {
      quizFlameIcon.classList.add('animate-flame');
      quizStreakCount.classList.add('text-orange-400');
    } else {
      quizFlameIcon.classList.remove('animate-flame');
      quizStreakCount.classList.remove('text-orange-400');
      quizStreakCount.classList.add('text-amber-400');
    }
  }

  function spawnFloatingXP(text) {
    const badge = document.createElement('div');
    badge.className = 'floating-xp-badge px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/50';
    badge.textContent = text;
    quizFloatingContainer.appendChild(badge);
    setTimeout(() => badge.remove(), 1100);
  }

  function updateDirectInputDisplay() {
    directDisplayVal.textContent = state.directInputVal !== '' ? state.directInputVal : '_';
  }

  // =========================================================================
  // RPG BOSS BATTLE CONTROLLER
  // =========================================================================
  function startBossBattle() {
    showView('view-boss');

    const bossIndex = state.difficulty === 'hard' ? 2 : state.difficulty === 'medium' ? 1 : 0;
    state.currentBoss = MathEngine.getBoss(bossIndex);

    state.bossMaxHp = state.currentBoss.maxHp;
    state.bossHp = state.bossMaxHp;
    state.playerMaxHp = 100;
    state.playerHp = 100;
    state.bossTurnTime = 12;

    bossName.textContent = state.currentBoss.name;
    if (bossTitleDesc) bossTitleDesc.textContent = state.currentBoss.title;
    if (bossAvatarIcon) bossAvatarIcon.innerHTML = state.currentBoss.svg;

    syncBossHUD();
    startBossTurnTimer();
    loadNextBossProblem();
  }

  function syncBossHUD() {
    bossHpText.textContent = `${Math.max(0, state.bossHp)} / ${state.bossMaxHp}`;
    const bossPercent = Math.max(0, Math.floor((state.bossHp / state.bossMaxHp) * 100));
    bossHpBar.style.width = `${bossPercent}%`;

    playerHpText.textContent = `YOU: ${Math.max(0, state.playerHp)} HP`;
    bossTurnTimer.textContent = `${state.bossTurnTime}s`;
  }

  function startBossTurnTimer() {
    clearInterval(state.bossTimerInterval);
    state.bossTurnTime = 12;
    bossTurnTimer.textContent = `${state.bossTurnTime}s`;
    bossTurnTimer.classList.remove('text-rose-400');

    state.bossTimerInterval = setInterval(() => {
      state.bossTurnTime--;
      bossTurnTimer.textContent = `${state.bossTurnTime}s`;

      if (state.bossTurnTime <= 4) {
        SoundEngine.playTick();
        bossTurnTimer.classList.add('text-rose-400');
      }

      if (state.bossTurnTime <= 0) {
        clearInterval(state.bossTimerInterval);
        handleBossRetaliation("Time expired! The boss strikes!");
      }
    }, 1000);
  }

  function loadNextBossProblem() {
    state.isEvaluating = false;
    state.currentProblem = MathEngine.generateProblem({
      operation: state.operation,
      difficulty: state.difficulty,
      customTables: state.operation === 'multiply' ? state.customTables : [],
    });

    bossEquationText.textContent = state.currentProblem.equation;

    if (SoundEngine.isSpeechEnabled()) {
      SoundEngine.speakEquation(state.currentProblem.num1, state.currentProblem.operation, state.currentProblem.num2);
    }

    bossChoiceBtns.forEach((btn, index) => {
      const val = state.currentProblem.options[index];
      const valSpan = btn.querySelector('.choice-val');
      valSpan.textContent = val !== undefined ? val : '';
      btn.dataset.answer = val;
    });
  }

  function handleBossAnswerSubmit(playerAnswer) {
    if (state.isEvaluating) return;
    state.isEvaluating = true;
    state.totalCount++;

    const isCorrect = Number(playerAnswer) === state.currentProblem.answer;

    if (isCorrect) {
      handlePlayerBossAttack();
    } else {
      handleBossRetaliation("Incorrect! The boss counter-attacks!");
    }
  }

  function handlePlayerBossAttack() {
    clearInterval(state.bossTimerInterval);
    state.correctCount++;
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);

    SoundEngine.playSlash();
    SoundEngine.playBossHit();

    const slash = document.createElement('div');
    slash.className = 'slash-effect';
    bossAvatarWrapper.appendChild(slash);
    setTimeout(() => slash.remove(), 350);

    bossAvatarWrapper.classList.remove('boss-idle');
    bossAvatarWrapper.classList.add('boss-hit');
    setTimeout(() => {
      bossAvatarWrapper.classList.remove('boss-hit');
      bossAvatarWrapper.classList.add('boss-idle');
    }, 450);

    const multiplier = state.streak >= 3 ? 1.5 : 1.0;
    const damage = Math.round(25 * multiplier);
    state.bossHp -= damage;
    state.score += damage * 2;

    spawnDamageNumber(`-${damage} HP!`, '#ef4444');
    syncBossHUD();

    if (state.bossHp <= 0) {
      SoundEngine.playLevelUp();
      Confetti.cannon();
      StorageManager.recordBossDefeated(state.currentBoss.id);
      StorageManager.addXP(60);
      setTimeout(() => endGame(`Defeated ${state.currentBoss.name}!`), 750);
    } else {
      setTimeout(() => {
        startBossTurnTimer();
        loadNextBossProblem();
      }, 450);
    }
  }

  function handleBossRetaliation(message) {
    clearInterval(state.bossTimerInterval);
    state.streak = 0;
    SoundEngine.playBossAttack();

    const attackDamage = state.currentBoss.attackPower;
    state.playerHp -= attackDamage;

    spawnDamageNumber(`-${attackDamage} HP!`, '#f87171');

    document.body.classList.add('animate-shake');
    setTimeout(() => document.body.classList.remove('animate-shake'), 350);

    syncBossHUD();

    if (state.playerHp <= 0) {
      SoundEngine.playGameOver();
      setTimeout(() => endGame(`${state.currentBoss.name} defeated you!`), 600);
    } else {
      setTimeout(() => {
        startBossTurnTimer();
        loadNextBossProblem();
      }, 750);
    }
  }

  function spawnDamageNumber(text, color = '#ef4444') {
    const el = document.createElement('div');
    el.className = 'damage-number text-xl sm:text-3xl font-black drop-shadow-md';
    el.style.color = color;
    el.textContent = text;
    bossCombatEffectsContainer.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  // =========================================================================
  // FLASHCARDS STUDY ENGINE & TOUCH SWIPES
  // =========================================================================
  function startFlashcards() {
    showView('view-flashcards');
    state.isCardFlipped = false;
    fcCardInner.classList.remove('flipped');

    state.flashcardDeck = MathEngine.generateDeck({
      operation: state.operation,
      difficulty: state.difficulty,
      customTables: state.operation === 'multiply' ? state.customTables : [],
      count: 15,
    });
    state.flashcardIndex = 0;

    renderCurrentFlashcard();
  }

  function renderCurrentFlashcard() {
    state.isCardFlipped = false;
    fcCardInner.className = 'card-inner relative w-full h-full transform-style-3d min-h-[300px] sm:min-h-[360px]';

    const card = state.flashcardDeck[state.flashcardIndex];
    if (!card) {
      endGame('Flashcard Deck Finished!');
      return;
    }

    fcProgressText.textContent = `Card ${state.flashcardIndex + 1} of ${state.flashcardDeck.length}`;
    fcFrontEquation.textContent = card.equation;
    fcBackEquation.textContent = `${card.equation} =`;
    fcBackAnswer.textContent = card.answer;
    fcBackHint.textContent = card.hint || `${card.num1} ${card.symbol} ${card.num2} equals ${card.answer}`;

    if (card.operation === 'multiply' && card.num1 <= 12 && card.num2 <= 12) {
      fcVisualDotsContainer.classList.remove('hidden');
      renderVisualDotGrid(fcVisualDotsContainer, card.num1, card.num2);
    } else {
      fcVisualDotsContainer.classList.add('hidden');
    }

    if (SoundEngine.isSpeechEnabled()) {
      SoundEngine.speakEquation(card.num1, card.operation, card.num2);
    }
  }

  function toggleFlipCard() {
    SoundEngine.playFlip();
    state.isCardFlipped = !state.isCardFlipped;
    if (state.isCardFlipped) {
      fcCardInner.classList.add('flipped');
    } else {
      fcCardInner.classList.remove('flipped');
    }
  }

  function nextFlashcard(wasMastered) {
    const card = state.flashcardDeck[state.flashcardIndex];
    if (wasMastered) {
      SoundEngine.playCorrect();
      StorageManager.incrementMasteredCards(1);
      StorageManager.addXP(4);
    } else {
      SoundEngine.playClick();
      StorageManager.recordMistake(card);
    }

    // Swipe animation class
    const animClass = wasMastered ? 'card-swipe-right' : 'card-swipe-left';
    fcCardInner.classList.add(animClass);

    setTimeout(() => {
      state.flashcardIndex++;
      if (state.flashcardIndex >= state.flashcardDeck.length) {
        Confetti.cannon();
        endGame('Flashcards Completed!');
      } else {
        renderCurrentFlashcard();
      }
    }, 280);
  }

  // Setup mobile touch gestures on flashcards (Swipe left: learning, Swipe right: mastered, Tap: flip)
  function setupTouchSwipeGestures() {
    fcFlipCard.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      state.touchStartX = touch.clientX;
      state.touchStartY = touch.clientY;
      state.touchDeltaX = 0;
      state.touchDeltaY = 0;
      state.isSwiping = false;
    }, { passive: true });

    fcFlipCard.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      state.touchDeltaX = touch.clientX - state.touchStartX;
      state.touchDeltaY = touch.clientY - state.touchStartY;

      // Detect if user is swiping horizontally
      if (Math.abs(state.touchDeltaX) > 20 && Math.abs(state.touchDeltaX) > Math.abs(state.touchDeltaY)) {
        state.isSwiping = true;
      }
    }, { passive: true });

    fcFlipCard.addEventListener('touchend', () => {
      if (state.isSwiping) {
        if (state.touchDeltaX > 55) {
          // Swiped right -> Mastered
          nextFlashcard(true);
        } else if (state.touchDeltaX < -55) {
          // Swiped left -> Learning
          nextFlashcard(false);
        }
      } else if (Math.abs(state.touchDeltaX) < 15 && Math.abs(state.touchDeltaY) < 15) {
        // Simple tap -> Flip card
        toggleFlipCard();
      }
    });

    // Also allow mouse click for desktop
    fcFlipCard.addEventListener('click', (e) => {
      // Only flip on click if not triggered by touch
      if (!('ontouchstart' in window)) {
        toggleFlipCard();
      }
    });
  }

  // =========================================================================
  // 12x12 MULTIPLICATION MATRIX EXPLORER (SEGMENTED ON MOBILE)
  // =========================================================================
  function buildMatrixGrid() {
    matrixGridContainer.innerHTML = '';
    const matrixStats = StorageManager.getMatrixStats();

    let startCol = 1;
    let endCol = 12;

    if (state.matrixTab === '1-6') {
      startCol = 1;
      endCol = 6;
      matrixGridContainer.className = 'grid grid-cols-7 gap-1 min-w-[280px]';
    } else if (state.matrixTab === '7-12') {
      startCol = 7;
      endCol = 12;
      matrixGridContainer.className = 'grid grid-cols-7 gap-1 min-w-[280px]';
    } else {
      startCol = 1;
      endCol = 12;
      matrixGridContainer.className = 'grid grid-cols-13 gap-1 min-w-[340px]';
    }

    // Corner symbol
    const corner = document.createElement('div');
    corner.className = 'matrix-cell bg-slate-900 text-indigo-400 font-black text-xs border border-slate-800';
    corner.textContent = '×';
    matrixGridContainer.appendChild(corner);

    // Column Headers
    for (let c = startCol; c <= endCol; c++) {
      const colHeader = document.createElement('div');
      colHeader.className = 'matrix-cell bg-slate-800/90 text-indigo-300 font-bold border border-slate-700/80';
      colHeader.textContent = c;
      colHeader.dataset.col = c;
      matrixGridContainer.appendChild(colHeader);
    }

    // Grid Rows
    for (let r = 1; r <= 12; r++) {
      const rowHeader = document.createElement('div');
      rowHeader.className = 'matrix-cell bg-slate-800/90 text-indigo-300 font-bold border border-slate-700/80';
      rowHeader.textContent = r;
      rowHeader.dataset.row = r;
      matrixGridContainer.appendChild(rowHeader);

      for (let c = startCol; c <= endCol; c++) {
        const product = r * c;
        const cell = document.createElement('div');
        const key = `${Math.min(r, c)}x${Math.max(r, c)}`;
        const stat = matrixStats[key];

        let masteryClass = 'untested';
        if (stat && stat.attempts > 0) {
          const acc = stat.correct / stat.attempts;
          if (acc >= 0.8 && stat.attempts >= 2) masteryClass = 'mastered';
          else if (acc >= 0.5) masteryClass = 'learning';
          else masteryClass = 'struggling';
        }

        cell.className = `matrix-cell ${masteryClass}`;
        cell.textContent = product;
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.dataset.product = product;

        cell.addEventListener('mouseenter', () => highlightMatrixCrosshair(r, c));
        cell.addEventListener('click', () => {
          SoundEngine.playClick();
          selectMatrixCell(r, c, product, stat);
        });

        matrixGridContainer.appendChild(cell);
      }
    }

    selectMatrixCell(state.selectedMatrixRow, state.selectedMatrixCol, state.selectedMatrixRow * state.selectedMatrixCol, matrixStats[`${Math.min(state.selectedMatrixRow, state.selectedMatrixCol)}x${Math.max(state.selectedMatrixRow, state.selectedMatrixCol)}`]);
  }

  function highlightMatrixCrosshair(row, col) {
    document.querySelectorAll('.matrix-cell').forEach(el => el.classList.remove('crosshair'));
    document.querySelectorAll(`.matrix-cell[data-row="${row}"]`).forEach(el => el.classList.add('crosshair'));
    document.querySelectorAll(`.matrix-cell[data-col="${col}"]`).forEach(el => el.classList.add('crosshair'));
  }

  function selectMatrixCell(row, col, product, stat) {
    state.selectedMatrixRow = row;
    state.selectedMatrixCol = col;

    matrixInfoFactors.textContent = `${row} × ${col}`;
    matrixInfoProduct.textContent = `= ${product}`;

    if (stat && stat.attempts > 0) {
      const pct = Math.round((stat.correct / stat.attempts) * 100);
      matrixInfoStatus.textContent = `${pct}% accuracy (${stat.correct}/${stat.attempts})`;
    } else {
      matrixInfoStatus.textContent = 'Untested';
    }

    btnMatrixDrillRow.textContent = `⚡ Table of ${row}`;
  }

  function openMatrixModal() {
    SoundEngine.playClick();
    buildMatrixGrid();
    modalMatrix.classList.remove('hidden');
  }

  function closeMatrixModal() {
    modalMatrix.classList.add('hidden');
  }

  // =========================================================================
  // GAME END & RESULTS CONTROLLER
  // =========================================================================
  function endGame(title = 'Quest Complete!') {
    clearInterval(state.timerInterval);
    clearInterval(state.bossTimerInterval);
    disableFeverMode();

    showView('view-results');
    resultsTitle.textContent = title;

    const accuracy = state.totalCount > 0 ? Math.round((state.correctCount / state.totalCount) * 100) : 100;
    const gainedXP = Math.round(state.score / 2);

    const outcome = StorageManager.recordGameResult({
      mode: state.mode,
      duration: state.blitzDuration,
      score: state.score,
      streak: state.maxStreak,
      correct: state.correctCount,
      total: state.totalCount,
    });

    resultsScore.textContent = state.score;
    resultsStreak.textContent = state.maxStreak;
    resultsAccuracy.textContent = `${accuracy}%`;
    resultsXP.textContent = `+${gainedXP} XP`;

    if (outcome.newHighScore && state.score > 0) {
      SoundEngine.playLevelUp();
      Confetti.cannon();
      resultsSubtitle.textContent = '🎉 Brand New High Score Record!';
    } else if (state.score > 0 || state.mode === 'flashcards') {
      SoundEngine.playLevelUp();
      Confetti.burst(30);
    } else {
      SoundEngine.playGameOver();
    }

    if (state.roundMistakes.length > 0) {
      resultsMistakesContainer.classList.remove('hidden');
      resultsMistakesList.innerHTML = '';
      state.roundMistakes.forEach(m => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700/60';
        item.innerHTML = `
          <span class="font-mono font-bold text-white">${m.equation}</span>
          <span class="font-mono font-bold text-emerald-400">= ${m.answer}</span>
        `;
        resultsMistakesList.appendChild(item);
      });
    } else {
      resultsMistakesContainer.classList.add('hidden');
    }

    syncPlayerHUD();
  }

  // =========================================================================
  // EVENT LISTENERS & INPUT HANDLING
  // =========================================================================
  function attachEventListeners() {
    // Sound FX Toggles (Desktop & Mobile)
    const handleSoundToggle = () => {
      SoundEngine.toggleMute();
      updateAudioIcons();
    };
    btnSoundToggle.addEventListener('click', handleSoundToggle);
    if (btnSoundToggleMobile) btnSoundToggleMobile.addEventListener('click', handleSoundToggle);

    // 8-Bit BGM Toggle
    btnBgmToggle.addEventListener('click', () => {
      SoundEngine.toggleBGM();
      updateAudioIcons();
    });

    // Speech Read-Aloud Toggle
    btnSpeechToggle.addEventListener('click', () => {
      SoundEngine.toggleSpeech();
      updateAudioIcons();
    });

    // Single Question Speech Button
    btnQuizSpeak.addEventListener('click', () => {
      if (state.currentProblem) {
        SoundEngine.speakEquation(state.currentProblem.num1, state.currentProblem.operation, state.currentProblem.num2);
      }
    });

    // Logo click returns to lobby
    btnNavLogo.addEventListener('click', () => {
      SoundEngine.playClick();
      clearInterval(state.timerInterval);
      clearInterval(state.bossTimerInterval);
      showView('view-lobby');
    });

    // Mobile Action Menu Drawer
    if (btnMobileMenu) {
      btnMobileMenu.addEventListener('click', () => {
        SoundEngine.playClick();
        updateAudioIcons();
        modalMobileMenu.classList.remove('hidden');
      });
    }
    if (btnCloseMobileMenu) {
      btnCloseMobileMenu.addEventListener('click', () => modalMobileMenu.classList.add('hidden'));
    }
    if (modalMobileMenu) {
      modalMobileMenu.addEventListener('click', (e) => {
        if (e.target === modalMobileMenu) modalMobileMenu.classList.add('hidden');
      });
    }

    // Drawer Tile Actions
    if (btnMenuMatrix) {
      btnMenuMatrix.addEventListener('click', () => {
        modalMobileMenu.classList.add('hidden');
        openMatrixModal();
      });
    }
    if (btnMenuStats) {
      btnMenuStats.addEventListener('click', () => {
        modalMobileMenu.classList.add('hidden');
        openStatsModal();
      });
    }
    if (btnMenuBgm) {
      btnMenuBgm.addEventListener('click', () => {
        SoundEngine.toggleBGM();
        updateAudioIcons();
      });
    }
    if (btnMenuSpeech) {
      btnMenuSpeech.addEventListener('click', () => {
        SoundEngine.toggleSpeech();
        updateAudioIcons();
      });
    }
    if (btnMenuReset) {
      btnMenuReset.addEventListener('click', () => {
        modalMobileMenu.classList.add('hidden');
        if (confirm('Are you sure you want to reset all progress data?')) {
          StorageManager.resetAll();
          syncPlayerHUD();
          syncLobbyStats();
          buildMatrixGrid();
        }
      });
    }

    // Matrix Tabs (1-6, 7-12, all)
    matrixTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        matrixTabBtns.forEach(b => {
          b.className = 'matrix-tab-btn flex-1 py-1.5 rounded-lg text-slate-400 active:scale-95 text-center';
        });
        btn.className = 'matrix-tab-btn flex-1 py-1.5 rounded-lg bg-indigo-600 text-white active:scale-95 text-center';
        state.matrixTab = btn.dataset.tab;
        buildMatrixGrid();
      });
    });

    // Times Table Quick Presets
    tablePresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        const preset = btn.dataset.preset;
        if (preset === '1-5') {
          state.customTables = [1, 2, 3, 4, 5];
        } else if (preset === '6-10') {
          state.customTables = [6, 7, 8, 9, 10];
        } else if (preset === 'all') {
          state.customTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        }
        renderTableChips();
      });
    });

    // Matrix Explorer Modal
    btnMatrixToggle.addEventListener('click', openMatrixModal);
    btnCloseMatrix.addEventListener('click', closeMatrixModal);
    btnMatrixCloseAction.addEventListener('click', closeMatrixModal);
    modalMatrix.addEventListener('click', (e) => {
      if (e.target === modalMatrix) closeMatrixModal();
    });

    // Matrix instant drill button
    btnMatrixDrillRow.addEventListener('click', () => {
      closeMatrixModal();
      state.operation = 'multiply';
      state.customTables = [state.selectedMatrixRow];
      renderTableChips();
      startGame('blitz');
    });

    // Stats Modal
    btnStatsModal.addEventListener('click', openStatsModal);
    btnCloseStats.addEventListener('click', closeStatsModal);
    btnModalCloseAction.addEventListener('click', closeStatsModal);
    modalStats.addEventListener('click', (e) => {
      if (e.target === modalStats) closeStatsModal();
    });

    // Mode Selector Cards
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        SoundEngine.playClick();
        modeCards.forEach(c => {
          c.classList.remove('border-indigo-500', 'border-purple-500', 'border-2');
          c.classList.add('border-slate-800', 'border');
        });
        const borderColor = card.dataset.mode === 'boss' ? 'border-purple-500' : 'border-indigo-500';
        card.classList.add(borderColor, 'border-2');
        card.classList.remove('border-slate-800', 'border');
        state.mode = card.dataset.mode;
      });
    });

    // Blitz Duration Buttons
    durationBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        SoundEngine.playClick();
        durationBtns.forEach(b => {
          b.className = 'duration-btn px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] sm:text-[11px]';
        });
        btn.className = 'duration-btn px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px] sm:text-[11px]';
        state.blitzDuration = parseInt(btn.dataset.duration, 10);
      });
    });

    // Operations Row
    opBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        opBtns.forEach(b => {
          b.className = 'op-btn py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95';
        });
        btn.className = 'op-btn py-2.5 px-3 rounded-xl border border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95';
        state.operation = btn.dataset.op;

        if (state.operation === 'multiply') {
          customTablesWrapper.classList.remove('hidden');
        } else {
          customTablesWrapper.classList.add('hidden');
        }
      });
    });

    // Difficulty Row
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        diffBtns.forEach(b => {
          b.className = 'diff-btn py-2 px-2.5 rounded-xl border border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white font-semibold text-xs transition-all active:scale-95 text-center';
        });
        btn.className = 'diff-btn py-2 px-2.5 rounded-xl border border-indigo-500 bg-indigo-600/20 text-indigo-300 font-semibold text-xs transition-all active:scale-95 text-center';
        state.difficulty = btn.dataset.diff;
      });
    });

    // Input Style Toggle
    inputStyleChoice.addEventListener('click', () => {
      SoundEngine.playClick();
      state.inputStyle = 'choice';
      inputStyleChoice.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white transition-all shadow-sm';
      inputStyleDirect.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all';
    });

    inputStyleDirect.addEventListener('click', () => {
      SoundEngine.playClick();
      state.inputStyle = 'direct';
      inputStyleDirect.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white transition-all shadow-sm';
      inputStyleChoice.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all';
    });

    // Start Button
    btnStartGame.addEventListener('click', () => {
      SoundEngine.playClick();
      startGame();
    });

    // Exit from Quiz
    btnQuizExit.addEventListener('click', () => {
      SoundEngine.playClick();
      clearInterval(state.timerInterval);
      showView('view-lobby');
    });

    // Exit from Boss Battle
    btnBossExit.addEventListener('click', () => {
      SoundEngine.playClick();
      clearInterval(state.bossTimerInterval);
      showView('view-lobby');
    });

    // Multiple Choice Buttons Click
    choiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.isEvaluating) {
          handleAnswerSubmit(btn.dataset.answer);
        }
      });
    });

    // Boss Battle Choice Buttons Click
    bossChoiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.isEvaluating) {
          handleBossAnswerSubmit(btn.dataset.answer);
        }
      });
    });

    // Tactile Numpad Buttons Click
    numpadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        const key = btn.dataset.key;
        if (key === 'clear') {
          state.directInputVal = '';
        } else if (key === 'enter') {
          if (state.directInputVal.length > 0) {
            handleAnswerSubmit(state.directInputVal);
          }
        } else {
          if (state.directInputVal.length < 4) {
            state.directInputVal += key;
          }
        }
        updateDirectInputDisplay();
      });
    });

    // Flashcard Buttons
    btnFcLearning.addEventListener('click', () => nextFlashcard(false));
    btnFcMastered.addEventListener('click', () => nextFlashcard(true));
    btnFcExit.addEventListener('click', () => {
      SoundEngine.playClick();
      showView('view-lobby');
    });

    // Results Actions
    btnResultsReplay.addEventListener('click', () => {
      SoundEngine.playClick();
      startGame();
    });

    btnResultsLobby.addEventListener('click', () => {
      SoundEngine.playClick();
      showView('view-lobby');
    });

    btnResultsDrill.addEventListener('click', () => {
      SoundEngine.playClick();
      startGame('mistake_drill');
    });

    btnDrillMistakes.addEventListener('click', () => {
      SoundEngine.playClick();
      startGame('mistake_drill');
    });

    btnClearMistakes.addEventListener('click', () => {
      SoundEngine.playClick();
      StorageManager.clearMistakes();
      syncLobbyStats();
    });

    // Reset All Data
    btnResetData.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all XP, high scores, matrix heatmap, and progress?')) {
        StorageManager.resetAll();
        closeStatsModal();
        syncPlayerHUD();
        syncLobbyStats();
        buildMatrixGrid();
      }
    });

    // Global Keydown
    window.addEventListener('keydown', handleGlobalKeydown);
  }

  function handleGlobalKeydown(e) {
    if (!modalMatrix.classList.contains('hidden') && e.key === 'Escape') {
      closeMatrixModal();
      return;
    }

    if (!modalStats.classList.contains('hidden') && e.key === 'Escape') {
      closeStatsModal();
      return;
    }

    if (!modalMobileMenu.classList.contains('hidden') && e.key === 'Escape') {
      modalMobileMenu.classList.add('hidden');
      return;
    }

    if (!viewFlashcards.classList.contains('hidden')) {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggleFlipCard();
      } else if (e.key === '1' || e.key === 'ArrowLeft') {
        nextFlashcard(false);
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        nextFlashcard(true);
      }
      return;
    }

    if (!viewBoss.classList.contains('hidden') && !state.isEvaluating) {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const targetBtn = bossChoiceBtns[index];
        if (targetBtn && targetBtn.dataset.answer) {
          handleBossAnswerSubmit(targetBtn.dataset.answer);
        }
      }
      return;
    }

    if (!viewQuiz.classList.contains('hidden') && !state.isEvaluating) {
      if (state.inputStyle === 'choice') {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const index = parseInt(e.key, 10) - 1;
          const targetBtn = choiceBtns[index];
          if (targetBtn && targetBtn.dataset.answer) {
            handleAnswerSubmit(targetBtn.dataset.answer);
          }
        }
      } else {
        if (/^[0-9]$/.test(e.key)) {
          if (state.directInputVal.length < 4) {
            SoundEngine.playClick();
            state.directInputVal += e.key;
            updateDirectInputDisplay();
          }
        } else if (e.key === 'Backspace') {
          SoundEngine.playClick();
          state.directInputVal = state.directInputVal.slice(0, -1);
          updateDirectInputDisplay();
        } else if (e.key === 'Enter') {
          if (state.directInputVal.length > 0) {
            handleAnswerSubmit(state.directInputVal);
          }
        }
      }
    }
  }

  function openStatsModal() {
    SoundEngine.playClick();
    const stats = StorageManager.getStats();
    const info = stats.levelInfo;

    if (modalLevelIcon) modalLevelIcon.innerHTML = info.icon;
    modalLevelTitle.textContent = info.title;
    modalLevelNum.textContent = `Level ${info.level}`;
    modalXPBar.style.width = `${info.progressPercent}%`;
    modalXPNeeded.textContent = `${info.neededXP - info.progressXP} XP to reach Level ${info.level + 1}`;

    statTotalAnswered.textContent = stats.totalAnswered;
    statAccuracyRate.textContent = `${stats.accuracy}%`;
    statHighestStreak.textContent = stats.highestStreak;
    statBossDefeated.textContent = stats.bossStats ? stats.bossStats.totalBeaten : 0;

    recordBlitz30.textContent = stats.highScores.blitz_30 || 0;
    recordBlitz60.textContent = stats.highScores.blitz_60 || 0;
    recordBlitz120.textContent = stats.highScores.blitz_120 || 0;

    modalStats.classList.remove('hidden');
  }

  function closeStatsModal() {
    modalStats.classList.add('hidden');
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  init();
});
