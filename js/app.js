/**
 * Math Quest - Main Application Controller
 * Handles gameplay loop, UI states, input modes, timers, and animations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // APP STATE
  // =========================================================================
  const state = {
    // Current Configuration
    mode: 'blitz', // 'blitz' | 'survival' | 'flashcards' | 'mistake_drill'
    operation: 'multiply',
    difficulty: 'medium',
    customTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    blitzDuration: 30,
    inputStyle: 'choice', // 'choice' | 'direct'

    // Active Round State
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

    // Flashcard Round State
    flashcardDeck: [],
    flashcardIndex: 0,
    isCardFlipped: false,
  };

  // =========================================================================
  // DOM REFERENCES
  // =========================================================================
  // Navigation & Header
  const btnNavLogo = document.getElementById('btn-nav-logo');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const btnStatsModal = document.getElementById('btn-stats-modal');
  const navPlayerLevel = document.getElementById('nav-player-level');
  const navPlayerTitle = document.getElementById('nav-player-title');
  const navPlayerIcon = document.getElementById('nav-player-icon');
  const navXPBar = document.getElementById('nav-xp-bar');
  const navXPText = document.getElementById('nav-xp-text');

  // Views
  const viewLobby = document.getElementById('view-lobby');
  const viewQuiz = document.getElementById('view-quiz');
  const viewFlashcards = document.getElementById('view-flashcards');
  const viewResults = document.getElementById('view-results');

  // Lobby Elements
  const lobbyStatStreak = document.getElementById('lobby-stat-streak');
  const lobbyStatAccuracy = document.getElementById('lobby-stat-accuracy');
  const lobbyStatBlitz = document.getElementById('lobby-stat-blitz');
  const lobbyStatCards = document.getElementById('lobby-stat-cards');
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
  const quizEquationText = document.getElementById('quiz-equation-text');
  const quizHintText = document.getElementById('quiz-hint-text');
  const quizFloatingContainer = document.getElementById('quiz-floating-container');
  const inputContainerChoice = document.getElementById('input-container-choice');
  const choiceBtns = document.querySelectorAll('.choice-btn');
  const inputContainerDirect = document.getElementById('input-container-direct');
  const directDisplayVal = document.getElementById('direct-display-val');
  const numpadBtns = document.querySelectorAll('.numpad-btn');

  // Flashcards Arena Elements
  const fcProgressText = document.getElementById('fc-progress-text');
  const btnFcExit = document.getElementById('btn-fc-exit');
  const fcFlipCard = document.getElementById('fc-flip-card');
  const fcCardInner = document.getElementById('fc-card-inner');
  const fcFrontEquation = document.getElementById('fc-front-equation');
  const fcBackEquation = document.getElementById('fc-back-equation');
  const fcBackAnswer = document.getElementById('fc-back-answer');
  const fcBackHint = document.getElementById('fc-back-hint');
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

  // Stats Modal Elements
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
  const statSurvivalBest = document.getElementById('stat-survival-best');
  const recordBlitz30 = document.getElementById('record-blitz-30');
  const recordBlitz60 = document.getElementById('record-blitz-60');
  const recordBlitz120 = document.getElementById('record-blitz-120');
  const btnResetData = document.getElementById('btn-reset-data');

  // =========================================================================
  // INITIALIZATION & UI SYNC
  // =========================================================================
  function init() {
    renderTableChips();
    updateAudioIcon();
    syncPlayerHUD();
    syncLobbyStats();
    attachEventListeners();
  }

  function updateAudioIcon() {
    soundIcon.textContent = SoundEngine.isMuted() ? '🔇' : '🔊';
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
    lobbyStatCards.textContent = stats.masteredFlashcards;

    // Check for mistake review queue
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
    [viewLobby, viewQuiz, viewFlashcards, viewResults].forEach(el => {
      el.classList.add('hidden');
    });

    const target = document.getElementById(viewId);
    if (target) {
      target.classList.remove('hidden');
    }

    if (viewId === 'view-lobby') {
      syncPlayerHUD();
      syncLobbyStats();
    }
  }

  // =========================================================================
  // GAME START CONTROLLER
  // =========================================================================
  function startGame(customMode = null) {
    if (customMode) {
      state.mode = customMode;
    }

    // Reset round states
    state.score = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.correctCount = 0;
    state.totalCount = 0;
    state.hearts = 3;
    state.roundMistakes = [];
    state.isEvaluating = false;
    state.directInputVal = '';

    if (state.mode === 'flashcards') {
      startFlashcards();
    } else {
      startQuiz();
    }
  }

  // =========================================================================
  // QUIZ ENGINE (Speed Blitz & Survival)
  // =========================================================================
  function startQuiz() {
    showView('view-quiz');

    // Setup HUD according to mode
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

    // Check if mistake drill has finished
    if (state.mode === 'mistake_drill') {
      const mistakes = StorageManager.getMistakes();
      if (mistakes.length === 0) {
        endGame('Mistakes Mastered!');
        return;
      }
      // Pick first or random mistake
      const m = mistakes[0];
      state.currentProblem = {
        ...m,
        options: MathEngine.generateProblem({
          operation: m.operation,
          difficulty: state.difficulty,
        }).options, // generate fresh distractors
      };
      // Ensure answer is in options
      if (!state.currentProblem.options.includes(m.answer)) {
        state.currentProblem.options[0] = m.answer;
        state.currentProblem.options.sort(() => Math.random() - 0.5);
      }
    } else {
      // Normal generator
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

    // Update Multiple Choice Buttons
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

    // Calculate score & multipliers
    const multiplier = getMultiplier(state.streak);
    const basePoints = state.difficulty === 'hard' ? 25 : state.difficulty === 'medium' ? 15 : 10;
    const gainedScore = Math.round(basePoints * multiplier);
    state.score += gainedScore;

    // Add XP
    const earnedXP = Math.round(5 * multiplier);
    const xpResult = StorageManager.addXP(earnedXP);

    // Audio & visuals
    if (state.streak >= 3) {
      SoundEngine.playStreak(state.streak);
      if (state.streak % 5 === 0) {
        Confetti.burst(40);
      }
    } else {
      SoundEngine.playCorrect();
    }

    // Floating XP text
    spawnFloatingXP(`+${gainedScore} pts! ${multiplier > 1 ? `(${multiplier}x)` : ''}`);

    // Card visual feedback
    quizCard.classList.remove('animate-shake');
    quizCard.classList.add('animate-correct');
    setTimeout(() => quizCard.classList.remove('animate-correct'), 400);

    // If in mistake drill mode, remove from queue
    if (state.mode === 'mistake_drill') {
      StorageManager.removeMistake(state.currentProblem.equation);
    }

    updateScoreDisplay();
    updateStreakDisplay();
    syncPlayerHUD();

    // Small delay before next problem
    setTimeout(loadNextProblem, 350);
  }

  function handleIncorrectAnswer() {
    state.streak = 0;
    updateStreakDisplay();
    SoundEngine.playWrong();

    // Save mistake to review list
    StorageManager.recordMistake(state.currentProblem);
    state.roundMistakes.push({ ...state.currentProblem });

    // Show hint on card
    if (state.currentProblem.hint) {
      quizHintText.textContent = `💡 Hint: ${state.currentProblem.hint}`;
    }

    // Card shake animation
    quizCard.classList.remove('animate-correct');
    quizCard.classList.add('animate-shake');
    setTimeout(() => quizCard.classList.remove('animate-shake'), 450);

    // Handle Survival Lives
    if (state.mode === 'survival') {
      state.hearts--;
      renderHearts();
      if (state.hearts <= 0) {
        setTimeout(() => endGame('Out of Lives!'), 600);
        return;
      }
    }

    // Delay to let player see the hint
    setTimeout(loadNextProblem, 1000);
  }

  function getMultiplier(streak) {
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
  // FLASHCARDS STUDY ENGINE
  // =========================================================================
  function startFlashcards() {
    showView('view-flashcards');
    state.isCardFlipped = false;
    fcCardInner.classList.remove('flipped');

    // Generate a deck of 15 problems
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
  // GAME END & RESULTS CONTROLLER
  // =========================================================================
  function endGame(title = 'Quest Complete!') {
    clearInterval(state.timerInterval);

    showView('view-results');
    resultsTitle.textContent = title;

    const accuracy = state.totalCount > 0 ? Math.round((state.correctCount / state.totalCount) * 100) : 100;
    const gainedXP = Math.round(state.score / 2);

    // Save results to storage
    const outcome = StorageManager.recordGameResult({
      mode: state.mode,
      duration: state.blitzDuration,
      score: state.score,
      streak: state.maxStreak,
      correct: state.correctCount,
      total: state.totalCount,
    });

    // Populate Results UI
    resultsScore.textContent = state.score;
    resultsStreak.textContent = state.maxStreak;
    resultsAccuracy.textContent = `${accuracy}%`;
    resultsXP.textContent = `+${gainedXP} XP`;

    // High Score / Fanfare Audio
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

    // Populate mistakes section
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
      updateAudioIcon();
    });

    // Logo click returns to lobby
    btnNavLogo.addEventListener('click', () => {
      SoundEngine.playClick();
      clearInterval(state.timerInterval);
      showView('view-lobby');
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
          c.classList.remove('border-indigo-500', 'border-2');
          c.classList.add('border-slate-800', 'border');
        });
        card.classList.add('border-indigo-500', 'border-2');
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

        // Toggle custom tables visibility
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
        state.customTables = [7]; // keep at least one
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

    // Multiple Choice Buttons Click
    choiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.isEvaluating) {
          handleAnswerSubmit(btn.dataset.answer);
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
          // Limit to 4 digits
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
      if (confirm('Are you sure you want to reset all XP, high scores, and progress?')) {
        StorageManager.resetAll();
        closeStatsModal();
        syncPlayerHUD();
        syncLobbyStats();
      }
    });

    // Physical Keyboard Support
    window.addEventListener('keydown', handleGlobalKeydown);
  }

  function handleGlobalKeydown(e) {
    // If modal is open, Esc closes it
    if (!modalStats.classList.contains('hidden') && e.key === 'Escape') {
      closeStatsModal();
      return;
    }

    // Flashcard view keybindings
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

    // Quiz view keybindings
    if (!viewQuiz.classList.contains('hidden') && !state.isEvaluating) {
      if (state.inputStyle === 'choice') {
        // Keys 1, 2, 3, 4 select options
        if (['1', '2', '3', '4'].includes(e.key)) {
          const index = parseInt(e.key, 10) - 1;
          const targetBtn = choiceBtns[index];
          if (targetBtn && targetBtn.dataset.answer) {
            handleAnswerSubmit(targetBtn.dataset.answer);
          }
        }
      } else {
        // Direct input typing
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
    statSurvivalBest.textContent = stats.highScores.survival || 0;

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

  // Run App Init
  init();
});
