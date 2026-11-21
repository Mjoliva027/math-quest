/**
 * Math Quest - Main Application Controller (Mobile-Optimized & Touch-Enabled)
 * Handles gameplay loop, PvP Arena, Survival Gauntlet, touch swipe gestures, mobile drawer, and 12x12 Matrix.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // APP STATE
  // =========================================================================
  const state = {
    // Current Configuration
    mode: 'blitz', // 'blitz' | 'pvp' | 'meteor' | 'survival' | 'endless' | 'flashcards' | 'mistake_drill' | 'daily'
    operation: 'multiply',
    difficulty: 'medium',
    customTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    blitzDuration: 30,
    inputStyle: 'choice', // 'choice' | 'direct'
    autoSubmit: false,
    theme: 'dark',
    settingsCollapsed: false,

    // Active Quiz/Survival/Daily Round State
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
    isPaused: false,
    pauseStartedAt: 0,
    resumeNeedsNextProblem: false,
    isFeverActive: false,
    endlessCardCount: 1,
    roundStartLevel: 1,
    roundXPGained: 0,
    pendingTimeout: null,
    problemStartTime: 0,
    retryQueue: [],
    recommendedQuest: null,

    // Survival Gauntlet State
    survivalFloor: 1,
    survivalSolved: 0,
    survivalFuseLeft: 15,
    survivalFuseMax: 15,
    survivalFuseInterval: null,
    survival5050Left: 2,
    survivalSkipLeft: 1,
    survival5050UsedOnCurrent: false,

    // Daily Challenge State
    dailyDateKey: '',
    dailyDeck: [],
    dailyIndex: 0,
    dailyResults: [],
    dailyStartTime: 0,
    dailyElapsedSeconds: 0,
    dailyElapsedTimer: null,
    lastDailyShareText: '',

    // Flashcard State & Touch Gestures
    flashcardDeck: [],
    flashcardIndex: 0,
    isCardFlipped: false,
    isCardTransitioning: false,
    touchStartX: 0,
    touchStartY: 0,
    touchDeltaX: 0,
    touchDeltaY: 0,
    isSwiping: false,
    activePointerId: null,

    // Matrix Explorer State
    matrixTab: '1-6', // '1-6' | '7-12' | 'all'
    selectedMatrixRow: 7,
    selectedMatrixCol: 8,

    // App Shell / Profiles / Leaderboard / PvP Invite
    deferredInstallPrompt: null,
    selectedNewAvatar: 'knight',
    dailyQuestsExpanded: false,
    leaderboardTab: 'local',
    leaderboardLocalCat: 'xp',
    leaderboardRoom: '',
    lastDailyTimeSeconds: 0,
    lastMeteorWave: 1,
    pendingConfirmCallback: null,
    pendingPvpCode: '',
    pendingPvpFormat: '',
  };

  // =========================================================================
  // DOM REFERENCES
  // =========================================================================
  // Navigation & Controls
  const btnNavLogo = document.getElementById('btn-nav-logo');
  const btnProfileSwitcher = document.getElementById('btn-profile-switcher');
  const navProfileAvatar = document.getElementById('nav-profile-avatar');
  const navProfileName = document.getElementById('nav-profile-name');
  const btnInstallApp = document.getElementById('btn-install-app');
  const btnLeaderboardToggle = document.getElementById('btn-leaderboard-toggle');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIconWrapper = document.getElementById('theme-icon-wrapper');
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
  const navPlayerBar = document.getElementById('nav-player-bar');
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
  const btnMenuTheme = document.getElementById('btn-menu-theme');
  const menuThemeIconWrapper = document.getElementById('menu-theme-icon-wrapper');
  const menuThemeStatus = document.getElementById('menu-theme-status');
  const btnMenuProfiles = document.getElementById('btn-menu-profiles');
  const btnMenuLeaderboard = document.getElementById('btn-menu-leaderboard');
  const btnMenuInstall = document.getElementById('btn-menu-install');
  const btnMenuReset = document.getElementById('btn-menu-reset');

  // Views
  const viewLobby = document.getElementById('view-lobby');
  const viewQuiz = document.getElementById('view-quiz');
  const viewPvp = document.getElementById('view-pvp');
  const lobbyPvpOnlineBadge = document.getElementById('lobby-pvp-online-badge');
  const viewFlashcards = document.getElementById('view-flashcards');
  const viewResults = document.getElementById('view-results');
  const viewMeteor = document.getElementById('view-meteor');
  const viewTug = document.getElementById('view-tug');

  // Lobby Elements
  const lobbySharedBanner = document.getElementById('lobby-shared-banner');
  const sharedBannerText = document.getElementById('shared-banner-text');
  const btnSharedStart = document.getElementById('btn-shared-start');
  const btnSharedDismiss = document.getElementById('btn-shared-dismiss');
  const lobbyRecommendedCard = document.getElementById('lobby-recommended-card');
  const recQuestBadge = document.getElementById('rec-quest-badge');
  const recQuestTitle = document.getElementById('rec-quest-title');
  const recQuestSubtitle = document.getElementById('rec-quest-subtitle');
  const btnRecQuestStart = document.getElementById('btn-rec-quest-start');
  const dailyChallengeDate = document.getElementById('daily-challenge-date');
  const dailyChallengeStatus = document.getElementById('daily-challenge-status');
  const btnStartDailyChallenge = document.getElementById('btn-start-daily-challenge');
  const btnShareDailyLobby = document.getElementById('btn-share-daily-lobby');
  const btnToggleDailyQuests = document.getElementById('btn-toggle-daily-quests');
  const dailyQuestsChevron = document.getElementById('daily-quests-chevron');
  const dailyStreakCount = document.getElementById('daily-streak-count');
  const dailyQuestsSummary = document.getElementById('daily-quests-summary');
  const dailyQuestsList = document.getElementById('daily-quests-list');
  const lobbyMistakesAlert = document.getElementById('lobby-mistakes-alert');
  const lobbyMistakesCount = document.getElementById('lobby-mistakes-count');
  const btnDrillMistakes = document.getElementById('btn-drill-mistakes');
  const btnClearMistakes = document.getElementById('btn-clear-mistakes');
  const modeCards = document.querySelectorAll('.mode-card');
  const durationBtns = document.querySelectorAll('.duration-btn');
  const btnToggleSettings = document.getElementById('btn-toggle-settings');
  const settingsSummaryPill = document.getElementById('settings-summary-pill');
  const settingsChevron = document.getElementById('settings-chevron');
  const settingsPanelBody = document.getElementById('settings-panel-body');
  const opBtns = document.querySelectorAll('.op-btn');
  const diffBtns = document.querySelectorAll('.diff-btn');
  const customTablesWrapper = document.getElementById('custom-tables-wrapper');
  const tableChipsContainer = document.getElementById('table-chips-container');
  const tablePresetBtns = document.querySelectorAll('.table-preset-btn');
  const inputStyleChoice = document.getElementById('input-style-choice');
  const inputStyleDirect = document.getElementById('input-style-direct');
  const btnAutoSubmitToggle = document.getElementById('btn-auto-submit-toggle');
  const autoSubmitStatus = document.getElementById('auto-submit-status');
  const btnCopyPracticeLink = document.getElementById('btn-copy-practice-link');
  const copyLinkFeedback = document.getElementById('copy-link-feedback');
  const btnStartGame = document.getElementById('btn-start-game');

  // Quiz Arena Elements
  const quizFeverWrapper = document.getElementById('quiz-fever-wrapper');
  const quizFeverBar = document.getElementById('quiz-fever-bar');
  const quizStreakCount = document.getElementById('quiz-streak-count');
  const quizFlameIcon = document.getElementById('quiz-flame-icon');
  const quizMultiplierBadge = document.getElementById('quiz-multiplier-badge');
  const hudTimerContainer = document.getElementById('hud-timer-container');
  const hudTimerVal = document.getElementById('hud-timer-val');
  const hudHeartsContainer = document.getElementById('hud-hearts-container');
  const hudSurvivalFloor = document.getElementById('hud-survival-floor');
  const survivalFuseWrap = document.getElementById('survival-fuse-wrap');
  const survivalFuseText = document.getElementById('survival-fuse-text');
  const survivalFuseBar = document.getElementById('survival-fuse-bar');
  const survivalLifelinesBar = document.getElementById('survival-lifelines-bar');
  const btnSurvival5050 = document.getElementById('btn-survival-5050');
  const survival5050Count = document.getElementById('survival-5050-count');
  const btnSurvivalSkip = document.getElementById('btn-survival-skip');
  const survivalSkipCount = document.getElementById('survival-skip-count');
  const hudEndlessContainer = document.getElementById('hud-endless-container');
  const hudEndlessCardVal = document.getElementById('hud-endless-card-val');
  const hudDailyContainer = document.getElementById('hud-daily-container');
  const hudDailyProgress = document.getElementById('hud-daily-progress');
  const hudDailyElapsed = document.getElementById('hud-daily-elapsed');
  const hudScoreVal = document.getElementById('hud-score-val');
  const btnQuizFinish = document.getElementById('btn-quiz-finish');
  const btnQuizPause = document.getElementById('btn-quiz-pause');
  const btnQuizExit = document.getElementById('btn-quiz-exit');
  const quizCard = document.getElementById('quiz-card');
  const quizPauseOverlay = document.getElementById('quiz-pause-overlay');
  const btnQuizResume = document.getElementById('btn-quiz-resume');
  const quizOpSymbol = document.getElementById('quiz-op-symbol');
  const quizOpTitle = document.getElementById('quiz-op-title');
  const btnQuizSpeak = document.getElementById('btn-quiz-speak');
  const quizEquationText = document.getElementById('quiz-equation-text');
  const quizHintText = document.getElementById('quiz-hint-text');
  const quizVisualArrayWrapper = document.getElementById('quiz-visual-array-wrapper');
  const quizVisualLabel = document.getElementById('quiz-visual-label');
  const quizVisualDots = document.getElementById('quiz-visual-dots');
  const quizSkipCountBanner = document.getElementById('quiz-skip-count-banner');
  const quizFloatingContainer = document.getElementById('quiz-floating-container');
  const inputContainerChoice = document.getElementById('input-container-choice');
  const choiceBtns = document.querySelectorAll('.choice-btn');
  const inputContainerDirect = document.getElementById('input-container-direct');
  const directDisplayVal = document.getElementById('direct-display-val');
  const btnDirectClear = document.getElementById('btn-direct-clear');
  const numpadBtns = document.querySelectorAll('.numpad-btn');

  // Flashcards Elements
  const fcProgressText = document.getElementById('fc-progress-text');
  const btnFcExit = document.getElementById('btn-fc-exit');
  const fcFlipCard = document.getElementById('fc-flip-card');
  const fcCardInner = document.getElementById('fc-card-inner');
  const fcFrontEquation = document.getElementById('fc-front-equation');
  const fcFrontPrompt = document.getElementById('fc-front-prompt');
  const fcBackEquation = document.getElementById('fc-back-equation');
  const fcBackAnswer = document.getElementById('fc-back-answer');
  const fcBackHint = document.getElementById('fc-back-hint');
  const fcVisualDotsContainer = document.getElementById('fc-visual-dots-container');
  const fcSkipCountBanner = document.getElementById('fc-skip-count-banner');
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
  const resultsDailyShareBox = document.getElementById('results-daily-share-box');
  const resultsDailyGrid = document.getElementById('results-daily-grid');
  const btnResultsShareDaily = document.getElementById('btn-results-share-daily');
  const resultsShareFeedback = document.getElementById('results-share-feedback');
  const resultsMistakesContainer = document.getElementById('results-mistakes-container');
  const resultsMistakesList = document.getElementById('results-mistakes-list');
  const btnResultsDrill = document.getElementById('btn-results-drill');
  const btnResultsReplay = document.getElementById('btn-results-replay');
  const btnResultsLeaderboard = document.getElementById('btn-results-leaderboard');
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
  const statPvpWins = document.getElementById('stat-pvp-wins');
  const recordBlitz30 = document.getElementById('record-blitz-30');
  const recordBlitz60 = document.getElementById('record-blitz-60');
  const recordBlitz120 = document.getElementById('record-blitz-120');
  const recordSurvival = document.getElementById('record-survival');
  const recordEndless = document.getElementById('record-endless');
  const recordMeteor = document.getElementById('record-meteor');
  const achievementsContainer = document.getElementById('achievements-container');
  const achievementsCount = document.getElementById('achievements-count');
  const reportProfileName = document.getElementById('report-profile-name');
  const reportFactsMastered = document.getElementById('report-facts-mastered');
  const reportAvgSpeed = document.getElementById('report-avg-speed');
  const reportMasteredTables = document.getElementById('report-mastered-tables');
  const reportWeakFacts = document.getElementById('report-weak-facts');
  const btnPrintReport = document.getElementById('btn-print-report');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const inputImportJson = document.getElementById('input-import-json');
  const btnResetData = document.getElementById('btn-reset-data');

  // Profiles Modal Elements
  const modalProfiles = document.getElementById('modal-profiles');
  const btnCloseProfiles = document.getElementById('btn-close-profiles');
  const btnProfilesDone = document.getElementById('btn-profiles-done');
  const profilesList = document.getElementById('profiles-list');
  const btnRandomHeroName = document.getElementById('btn-random-hero-name');
  const inputNewProfileName = document.getElementById('input-new-profile-name');
  const profileAvatarPicker = document.getElementById('profile-avatar-picker');
  const btnCreateProfile = document.getElementById('btn-create-profile');

  // Leaderboard Modal Elements
  const modalLeaderboard = document.getElementById('modal-leaderboard');
  const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
  const btnLeaderboardDone = document.getElementById('btn-leaderboard-done');
  const btnLbRefresh = document.getElementById('btn-lb-refresh');
  const lbTabBtns = document.querySelectorAll('.lb-tab-btn');
  const lbLocalFilterRow = document.getElementById('lb-local-filter-row');
  const lbLocalCatBtns = document.querySelectorAll('.lb-local-cat-btn');
  const lbRoomBar = document.getElementById('lb-room-bar');
  const inputLbRoomCode = document.getElementById('input-lb-room-code');
  const btnLbApplyRoom = document.getElementById('btn-lb-apply-room');
  const btnLbClearRoom = document.getElementById('btn-lb-clear-room');
  const lbStatusBanner = document.getElementById('lb-status-banner');
  const leaderboardRows = document.getElementById('leaderboard-rows');

  // Confirmation Dialog & Toasts
  const modalConfirm = document.getElementById('modal-confirm');
  const confirmModalTitle = document.getElementById('confirm-modal-title');
  const confirmModalMessage = document.getElementById('confirm-modal-message');
  const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
  const btnConfirmOk = document.getElementById('btn-confirm-ok');
  const toastContainer = document.getElementById('toast-container');

  // =========================================================================
  // INITIALIZATION & UI SYNC
  // =========================================================================
  function init() {
    loadPreferencesIntoState();
    parseSharedPracticeFromURL();
    applyTheme(state.theme);
    syncProfileUI();
    syncLobbySelectors();
    syncDurationUI();
    syncInputStyleUI();
    syncAutoSubmitUI();
    syncSettingsCollapse();
    updateAudioIcons();
    syncPlayerHUD();
    syncLobbyStats();
    buildMatrixGrid();
    setupTouchSwipeGestures();
    attachEventListeners();

    if (state.pendingPvpCode) {
      startGame('pvp');
    } else {
      refreshLobbyOnlineCount();
    }
  }

  let lastLobbyOnlineFetchAt = 0;
  let lobbyOnlineController = null;
  let lobbyOnlineSeq = 0;

  async function refreshLobbyOnlineCount(force = false) {
    if (!lobbyPvpOnlineBadge) return;
    if (typeof PvpArena === 'undefined' || typeof PvpArena.fetchOnlineCount !== 'function') return;

    const now = Date.now();
    if (!force && now - lastLobbyOnlineFetchAt < 10000) return;
    lastLobbyOnlineFetchAt = now;

    if (lobbyOnlineController) {
      lobbyOnlineController.abort();
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    lobbyOnlineController = controller;
    const seq = ++lobbyOnlineSeq;

    const res = await PvpArena.fetchOnlineCount(controller ? controller.signal : undefined);
    if (seq !== lobbyOnlineSeq || (res && res.aborted)) return;
    if (lobbyOnlineController === controller) {
      lobbyOnlineController = null;
    }

    if (res && res.configured) {
      const count = Math.max(0, Number(res.onlineCount) || 0);
      lobbyPvpOnlineBadge.textContent = count > 0 ? `● ${count} Online · 2P` : '0 Online · 2P';
      lobbyPvpOnlineBadge.className = count > 0
        ? 'text-emerald-400 font-semibold'
        : 'text-amber-400 font-semibold';
    } else {
      lobbyPvpOnlineBadge.textContent = 'Online + 2P';
      lobbyPvpOnlineBadge.className = 'text-amber-400 font-semibold';
    }
  }

  // Vector SVG Icon Definitions for Reactive Controls
  const SVG_ICONS = {
    soundOn: `<svg class="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    soundOff: `<svg class="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>`,
    bgmOn: `<svg class="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    bgmOff: `<svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M9 18V5l12-2v7"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    speechOn: `<svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>`,
    speechOff: `<svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    themeLight: `<svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    themeDark: `<svg class="w-4 h-4 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  };

  function loadPreferencesIntoState() {
    const prefs = StorageManager.getPreferences();
    state.mode = prefs.mode;
    state.operation = prefs.operation;
    state.difficulty = prefs.difficulty;
    state.customTables = [...prefs.customTables];
    state.blitzDuration = prefs.blitzDuration;
    state.inputStyle = prefs.inputStyle;
    state.autoSubmit = prefs.autoSubmit;
    state.theme = prefs.theme;
    state.settingsCollapsed = prefs.settingsCollapsed;
    state.leaderboardRoom = prefs.leaderboardRoom || '';
  }

  function persistPreferences() {
    const lobbyModes = ['blitz', 'pvp', 'meteor', 'survival', 'endless', 'flashcards'];
    const currentSaved = StorageManager.getPreferences();
    StorageManager.savePreferences({
      mode: lobbyModes.includes(state.mode) ? state.mode : currentSaved.mode,
      operation: state.operation,
      difficulty: state.difficulty,
      customTables: [...state.customTables],
      blitzDuration: state.blitzDuration,
      inputStyle: state.inputStyle,
      autoSubmit: state.autoSubmit,
      theme: state.theme,
      settingsCollapsed: state.settingsCollapsed,
      leaderboardRoom: state.leaderboardRoom,
    });
    updateSettingsSummaryPill();
  }

  function showToast(message, type = 'info') {
    if (!toastContainer || !message) return;
    while (toastContainer.children.length >= 3) {
      toastContainer.firstElementChild.remove();
    }
    const toast = document.createElement('div');
    const styleMap = {
      success: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200',
      error: 'bg-rose-950/95 border-rose-500/50 text-rose-200',
      info: 'bg-slate-900/95 border-indigo-500/50 text-slate-100',
    };
    toast.className = `mq-toast px-3.5 py-2.5 rounded-2xl border shadow-xl text-xs font-semibold backdrop-blur-md ${styleMap[type] || styleMap.info}`;
    toast.textContent = String(message);
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  function showConfirmDialog({ title = 'Confirm Action', message = '', confirmLabel = 'Confirm', onConfirm }) {
    if (!modalConfirm) return;
    if (confirmModalTitle) confirmModalTitle.textContent = title;
    if (confirmModalMessage) confirmModalMessage.textContent = message;
    if (btnConfirmOk) btnConfirmOk.textContent = confirmLabel;
    state.pendingConfirmCallback = typeof onConfirm === 'function' ? onConfirm : null;
    modalConfirm.classList.remove('hidden');
  }

  function closeConfirmDialog() {
    state.pendingConfirmCallback = null;
    if (modalConfirm) modalConfirm.classList.add('hidden');
  }

  function triggerHaptic(pattern) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  function applyTheme(theme) {
    const resolved = theme === 'light' ? 'light' : 'dark';
    state.theme = resolved;
    document.documentElement.classList.toggle('theme-light', resolved === 'light');
    const iconHtml = resolved === 'light' ? SVG_ICONS.themeLight : SVG_ICONS.themeDark;
    if (themeIconWrapper) themeIconWrapper.innerHTML = iconHtml;
    if (menuThemeIconWrapper) menuThemeIconWrapper.innerHTML = iconHtml;
    if (menuThemeStatus) menuThemeStatus.textContent = resolved === 'light' ? 'Light' : 'Dark';
  }

  function syncProfileUI() {
    const active = StorageManager.getActiveProfile();
    if (navProfileName) navProfileName.textContent = active.name;
    if (navProfileAvatar) navProfileAvatar.innerHTML = active.svg;
  }

  function refreshActiveProfileUI() {
    loadPreferencesIntoState();
    applyTheme(state.theme);
    syncProfileUI();
    syncPlayerHUD();
    syncLobbySelectors();
    syncDurationUI();
    syncInputStyleUI();
    syncAutoSubmitUI();
    syncSettingsCollapse();
    syncLobbyStats();
    buildMatrixGrid();
  }

  function parseSharedPracticeFromURL() {
    if (!window.location || !window.location.search) return;
    const params = new URLSearchParams(window.location.search);
    const allowedModes = ['blitz', 'pvp', 'meteor', 'survival', 'endless', 'flashcards', 'tug'];
    const allowedOps = ['multiply', 'divide', 'missing', 'add', 'subtract', 'mixed'];
    const allowedDiffs = ['easy', 'medium', 'hard'];
    const allowedInputs = ['choice', 'direct'];
    const allowedDurs = [30, 60, 120];

    let hasShared = false;
    const parts = [];

    const modeParamRaw = params.get('mode');
    const modeParam = modeParamRaw === 'tug' ? 'pvp' : modeParamRaw;
    if (modeParam && allowedModes.includes(modeParam)) {
      state.mode = modeParam;
      hasShared = true;
      const modeNames = {
        blitz: 'Speed Blitz',
        pvp: 'PvP Arena',
        meteor: 'Meteor Blaster',
        survival: 'Survival Gauntlet',
        endless: 'Endless Cards',
        flashcards: 'Flashcards',
      };
      parts.push(modeNames[modeParam]);
    }

    const codeParamRaw = params.get('code');
    if (codeParamRaw) {
      const cleanCode = codeParamRaw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
      if (cleanCode.length >= 4) {
        state.pendingPvpCode = cleanCode;
        state.mode = 'pvp';
        hasShared = true;
        parts.push(`Room ${cleanCode}`);
      }
    }

    const formatParam = params.get('format');
    if (formatParam === 'duel' || formatParam === 'tug') {
      state.pendingPvpFormat = formatParam;
    }

    const opParam = params.get('op');
    if (opParam && allowedOps.includes(opParam)) {
      state.operation = opParam;
      hasShared = true;
      parts.push(opParam === 'missing' ? 'Mystery Factor' : capitalize(opParam));
    }

    const diffParam = params.get('diff');
    if (diffParam && allowedDiffs.includes(diffParam)) {
      state.difficulty = diffParam;
      hasShared = true;
      parts.push(capitalize(diffParam));
    }

    const tablesParam = params.get('tables');
    if (tablesParam) {
      const parsedTables = Array.from(new Set(
        tablesParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isInteger(n) && n >= 1 && n <= 12)
      )).sort((a, b) => a - b);
      if (parsedTables.length > 0) {
        state.customTables = parsedTables;
        hasShared = true;
        parts.push(`Tables ${parsedTables.join(', ')}`);
      }
    }

    const inputParam = params.get('input');
    if (inputParam && allowedInputs.includes(inputParam)) {
      state.inputStyle = inputParam;
      hasShared = true;
      parts.push(inputParam === 'direct' ? 'Numpad' : 'Choices');
    }

    const durParam = parseInt(params.get('dur') || '', 10);
    if (allowedDurs.includes(durParam)) {
      state.blitzDuration = durParam;
      hasShared = true;
    }

    if (hasShared && !state.pendingPvpCode && lobbySharedBanner && sharedBannerText) {
      sharedBannerText.textContent = parts.join(' · ');
      lobbySharedBanner.classList.remove('hidden');
    }
  }

  function buildShareablePracticeURL() {
    const params = new URLSearchParams();
    const lobbyModes = ['blitz', 'pvp', 'meteor', 'survival', 'endless', 'flashcards'];
    const mode = lobbyModes.includes(state.mode) ? state.mode : 'blitz';
    params.set('mode', mode);
    params.set('op', state.operation);
    params.set('diff', state.difficulty);
    if (isTableOperation(state.operation)) {
      params.set('tables', state.customTables.join(','));
    }
    params.set('input', state.inputStyle);
    if (mode === 'blitz') {
      params.set('dur', String(state.blitzDuration));
    }
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  function copyTextToClipboard(text, onDone) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(() => {
        if (onDone) onDone(true);
      }).catch(() => {
        fallbackCopy(text, onDone);
      });
    } else {
      fallbackCopy(text, onDone);
    }
  }

  function fallbackCopy(text, onDone) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (onDone) onDone(true);
    } catch (e) {
      if (onDone) onDone(false);
    }
  }

  function formatDailyShareText(dateKey, entry) {
    const cells = (entry && Array.isArray(entry.results) ? entry.results : []).map(ok => (ok ? '🟩' : '🟥'));
    const rows = [];
    for (let i = 0; i < cells.length; i += 5) {
      rows.push(cells.slice(i, i + 5).join(''));
    }
    return [
      `Math Quest Daily (${dateKey})`,
      `${entry.correct}/${entry.total} · ${entry.timeSeconds}s · Streak ${entry.bestStreak}`,
      rows.join('\n'),
    ].filter(Boolean).join('\n');
  }

  function syncDailyChallengeCard() {
    const status = StorageManager.getDailyChallengeStatus();
    if (dailyChallengeDate) dailyChallengeDate.textContent = status.dateKey;
    if (status.completed && status.entry) {
      if (dailyChallengeStatus) {
        dailyChallengeStatus.textContent = `Best Today: ${status.entry.correct}/${status.entry.total} in ${status.entry.timeSeconds}s`;
      }
      if (btnStartDailyChallenge) btnStartDailyChallenge.textContent = 'Replay Daily';
      if (btnShareDailyLobby) btnShareDailyLobby.classList.remove('hidden');
      state.lastDailyShareText = formatDailyShareText(status.dateKey, status.entry);
    } else {
      if (dailyChallengeStatus) {
        dailyChallengeStatus.textContent = 'Same 15 facts worldwide today · +50 Bonus XP';
      }
      if (btnStartDailyChallenge) btnStartDailyChallenge.textContent = 'Play Daily';
      if (btnShareDailyLobby) btnShareDailyLobby.classList.add('hidden');
    }
  }

  function syncDurationUI() {
    durationBtns.forEach(b => {
      const dur = parseInt(b.dataset.duration, 10);
      if (dur === state.blitzDuration) {
        b.className = 'duration-btn px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold text-[9px] sm:text-[10px]';
      } else {
        b.className = 'duration-btn px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] sm:text-[10px]';
      }
    });
  }

  function syncInputStyleUI() {
    if (!inputStyleChoice || !inputStyleDirect) return;
    if (state.inputStyle === 'choice') {
      inputStyleChoice.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white transition-all shadow-sm';
      inputStyleDirect.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all';
    } else {
      inputStyleDirect.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white transition-all shadow-sm';
      inputStyleChoice.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all';
    }
  }

  function syncAutoSubmitUI() {
    if (autoSubmitStatus) {
      autoSubmitStatus.textContent = state.autoSubmit ? 'On' : 'Off';
      autoSubmitStatus.className = state.autoSubmit ? 'text-emerald-400' : 'text-slate-400';
    }
    if (btnAutoSubmitToggle) {
      btnAutoSubmitToggle.className = state.autoSubmit
        ? 'px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/50 text-[11px] font-bold text-emerald-300 transition-all active:scale-95'
        : 'px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 hover:text-white transition-all active:scale-95';
    }
  }

  function syncSettingsCollapse() {
    if (settingsPanelBody) {
      settingsPanelBody.classList.toggle('hidden', state.settingsCollapsed);
    }
    if (settingsChevron) {
      settingsChevron.classList.toggle('rotate-180', !state.settingsCollapsed);
    }
    updateSettingsSummaryPill();
  }

  function updateSettingsSummaryPill() {
    if (!settingsSummaryPill) return;
    const opLabels = { multiply: '×', divide: '÷', missing: '?', add: '+', subtract: '−', mixed: 'Mixed' };
    const opLabel = opLabels[state.operation] || '×';
    const diffLabel = capitalize(state.difficulty);
    const inputLabel = state.inputStyle === 'direct' ? (state.autoSubmit ? 'Numpad (Auto)' : 'Numpad') : 'Choice';
    const tableInfo = isTableOperation(state.operation) && state.customTables.length < 12
      ? ` · ${state.customTables.length} tbls`
      : '';
    settingsSummaryPill.textContent = `${opLabel} · ${diffLabel} · ${inputLabel}${tableInfo}`;
  }

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

  function isTableOperation(op) {
    return op === 'multiply' || op === 'divide' || op === 'missing';
  }

  function resetChoiceStyles(buttons) {
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('choice-correct', 'choice-wrong', 'opacity-25', 'pointer-events-none');
    });
  }

  function highlightChoices(buttons, chosenAnswer, correctAnswer) {
    const chosenNum = Number(chosenAnswer);
    const correctNum = Number(correctAnswer);
    buttons.forEach(btn => {
      const val = Number(btn.dataset.answer);
      if (val === correctNum) {
        btn.classList.add('choice-correct');
      } else if (val === chosenNum && chosenNum !== correctNum) {
        btn.classList.add('choice-wrong');
      }
    });
  }

  function handleQuestUpdates(metrics) {
    const res = StorageManager.updateDailyQuestProgress(metrics);
    if (res.newlyCompleted && res.newlyCompleted.length > 0) {
      res.newlyCompleted.forEach((q, idx) => {
        state.roundXPGained += q.rewardXP;
        setTimeout(() => {
          SoundEngine.playLevelUp();
          spawnFloatingXP(`Quest Done: ${q.title} (+${q.rewardXP} XP)`, true);
        }, idx * 500);
      });
      syncPlayerHUD();
    }
  }

  function syncRecommendedQuest() {
    const rec = StorageManager.getRecommendedQuest();
    state.recommendedQuest = rec;
    if (recQuestBadge) recQuestBadge.textContent = rec.badge;
    if (recQuestTitle) recQuestTitle.textContent = rec.title;
    if (recQuestSubtitle) recQuestSubtitle.textContent = rec.subtitle;
    if (btnRecQuestStart) btnRecQuestStart.textContent = rec.cta;
  }

  function syncDailyPanel() {
    const streak = StorageManager.getDailyStreak();
    const quests = StorageManager.getDailyQuests();

    if (dailyStreakCount) {
      dailyStreakCount.textContent = `${streak.count} Day Streak`;
    }
    if (dailyQuestsSummary) {
      dailyQuestsSummary.textContent = `${quests.completedCount}/${quests.totalCount} Done`;
    }
    if (dailyQuestsList) {
      dailyQuestsList.innerHTML = '';
      quests.items.forEach(q => {
        const isDone = q.progress >= q.target;
        const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
        const card = document.createElement('div');
        card.className = `p-2.5 rounded-xl border transition-all ${
          isDone
            ? 'bg-emerald-950/40 border-emerald-500/40'
            : 'bg-slate-800/70 border-slate-700/60'
        }`;
        card.innerHTML = `
          <div class="flex items-center justify-between gap-1 text-[11px] font-bold mb-1">
            <span class="${isDone ? 'text-emerald-300' : 'text-slate-200'} truncate">${q.title}</span>
            <span class="text-[10px] font-mono ${isDone ? 'text-emerald-400' : 'text-amber-400'} flex-shrink-0">+${q.rewardXP} XP</span>
          </div>
          <div class="w-full bg-slate-900/90 h-1.5 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-400' : 'bg-indigo-500'}" style="width: ${pct}%"></div>
          </div>
          <div class="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
            <span>${q.progress}/${q.target}</span>
            <span>${isDone ? 'Claimed ✓' : `${pct}%`}</span>
          </div>
        `;
        dailyQuestsList.appendChild(card);
      });
    }
  }

  function syncLobbySelectors() {
    opBtns.forEach(b => {
      if (b.dataset.op === state.operation) {
        b.className = 'op-btn py-2.5 px-3 rounded-xl border border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95';
      } else {
        b.className = 'op-btn py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95';
      }
    });

    diffBtns.forEach(b => {
      if (b.dataset.diff === state.difficulty) {
        b.className = 'diff-btn py-2 px-2.5 rounded-xl border border-indigo-500 bg-indigo-600/20 text-indigo-300 font-semibold text-xs transition-all active:scale-95 text-center';
      } else {
        b.className = 'diff-btn py-2 px-2.5 rounded-xl border border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white font-semibold text-xs transition-all active:scale-95 text-center';
      }
    });

    const borderMap = {
      blitz: 'border-indigo-500',
      pvp: 'border-amber-500',
      meteor: 'border-sky-500',
      survival: 'border-rose-500',
      endless: 'border-cyan-500',
      flashcards: 'border-emerald-500',
    };
    if (borderMap[state.mode]) {
      modeCards.forEach(c => {
        c.classList.remove(
          'border-indigo-500', 'border-cyan-500', 'border-sky-500', 'border-amber-500', 'border-rose-500', 'border-emerald-500',
          'border-2'
        );
        if (c.dataset.mode === state.mode) {
          c.classList.add(borderMap[state.mode], 'border-2');
          c.classList.remove('border-slate-800', 'border');
        } else {
          c.classList.add('border-slate-800', 'border');
        }
      });
    }

    if (isTableOperation(state.operation)) {
      customTablesWrapper.classList.remove('hidden');
    } else {
      customTablesWrapper.classList.add('hidden');
    }

    renderTableChips();
    updateSettingsSummaryPill();
  }

  function syncLobbyStats() {
    const mistakes = StorageManager.getMistakes();
    if (mistakes.length > 0) {
      lobbyMistakesAlert.classList.remove('hidden');
      lobbyMistakesCount.textContent = mistakes.length;
    } else {
      lobbyMistakesAlert.classList.add('hidden');
    }

    renderTableChips();
    syncRecommendedQuest();
    syncDailyChallengeCard();
    syncDailyPanel();
  }

  function renderTableChips() {
    tableChipsContainer.innerHTML = '';
    const mastery = StorageManager.getTableMastery();

    for (let i = 1; i <= 12; i++) {
      const m = mastery[i] || { status: 'untested', progressPercent: 0, accuracy: 0, mastered: 0, tested: 0 };
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `table-chip py-1.5 px-1.5 rounded-xl text-xs font-bold font-mono transition-all border active:scale-95 flex flex-col items-center ${
        state.customTables.includes(i)
          ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
      }`;
      chip.dataset.table = i;
      chip.title = m.tested > 0
        ? `${i}× Table: ${m.accuracy}% accuracy (${m.mastered}/12 mastered)`
        : `${i}× Table: Untested`;

      let barColor = 'bg-slate-600';
      let barWidth = 0;
      if (m.status === 'mastered') {
        barColor = 'bg-emerald-400';
        barWidth = 100;
      } else if (m.status === 'learning') {
        barColor = 'bg-amber-400';
        barWidth = Math.max(25, m.progressPercent);
      } else if (m.status === 'struggling') {
        barColor = 'bg-rose-400';
        barWidth = Math.max(30, m.accuracy);
      }

      chip.innerHTML = `
        <span>${i}×</span>
        <span class="table-mastery-bar">
          <span class="block h-full rounded-full ${barColor}" style="width: ${barWidth}%"></span>
        </span>
      `;

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
        persistPreferences();
      });

      tableChipsContainer.appendChild(chip);
    }
  }

  // =========================================================================
  // VIEW SWITCHING
  // =========================================================================
  function showView(viewId) {
    if (typeof ArcadeGames !== 'undefined') {
      if (viewId !== 'view-meteor') ArcadeGames.MeteorBlaster.stop();
      if (viewId !== 'view-tug') ArcadeGames.TugOfWar.stop();
    }
    if (typeof PvpArena !== 'undefined' && viewId !== 'view-pvp') {
      PvpArena.stop();
    }

    [viewLobby, viewQuiz, viewPvp, viewFlashcards, viewResults, viewMeteor, viewTug].forEach(el => {
      if (el) el.classList.add('hidden');
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
      refreshLobbyOnlineCount();
    }
  }

  // =========================================================================
  // GAME LAUNCHER
  // =========================================================================
  function clearPendingTimers() {
    clearInterval(state.timerInterval);
    clearInterval(state.survivalFuseInterval);
    clearInterval(state.dailyElapsedTimer);
    state.timerInterval = null;
    state.survivalFuseInterval = null;
    state.dailyElapsedTimer = null;
    if (state.pendingTimeout) {
      clearTimeout(state.pendingTimeout);
      state.pendingTimeout = null;
    }
    state.isPaused = false;
    state.resumeNeedsNextProblem = false;
    if (quizPauseOverlay) quizPauseOverlay.classList.add('hidden');
  }

  function startGame(customMode = null) {
    clearPendingTimers();

    if (customMode) {
      state.mode = customMode;
    }

    const currentData = StorageManager.getData();
    state.roundStartLevel = StorageManager.getLevelInfo(currentData.xp).level;
    state.roundXPGained = 0;

    state.score = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.correctCount = 0;
    state.totalCount = 0;
    state.hearts = 3;
    state.endlessCardCount = 1;
    state.roundMistakes = [];
    state.retryQueue = [];
    state.isEvaluating = false;
    state.isPaused = false;
    state.isCardTransitioning = false;
    state.directInputVal = '';
    state.problemStartTime = 0;
    state.survivalFloor = 1;
    state.survivalSolved = 0;
    state.survival5050Left = 2;
    state.survivalSkipLeft = 1;
    state.survival5050UsedOnCurrent = false;
    disableFeverMode();

    if (state.mode === 'daily') {
      state.dailyDateKey = StorageManager.getDateKey();
      state.dailyDeck = MathEngine.generateDailyChallenge(state.dailyDateKey, 15);
      state.dailyIndex = 0;
      state.dailyResults = [];
      state.dailyElapsedSeconds = 0;
      state.dailyStartTime = Date.now();
    }

    if (state.mode === 'pvp' && typeof PvpArena !== 'undefined') {
      const initialCode = state.pendingPvpCode || '';
      const initialFormat = state.pendingPvpFormat || '';
      state.pendingPvpCode = '';
      state.pendingPvpFormat = '';
      showView('view-pvp');
      PvpArena.open({
        operation: state.operation,
        difficulty: state.difficulty,
        inputStyle: state.inputStyle,
        autoSubmit: state.autoSubmit,
        initialCode,
        initialFormat,
        onOpenLocalTug: () => {
          showView('view-tug');
          ArcadeGames.TugOfWar.start({
            operation: state.operation,
            difficulty: state.difficulty,
            customTables: isTableOperation(state.operation) ? state.customTables : [],
            onWin: () => {
              StorageManager.addXP(20);
              syncPlayerHUD();
              handleQuestUpdates({ answered: 5 });
            },
            onExit: () => showView('view-lobby'),
          });
        },
        onStatsAttempt: (prob, isCorrect, rt) => {
          const factors = prob.matrixFactors || (prob.operation === 'multiply' ? [prob.num1, prob.num2] : null);
          if (factors && factors.length === 2) {
            StorageManager.recordMatrixAttempt(factors[0], factors[1], isCorrect, rt);
          }
          if (!isCorrect) {
            StorageManager.recordMistake(prob);
          }
          handleQuestUpdates({ answered: 1, fastCorrect: (isCorrect && rt < 3000) ? 1 : 0 });
        },
        onMatchComplete: ({ outcome, format, xpGained, correctCount, totalCount, maxStreak }) => {
          StorageManager.recordPvpResult({ outcome, format });
          if (xpGained > 0) {
            StorageManager.addXP(xpGained);
          }
          StorageManager.recordGameResult({
            mode: 'pvp',
            score: 0,
            streak: maxStreak || 0,
            correct: correctCount || 0,
            total: totalCount || 0,
          });
          handleQuestUpdates({
            pvpWins: outcome === 'win' ? 1 : 0,
            maxStreak: maxStreak || 0,
          });
          const newlyUnlocked = StorageManager.checkAchievements();
          if (newlyUnlocked.length > 0) {
            newlyUnlocked.forEach((ach, i) => {
              setTimeout(() => {
                spawnFloatingXP(`Badge Unlocked: ${ach.title}!`, true);
              }, i * 650);
            });
          }
          syncPlayerHUD();
        },
        onToast: (msg, type) => showToast(msg, type),
        onExit: () => showView('view-lobby'),
      });
    } else if (state.mode === 'flashcards') {
      startFlashcards();
    } else if (state.mode === 'meteor' && typeof ArcadeGames !== 'undefined') {
      showView('view-meteor');
      ArcadeGames.MeteorBlaster.start({
        operation: state.operation,
        difficulty: state.difficulty,
        customTables: isTableOperation(state.operation) ? state.customTables : [],
        weakFacts: StorageManager.getWeakFacts(state.operation),
        onStatsAttempt: (prob, isCorrect, rt) => {
          const factors = prob.matrixFactors || (prob.operation === 'multiply' ? [prob.num1, prob.num2] : null);
          if (factors && factors.length === 2) {
            StorageManager.recordMatrixAttempt(factors[0], factors[1], isCorrect, rt);
          }
          if (!isCorrect) {
            StorageManager.recordMistake(prob);
            state.roundMistakes.push({ ...prob });
          }
          handleQuestUpdates({ answered: 1, fastCorrect: isCorrect ? 1 : 0 });
        },
        onFinish: (summary) => {
          state.score = summary.score;
          state.maxStreak = summary.maxStreak;
          state.correctCount = summary.correctCount;
          state.totalCount = summary.totalCount;
          state.lastMeteorWave = summary.wave || 1;
          state.roundXPGained += summary.xpGained;
          if (summary.xpGained > 0) {
            StorageManager.addXP(summary.xpGained);
          }
          endGame(`Meteor Wave ${state.lastMeteorWave}!`);
        },
        onExit: () => showView('view-lobby'),
      });
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
      spawnFloatingXP('FEVER MODE! (3.5x pts)', true);
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
  // VISUAL DOT ARRAY (INTERACTIVE SKIP-COUNTING AREA MODEL)
  // =========================================================================
  function renderVisualDotGrid(container, num1, num2, skipBannerEl = null, maskFinal = false) {
    container.innerHTML = '';
    if (skipBannerEl) {
      skipBannerEl.classList.add('hidden');
      skipBannerEl.textContent = '';
    }
    const arrayInfo = MathEngine.generateVisualArray(num1, num2);
    const rowElements = [];

    for (let r = 0; r < arrayInfo.rows; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'flex gap-1 items-center justify-center cursor-pointer px-1.5 py-0.5 rounded-lg hover:bg-indigo-500/10 transition-colors';
      rowDiv.title = `Tap to skip-count ${r + 1} row(s) of ${arrayInfo.cols}`;

      const rowDots = [];
      for (let c = 0; c < arrayInfo.cols; c++) {
        const dot = document.createElement('div');
        dot.className = 'array-dot cursor-pointer';
        dot.title = `Row ${r + 1}, Col ${c + 1}`;
        rowDiv.appendChild(dot);
        rowDots.push(dot);
      }

      rowDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        SoundEngine.playClick();
        rowElements.forEach((dots, idx) => {
          dots.forEach(d => d.classList.toggle('row-active', idx <= r));
        });
        if (skipBannerEl) {
          const seq = [];
          for (let k = 1; k <= r + 1; k++) {
            if (maskFinal && k === arrayInfo.rows && !arrayInfo.isScaled) {
              seq.push('?');
            } else {
              seq.push(String(k * arrayInfo.cols));
            }
          }
          skipBannerEl.textContent = `Skip-count: ${seq.join(', ')}`;
          skipBannerEl.classList.remove('hidden');
        }
      });

      rowElements.push(rowDots);
      container.appendChild(rowDiv);
    }
  }

  // =========================================================================
  // QUIZ ENGINE (Speed Blitz, Survival Gauntlet, Endless, Mistake Drill & Daily)
  // =========================================================================
  function startQuiz() {
    showView('view-quiz');

    // Reset visibility of mode-specific HUD widgets
    hudTimerContainer.classList.add('hidden');
    hudHeartsContainer.classList.add('hidden');
    if (hudSurvivalFloor) hudSurvivalFloor.classList.add('hidden');
    if (survivalFuseWrap) survivalFuseWrap.classList.add('hidden');
    if (survivalLifelinesBar) survivalLifelinesBar.classList.add('hidden');
    if (hudEndlessContainer) hudEndlessContainer.classList.add('hidden');
    if (hudDailyContainer) hudDailyContainer.classList.add('hidden');
    if (btnQuizFinish) btnQuizFinish.classList.add('hidden');
    if (btnQuizPause) btnQuizPause.classList.add('hidden');
    if (quizPauseOverlay) quizPauseOverlay.classList.add('hidden');

    if (state.mode === 'blitz') {
      hudTimerContainer.classList.remove('hidden');
      if (btnQuizPause) btnQuizPause.classList.remove('hidden');
      state.timeLeft = state.blitzDuration;
      hudTimerVal.textContent = state.timeLeft;
      hudTimerVal.classList.remove('text-rose-400');
      startBlitzTimer();
    } else if (state.mode === 'survival') {
      state.survivalFloor = 1;
      state.survivalSolved = 0;
      state.survival5050Left = 2;
      state.survivalSkipLeft = 1;
      state.survival5050UsedOnCurrent = false;
      hudHeartsContainer.classList.remove('hidden');
      if (hudSurvivalFloor) hudSurvivalFloor.classList.remove('hidden');
      if (survivalFuseWrap) survivalFuseWrap.classList.remove('hidden');
      if (survivalLifelinesBar) survivalLifelinesBar.classList.remove('hidden');
      if (btnQuizPause) btnQuizPause.classList.remove('hidden');
      renderHearts();
      updateSurvivalFloorUI();
      updateSurvivalLifelinesUI();
    } else if (state.mode === 'endless') {
      if (hudEndlessContainer) hudEndlessContainer.classList.remove('hidden');
      if (btnQuizFinish) btnQuizFinish.classList.remove('hidden');
      state.endlessCardCount = 1;
      if (hudEndlessCardVal) hudEndlessCardVal.textContent = `#${state.endlessCardCount}`;
    } else if (state.mode === 'daily') {
      if (hudDailyContainer) hudDailyContainer.classList.remove('hidden');
      if (btnQuizPause) btnQuizPause.classList.remove('hidden');
      if (hudDailyProgress) hudDailyProgress.textContent = `Q 1/${state.dailyDeck.length}`;
      if (hudDailyElapsed) hudDailyElapsed.textContent = '0s';
      resumeDailyElapsedTimer();
    } else if (state.mode === 'mistake_drill') {
      // Untimed, mistake drill
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

  function resumeBlitzTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      if (state.isPaused) return;
      state.timeLeft--;
      hudTimerVal.textContent = state.timeLeft;

      if (state.timeLeft <= 5 && state.timeLeft > 0) {
        SoundEngine.playTick();
        hudTimerVal.classList.add('text-rose-400');
      } else if (state.timeLeft > 5) {
        hudTimerVal.classList.remove('text-rose-400');
      }

      if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        endGame('Time Up!');
      }
    }, 1000);
  }

  function startBlitzTimer() {
    state.timeLeft = state.blitzDuration;
    hudTimerVal.textContent = state.timeLeft;
    resumeBlitzTimer();
  }

  function resumeDailyElapsedTimer() {
    clearInterval(state.dailyElapsedTimer);
    state.dailyElapsedTimer = setInterval(() => {
      if (state.isPaused) return;
      state.dailyElapsedSeconds++;
      if (hudDailyElapsed) hudDailyElapsed.textContent = `${state.dailyElapsedSeconds}s`;
    }, 1000);
  }

  function toggleQuizPause() {
    if (viewQuiz.classList.contains('hidden')) return;
    if (!['blitz', 'daily', 'survival'].includes(state.mode)) return;

    SoundEngine.playClick();
    if (!state.isPaused) {
      state.isPaused = true;
      state.pauseStartedAt = Date.now();
      clearInterval(state.timerInterval);
      clearInterval(state.survivalFuseInterval);
      clearInterval(state.dailyElapsedTimer);
      state.timerInterval = null;
      state.survivalFuseInterval = null;
      state.dailyElapsedTimer = null;
      if (state.pendingTimeout) {
        clearTimeout(state.pendingTimeout);
        state.pendingTimeout = null;
        state.resumeNeedsNextProblem = true;
      }
      if (state.mode === 'survival') updateSurvivalLifelinesUI();
      if (quizPauseOverlay) quizPauseOverlay.classList.remove('hidden');
    } else {
      state.isPaused = false;
      const pausedMs = Date.now() - state.pauseStartedAt;
      if (state.problemStartTime) state.problemStartTime += pausedMs;
      if (state.dailyStartTime) state.dailyStartTime += pausedMs;
      if (quizPauseOverlay) quizPauseOverlay.classList.add('hidden');
      if (state.mode === 'blitz') resumeBlitzTimer();
      if (state.mode === 'daily') resumeDailyElapsedTimer();
      if (state.mode === 'survival') {
        updateSurvivalLifelinesUI();
        if (!state.resumeNeedsNextProblem) resumeSurvivalFuse();
      }
      if (state.resumeNeedsNextProblem) {
        state.resumeNeedsNextProblem = false;
        loadNextProblem();
      }
    }
  }

  function updateSurvivalFloorUI() {
    if (!hudSurvivalFloor || typeof MathEngine === 'undefined') return;
    const cfg = MathEngine.getSurvivalFloorConfig(state.survivalFloor);
    hudSurvivalFloor.textContent = `F${cfg.floor} · ${cfg.label}`;
  }

  function updateSurvivalFuseUI() {
    if (survivalFuseText) {
      survivalFuseText.textContent = `${Math.max(0, state.survivalFuseLeft).toFixed(1)}s`;
    }
    if (survivalFuseBar) {
      const pct = state.survivalFuseMax > 0
        ? Math.max(0, Math.min(100, (state.survivalFuseLeft / state.survivalFuseMax) * 100))
        : 0;
      survivalFuseBar.style.width = `${pct}%`;
    }
  }

  function startSurvivalFuse() {
    clearInterval(state.survivalFuseInterval);
    const cfg = MathEngine.getSurvivalFloorConfig(state.survivalFloor);
    state.survivalFuseMax = cfg.timePerQuestion;
    state.survivalFuseLeft = cfg.timePerQuestion;
    updateSurvivalFuseUI();
    resumeSurvivalFuse();
  }

  function resumeSurvivalFuse() {
    clearInterval(state.survivalFuseInterval);
    state.survivalFuseInterval = setInterval(() => {
      if (state.isPaused || state.isEvaluating || state.mode !== 'survival') return;
      state.survivalFuseLeft = Math.max(0, state.survivalFuseLeft - 0.1);
      updateSurvivalFuseUI();

      if (state.survivalFuseLeft <= 0) {
        clearInterval(state.survivalFuseInterval);
        state.survivalFuseInterval = null;
        state.isEvaluating = true;
        state.totalCount++;
        if (state.currentProblem) {
          const factors = state.currentProblem.matrixFactors ||
            (state.currentProblem.operation === 'multiply' ? [state.currentProblem.num1, state.currentProblem.num2] : null);
          if (factors && factors.length === 2) {
            StorageManager.recordMatrixAttempt(factors[0], factors[1], false, state.survivalFuseMax * 1000);
          }
          quizHintText.textContent = `Time Up! ${state.currentProblem.equation} = ${state.currentProblem.answer}`;
        }
        handleIncorrectAnswer();
      }
    }, 100);
  }

  function updateSurvivalLifelinesUI() {
    if (survival5050Count) survival5050Count.textContent = state.survival5050Left;
    if (survivalSkipCount) survivalSkipCount.textContent = state.survivalSkipLeft;
    if (btnSurvival5050) {
      btnSurvival5050.disabled = state.mode !== 'survival' ||
        state.survival5050Left <= 0 ||
        state.survival5050UsedOnCurrent ||
        state.isEvaluating ||
        state.isPaused;
    }
    if (btnSurvivalSkip) {
      btnSurvivalSkip.disabled = state.mode !== 'survival' ||
        state.survivalSkipLeft <= 0 ||
        state.isEvaluating ||
        state.isPaused;
    }
  }

  function useSurvival5050() {
    if (state.mode !== 'survival' || state.survival5050Left <= 0 || state.survival5050UsedOnCurrent || state.isEvaluating || state.isPaused || !state.currentProblem) {
      return;
    }
    SoundEngine.playClick();
    state.survival5050Left--;
    state.survival5050UsedOnCurrent = true;

    if (state.inputStyle === 'choice') {
      const wrongBtns = Array.from(choiceBtns).filter(btn => Number(btn.dataset.answer) !== state.currentProblem.answer && !btn.disabled);
      for (let i = wrongBtns.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wrongBtns[i], wrongBtns[j]] = [wrongBtns[j], wrongBtns[i]];
      }
      wrongBtns.slice(0, 2).forEach(btn => {
        btn.disabled = true;
        btn.classList.add('opacity-25', 'pointer-events-none');
      });
      quizHintText.textContent = '50/50 Lifeline: 2 wrong answers eliminated!';
    } else {
      const ansStr = String(state.currentProblem.answer);
      quizHintText.textContent = ansStr.length > 1
        ? `50/50 Hint: Starts with "${ansStr[0]}" (${ansStr.length} digits)`
        : '50/50 Hint: Single-digit answer!';
    }
    updateSurvivalLifelinesUI();
  }

  function useSurvivalSkip() {
    if (state.mode !== 'survival' || state.survivalSkipLeft <= 0 || state.isEvaluating || state.isPaused || !state.currentProblem) {
      return;
    }
    SoundEngine.playShieldBlock();
    clearInterval(state.survivalFuseInterval);
    state.survivalFuseInterval = null;
    state.survivalSkipLeft--;
    spawnFloatingXP('SHIELD SKIP!', true);
    updateSurvivalLifelinesUI();
    loadNextProblem();
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
    state.survival5050UsedOnCurrent = false;
    updateDirectInputDisplay();
    resetChoiceStyles(choiceBtns);

    let fromRetry = false;

    if (state.mode === 'daily') {
      if (state.dailyIndex >= state.dailyDeck.length) {
        endGame('Daily Challenge Complete!');
        return;
      }
      state.currentProblem = state.dailyDeck[state.dailyIndex];
      if (hudDailyProgress) {
        hudDailyProgress.textContent = `Q ${state.dailyIndex + 1}/${state.dailyDeck.length}`;
      }
    } else if (state.mode === 'mistake_drill') {
      const mistakes = StorageManager.getMistakes();
      if (mistakes.length === 0) {
        endGame('Mistakes Mastered!');
        return;
      }
      const m = mistakes[0];
      const options = MathEngine.generateDistractors(m.answer, m.operation, m.num1, m.num2);
      state.currentProblem = {
        ...m,
        options,
      };
    } else {
      state.retryQueue.forEach(item => { item.dueIn--; });
      const dueIdx = state.retryQueue.findIndex(item => item.dueIn <= 0);
      if (dueIdx !== -1) {
        const [dueItem] = state.retryQueue.splice(dueIdx, 1);
        const prob = dueItem.problem;
        state.currentProblem = {
          ...prob,
          options: MathEngine.generateDistractors(prob.answer, prob.operation, prob.num1, prob.num2),
        };
        fromRetry = true;
      } else {
        const targetDifficulty = state.mode === 'survival'
          ? MathEngine.getSurvivalFloorConfig(state.survivalFloor).difficulty
          : state.difficulty;
        state.currentProblem = MathEngine.generateProblem({
          operation: state.operation,
          difficulty: targetDifficulty,
          customTables: isTableOperation(state.operation) ? state.customTables : [],
          weakFacts: StorageManager.getWeakFacts(state.operation),
        });
      }
    }

    state.problemStartTime = Date.now();
    quizOpSymbol.textContent = state.currentProblem.symbol;
    quizOpTitle.textContent = state.currentProblem.operation === 'missing'
      ? 'Mystery Factor'
      : capitalize(state.currentProblem.operation);
    quizEquationText.textContent = state.currentProblem.equation;
    quizHintText.textContent = fromRetry ? 'Recall Check — try this one again!' : '';

    if (SoundEngine.isSpeechEnabled()) {
      SoundEngine.speakEquation(
        state.currentProblem.num1,
        state.currentProblem.operation,
        state.currentProblem.num2,
        false,
        state.currentProblem
      );
    }

    if (state.currentProblem.operation === 'multiply' && state.currentProblem.num1 <= 12 && state.currentProblem.num2 <= 12) {
      quizVisualArrayWrapper.classList.remove('hidden');
      quizVisualLabel.classList.remove('text-emerald-400', 'text-rose-400');
      quizVisualLabel.textContent = `${state.currentProblem.num1} × ${state.currentProblem.num2} = ?`;
      renderVisualDotGrid(quizVisualDots, state.currentProblem.num1, state.currentProblem.num2, quizSkipCountBanner, true);
    } else {
      quizVisualArrayWrapper.classList.add('hidden');
      if (quizSkipCountBanner) quizSkipCountBanner.classList.add('hidden');
    }

    if (state.inputStyle === 'choice') {
      choiceBtns.forEach((btn, index) => {
        const val = state.currentProblem.options[index];
        const valSpan = btn.querySelector('.choice-val');
        valSpan.textContent = val !== undefined ? val : '';
        btn.dataset.answer = val;
      });
    }

    if (state.mode === 'survival') {
      updateSurvivalFloorUI();
      updateSurvivalLifelinesUI();
      startSurvivalFuse();
    }
  }

  function handleAnswerSubmit(playerAnswer) {
    if (state.isEvaluating || state.isPaused || !state.currentProblem) return;
    state.isEvaluating = true;
    state.totalCount++;

    const responseTimeMs = state.problemStartTime ? Date.now() - state.problemStartTime : null;
    const isCorrect = Number(playerAnswer) === state.currentProblem.answer;

    if (state.mode === 'daily') {
      state.dailyResults.push(isCorrect);
      state.dailyIndex++;
    }

    if (state.inputStyle === 'choice') {
      highlightChoices(choiceBtns, playerAnswer, state.currentProblem.answer);
    }

    const factors = state.currentProblem.matrixFactors ||
      (state.currentProblem.operation === 'multiply' ? [state.currentProblem.num1, state.currentProblem.num2] : null);
    if (factors && factors.length === 2) {
      StorageManager.recordMatrixAttempt(factors[0], factors[1], isCorrect, responseTimeMs);
    }

    handleQuestUpdates({
      answered: 1,
      directCorrect: (isCorrect && state.inputStyle === 'direct') ? 1 : 0,
      fastCorrect: (isCorrect && responseTimeMs !== null && responseTimeMs < 3000) ? 1 : 0,
      maxStreak: isCorrect ? state.streak + 1 : 0,
    });

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  }

  function handleCorrectAnswer() {
    clearInterval(state.survivalFuseInterval);
    state.survivalFuseInterval = null;
    state.correctCount++;
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);

    checkFeverMode();

    const multiplier = getMultiplier(state.streak);
    const inputBonus = state.inputStyle === 'direct' ? 1.25 : 1.0;
    const floorBonus = state.mode === 'survival'
      ? MathEngine.getSurvivalFloorConfig(state.survivalFloor).scoreMultiplier
      : 1.0;
    const basePoints = state.difficulty === 'hard' ? 25 : state.difficulty === 'medium' ? 15 : 10;
    const gainedScore = Math.round(basePoints * multiplier * inputBonus * floorBonus);
    state.score += gainedScore;

    const earnedXP = Math.round(5 * multiplier * inputBonus);
    state.roundXPGained += earnedXP;
    StorageManager.addXP(earnedXP);

    if (state.streak >= 3) {
      SoundEngine.playStreak(state.streak);
      if (state.streak % 5 === 0) {
        Confetti.burst(35);
      }
    } else {
      SoundEngine.playCorrect();
    }
    triggerHaptic(12);

    spawnFloatingXP(`+${gainedScore} pts! ${multiplier > 1 ? `(${multiplier}x)` : ''}${inputBonus > 1 ? ' +25%' : ''}`);

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

    if (state.mode === 'endless') {
      state.endlessCardCount++;
      if (hudEndlessCardVal) hudEndlessCardVal.textContent = `#${state.endlessCardCount}`;
    }

    if (state.mode === 'survival') {
      state.survivalSolved++;
      if (state.survivalSolved % 5 === 0) {
        state.survivalFloor++;
        state.roundXPGained += 25;
        StorageManager.addXP(25);
        if ((state.survivalFloor - 1) % 3 === 0) {
          state.survivalSkipLeft++;
        }
        updateSurvivalFloorUI();
        Confetti.burst(35);
        setTimeout(() => {
          spawnFloatingXP(`FLOOR ${state.survivalFloor}! +25 XP`, true);
        }, 160);
      }
      if (state.streak > 0 && state.streak % 10 === 0 && state.hearts < 3) {
        state.hearts++;
        renderHearts();
        setTimeout(() => {
          spawnFloatingXP('+1 HEART! (Second Wind)', true);
        }, 260);
      }
      updateSurvivalLifelinesUI();
    }

    // Blitz Mode Streak Time Bonus (Tiered: +2s @ 3 streak, +3s @ 5 streak, +5s @ 10+ streak)
    if (state.mode === 'blitz') {
      let timeBonus = 0;
      let bonusMessage = '';

      if (state.streak >= 10 && state.streak % 5 === 0) {
        timeBonus = 5;
        bonusMessage = '+5s MEGA STREAK BONUS!';
      } else if (state.streak === 5) {
        timeBonus = 3;
        bonusMessage = '+3s FEVER TIME BONUS!';
      } else if (state.streak === 3) {
        timeBonus = 2;
        bonusMessage = '+2s STREAK TIME BONUS!';
      }

      if (timeBonus > 0) {
        state.timeLeft += timeBonus;
        hudTimerVal.textContent = state.timeLeft;
        if (state.timeLeft > 5) {
          hudTimerVal.classList.remove('text-rose-400');
        }

        hudTimerVal.classList.add('timer-bonus-pulse');
        setTimeout(() => hudTimerVal.classList.remove('timer-bonus-pulse'), 500);

        spawnFloatingXP(bonusMessage, true);
        Confetti.burst(25);
      }
    }

    updateScoreDisplay();
    updateStreakDisplay();
    syncPlayerHUD();

    state.pendingTimeout = setTimeout(loadNextProblem, 320);
  }

  function handleIncorrectAnswer() {
    clearInterval(state.survivalFuseInterval);
    state.survivalFuseInterval = null;
    state.streak = 0;
    disableFeverMode();
    updateStreakDisplay();
    SoundEngine.playWrong();
    triggerHaptic([35, 25, 35]);

    StorageManager.recordMistake(state.currentProblem);
    if (state.mode === 'mistake_drill') {
      StorageManager.rotateMistakeToBack(state.currentProblem.equation);
    }
    state.roundMistakes.push({ ...state.currentProblem });

    if (['blitz', 'endless', 'survival'].includes(state.mode)) {
      const alreadyQueued = state.retryQueue.some(item => item.problem.equation === state.currentProblem.equation);
      if (!alreadyQueued && state.retryQueue.length < 5) {
        state.retryQueue.push({ problem: { ...state.currentProblem }, dueIn: 2 });
      }
    }

    if (state.mode === 'endless') {
      state.endlessCardCount++;
      if (hudEndlessCardVal) hudEndlessCardVal.textContent = `#${state.endlessCardCount}`;
    }

    // Reveal answer on visual area model if active
    if (state.currentProblem.operation === 'multiply') {
      quizVisualLabel.textContent = `${state.currentProblem.num1} × ${state.currentProblem.num2} = ${state.currentProblem.answer}`;
      quizVisualLabel.classList.add('text-rose-400');
    }

    if (state.currentProblem.hint) {
      quizHintText.textContent = `Hint: ${state.currentProblem.hint}`;
    }

    quizCard.classList.remove('animate-correct');
    quizCard.classList.add('animate-shake');
    setTimeout(() => quizCard.classList.remove('animate-shake'), 400);

    if (state.mode === 'survival') {
      state.hearts--;
      renderHearts();
      updateSurvivalLifelinesUI();
      if (state.hearts <= 0) {
        state.pendingTimeout = setTimeout(() => endGame(`Survival Floor ${state.survivalFloor}!`), 500);
        return;
      }
    }

    state.pendingTimeout = setTimeout(loadNextProblem, 900);
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

    if (quizFeverBar) {
      const feverPct = Math.min(100, Math.round((state.streak / 5) * 100));
      quizFeverBar.style.width = `${feverPct}%`;
    }
  }

  function spawnFloatingXP(text, isBonus = false) {
    const badge = document.createElement('div');
    badge.className = isBonus
      ? 'floating-xp-badge px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/50 border border-emerald-300/40'
      : 'floating-xp-badge px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/50';
    badge.textContent = text;
    if (viewQuiz.classList.contains('hidden')) {
      badge.style.position = 'fixed';
      badge.style.top = '5rem';
      badge.style.left = '50%';
      badge.style.transform = 'translateX(-50%)';
      badge.style.zIndex = '60';
      document.body.appendChild(badge);
    } else {
      quizFloatingContainer.appendChild(badge);
    }
    setTimeout(() => badge.remove(), 1100);
  }

  function updateDirectInputDisplay() {
    directDisplayVal.textContent = state.directInputVal !== '' ? state.directInputVal : '_';
  }

  function maybeAutoSubmitQuiz() {
    if (!state.autoSubmit || !state.currentProblem || state.isEvaluating || state.isPaused) return;
    const targetLen = String(state.currentProblem.answer).length;
    if (state.directInputVal.length >= targetLen) {
      handleAnswerSubmit(state.directInputVal);
    }
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
      customTables: isTableOperation(state.operation) ? state.customTables : [],
      weakFacts: StorageManager.getWeakFacts(state.operation),
      count: 15,
    });
    state.flashcardIndex = 0;

    renderCurrentFlashcard();
  }

  function renderCurrentFlashcard() {
    state.isCardFlipped = false;
    state.isCardTransitioning = false;
    fcCardInner.className = 'card-inner relative w-full h-full transform-style-3d min-h-[300px] sm:min-h-[360px]';

    const card = state.flashcardDeck[state.flashcardIndex];
    if (!card) {
      endGame('Flashcard Deck Finished!');
      return;
    }

    fcProgressText.textContent = `Card ${state.flashcardIndex + 1} of ${state.flashcardDeck.length}`;
    fcFrontEquation.textContent = card.equation;
    if (fcFrontPrompt) {
      const promptMap = {
        multiply: 'What is the product?',
        divide: 'What is the quotient?',
        missing: 'What is the missing factor?',
        add: 'What is the sum?',
        subtract: 'What is the difference?',
      };
      fcFrontPrompt.textContent = promptMap[card.operation] || 'What is the answer?';
    }
    fcBackEquation.textContent = `${card.equation} =`;
    fcBackAnswer.textContent = card.answer;
    fcBackHint.textContent = card.hint || `${card.num1} ${card.symbol} ${card.num2} equals ${card.answer}`;

    if (card.operation === 'multiply' && card.num1 <= 12 && card.num2 <= 12) {
      fcVisualDotsContainer.classList.remove('hidden');
      renderVisualDotGrid(fcVisualDotsContainer, card.num1, card.num2, fcSkipCountBanner, false);
    } else {
      fcVisualDotsContainer.classList.add('hidden');
      if (fcSkipCountBanner) fcSkipCountBanner.classList.add('hidden');
    }

    if (SoundEngine.isSpeechEnabled()) {
      SoundEngine.speakEquation(card.num1, card.operation, card.num2, false, card);
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
    if (state.isCardTransitioning) return;
    state.isCardTransitioning = true;

    const card = state.flashcardDeck[state.flashcardIndex];
    if (wasMastered) {
      SoundEngine.playCorrect();
      StorageManager.incrementMasteredCards(1);
      state.roundXPGained += 4;
      StorageManager.addXP(4);
      handleQuestUpdates({ flashcardsMastered: 1 });
    } else {
      SoundEngine.playClick();
      StorageManager.recordMistake(card);
    }

    // Swipe animation class
    const animClass = wasMastered ? 'card-swipe-right' : 'card-swipe-left';
    fcCardInner.classList.add(animClass);

    state.pendingTimeout = setTimeout(() => {
      state.flashcardIndex++;
      if (state.flashcardIndex >= state.flashcardDeck.length) {
        Confetti.cannon();
        endGame('Flashcards Completed!');
      } else {
        renderCurrentFlashcard();
      }
    }, 280);
  }

  // Setup unified Pointer Events on flashcards (works on touch, mouse, trackpad, and Chromebook)
  function setupTouchSwipeGestures() {
    fcFlipCard.style.touchAction = 'pan-y';

    fcFlipCard.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      state.activePointerId = e.pointerId;
      state.touchStartX = e.clientX;
      state.touchStartY = e.clientY;
      state.touchDeltaX = 0;
      state.touchDeltaY = 0;
      state.isSwiping = false;
    });

    fcFlipCard.addEventListener('pointermove', (e) => {
      if (state.activePointerId !== e.pointerId) return;
      state.touchDeltaX = e.clientX - state.touchStartX;
      state.touchDeltaY = e.clientY - state.touchStartY;

      if (Math.abs(state.touchDeltaX) > 20 && Math.abs(state.touchDeltaX) > Math.abs(state.touchDeltaY)) {
        state.isSwiping = true;
      }
    });

    fcFlipCard.addEventListener('pointerup', (e) => {
      if (state.activePointerId !== e.pointerId) return;
      state.activePointerId = null;

      if (state.isSwiping) {
        if (state.touchDeltaX > 55) {
          nextFlashcard(true);
        } else if (state.touchDeltaX < -55) {
          nextFlashcard(false);
        }
      } else if (Math.abs(state.touchDeltaX) < 15 && Math.abs(state.touchDeltaY) < 15) {
        toggleFlipCard();
      }
      state.isSwiping = false;
    });

    fcFlipCard.addEventListener('pointercancel', () => {
      state.activePointerId = null;
      state.isSwiping = false;
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
      matrixGridContainer.className = 'grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1 min-w-[340px]';
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
      const speedText = stat.timedAttempts > 0
        ? ` · Avg ${(stat.totalTimeMs / stat.timedAttempts / 1000).toFixed(1)}s`
        : '';
      matrixInfoStatus.textContent = `${pct}% accuracy (${stat.correct}/${stat.attempts})${speedText}`;
    } else {
      matrixInfoStatus.textContent = 'Untested';
    }

    btnMatrixDrillRow.textContent = `Table of ${row}`;
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
    clearPendingTimers();
    state.isCardTransitioning = false;
    disableFeverMode();

    showView('view-results');
    resultsTitle.textContent = title;
    resultsSubtitle.textContent = 'Excellent mental math workout!';

    let dailyOutcome = null;
    if (state.mode === 'daily') {
      const elapsedSeconds = Math.max(
        1,
        state.dailyElapsedSeconds || Math.round((Date.now() - state.dailyStartTime) / 1000)
      );
      state.lastDailyTimeSeconds = elapsedSeconds;
      dailyOutcome = StorageManager.recordDailyChallengeResult({
        dateKey: state.dailyDateKey || StorageManager.getDateKey(),
        correct: state.correctCount,
        total: state.dailyDeck.length || 15,
        timeSeconds: elapsedSeconds,
        bestStreak: state.maxStreak,
        results: state.dailyResults,
      });
      if (dailyOutcome.bonusXP > 0) {
        state.roundXPGained += dailyOutcome.bonusXP;
      }
      state.lastDailyShareText = formatDailyShareText(
        dailyOutcome.entry.dateKey,
        dailyOutcome.entry
      );
      if (resultsDailyGrid) {
        const cells = state.dailyResults.map(ok => (ok ? '🟩' : '🟥'));
        const rows = [];
        for (let i = 0; i < cells.length; i += 5) {
          rows.push(cells.slice(i, i + 5).join(''));
        }
        resultsDailyGrid.textContent = rows.join('  ');
      }
      if (resultsDailyShareBox) resultsDailyShareBox.classList.remove('hidden');
      if (resultsShareFeedback) resultsShareFeedback.classList.add('hidden');
      resultsSubtitle.textContent = dailyOutcome.isFirstToday
        ? `Finished in ${elapsedSeconds}s · +50 Daily Bonus XP!`
        : `Finished in ${elapsedSeconds}s!`;
    } else if (resultsDailyShareBox) {
      resultsDailyShareBox.classList.add('hidden');
    }

    const accuracyText = state.totalCount > 0
      ? `${Math.round((state.correctCount / state.totalCount) * 100)}%`
      : '—';
    const gainedXP = state.roundXPGained;

    const outcome = StorageManager.recordGameResult({
      mode: state.mode,
      duration: state.blitzDuration,
      score: state.score,
      streak: state.maxStreak,
      correct: state.correctCount,
      total: state.totalCount,
      floor: state.survivalFloor || 1,
    });

    resultsScore.textContent = state.score;
    resultsStreak.textContent = state.maxStreak;
    resultsAccuracy.textContent = accuracyText;
    resultsXP.textContent = `+${gainedXP} XP`;

    const replaySpan = btnResultsReplay && btnResultsReplay.querySelector('span');
    if (replaySpan) {
      replaySpan.textContent = (state.mode === 'mistake_drill' && StorageManager.getMistakes().length === 0)
        ? 'Back to Lobby'
        : 'Play Again';
    }

    const currentLevel = outcome.stats.levelInfo.level;
    if (resultsLevelUpBanner) {
      if (currentLevel > state.roundStartLevel) {
        if (resultsLevelUpNum) resultsLevelUpNum.textContent = currentLevel;
        resultsLevelUpBanner.classList.remove('hidden');
      } else {
        resultsLevelUpBanner.classList.add('hidden');
      }
    }

    if (outcome.newHighScore && state.score > 0) {
      SoundEngine.playLevelUp();
      Confetti.cannon();
      resultsSubtitle.textContent = 'Brand New High Score Record!';
    } else if (state.score > 0 || state.mode === 'flashcards' || state.mode === 'daily') {
      SoundEngine.playLevelUp();
      Confetti.burst(30);
    } else {
      SoundEngine.playGameOver();
    }

    // Check & celebrate newly unlocked achievements
    const newlyUnlocked = StorageManager.checkAchievements();
    if (newlyUnlocked.length > 0) {
      SoundEngine.playLevelUp();
      Confetti.cannon();
      newlyUnlocked.forEach((ach, i) => {
        setTimeout(() => {
          spawnFloatingXP(`Badge Unlocked: ${ach.title}!`, true);
        }, i * 650);
      });
    }

    if (state.roundMistakes.length > 0) {
      resultsMistakesContainer.classList.remove('hidden');
      resultsMistakesList.innerHTML = '';
      state.roundMistakes.forEach(m => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700/60';
        const eqSpan = document.createElement('span');
        eqSpan.className = 'font-mono font-bold text-white';
        eqSpan.textContent = m.equation;
        const ansSpan = document.createElement('span');
        ansSpan.className = 'font-mono font-bold text-emerald-400';
        ansSpan.textContent = `= ${m.answer}`;
        item.appendChild(eqSpan);
        item.appendChild(ansSpan);
        resultsMistakesList.appendChild(item);
      });
    } else {
      resultsMistakesContainer.classList.add('hidden');
    }

    syncPlayerHUD();
    submitScoreToOnlineLeaderboardIfEligible();
  }

  function submitScoreToOnlineLeaderboardIfEligible() {
    if (typeof LeaderboardClient === 'undefined') return;
    let board = null;
    if (state.mode === 'daily' && state.totalCount >= 15) {
      board = 'daily';
    } else if (state.mode === 'blitz' && state.score > 0) {
      board = `blitz_${state.blitzDuration || 60}`;
    } else if (state.mode === 'survival' && state.score > 0) {
      board = 'survival';
    } else if (state.mode === 'meteor' && state.score > 0) {
      board = 'meteor';
    }
    if (!board) return;

    const profile = StorageManager.getActiveProfile();
    LeaderboardClient.submitOnlineScore({
      board,
      dateKey: state.dailyDateKey || StorageManager.getDateKey(),
      room: state.leaderboardRoom,
      name: profile.name,
      avatar: profile.avatar,
      score: state.score,
      correct: state.correctCount,
      total: state.totalCount || 15,
      timeSeconds: state.lastDailyTimeSeconds || 30,
      wave: state.lastMeteorWave || 1,
      floor: state.survivalFloor || 1,
    });
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
        SoundEngine.speakEquation(
          state.currentProblem.num1,
          state.currentProblem.operation,
          state.currentProblem.num2,
          true,
          state.currentProblem
        );
      }
    });

    // Nav XP Pill opens Career Stats
    if (navPlayerBar) {
      navPlayerBar.addEventListener('click', openStatsModal);
      navPlayerBar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openStatsModal();
        }
      });
    }

    // Confirm Modal Actions
    if (btnConfirmCancel) btnConfirmCancel.addEventListener('click', closeConfirmDialog);
    if (modalConfirm) {
      modalConfirm.addEventListener('click', (e) => {
        if (e.target === modalConfirm) closeConfirmDialog();
      });
    }
    if (btnConfirmOk) {
      btnConfirmOk.addEventListener('click', () => {
        const cb = state.pendingConfirmCallback;
        closeConfirmDialog();
        if (cb) cb();
      });
    }

    // Leaderboard Modal Triggers & Controls
    if (btnLeaderboardToggle) btnLeaderboardToggle.addEventListener('click', openLeaderboardModal);
    if (btnMenuLeaderboard) {
      btnMenuLeaderboard.addEventListener('click', () => {
        modalMobileMenu.classList.add('hidden');
        openLeaderboardModal();
      });
    }
    if (btnResultsLeaderboard) btnResultsLeaderboard.addEventListener('click', openLeaderboardModal);
    if (btnCloseLeaderboard) btnCloseLeaderboard.addEventListener('click', closeLeaderboardModal);
    if (btnLeaderboardDone) btnLeaderboardDone.addEventListener('click', closeLeaderboardModal);
    if (btnLbRefresh) btnLbRefresh.addEventListener('click', () => {
      SoundEngine.playClick();
      renderLeaderboardModal();
    });
    if (modalLeaderboard) {
      modalLeaderboard.addEventListener('click', (e) => {
        if (e.target === modalLeaderboard) closeLeaderboardModal();
      });
    }

    lbTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        state.leaderboardTab = btn.dataset.lbTab || 'local';
        renderLeaderboardModal();
      });
    });

    lbLocalCatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        state.leaderboardLocalCat = btn.dataset.localCat || 'xp';
        renderLeaderboardModal();
      });
    });

    if (btnLbApplyRoom) {
      btnLbApplyRoom.addEventListener('click', () => {
        SoundEngine.playClick();
        const raw = inputLbRoomCode ? inputLbRoomCode.value.trim() : '';
        const normalized = typeof LeaderboardClient !== 'undefined'
          ? LeaderboardClient.normalizeRoomCode(raw)
          : raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
        if (raw && normalized.length < 3) {
          showToast('Room code must be at least 3 letters/numbers.', 'error');
          return;
        }
        state.leaderboardRoom = normalized;
        if (inputLbRoomCode) inputLbRoomCode.value = normalized;
        persistPreferences();
        renderLeaderboardModal();
      });
    }

    if (btnLbClearRoom) {
      btnLbClearRoom.addEventListener('click', () => {
        SoundEngine.playClick();
        state.leaderboardRoom = '';
        if (inputLbRoomCode) inputLbRoomCode.value = '';
        persistPreferences();
        renderLeaderboardModal();
      });
    }

    // Collapsible Daily Quests Panel
    if (btnToggleDailyQuests) {
      btnToggleDailyQuests.addEventListener('click', () => {
        SoundEngine.playClick();
        state.dailyQuestsExpanded = !state.dailyQuestsExpanded;
        if (dailyQuestsList) dailyQuestsList.classList.toggle('hidden', !state.dailyQuestsExpanded);
        if (dailyQuestsChevron) dailyQuestsChevron.classList.toggle('rotate-180', state.dailyQuestsExpanded);
      });
    }

    // Random Hero Name Generator in Profiles Modal
    if (btnRandomHeroName) {
      btnRandomHeroName.addEventListener('click', () => {
        SoundEngine.playClick();
        if (inputNewProfileName && typeof LeaderboardClient !== 'undefined') {
          inputNewProfileName.value = LeaderboardClient.generateHeroName();
        }
      });
    }

    // Survival Gauntlet Lifelines
    if (btnSurvival5050) {
      btnSurvival5050.addEventListener('click', useSurvival5050);
    }
    if (btnSurvivalSkip) {
      btnSurvivalSkip.addEventListener('click', useSurvivalSkip);
    }

    // Logo click returns to lobby
    btnNavLogo.addEventListener('click', () => {
      SoundEngine.playClick();
      clearPendingTimers();
      showView('view-lobby');
    });

    // Theme Toggles (Desktop & Mobile)
    const handleThemeToggle = () => {
      SoundEngine.playClick();
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      persistPreferences();
    };
    if (btnThemeToggle) btnThemeToggle.addEventListener('click', handleThemeToggle);
    if (btnMenuTheme) {
      btnMenuTheme.addEventListener('click', () => {
        handleThemeToggle();
      });
    }

    // PWA Install Prompt
    const triggerInstallPrompt = () => {
      if (!state.deferredInstallPrompt) return;
      state.deferredInstallPrompt.prompt();
      state.deferredInstallPrompt.userChoice.finally(() => {
        state.deferredInstallPrompt = null;
        if (btnInstallApp) btnInstallApp.classList.add('hidden');
        if (btnMenuInstall) btnMenuInstall.classList.add('hidden');
      });
    };
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredInstallPrompt = e;
      if (btnInstallApp) btnInstallApp.classList.remove('hidden');
      if (btnMenuInstall) btnMenuInstall.classList.remove('hidden');
    });
    window.addEventListener('appinstalled', () => {
      state.deferredInstallPrompt = null;
      if (btnInstallApp) btnInstallApp.classList.add('hidden');
      if (btnMenuInstall) btnMenuInstall.classList.add('hidden');
    });
    if (btnInstallApp) btnInstallApp.addEventListener('click', triggerInstallPrompt);
    if (btnMenuInstall) {
      btnMenuInstall.addEventListener('click', () => {
        modalMobileMenu.classList.add('hidden');
        triggerInstallPrompt();
      });
    }

    // Profiles Modal Triggers & Actions
    if (btnProfileSwitcher) btnProfileSwitcher.addEventListener('click', openProfilesModal);
    if (btnMenuProfiles) {
      btnMenuProfiles.addEventListener('click', () => {
        modalMobileMenu.classList.add('hidden');
        openProfilesModal();
      });
    }
    if (btnCloseProfiles) btnCloseProfiles.addEventListener('click', closeProfilesModal);
    if (btnProfilesDone) btnProfilesDone.addEventListener('click', closeProfilesModal);
    if (modalProfiles) {
      modalProfiles.addEventListener('click', (e) => {
        if (e.target === modalProfiles) closeProfilesModal();
      });
    }
    if (btnCreateProfile) {
      btnCreateProfile.addEventListener('click', () => {
        const rawName = inputNewProfileName ? inputNewProfileName.value.trim() : '';
        if (!rawName) {
          showToast('Please enter a player name or tap Random Hero Name.', 'info');
          return;
        }
        SoundEngine.playClick();
        const res = StorageManager.createProfile(rawName, state.selectedNewAvatar);
        if (res.success) {
          if (inputNewProfileName) inputNewProfileName.value = '';
          refreshActiveProfileUI();
          renderProfilesModal();
          closeProfilesModal();
          showToast(`Switched to profile: ${res.profile.name}`, 'success');
        } else {
          showToast(res.error || 'Could not create profile.', 'error');
        }
      });
    }

    // Shared Practice Link Banner
    if (btnSharedStart) {
      btnSharedStart.addEventListener('click', () => {
        SoundEngine.playClick();
        if (lobbySharedBanner) lobbySharedBanner.classList.add('hidden');
        startGame();
      });
    }
    if (btnSharedDismiss) {
      btnSharedDismiss.addEventListener('click', () => {
        SoundEngine.playClick();
        if (lobbySharedBanner) lobbySharedBanner.classList.add('hidden');
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }

    // Daily Challenge Lobby Triggers
    if (btnStartDailyChallenge) {
      btnStartDailyChallenge.addEventListener('click', () => {
        SoundEngine.playClick();
        startGame('daily');
      });
    }
    if (btnShareDailyLobby) {
      btnShareDailyLobby.addEventListener('click', () => {
        if (!state.lastDailyShareText) return;
        SoundEngine.playClick();
        copyTextToClipboard(state.lastDailyShareText, (ok) => {
          if (ok) {
            btnShareDailyLobby.textContent = 'Copied!';
            setTimeout(() => { btnShareDailyLobby.textContent = 'Share'; }, 1800);
          }
        });
      });
    }

    // Collapsible Settings Toggle
    if (btnToggleSettings) {
      btnToggleSettings.addEventListener('click', () => {
        SoundEngine.playClick();
        state.settingsCollapsed = !state.settingsCollapsed;
        syncSettingsCollapse();
        persistPreferences();
      });
    }

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
        showConfirmDialog({
          title: 'Reset Profile Data?',
          message: 'This clears all XP, high scores, matrix mastery, and streaks for the current profile.',
          confirmLabel: 'Reset Progress',
          onConfirm: () => {
            StorageManager.resetAll();
            refreshActiveProfileUI();
            showToast('Progress data has been reset.', 'info');
          },
        });
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
        persistPreferences();
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
      syncLobbySelectors();
      startGame('blitz');
    });

    // Recommended Quest Hero Button
    if (btnRecQuestStart) {
      btnRecQuestStart.addEventListener('click', () => {
        SoundEngine.playClick();
        const rec = state.recommendedQuest || StorageManager.getRecommendedQuest();
        if (rec.operation) state.operation = rec.operation;
        if (rec.difficulty) state.difficulty = rec.difficulty;
        if (rec.table) state.customTables = [rec.table];
        if (rec.mode && rec.mode !== 'mistake_drill') state.mode = rec.mode;
        syncLobbySelectors();
        startGame(rec.mode);
      });
    }

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
        state.mode = card.dataset.mode;
        syncLobbySelectors();
        persistPreferences();
      });
    });

    // Blitz Duration Buttons
    durationBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        SoundEngine.playClick();
        state.blitzDuration = parseInt(btn.dataset.duration, 10);
        syncDurationUI();
        persistPreferences();
      });
    });

    // Operations Row
    opBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        state.operation = btn.dataset.op;
        syncLobbySelectors();
        persistPreferences();
      });
    });

    // Difficulty Row
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        state.difficulty = btn.dataset.diff;
        syncLobbySelectors();
        persistPreferences();
      });
    });

    // Input Style Toggle
    inputStyleChoice.addEventListener('click', () => {
      SoundEngine.playClick();
      state.inputStyle = 'choice';
      syncInputStyleUI();
      persistPreferences();
    });

    inputStyleDirect.addEventListener('click', () => {
      SoundEngine.playClick();
      state.inputStyle = 'direct';
      syncInputStyleUI();
      persistPreferences();
    });

    // Auto-Submit Toggle
    if (btnAutoSubmitToggle) {
      btnAutoSubmitToggle.addEventListener('click', () => {
        SoundEngine.playClick();
        state.autoSubmit = !state.autoSubmit;
        syncAutoSubmitUI();
        persistPreferences();
      });
    }

    // Copy Shareable Practice Link
    if (btnCopyPracticeLink) {
      btnCopyPracticeLink.addEventListener('click', () => {
        SoundEngine.playClick();
        const url = buildShareablePracticeURL();
        copyTextToClipboard(url, (ok) => {
          if (ok && copyLinkFeedback) {
            copyLinkFeedback.classList.remove('hidden');
            setTimeout(() => copyLinkFeedback.classList.add('hidden'), 2000);
          }
        });
      });
    }

    // Start Button
    btnStartGame.addEventListener('click', () => {
      SoundEngine.playClick();
      const lobbyModes = ['blitz', 'pvp', 'meteor', 'survival', 'endless', 'flashcards'];
      if (!lobbyModes.includes(state.mode)) {
        state.mode = StorageManager.getPreferences().mode;
      }
      startGame();
    });

    // Quiz Pause & Resume
    if (btnQuizPause) btnQuizPause.addEventListener('click', toggleQuizPause);
    if (btnQuizResume) btnQuizResume.addEventListener('click', toggleQuizPause);

    // Exit from Quiz
    btnQuizExit.addEventListener('click', () => {
      SoundEngine.playClick();
      clearPendingTimers();
      showView('view-lobby');
    });

    // Finish Endless Mode Session
    if (btnQuizFinish) {
      btnQuizFinish.addEventListener('click', () => {
        SoundEngine.playClick();
        endGame('Endless Session Complete!');
      });
    }

    // Multiple Choice Buttons Click
    choiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.isEvaluating && !state.isPaused) {
          handleAnswerSubmit(btn.dataset.answer);
        }
      });
    });

    // Tactile Numpad Buttons Click
    if (btnDirectClear) {
      btnDirectClear.addEventListener('click', () => {
        if (state.isEvaluating || state.isPaused) return;
        SoundEngine.playClick();
        state.directInputVal = '';
        updateDirectInputDisplay();
      });
    }

    numpadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isEvaluating || state.isPaused) return;
        SoundEngine.playClick();
        const key = btn.dataset.key;
        if (key === 'clear') {
          state.directInputVal = '';
        } else if (key === 'backspace') {
          state.directInputVal = state.directInputVal.slice(0, -1);
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
        if (/^[0-9]$/.test(key)) {
          maybeAutoSubmitQuiz();
        }
      });
    });

    // Flashcard Buttons
    btnFcLearning.addEventListener('click', () => nextFlashcard(false));
    btnFcMastered.addEventListener('click', () => nextFlashcard(true));
    btnFcExit.addEventListener('click', () => {
      SoundEngine.playClick();
      clearPendingTimers();
      state.isCardTransitioning = false;
      showView('view-lobby');
    });

    // Results Actions
    btnResultsReplay.addEventListener('click', () => {
      SoundEngine.playClick();
      if (state.mode === 'mistake_drill' && StorageManager.getMistakes().length === 0) {
        showView('view-lobby');
      } else {
        startGame();
      }
    });

    if (btnResultsShareDaily) {
      btnResultsShareDaily.addEventListener('click', () => {
        if (!state.lastDailyShareText) return;
        SoundEngine.playClick();
        copyTextToClipboard(state.lastDailyShareText, (ok) => {
          if (ok && resultsShareFeedback) {
            resultsShareFeedback.classList.remove('hidden');
            setTimeout(() => resultsShareFeedback.classList.add('hidden'), 2000);
          }
        });
      });
    }

    if (btnPrintReport) {
      btnPrintReport.addEventListener('click', () => {
        SoundEngine.playClick();
        window.print();
      });
    }

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

    // Export Data JSON
    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => {
        SoundEngine.playClick();
        const jsonStr = StorageManager.exportDataJSON();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `math-quest-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // Import Data Trigger & Handler
    if (btnImportTrigger && inputImportJson) {
      btnImportTrigger.addEventListener('click', () => {
        SoundEngine.playClick();
        inputImportJson.click();
      });

      inputImportJson.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const res = StorageManager.importDataJSON(event.target.result);
          if (res.success) {
            SoundEngine.playLevelUp();
            Confetti.cannon();
            refreshActiveProfileUI();
            openStatsModal();
            showToast('Progress and achievements restored!', 'success');
          } else {
            SoundEngine.playWrong();
            showToast('Import failed: ' + (res.error || 'Invalid format'), 'error');
          }
        };
        reader.readAsText(file);
        inputImportJson.value = '';
      });
    }

    // Reset All Data
    btnResetData.addEventListener('click', () => {
      showConfirmDialog({
        title: 'Reset All Profile Data?',
        message: 'Are you sure you want to reset all XP, high scores, matrix heatmap, and progress for this profile?',
        confirmLabel: 'Reset All',
        onConfirm: () => {
          StorageManager.resetAll();
          closeStatsModal();
          refreshActiveProfileUI();
          showToast('Profile progress reset.', 'info');
        },
      });
    });

    // Global Keydown
    window.addEventListener('keydown', handleGlobalKeydown);
  }

  function handleGlobalKeydown(e) {
    if (modalConfirm && !modalConfirm.classList.contains('hidden')) {
      if (e.key === 'Escape') closeConfirmDialog();
      return;
    }

    if (modalLeaderboard && !modalLeaderboard.classList.contains('hidden')) {
      if (e.key === 'Escape') closeLeaderboardModal();
      return;
    }

    if (modalProfiles && !modalProfiles.classList.contains('hidden')) {
      if (e.key === 'Escape') closeProfilesModal();
      return;
    }

    if (!modalMatrix.classList.contains('hidden')) {
      if (e.key === 'Escape') closeMatrixModal();
      return;
    }

    if (!modalStats.classList.contains('hidden')) {
      if (e.key === 'Escape') closeStatsModal();
      return;
    }

    if (!modalMobileMenu.classList.contains('hidden')) {
      if (e.key === 'Escape') modalMobileMenu.classList.add('hidden');
      return;
    }

    if (viewMeteor && !viewMeteor.classList.contains('hidden') && typeof ArcadeGames !== 'undefined') {
      if (ArcadeGames.MeteorBlaster.handleKey(e)) return;
    }

    if (viewTug && !viewTug.classList.contains('hidden') && typeof ArcadeGames !== 'undefined') {
      if (ArcadeGames.TugOfWar.handleKey(e)) return;
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

    if (viewPvp && !viewPvp.classList.contains('hidden') && typeof PvpArena !== 'undefined') {
      if (PvpArena.handleKey(e)) return;
    }

    if (!viewQuiz.classList.contains('hidden')) {
      if (e.key === 'Escape' && ['blitz', 'daily', 'survival'].includes(state.mode)) {
        toggleQuizPause();
        return;
      }
      if (state.isPaused || state.isEvaluating) return;
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
            maybeAutoSubmitQuiz();
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

  function renderProfileAvatarPicker() {
    if (!profileAvatarPicker) return;
    profileAvatarPicker.innerHTML = '';
    StorageManager.PROFILE_AVATARS.forEach(av => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isSelected = av.id === state.selectedNewAvatar;
      btn.className = `p-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
        isSelected
          ? 'bg-indigo-600/25 border-indigo-400'
          : 'bg-slate-800/70 border-slate-700 hover:border-slate-500'
      }`;
      btn.title = av.label;
      btn.innerHTML = av.svg;
      btn.addEventListener('click', () => {
        SoundEngine.playClick();
        state.selectedNewAvatar = av.id;
        renderProfileAvatarPicker();
      });
      profileAvatarPicker.appendChild(btn);
    });
  }

  function renderProfilesModal() {
    if (!profilesList) return;
    profilesList.innerHTML = '';
    const profiles = StorageManager.getProfiles();

    profiles.forEach(p => {
      const row = document.createElement('div');
      row.className = `flex items-center justify-between gap-2 p-2.5 rounded-2xl border ${
        p.isActive
          ? 'bg-indigo-950/40 border-indigo-500/60'
          : 'bg-slate-800/70 border-slate-700/60'
      }`;

      const switchBtn = document.createElement('button');
      switchBtn.type = 'button';
      switchBtn.className = 'flex items-center gap-2.5 flex-1 text-left min-w-0';

      const avatarWrap = document.createElement('span');
      avatarWrap.className = 'w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-center flex-shrink-0';
      avatarWrap.innerHTML = p.svg;

      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0 flex-1';

      const nameEl = document.createElement('span');
      nameEl.className = 'text-xs font-bold text-white block truncate';
      nameEl.textContent = p.name;

      const subEl = document.createElement('span');
      subEl.className = p.isActive
        ? 'text-[10px] font-semibold text-emerald-400 block'
        : 'text-[10px] text-slate-400 block';
      subEl.textContent = p.isActive ? 'Active Profile' : 'Tap to switch';

      textWrap.appendChild(nameEl);
      textWrap.appendChild(subEl);
      switchBtn.appendChild(avatarWrap);
      switchBtn.appendChild(textWrap);

      switchBtn.addEventListener('click', () => {
        if (p.isActive) return;
        SoundEngine.playClick();
        StorageManager.switchProfile(p.id);
        refreshActiveProfileUI();
        renderProfilesModal();
        closeProfilesModal();
      });

      row.appendChild(switchBtn);

      if (profiles.length > 1) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'px-2 py-1 rounded-lg bg-slate-900/70 hover:bg-rose-950/70 text-[10px] font-bold text-rose-400 flex-shrink-0';
        delBtn.textContent = 'Remove';
        delBtn.addEventListener('click', () => {
          showConfirmDialog({
            title: 'Remove Profile?',
            message: `Delete "${p.name}" and all of its local progress?`,
            confirmLabel: 'Remove',
            onConfirm: () => {
              SoundEngine.playClick();
              StorageManager.deleteProfile(p.id);
              refreshActiveProfileUI();
              renderProfilesModal();
              showToast(`Removed profile "${p.name}".`, 'info');
            },
          });
        });
        row.appendChild(delBtn);
      }

      profilesList.appendChild(row);
    });

    renderProfileAvatarPicker();
  }

  function openProfilesModal() {
    if (!modalProfiles) return;
    SoundEngine.playClick();
    renderProfilesModal();
    modalProfiles.classList.remove('hidden');
  }

  function closeProfilesModal() {
    if (modalProfiles) modalProfiles.classList.add('hidden');
  }

  function getAvatarSvgById(avatarId) {
    const found = (StorageManager.PROFILE_AVATARS || []).find(a => a.id === avatarId);
    return found ? found.svg : (StorageManager.PROFILE_AVATARS[0] ? StorageManager.PROFILE_AVATARS[0].svg : '');
  }

  function renderLeaderboardRows(rows, emptyMessage) {
    if (!leaderboardRows) return;
    leaderboardRows.innerHTML = '';

    if (!rows || rows.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'text-center py-6 text-xs text-slate-400';
      emptyEl.textContent = emptyMessage;
      leaderboardRows.appendChild(emptyEl);
      return;
    }

    rows.forEach((entry, idx) => {
      const rank = entry.rank || idx + 1;
      const item = document.createElement('div');
      item.className = `flex items-center justify-between gap-2.5 p-2.5 rounded-xl border ${
        entry.isActive
          ? 'bg-indigo-950/40 border-indigo-500/50'
          : 'bg-slate-800/70 border-slate-700/60'
      }`;

      const left = document.createElement('div');
      left.className = 'flex items-center gap-2.5 min-w-0';

      const rankBadge = document.createElement('span');
      rankBadge.className = `w-6 h-6 rounded-lg font-mono font-black text-xs flex items-center justify-center flex-shrink-0 ${
        rank === 1
          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
          : rank === 2
            ? 'bg-slate-400/20 text-slate-200 border border-slate-400/30'
            : rank === 3
              ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30'
              : 'bg-slate-900/60 text-slate-400'
      }`;
      rankBadge.textContent = `#${rank}`;

      const avatarWrap = document.createElement('span');
      avatarWrap.className = 'w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center flex-shrink-0';
      avatarWrap.innerHTML = entry.svg || getAvatarSvgById(entry.avatar);

      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0';

      const nameEl = document.createElement('span');
      nameEl.className = 'text-xs font-bold text-white block truncate';
      nameEl.textContent = entry.name || 'Player';

      const subEl = document.createElement('span');
      subEl.className = 'text-[10px] text-slate-400 block truncate';
      subEl.textContent = entry.subtext || '';

      textWrap.appendChild(nameEl);
      textWrap.appendChild(subEl);
      left.appendChild(rankBadge);
      left.appendChild(avatarWrap);
      left.appendChild(textWrap);

      const right = document.createElement('span');
      right.className = 'font-mono font-black text-xs sm:text-sm text-emerald-400 flex-shrink-0';
      right.textContent = entry.displayValue || String(entry.value || 0);

      item.appendChild(left);
      item.appendChild(right);
      leaderboardRows.appendChild(item);
    });
  }

  async function renderLeaderboardModal() {
    const tab = state.leaderboardTab || 'local';

    lbTabBtns.forEach(btn => {
      const isSelected = btn.dataset.lbTab === tab;
      btn.className = isSelected
        ? 'lb-tab-btn py-1.5 rounded-lg bg-indigo-600 text-white'
        : 'lb-tab-btn py-1.5 rounded-lg text-slate-400';
    });

    if (tab === 'local') {
      if (lbLocalFilterRow) lbLocalFilterRow.classList.remove('hidden');
      if (lbRoomBar) lbRoomBar.classList.add('hidden');

      lbLocalCatBtns.forEach(btn => {
        const active = btn.dataset.localCat === state.leaderboardLocalCat;
        btn.className = active
          ? 'lb-local-cat-btn px-2.5 py-1 rounded-lg bg-indigo-600 text-white'
          : 'lb-local-cat-btn px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400';
      });

      const localRows = typeof LeaderboardClient !== 'undefined'
        ? LeaderboardClient.getLocalBoard(state.leaderboardLocalCat, StorageManager)
        : StorageManager.getLocalLeaderboard(state.leaderboardLocalCat);

      const mapped = localRows.map(r => {
        let displayValue = `${r.xp} XP`;
        if (state.leaderboardLocalCat === 'blitz') displayValue = `${r.blitzBest} pts`;
        else if (state.leaderboardLocalCat === 'survival') displayValue = `${r.survivalBest} pts`;
        else if (state.leaderboardLocalCat === 'meteor') displayValue = `${r.meteorBest} pts`;
        else if (state.leaderboardLocalCat === 'daily') {
          displayValue = r.dailyEntry ? `${r.dailyEntry.correct}/${r.dailyEntry.total}` : '—';
        }
        return { ...r, displayValue };
      });

      if (lbStatusBanner) {
        lbStatusBanner.textContent = 'Comparing all learner profiles saved on this device.';
      }
      renderLeaderboardRows(mapped, 'Create multiple learner profiles to compare scores on this device!');
      return;
    }

    if (lbLocalFilterRow) lbLocalFilterRow.classList.add('hidden');
    if (lbRoomBar) lbRoomBar.classList.remove('hidden');
    if (inputLbRoomCode) inputLbRoomCode.value = state.leaderboardRoom || '';
    if (lbStatusBanner) lbStatusBanner.textContent = 'Loading online leaderboard...';
    renderLeaderboardRows([], 'Fetching latest scores...');

    if (typeof LeaderboardClient === 'undefined') {
      if (lbStatusBanner) lbStatusBanner.textContent = 'Online leaderboard client unavailable.';
      renderLeaderboardRows([], 'Switch to "This Device" to view local rankings.');
      return;
    }

    const res = await LeaderboardClient.fetchOnlineBoard({
      board: tab,
      dateKey: StorageManager.getDateKey(),
      room: state.leaderboardRoom,
    });

    if (!res.configured) {
      if (lbStatusBanner) {
        lbStatusBanner.textContent = 'Online boards activate automatically once deployed to Vercel with Upstash Redis. Use "This Device" offline anytime!';
      }
      renderLeaderboardRows([], 'No online backend connected on this host yet.');
      return;
    }

    const scopeLabel = state.leaderboardRoom ? `Room: ${state.leaderboardRoom}` : 'Global Board';
    if (lbStatusBanner) {
      lbStatusBanner.textContent = tab === 'daily'
        ? `${scopeLabel} · Daily Challenge (${res.dateKey})`
        : `${scopeLabel} · Top 25 Scores`;
    }

    const myClientId = LeaderboardClient.getClientId();
    const mapped = (res.entries || []).map(entry => {
      let displayValue = `${entry.score} pts`;
      let subtext = '';
      if (tab === 'meteor' && entry.wave) subtext = `Wave ${entry.wave}`;
      else if (tab === 'survival' && entry.floor) subtext = `Floor ${entry.floor}`;
      if (tab === 'daily') {
        displayValue = `${entry.correct}/${entry.total || 15}`;
        subtext = `${entry.timeSeconds}s`;
      }
      return {
        ...entry,
        isActive: Boolean(entry.clientId && entry.clientId === myClientId),
        displayValue,
        subtext,
      };
    });

    renderLeaderboardRows(mapped, 'No scores submitted yet — play a round to claim #1!');
  }

  function openLeaderboardModal() {
    if (!modalLeaderboard) return;
    SoundEngine.playClick();
    modalLeaderboard.classList.remove('hidden');
    renderLeaderboardModal();
  }

  function closeLeaderboardModal() {
    if (modalLeaderboard) modalLeaderboard.classList.add('hidden');
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
    statAccuracyRate.textContent = stats.totalAnswered > 0 ? `${stats.accuracy}%` : '—';
    statHighestStreak.textContent = stats.highestStreak;
    if (statPvpWins) statPvpWins.textContent = (stats.pvpStats && stats.pvpStats.wins) || 0;

    // Populate Parent / Teacher Progress Snapshot
    const summary = StorageManager.getParentSummary();
    if (reportProfileName) reportProfileName.textContent = summary.profileName;
    if (reportFactsMastered) {
      reportFactsMastered.textContent = `${summary.masteredFacts} / ${summary.totalUniqueFacts}`;
    }
    if (reportAvgSpeed) {
      reportAvgSpeed.textContent = summary.avgResponseSeconds !== null ? `${summary.avgResponseSeconds}s` : '—';
    }
    if (reportMasteredTables) {
      reportMasteredTables.textContent = summary.masteredTables.length > 0
        ? summary.masteredTables.map(t => `${t}×`).join(', ')
        : 'None yet';
    }
    if (reportWeakFacts) {
      reportWeakFacts.innerHTML = '';
      if (summary.weakestFacts.length > 0) {
        summary.weakestFacts.forEach(f => {
          const item = document.createElement('div');
          item.className = 'flex items-center justify-between px-2 py-1 rounded bg-slate-900/60';
          const labelSpan = document.createElement('span');
          labelSpan.className = 'font-mono font-bold text-slate-200';
          labelSpan.textContent = f.label;
          const metaSpan = document.createElement('span');
          metaSpan.className = 'font-mono text-amber-300';
          metaSpan.textContent = f.avgSeconds !== null
            ? `${f.accuracy}% · ${f.avgSeconds}s avg`
            : `${f.accuracy}% (${f.attempts} tries)`;
          item.appendChild(labelSpan);
          item.appendChild(metaSpan);
          reportWeakFacts.appendChild(item);
        });
      } else {
        const emptyEl = document.createElement('span');
        emptyEl.className = 'text-slate-400';
        emptyEl.textContent = summary.testedFacts > 0
          ? 'Great job — no struggling facts detected!'
          : 'Play a round to generate insights.';
        reportWeakFacts.appendChild(emptyEl);
      }
    }

    if (recordBlitz30) recordBlitz30.textContent = stats.highScores.blitz_30 || 0;
    if (recordBlitz60) recordBlitz60.textContent = stats.highScores.blitz_60 || 0;
    if (recordBlitz120) recordBlitz120.textContent = stats.highScores.blitz_120 || 0;
    if (recordSurvival) recordSurvival.textContent = stats.highScores.survival || 0;
    if (recordEndless) recordEndless.textContent = stats.highScores.endless || 0;
    if (recordMeteor) recordMeteor.textContent = stats.highScores.meteor || 0;

    // Render Achievements Showcase
    const achievements = StorageManager.getAchievements();
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    if (achievementsCount) {
      achievementsCount.textContent = `${unlockedCount} / ${achievements.length}`;
    }
    if (achievementsContainer) {
      achievementsContainer.innerHTML = '';
      achievements.forEach(ach => {
        const item = document.createElement('div');
        item.className = `p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
          ach.unlocked
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
            : 'bg-slate-900/60 border-slate-800 text-slate-600 grayscale opacity-45'
        }`;
        item.title = `${ach.title}: ${ach.desc} ${ach.unlocked ? '(Unlocked)' : '(Locked)'}`;
        item.innerHTML = `
          <div class="mb-1">${ach.icon}</div>
          <span class="text-[9px] font-bold truncate max-w-full block">${ach.title}</span>
        `;
        achievementsContainer.appendChild(item);
      });
    }

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

  // Register PWA Service Worker
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('Service Worker registration skipped:', err);
      });
    });
  }
});
