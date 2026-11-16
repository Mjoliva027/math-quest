/**
 * Math Quest - Main Application Controller
 * Handles gameplay loop, Boss Battles, 12x12 Matrix Explorer, Fever Mode, and Voice Synthesis.
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

    // Flashcard State
    flashcardDeck: [],
    flashcardIndex: 0,
    isCardFlipped: false,

    // Boss Battle State
    currentBoss: null,
    bossHp: 100,
    bossMaxHp: 100,
    playerHp: 100,
    playerMaxHp: 100,
    bossTurnTime: 12,
    bossTimerInterval: null,

    // Matrix Explorer State
    selectedMatrixRow: 7,
    selectedMatrixCol: 8,
  };

  // =========================================================================
  // DOM REFERENCES
  // =========================================================================
  // Navigation & Controls
  const btnNavLogo = document.getElementById('btn-nav-logo');
  const btnBgmToggle = document.getElementById('btn-bgm-toggle');
  const bgmIcon = document.getElementById('bgm-icon');
  const btnSpeechToggle = document.getElementById('btn-speech-toggle');
  const speechIcon = document.getElementById('speech-icon');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const btnStatsModal = document.getElementById('btn-stats-modal');
  const btnMatrixToggle = document.getElementById('btn-matrix-toggle');
  const navPlayerLevel = document.getElementById('nav-player-level');
  const navPlayerTitle = document.getElementById('nav-player-title');
  const navPlayerIcon = document.getElementById('nav-player-icon');
  const navXPBar = document.getElementById('nav-xp-bar');
  const navXPText = document.getElementById('nav-xp-text');

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
  const btnToggleAllTables = document.getElementById('btn-toggle-all-tables');
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
    attachEventListeners();
  }

  function updateAudioIcons() {
    soundIcon.textContent = SoundEngine.isMuted() ? '🔇' : '🔊';
    bgmIcon.textContent = SoundEngine.isBgmMuted() ? '🔇' : '🎵';
    speechIcon.textContent = SoundEngine.isSpeechEnabled() ? '🗣️' : '🤐';
  }

  function syncPlayerHUD() {
    const data = StorageManager.getData();
    const info = StorageManager.getLevelInfo(data.xp);

    navPlayerLevel.textContent = `Level ${info.level}`;
    navPlayerTitle.textContent = info.title;
    navPlayerIcon.textContent = info.icon;
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
      chip.className = `table-chip py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all border ${
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

    // Reset common round parameters
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
      Confetti.burst(50);
      spawnFloatingXP('🔥 FEVER MODE ACTIVATED! (3x Multiplier!)');
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
      rowDiv.className = 'flex gap-1.5 items-center justify-center';

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
    const heartElements = hudHeartsContainer.querySelectorAll('.heart-icon');
    heartElements.forEach((el, index) => {
      if (index < state.hearts) {
        el.textContent = '❤️';
        el.classList.remove('opacity-25', 'grayscale');
      } else {
        el.textContent = '🖤';
        el.classList.add('opacity-25', 'grayscale');
      }
    });
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

    // Update Equation Card
    quizOpSymbol.textContent = state.currentProblem.symbol;
    quizOpTitle.textContent = capitalize(state.currentProblem.operation);
    quizEquationText.textContent = state.currentProblem.equation;
    quizHintText.textContent = '';

    // Voice Read-Aloud
    if (SoundEngine.isSpeechEnabled()) {
      SoundEngine.speakEquation(state.currentProblem.num1, state.currentProblem.operation, state.currentProblem.num2);
    }

    // Visual Area Model for Multiplication
    if (state.currentProblem.operation === 'multiply' && state.currentProblem.num1 <= 12 && state.currentProblem.num2 <= 12) {
      quizVisualArrayWrapper.classList.remove('hidden');
      quizVisualLabel.textContent = `${state.currentProblem.num1} × ${state.currentProblem.num2} = ${state.currentProblem.answer}`;
      renderVisualDotGrid(quizVisualDots, state.currentProblem.num1, state.currentProblem.num2);
    } else {
      quizVisualArrayWrapper.classList.add('hidden');
    }

    // Multiple Choice Buttons
    if (state.inputStyle === 'choice') {
      choiceBtns.forEach((btn, index) => {
        const val = state.currentProblem.options[index];
        const valSpan = btn.querySelector('.choice-val');
        valSpan.textContent = val !== undefined ? val : '';
        btn.dataset.answer = val;
        btn.className = 'choice-btn py-5 px-6 rounded-2xl bg-slate-900/90 hover:bg-indigo-600 border border-slate-700/80 hover:border-indigo-400 font-black text-2xl sm:text-3xl text-white transition-all transform active:scale-95 shadow-lg flex items-center justify-between';
      });
    }
  }

  function handleAnswerSubmit(playerAnswer) {
    if (state.isEvaluating || !state.currentProblem) return;
    state.isEvaluating = true;
    state.totalCount++;

    const isCorrect = Number(playerAnswer) === state.currentProblem.answer;

    // Record matrix heatmap data for multiplication
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
        Confetti.burst(40);
      }
    } else {
      SoundEngine.playCorrect();
    }

    spawnFloatingXP(`+${gainedScore} pts! ${multiplier > 1 ? `(${multiplier}x)` : ''}`);

    quizCard.classList.remove('animate-shake');
    quizCard.classList.add('animate-correct');
    setTimeout(() => quizCard.classList.remove('animate-correct'), 350);

    if (state.mode === 'mistake_drill') {
      StorageManager.removeMistake(state.currentProblem.equation);
    }

    updateScoreDisplay();
    updateStreakDisplay();
    syncPlayerHUD();

    setTimeout(loadNextProblem, 350);
  }

  function handleIncorrectAnswer() {
    state.streak = 0;
    disableFeverMode();
    updateStreakDisplay();
    SoundEngine.playWrong();

    StorageManager.recordMistake(state.currentProblem);
    state.roundMistakes.push({ ...state.currentProblem });

    if (state.currentProblem.hint) {
      quizHintText.textContent = `💡 Hint: ${state.currentProblem.hint}`;
    }

    quizCard.classList.remove('animate-correct');
    quizCard.classList.add('animate-shake');
    setTimeout(() => quizCard.classList.remove('animate-shake'), 450);

    if (state.mode === 'survival') {
      state.hearts--;
      renderHearts();
      if (state.hearts <= 0) {
        setTimeout(() => endGame('Out of Lives!'), 600);
        return;
      }
    }

    setTimeout(loadNextProblem, 1000);
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
    badge.className = 'floating-xp-badge px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/50';
    badge.textContent = text;
    quizFloatingContainer.appendChild(badge);
    setTimeout(() => badge.remove(), 1200);
  }

  function updateDirectInputDisplay() {
    directDisplayVal.textContent = state.directInputVal !== '' ? state.directInputVal : '_';
  }

  // =========================================================================
  // RPG BOSS BATTLE CONTROLLER (NEW!)
  // =========================================================================
  function startBossBattle() {
    showView('view-boss');

    // Pick boss based on difficulty or stats
    const bossIndex = state.difficulty === 'hard' ? 2 : state.difficulty === 'medium' ? 1 : 0;
    state.currentBoss = MathEngine.getBoss(bossIndex);

    state.bossMaxHp = state.currentBoss.maxHp;
    state.bossHp = state.bossMaxHp;
    state.playerMaxHp = 100;
    state.playerHp = 100;
    state.bossTurnTime = 12;

    bossName.textContent = state.currentBoss.name;
    bossTitleDesc.textContent = state.currentBoss.title;
    bossAvatarIcon.textContent = state.currentBoss.icon;

    syncBossHUD();
    startBossTurnTimer();
    loadNextBossProblem();
  }

  function syncBossHUD() {
    bossHpText.textContent = `${Math.max(0, state.bossHp)} / ${state.bossMaxHp}`;
    const bossPercent = Math.max(0, Math.floor((state.bossHp / state.bossMaxHp) * 100));
    bossHpBar.style.width = `${bossPercent}%`;

    playerHpText.textContent = `${Math.max(0, state.playerHp)} / ${state.playerMaxHp}`;
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
        handleBossRetaliation("Time expired! The boss counter-attacks!");
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
      handleBossRetaliation("Wrong answer! The boss counter-attacks!");
    }
  }

  function handlePlayerBossAttack() {
    clearInterval(state.bossTimerInterval);
    state.correctCount++;
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);

    // Audio & Combat visuals
    SoundEngine.playSlash();
    SoundEngine.playBossHit();

    // Spawn slash effect
    const slash = document.createElement('div');
    slash.className = 'slash-effect';
    bossAvatarWrapper.appendChild(slash);
    setTimeout(() => slash.remove(), 400);

    // Boss recoil shake
    bossAvatarWrapper.classList.remove('boss-idle');
    bossAvatarWrapper.classList.add('boss-hit');
    setTimeout(() => {
      bossAvatarWrapper.classList.remove('boss-hit');
      bossAvatarWrapper.classList.add('boss-idle');
    }, 500);

    // Calculate Damage
    const multiplier = state.streak >= 3 ? 1.5 : 1.0;
    const damage = Math.round(25 * multiplier);
    state.bossHp -= damage;
    state.score += damage * 2;

    // Spawn Damage Number
    spawnDamageNumber(`-${damage} HP!`, '#ef4444');

    syncBossHUD();

    if (state.bossHp <= 0) {
      // VICTORY!
      SoundEngine.playLevelUp();
      Confetti.cannon();
      StorageManager.recordBossDefeated(state.currentBoss.id);
      StorageManager.addXP(60);
      setTimeout(() => endGame(`Defeated ${state.currentBoss.name}!`), 800);
    } else {
      setTimeout(() => {
        startBossTurnTimer();
        loadNextBossProblem();
      }, 500);
    }
  }

  function handleBossRetaliation(message) {
    clearInterval(state.bossTimerInterval);
    state.streak = 0;
    SoundEngine.playBossAttack();

    const attackDamage = state.currentBoss.attackPower;
    state.playerHp -= attackDamage;

    spawnDamageNumber(`-${attackDamage} HP!`, '#f87171', window.innerWidth * 0.4, window.innerHeight * 0.6);

    // Screen Shake
    document.body.classList.add('animate-shake');
    setTimeout(() => document.body.classList.remove('animate-shake'), 400);

    syncBossHUD();

    if (state.playerHp <= 0) {
      SoundEngine.playGameOver();
      setTimeout(() => endGame(`${state.currentBoss.name} defeated you!`), 600);
    } else {
      setTimeout(() => {
        startBossTurnTimer();
        loadNextBossProblem();
      }, 800);
    }
  }

  function spawnDamageNumber(text, color = '#ef4444', originX = null, originY = null) {
    const el = document.createElement('div');
    el.className = 'damage-number text-2xl sm:text-3xl font-black drop-shadow-md';
    el.style.color = color;
    el.textContent = text;
    bossCombatEffectsContainer.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  // =========================================================================
  // FLASHCARDS STUDY ENGINE
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
    fcCardInner.classList.remove('flipped');

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

    // Render Visual Dot Array on Back of Flashcard
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

    state.flashcardIndex++;
    if (state.flashcardIndex >= state.flashcardDeck.length) {
      Confetti.cannon();
      endGame('Flashcards Completed!');
    } else {
      renderCurrentFlashcard();
    }
  }

  // =========================================================================
  // 12x12 MULTIPLICATION MATRIX EXPLORER (NEW!)
  // =========================================================================
  function buildMatrixGrid() {
    matrixGridContainer.innerHTML = '';
    const matrixStats = StorageManager.getMatrixStats();

    // Cell (0, 0): Corner Symbol
    const corner = document.createElement('div');
    corner.className = 'matrix-cell bg-slate-900 text-indigo-400 font-black text-sm border border-slate-800';
    corner.textContent = '×';
    matrixGridContainer.appendChild(corner);

    // Column Headers (1 to 12)
    for (let c = 1; c <= 12; c++) {
      const colHeader = document.createElement('div');
      colHeader.className = 'matrix-cell bg-slate-800/90 text-indigo-300 font-bold border border-slate-700/80 header-col';
      colHeader.textContent = c;
      colHeader.dataset.col = c;
      matrixGridContainer.appendChild(colHeader);
    }

    // Grid Rows
    for (let r = 1; r <= 12; r++) {
      // Row Header
      const rowHeader = document.createElement('div');
      rowHeader.className = 'matrix-cell bg-slate-800/90 text-indigo-300 font-bold border border-slate-700/80 header-row';
      rowHeader.textContent = r;
      rowHeader.dataset.row = r;
      matrixGridContainer.appendChild(rowHeader);

      // Data Cells (1 to 12)
      for (let c = 1; c <= 12; c++) {
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

        // Hover & Tap Events
        cell.addEventListener('mouseenter', () => highlightMatrixCrosshair(r, c));
        cell.addEventListener('click', () => {
          SoundEngine.playClick();
          selectMatrixCell(r, c, product, stat);
        });

        matrixGridContainer.appendChild(cell);
      }
    }

    // Default select 7x8
    selectMatrixCell(7, 8, 56, matrixStats['7x8']);
  }

  function highlightMatrixCrosshair(row, col) {
    document.querySelectorAll('.matrix-cell').forEach(el => {
      el.classList.remove('crosshair');
    });

    document.querySelectorAll(`.matrix-cell[data-row="${row}"]`).forEach(el => {
      el.classList.add('crosshair');
    });
    document.querySelectorAll(`.matrix-cell[data-col="${col}"]`).forEach(el => {
      el.classList.add('crosshair');
    });
  }

  function selectMatrixCell(row, col, product, stat) {
    state.selectedMatrixRow = row;
    state.selectedMatrixCol = col;

    matrixInfoFactors.textContent = `${row} × ${col}`;
    matrixInfoProduct.textContent = `= ${product}`;

    if (stat && stat.attempts > 0) {
      const pct = Math.round((stat.correct / stat.attempts) * 100);
      matrixInfoStatus.textContent = `${pct}% accuracy (${stat.correct}/${stat.attempts} correct)`;
    } else {
      matrixInfoStatus.textContent = 'Untested (No attempts yet)';
    }

    btnMatrixDrillRow.textContent = `⚡ Practice Table of ${row}`;
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
      Confetti.burst();
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
    // Sound FX Toggle
    btnSoundToggle.addEventListener('click', () => {
      SoundEngine.toggleMute();
      updateAudioIcons();
    });

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
          b.className = 'duration-btn px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-[11px]';
        });
        btn.className = 'duration-btn px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-[11px]';
        state.blitzDuration = parseInt(btn.dataset.duration, 10);
      });
    });

    // Operations Row
    opBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        opBtns.forEach(b => {
          b.className = 'op-btn py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all';
        });
        btn.className = 'op-btn py-2.5 px-3 rounded-xl border border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all';
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
          b.className = 'diff-btn py-2 px-3 rounded-xl border border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white font-semibold text-xs transition-all';
        });
        btn.className = 'diff-btn py-2 px-3 rounded-xl border border-indigo-500 bg-indigo-600/20 text-indigo-300 font-semibold text-xs transition-all';
        state.difficulty = btn.dataset.diff;
      });
    });

    // Select / Deselect All Tables
    btnToggleAllTables.addEventListener('click', () => {
      SoundEngine.playClick();
      if (state.customTables.length === 12) {
        state.customTables = [7];
      } else {
        state.customTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      }
      renderTableChips();
    });

    // Input Style Toggle
    inputStyleChoice.addEventListener('click', () => {
      SoundEngine.playClick();
      state.inputStyle = 'choice';
      inputStyleChoice.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white transition-all shadow-sm';
      inputStyleDirect.className = 'px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all';
    });

    inputStyleDirect.addEventListener('click', () => {
      SoundEngine.playClick();
      state.inputStyle = 'direct';
      inputStyleDirect.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white transition-all shadow-sm';
      inputStyleChoice.className = 'px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all';
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

    // Flashcard Interactions
    fcFlipCard.addEventListener('click', toggleFlipCard);
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

    modalLevelIcon.textContent = info.icon;
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
