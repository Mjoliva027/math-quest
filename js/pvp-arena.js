/**
 * Online 1v1 PvP Arena & Online Tug-of-War Controller for Math Quest
 * Works on Vercel Serverless + Upstash Redis (/api/match) with graceful 8s AI Rival fallback
 * when offline, running locally on Apache, or when no human opponent is queued.
 */

const PvpArena = (() => {
  const POLL_INTERVAL_MS = 1200;
  const SEARCH_TIMEOUT_MS = 8000;
  const PRESENCE_INTERVAL_MS = 15000;

  let bound = false;

  // DOM References
  let lobbyPanel, battlePanel, resultOverlay;
  let btnLobbyExit, recordBadge, formatDescEl;
  let onlineDotEl, onlineCountTextEl, onlineSubtextEl;
  let formatBtns = [];
  let btnFindMatch, btnVsAi, btnLocalTug;
  let searchingBox, searchStatusEl, btnCancelSearch;
  let btnCreateRoom, roomCreatedBox, roomCodeDisplay, btnCopyInvite, btnCancelRoom;
  let inputJoinCode, btnJoinRoom;

  let formatLabelEl, timerEl, btnForfeit;
  let duelHud, meAvatarEl, meNameEl, meHpTextEl, meHpBarEl, meShieldEl, meStreakEl;
  let oppAvatarEl, oppNameEl, oppBadgeEl, oppHpTextEl, oppHpBarEl, oppShieldEl, oppStreakEl, combatFxEl;
  let tugHud, tugMeAvatarEl, tugMeNameEl, tugMePullsEl, tugOppAvatarEl, tugOppNameEl, tugOppBadgeEl, tugOppPullsEl;
  let ropeLabelEl, ropeKnotEl, tugFxEl;
  let equationCard, opLabelEl, equationTextEl, statusTextEl;
  let inputChoiceWrap, choiceBtns = [];
  let inputDirectWrap, directValEl, btnDirectClear, numpadBtns = [];
  let resultBadgeEl, resultTitleEl, resultSummaryEl, resultXpEl, btnRematch, btnBackLobby;

  const state = {
    active: false,
    phase: 'idle', // 'idle' | 'searching' | 'waiting_room' | 'playing' | 'finished'
    format: 'duel', // 'duel' | 'tug'
    modeKind: 'ai', // 'online' | 'ai'
    config: null,
    callbacks: null,
    playerId: '',
    meProfile: null,

    // Match runtime
    matchId: '',
    roomCode: '',
    match: null,
    deck: [],
    deckIndex: 0,
    directVal: '',
    problemStartTime: 0,
    isEvaluating: false,
    isStunned: false,
    stunUntil: 0,
    lastHandledEventTs: 0,
    xpAwarded: false,

    // Online presence state (independent of match/search clearRuntimeTimers)
    onlineConfigured: false,
    onlineCount: null,
    presenceInterval: null,
    presenceController: null,
    presenceSeq: 0,

    // Timers / Intervals
    pollInterval: null,
    searchCountdownInterval: null,
    searchFallbackTimeout: null,
    clockInterval: null,
    aiTimeout: null,
    stunTimeout: null,
    nextProbTimeout: null,
  };

  function getOrCreatePlayerId() {
    if (typeof LeaderboardClient !== 'undefined' && typeof LeaderboardClient.getClientId === 'function') {
      return LeaderboardClient.getClientId();
    }
    try {
      const key = 'math_quest_client_id';
      const existing = localStorage.getItem(key);
      if (existing && existing.length >= 6) return existing;
      const generated = `mq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(key, generated);
      return generated;
    } catch (e) {
      return `mq_${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  function getAvatarSvg(avatarId) {
    if (typeof StorageManager !== 'undefined' && Array.isArray(StorageManager.PROFILE_AVATARS)) {
      const found = StorageManager.PROFILE_AVATARS.find(a => a.id === avatarId) || StorageManager.PROFILE_AVATARS[0];
      return found ? found.svg : '';
    }
    return '';
  }

  function getActivePlayerProfile() {
    if (typeof StorageManager !== 'undefined' && typeof StorageManager.getActiveProfile === 'function') {
      return StorageManager.getActiveProfile();
    }
    return { id: 'default', name: 'Player 1', avatar: 'knight', svg: '' };
  }

  function normalizeRoomInput(raw) {
    return String(raw || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
  }

  function pickAiRival(difficulty) {
    const names = {
      easy: ['PipBot', 'Sunny FoxBot', 'Sprout AI'],
      medium: ['Volt Knight AI', 'Prism Wizard AI', 'Nova Falcon AI'],
      hard: ['Hyper Comet AI', 'Quantum Owl AI', 'Apex Titan AI'],
    };
    const pool = names[difficulty] || names.medium;
    const avatars = ['knight', 'wizard', 'rocket', 'owl', 'star'];
    return {
      playerId: 'ai_rival',
      name: pool[Math.floor(Math.random() * pool.length)],
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
    };
  }

  function toast(msg, type = 'info') {
    if (state.callbacks && typeof state.callbacks.onToast === 'function') {
      state.callbacks.onToast(msg, type);
    }
  }

  function clearRuntimeTimers() {
    clearInterval(state.pollInterval);
    clearInterval(state.searchCountdownInterval);
    clearTimeout(state.searchFallbackTimeout);
    clearInterval(state.clockInterval);
    clearTimeout(state.aiTimeout);
    clearTimeout(state.stunTimeout);
    clearTimeout(state.nextProbTimeout);
    state.pollInterval = null;
    state.searchCountdownInterval = null;
    state.searchFallbackTimeout = null;
    state.clockInterval = null;
    state.aiTimeout = null;
    state.stunTimeout = null;
    state.nextProbTimeout = null;
  }

  function bindElements() {
    if (bound) return;

    lobbyPanel = document.getElementById('pvp-lobby-panel');
    battlePanel = document.getElementById('pvp-battle-panel');
    resultOverlay = document.getElementById('pvp-result-overlay');

    btnLobbyExit = document.getElementById('btn-pvp-lobby-exit');
    recordBadge = document.getElementById('pvp-record-badge');
    formatDescEl = document.getElementById('pvp-format-desc');
    onlineDotEl = document.getElementById('pvp-online-dot');
    onlineCountTextEl = document.getElementById('pvp-online-count-text');
    onlineSubtextEl = document.getElementById('pvp-online-subtext');
    formatBtns = Array.from(document.querySelectorAll('.pvp-format-btn'));

    btnFindMatch = document.getElementById('btn-pvp-find-match');
    btnVsAi = document.getElementById('btn-pvp-vs-ai');
    btnLocalTug = document.getElementById('btn-pvp-local-tug');

    searchingBox = document.getElementById('pvp-searching-box');
    searchStatusEl = document.getElementById('pvp-search-status');
    btnCancelSearch = document.getElementById('btn-pvp-cancel-search');

    btnCreateRoom = document.getElementById('btn-pvp-create-room');
    roomCreatedBox = document.getElementById('pvp-room-created-box');
    roomCodeDisplay = document.getElementById('pvp-room-code-display');
    btnCopyInvite = document.getElementById('btn-pvp-copy-invite');
    btnCancelRoom = document.getElementById('btn-pvp-cancel-room');
    inputJoinCode = document.getElementById('input-pvp-join-code');
    btnJoinRoom = document.getElementById('btn-pvp-join-room');

    formatLabelEl = document.getElementById('pvp-format-label');
    timerEl = document.getElementById('pvp-timer');
    btnForfeit = document.getElementById('btn-pvp-forfeit');

    duelHud = document.getElementById('pvp-duel-hud');
    meAvatarEl = document.getElementById('pvp-me-avatar');
    meNameEl = document.getElementById('pvp-me-name');
    meHpTextEl = document.getElementById('pvp-me-hp-text');
    meHpBarEl = document.getElementById('pvp-me-hp-bar');
    meShieldEl = document.getElementById('pvp-me-shield');
    meStreakEl = document.getElementById('pvp-me-streak');
    oppAvatarEl = document.getElementById('pvp-opp-avatar');
    oppNameEl = document.getElementById('pvp-opp-name');
    oppBadgeEl = document.getElementById('pvp-opp-badge');
    oppHpTextEl = document.getElementById('pvp-opp-hp-text');
    oppHpBarEl = document.getElementById('pvp-opp-hp-bar');
    oppShieldEl = document.getElementById('pvp-opp-shield');
    oppStreakEl = document.getElementById('pvp-opp-streak');
    combatFxEl = document.getElementById('pvp-combat-fx');

    tugHud = document.getElementById('pvp-tug-hud');
    tugMeAvatarEl = document.getElementById('pvp-tug-me-avatar');
    tugMeNameEl = document.getElementById('pvp-tug-me-name');
    tugMePullsEl = document.getElementById('pvp-tug-me-pulls');
    tugOppAvatarEl = document.getElementById('pvp-tug-opp-avatar');
    tugOppNameEl = document.getElementById('pvp-tug-opp-name');
    tugOppBadgeEl = document.getElementById('pvp-tug-opp-badge');
    tugOppPullsEl = document.getElementById('pvp-tug-opp-pulls');
    ropeLabelEl = document.getElementById('pvp-rope-label');
    ropeKnotEl = document.getElementById('pvp-rope-knot');
    tugFxEl = document.getElementById('pvp-tug-fx');

    equationCard = document.getElementById('pvp-equation-card');
    opLabelEl = document.getElementById('pvp-op-label');
    equationTextEl = document.getElementById('pvp-equation-text');
    statusTextEl = document.getElementById('pvp-status-text');

    inputChoiceWrap = document.getElementById('pvp-input-choice');
    choiceBtns = Array.from(document.querySelectorAll('.pvp-choice-btn'));
    inputDirectWrap = document.getElementById('pvp-input-direct');
    directValEl = document.getElementById('pvp-direct-val');
    btnDirectClear = document.getElementById('btn-pvp-direct-clear');
    numpadBtns = Array.from(document.querySelectorAll('.pvp-numpad-btn'));

    resultBadgeEl = document.getElementById('pvp-result-badge');
    resultTitleEl = document.getElementById('pvp-result-title');
    resultSummaryEl = document.getElementById('pvp-result-summary');
    resultXpEl = document.getElementById('pvp-result-xp');
    btnRematch = document.getElementById('btn-pvp-rematch');
    btnBackLobby = document.getElementById('btn-pvp-back-lobby');

    // Event bindings
    formatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.phase === 'playing') return;
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        state.format = btn.dataset.pvpFormat === 'tug' ? 'tug' : 'duel';
        syncFormatSelectorUI();
      });
    });

    if (btnLobbyExit) {
      btnLobbyExit.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        const exitCb = state.callbacks && state.callbacks.onExit;
        stop();
        if (exitCb) exitCb();
      });
    }

    if (btnFindMatch) {
      btnFindMatch.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        startFindMatch();
      });
    }

    if (btnVsAi) {
      btnVsAi.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        startAiMatch();
      });
    }

    if (btnCancelSearch) {
      btnCancelSearch.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        cancelSearchOrRoom();
      });
    }

    if (btnCreateRoom) {
      btnCreateRoom.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        createFriendRoom();
      });
    }

    if (btnCancelRoom) {
      btnCancelRoom.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        cancelSearchOrRoom();
      });
    }

    if (btnCopyInvite) {
      btnCopyInvite.addEventListener('click', () => {
        if (!state.roomCode) return;
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        const params = new URLSearchParams();
        params.set('mode', 'pvp');
        params.set('code', state.roomCode);
        params.set('format', state.format);
        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(url).then(() => {
            toast(`Invite link for room ${state.roomCode} copied!`, 'success');
          }).catch(() => {
            toast(`Room Code: ${state.roomCode}`, 'info');
          });
        } else {
          toast(`Room Code: ${state.roomCode}`, 'info');
        }
      });
    }

    if (btnJoinRoom) {
      btnJoinRoom.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        const code = normalizeRoomInput(inputJoinCode ? inputJoinCode.value : '');
        joinFriendRoom(code);
      });
    }

    if (btnLocalTug) {
      btnLocalTug.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        const localCb = state.callbacks && state.callbacks.onOpenLocalTug;
        stop();
        if (localCb) localCb();
      });
    }

    if (btnForfeit) {
      btnForfeit.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        handleForfeit();
      });
    }

    choiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.phase !== 'playing' || state.isEvaluating || state.isStunned) return;
        submitAnswer(btn.dataset.answer);
      });
    });

    if (btnDirectClear) {
      btnDirectClear.addEventListener('click', () => {
        if (state.phase !== 'playing' || state.isEvaluating || state.isStunned) return;
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        state.directVal = '';
        updateDirectDisplay();
      });
    }

    numpadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.phase !== 'playing' || state.isEvaluating || state.isStunned) return;
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        handleDirectKey(btn.dataset.key);
      });
    });

    if (btnRematch) {
      btnRematch.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        if (resultOverlay) resultOverlay.classList.add('hidden');
        if (state.modeKind === 'ai') {
          startAiMatch();
        } else {
          showLobbyPanel();
          startFindMatch();
        }
      });
    }

    if (btnBackLobby) {
      btnBackLobby.addEventListener('click', () => {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        showLobbyPanel();
      });
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && state.active) {
          pingPresence();
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => {
        if (state.active && state.onlineConfigured && state.playerId) {
          sendLeavePresenceBeacon();
        }
      });
    }

    bound = true;
  }

  function syncRecordBadge() {
    if (!recordBadge) return;
    const stats = typeof StorageManager !== 'undefined' ? StorageManager.getStats() : null;
    const pvp = (stats && stats.pvpStats) || { wins: 0, losses: 0, draws: 0, winStreak: 0 };
    recordBadge.textContent = `${pvp.wins || 0}W · ${pvp.losses || 0}L · ${pvp.winStreak || 0} Streak`;
  }

  function syncFormatSelectorUI() {
    formatBtns.forEach(btn => {
      const isActive = btn.dataset.pvpFormat === state.format;
      btn.className = isActive
        ? 'pvp-format-btn py-2.5 px-3 rounded-xl border-2 border-indigo-400 bg-indigo-600/25 text-white font-bold text-xs text-left transition-all shadow'
        : 'pvp-format-btn py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-500 font-bold text-xs text-left transition-all';
    });
    if (formatDescEl) {
      formatDescEl.textContent = state.format === 'tug'
        ? 'Online Tug-of-War: Pull the rope 6 steps to your side! Fast/streak answers pull +2; wrong answers cause a brief slip.'
        : '1v1 HP Battle: Start at 100 HP. Answer fast (<2.5s) for Critical Strikes and build a 5-streak Shield!';
    }
  }

  function showLobbyPanel() {
    clearRuntimeTimers();
    state.phase = 'idle';
    state.matchId = '';
    state.roomCode = '';
    state.match = null;
    state.isStunned = false;
    state.isEvaluating = false;
    if (equationCard) equationCard.classList.remove('tug-stunned');
    if (lobbyPanel) lobbyPanel.classList.remove('hidden');
    if (battlePanel) battlePanel.classList.add('hidden');
    if (resultOverlay) resultOverlay.classList.add('hidden');
    if (searchingBox) searchingBox.classList.add('hidden');
    if (roomCreatedBox) roomCreatedBox.classList.add('hidden');
    syncRecordBadge();
    syncFormatSelectorUI();
  }

  async function apiPost(payload) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;
    try {
      const res = await fetch('./api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined,
      });
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: null };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function apiGet(matchId) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 4500) : null;
    try {
      const params = new URLSearchParams({ matchId, playerId: state.playerId });
      const res = await fetch(`./api/match?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined,
      });
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: null };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function renderOnlineStatus(status, count = 0) {
    if (!onlineDotEl || !onlineCountTextEl || !onlineSubtextEl) return;
    if (status === 'online') {
      const n = Math.max(0, Number(count) || 0);
      onlineDotEl.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0';
      onlineCountTextEl.className = 'text-xs font-bold text-emerald-300 truncate';
      onlineCountTextEl.textContent = `${n} ${n === 1 ? 'player' : 'players'} online`;
      onlineSubtextEl.textContent = n > 1 ? 'Rivals active now' : 'Only you right now · AI & Rooms ready';
      return;
    }
    if (status === 'offline') {
      onlineDotEl.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0';
      onlineCountTextEl.className = 'text-xs font-bold text-amber-300 truncate';
      onlineCountTextEl.textContent = 'Offline / Local Mode';
      onlineSubtextEl.textContent = 'AI Rival & 2P available';
      return;
    }
    if (status === 'error') {
      onlineDotEl.className = 'w-2.5 h-2.5 rounded-full bg-slate-500 flex-shrink-0';
      onlineCountTextEl.className = 'text-xs font-bold text-slate-400 truncate';
      onlineCountTextEl.textContent = 'Online count unavailable';
      onlineSubtextEl.textContent = 'AI Rival & 2P ready';
      return;
    }
    onlineDotEl.className = 'w-2.5 h-2.5 rounded-full bg-slate-500 animate-pulse flex-shrink-0';
    onlineCountTextEl.className = 'text-xs font-bold text-slate-300 truncate';
    onlineCountTextEl.textContent = 'Checking online players...';
    onlineSubtextEl.textContent = 'Live Arena';
  }

  function sendLeavePresenceBeacon() {
    if (!state.playerId || typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
      return;
    }
    try {
      const body = JSON.stringify({ action: 'leave_presence', playerId: state.playerId });
      const blob = typeof Blob !== 'undefined'
        ? new Blob([body], { type: 'application/json' })
        : body;
      navigator.sendBeacon('./api/match', blob);
    } catch (e) {}
  }

  async function pingPresence() {
    if (!state.active || !state.playerId) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (typeof fetch !== 'function') {
      renderOnlineStatus('offline', 0);
      return;
    }

    if (state.presenceController) {
      state.presenceController.abort();
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    state.presenceController = controller;
    const seq = ++state.presenceSeq;
    const timer = controller ? setTimeout(() => controller.abort(), 4500) : null;

    try {
      const res = await fetch('./api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action: 'presence', playerId: state.playerId }),
        signal: controller ? controller.signal : undefined,
      });
      const data = await res.json().catch(() => null);
      if (!state.active || seq !== state.presenceSeq) return;

      if (res.status === 404 || res.status === 405 || (res.ok && data && data.configured === false)) {
        state.onlineConfigured = false;
        state.onlineCount = 0;
        clearInterval(state.presenceInterval);
        state.presenceInterval = null;
        renderOnlineStatus('offline', 0);
        return;
      }

      if (res.ok && data && data.configured) {
        const count = Math.max(0, Number(data.onlineCount) || 0);
        state.onlineConfigured = true;
        state.onlineCount = count;
        renderOnlineStatus('online', count);
        return;
      }

      renderOnlineStatus('error', 0);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      if (!state.active || seq !== state.presenceSeq) return;
      renderOnlineStatus(state.onlineConfigured ? 'error' : 'offline', 0);
    } finally {
      if (timer) clearTimeout(timer);
      if (state.presenceController === controller) {
        state.presenceController = null;
      }
    }
  }

  function startPresence() {
    stopPresence(false);
    renderOnlineStatus('loading');
    pingPresence();
    state.presenceInterval = setInterval(pingPresence, PRESENCE_INTERVAL_MS);
  }

  function stopPresence(notifyServer = true) {
    clearInterval(state.presenceInterval);
    state.presenceInterval = null;
    state.presenceSeq++;
    if (state.presenceController) {
      state.presenceController.abort();
      state.presenceController = null;
    }
    if (notifyServer && state.active && state.onlineConfigured && state.playerId) {
      apiPost({ action: 'leave_presence', playerId: state.playerId });
    }
    state.onlineConfigured = false;
    state.onlineCount = null;
  }

  async function fetchOnlineCount(externalSignal) {
    if (typeof fetch !== 'function') {
      return { configured: false, onlineCount: 0 };
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const onExternalAbort = () => {
      if (controller) controller.abort();
    };
    if (externalSignal) {
      if (externalSignal.aborted) {
        return { configured: false, onlineCount: 0, aborted: true };
      }
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
    const timer = controller ? setTimeout(() => controller.abort(), 4000) : null;

    try {
      const res = await fetch('./api/match?action=presence', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined,
      });
      if (!res.ok) {
        return { configured: false, onlineCount: 0, error: true };
      }
      const data = await res.json().catch(() => null);
      if (!data || typeof data !== 'object') {
        return { configured: false, onlineCount: 0, error: true };
      }
      return {
        configured: Boolean(data.configured),
        onlineCount: Math.max(0, Number(data.onlineCount) || 0),
      };
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return { configured: false, onlineCount: 0, aborted: true };
      }
      return { configured: false, onlineCount: 0, error: true };
    } finally {
      if (timer) clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }

  async function cancelSearchOrRoom() {
    const prevPhase = state.phase;
    const prevMatchId = state.matchId;
    clearRuntimeTimers();
    state.phase = 'idle';
    state.matchId = '';
    state.roomCode = '';
    if (searchingBox) searchingBox.classList.add('hidden');
    if (roomCreatedBox) roomCreatedBox.classList.add('hidden');

    if (prevPhase === 'searching') {
      apiPost({ action: 'cancel_queue', playerId: state.playerId });
    } else if (prevPhase === 'waiting_room' && prevMatchId) {
      apiPost({ action: 'forfeit', matchId: prevMatchId, playerId: state.playerId });
    }
  }

  async function startFindMatch() {
    if (state.phase === 'searching' || state.phase === 'playing') return;
    await cancelSearchOrRoom();

    state.phase = 'searching';
    if (searchingBox) searchingBox.classList.remove('hidden');
    if (roomCreatedBox) roomCreatedBox.classList.add('hidden');
    if (searchStatusEl) searchStatusEl.textContent = 'Searching for an online opponent...';

    const cfg = state.config || {};
    const me = state.meProfile || getActivePlayerProfile();

    const res = await apiPost({
      action: 'queue',
      format: state.format,
      operation: cfg.operation || 'multiply',
      difficulty: cfg.difficulty || 'medium',
      name: me.name,
      avatar: me.avatar,
      playerId: state.playerId,
    });

    if (!state.active || state.phase !== 'searching') return;

    if (!res.ok || !res.data || !res.data.configured) {
      if (searchStatusEl) {
        searchStatusEl.textContent = 'Offline / Local host detected — matching with AI Rival...';
      }
      state.searchFallbackTimeout = setTimeout(() => {
        if (state.active && state.phase === 'searching') {
          startAiMatch();
        }
      }, 650);
      return;
    }

    if (res.data.matched && res.data.match) {
      beginMatch(res.data.match, 'online');
      return;
    }

    let remaining = Math.round(SEARCH_TIMEOUT_MS / 1000);
    if (searchStatusEl) {
      searchStatusEl.textContent = `Looking for player... (AI Rival in ${remaining}s)`;
    }

    state.searchCountdownInterval = setInterval(() => {
      remaining--;
      if (remaining > 0 && searchStatusEl) {
        searchStatusEl.textContent = `Looking for player... (AI Rival in ${remaining}s)`;
      }
    }, 1000);

    state.pollInterval = setInterval(async () => {
      if (!state.active || state.phase !== 'searching') return;
      const poll = await apiPost({ action: 'poll_queue', playerId: state.playerId });
      if (state.active && state.phase === 'searching' && poll.ok && poll.data && poll.data.matched && poll.data.match) {
        beginMatch(poll.data.match, 'online');
      }
    }, POLL_INTERVAL_MS);

    state.searchFallbackTimeout = setTimeout(async () => {
      if (!state.active || state.phase !== 'searching') return;
      clearRuntimeTimers();
      apiPost({ action: 'cancel_queue', playerId: state.playerId });
      toast('No human opponent found right now — AI Rival stepped in!', 'info');
      startAiMatch();
    }, SEARCH_TIMEOUT_MS);
  }

  async function createFriendRoom() {
    if (state.phase === 'playing') return;
    await cancelSearchOrRoom();

    const cfg = state.config || {};
    const me = state.meProfile || getActivePlayerProfile();
    const res = await apiPost({
      action: 'create_room',
      format: state.format,
      operation: cfg.operation || 'multiply',
      difficulty: cfg.difficulty || 'medium',
      name: me.name,
      avatar: me.avatar,
      playerId: state.playerId,
    });

    if (!state.active) return;

    if (!res.ok || !res.data || !res.data.configured) {
      toast('Online Friend Rooms activate on Vercel + Upstash Redis. Try AI Rival or Same-Device 2P!', 'info');
      return;
    }

    state.phase = 'waiting_room';
    state.roomCode = res.data.code || '';
    state.matchId = res.data.matchId || '';

    if (roomCodeDisplay) roomCodeDisplay.textContent = state.roomCode;
    if (roomCreatedBox) roomCreatedBox.classList.remove('hidden');
    if (searchingBox) searchingBox.classList.add('hidden');

    state.pollInterval = setInterval(async () => {
      if (!state.active || state.phase !== 'waiting_room' || !state.matchId) return;
      const poll = await apiGet(state.matchId);
      if (poll.ok && poll.data && poll.data.match) {
        const m = poll.data.match;
        if (m.status === 'active' || m.status === 'finished') {
          beginMatch(m, 'online');
        }
      }
    }, POLL_INTERVAL_MS);
  }

  async function joinFriendRoom(rawCode) {
    const code = normalizeRoomInput(rawCode);
    if (!code || code.length < 4) {
      toast('Enter a 4–10 character Friend Room code.', 'error');
      return;
    }
    await cancelSearchOrRoom();

    const cfg = state.config || {};
    const me = state.meProfile || getActivePlayerProfile();
    const res = await apiPost({
      action: 'join_room',
      code,
      name: me.name,
      avatar: me.avatar,
      playerId: state.playerId,
      operation: cfg.operation || 'multiply',
      difficulty: cfg.difficulty || 'medium',
    });

    if (!state.active) return;

    if (!res.ok || !res.data) {
      toast('Unable to join room right now.', 'error');
      return;
    }
    if (!res.data.configured) {
      toast('Online Friend Rooms activate on Vercel + Upstash Redis. Launching AI Rival instead!', 'info');
      startAiMatch();
      return;
    }
    if (!res.data.joined || !res.data.match) {
      toast(res.data.error || 'Room not found or already started.', 'error');
      return;
    }

    state.format = res.data.match.format || state.format;
    beginMatch(res.data.match, 'online');
  }

  function startAiMatch() {
    clearRuntimeTimers();
    const cfg = state.config || {};
    const me = state.meProfile || getActivePlayerProfile();
    const difficulty = cfg.difficulty || 'medium';
    const operation = cfg.operation || 'multiply';
    const rival = pickAiRival(difficulty);
    const seed = `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    const match = {
      matchId: seed,
      seed,
      format: state.format,
      operation,
      difficulty,
      status: 'active',
      ropePos: 0,
      winThreshold: 6,
      timeLeft: 90,
      endsAt: Date.now() + 90000,
      winnerOutcome: null,
      finishReason: null,
      lastEvent: null,
      me: {
        name: me.name,
        avatar: me.avatar,
        hp: 100,
        shieldReady: false,
        streak: 0,
        maxStreak: 0,
        correct: 0,
        answered: 0,
        pulls: 0,
      },
      opponent: {
        name: rival.name,
        avatar: rival.avatar,
        hp: 100,
        shieldReady: false,
        streak: 0,
        maxStreak: 0,
        correct: 0,
        answered: 0,
        pulls: 0,
      },
    };

    beginMatch(match, 'ai');
  }

  function beginMatch(matchView, kind) {
    clearRuntimeTimers();
    state.modeKind = kind;
    state.phase = 'playing';
    state.match = matchView;
    state.matchId = matchView.matchId;
    state.format = matchView.format || state.format;
    state.deckIndex = 0;
    state.directVal = '';
    state.isEvaluating = false;
    state.isStunned = false;
    state.lastHandledEventTs = 0;
    state.xpAwarded = false;

    if (typeof MathEngine !== 'undefined' && typeof MathEngine.generateSeededDeck === 'function') {
      state.deck = MathEngine.generateSeededDeck({
        seed: matchView.seed || matchView.matchId,
        operation: matchView.operation || 'multiply',
        difficulty: matchView.difficulty || 'medium',
        count: 80,
      });
    } else {
      state.deck = [];
    }

    if (lobbyPanel) lobbyPanel.classList.add('hidden');
    if (searchingBox) searchingBox.classList.add('hidden');
    if (roomCreatedBox) roomCreatedBox.classList.add('hidden');
    if (resultOverlay) resultOverlay.classList.add('hidden');
    if (battlePanel) battlePanel.classList.remove('hidden');
    if (equationCard) equationCard.classList.remove('tug-stunned');

    if (formatLabelEl) {
      formatLabelEl.textContent = state.format === 'tug' ? 'Online Tug-of-War' : '1v1 HP Battle';
    }

    const inputStyle = (state.config && state.config.inputStyle) || 'choice';
    if (inputChoiceWrap && inputDirectWrap) {
      if (inputStyle === 'direct') {
        inputChoiceWrap.classList.add('hidden');
        inputDirectWrap.classList.remove('hidden');
      } else {
        inputChoiceWrap.classList.remove('hidden');
        inputDirectWrap.classList.add('hidden');
      }
    }

    syncMatchHUD();
    loadNextProblem();

    // Countdown display timer
    state.clockInterval = setInterval(() => {
      if (!state.active || state.phase !== 'playing' || !state.match) return;
      if (state.modeKind === 'ai' && state.match.endsAt) {
        const left = Math.max(0, Math.ceil((state.match.endsAt - Date.now()) / 1000));
        state.match.timeLeft = left;
        if (timerEl) timerEl.textContent = `${left}s`;
        if (left <= 0) {
          resolveLocalTimeout();
        }
      } else if (state.match.timeLeft > 0) {
        state.match.timeLeft--;
        if (timerEl) timerEl.textContent = `${state.match.timeLeft}s`;
      }
    }, 1000);

    if (state.modeKind === 'online') {
      state.pollInterval = setInterval(pollOnlineMatch, POLL_INTERVAL_MS);
    } else {
      scheduleNextAiAction();
    }
  }

  async function pollOnlineMatch() {
    if (!state.active || state.phase !== 'playing' || !state.matchId) return;
    const res = await apiGet(state.matchId);
    if (!state.active || state.phase !== 'playing') return;
    if (res.ok && res.data && res.data.match) {
      applyServerMatchState(res.data.match);
    }
  }

  function applyServerMatchState(serverMatch) {
    if (!serverMatch) return;
    state.match = serverMatch;

    if (serverMatch.lastEvent && serverMatch.lastEvent.ts && serverMatch.lastEvent.ts > state.lastHandledEventTs) {
      state.lastHandledEventTs = serverMatch.lastEvent.ts;
      renderEventFx(serverMatch.lastEvent);
    }

    syncMatchHUD();
    if (serverMatch.status === 'finished') {
      finishMatch();
    }
  }

  function renderEventFx(ev) {
    if (!ev) return;
    const isMe = Boolean(ev.byMe);

    if (ev.type === 'hit' || ev.type === 'crit') {
      if (isMe) {
        if (typeof SoundEngine !== 'undefined') {
          if (ev.type === 'crit') SoundEngine.playCritical();
          else SoundEngine.playSlash();
        }
        spawnFx(combatFxEl, ev.type === 'crit' ? `CRIT! -${ev.amount} HP` : `-${ev.amount} HP`, ev.type === 'crit' ? '#fbbf24' : '#34d399');
        if (oppAvatarEl) {
          oppAvatarEl.classList.add('pvp-avatar-hit');
          setTimeout(() => oppAvatarEl.classList.remove('pvp-avatar-hit'), 350);
        }
      } else {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playBossAttack();
        spawnFx(combatFxEl, `RIVAL -${ev.amount} HP!`, '#fb7185');
        if (meAvatarEl) {
          meAvatarEl.classList.add('pvp-avatar-hit');
          setTimeout(() => meAvatarEl.classList.remove('pvp-avatar-hit'), 350);
        }
      }
    } else if (ev.type === 'shield_blocked') {
      if (typeof SoundEngine !== 'undefined') SoundEngine.playShieldBlock();
      spawnFx(combatFxEl, 'SHIELD BLOCKED!', '#22d3ee');
    } else if (ev.type === 'pull' || ev.type === 'power_pull') {
      if (typeof SoundEngine !== 'undefined') {
        if (isMe) SoundEngine.playCorrect();
        else SoundEngine.playClick();
      }
      const label = isMe
        ? (ev.type === 'power_pull' ? 'POWER PULL +2!' : 'PULL +1!')
        : (ev.type === 'power_pull' ? 'RIVAL +2 PULL!' : 'RIVAL +1 PULL');
      spawnFx(tugFxEl, label, isMe ? '#34d399' : '#fb7185');
    }
  }

  function spawnFx(container, text, color) {
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'damage-number text-sm sm:text-xl font-black drop-shadow-md';
    el.style.color = color || '#ffffff';
    el.textContent = text;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  function syncMatchHUD() {
    const m = state.match;
    if (!m) return;
    const me = m.me || {};
    const opp = m.opponent || {};

    if (timerEl) timerEl.textContent = `${m.timeLeft ?? 90}s`;
    const badgeLabel = state.modeKind === 'ai' ? 'AI RIVAL' : 'ONLINE';

    if (state.format === 'tug') {
      if (duelHud) duelHud.classList.add('hidden');
      if (tugHud) tugHud.classList.remove('hidden');

      if (tugMeAvatarEl) tugMeAvatarEl.innerHTML = getAvatarSvg(me.avatar);
      if (tugMeNameEl) tugMeNameEl.textContent = me.name || 'You';
      if (tugMePullsEl) tugMePullsEl.textContent = `${me.pulls || 0} pulls`;

      if (tugOppAvatarEl) tugOppAvatarEl.innerHTML = getAvatarSvg(opp.avatar);
      if (tugOppNameEl) tugOppNameEl.textContent = opp.name || 'Rival';
      if (tugOppBadgeEl) tugOppBadgeEl.textContent = badgeLabel;
      if (tugOppPullsEl) tugOppPullsEl.textContent = `${opp.pulls || 0} pulls`;

      const threshold = m.winThreshold || 6;
      const rope = Number(m.ropePos) || 0; // negative = YOU, positive = RIVAL
      const pct = Math.max(5, Math.min(95, 50 + (rope / threshold) * 44));
      if (ropeKnotEl) ropeKnotEl.style.left = `${pct}%`;
      if (ropeLabelEl) {
        if (rope === 0) ropeLabelEl.textContent = 'EVEN!';
        else if (rope < 0) ropeLabelEl.textContent = `YOU +${Math.abs(rope)}`;
        else ropeLabelEl.textContent = `RIVAL +${rope}`;
      }
      return;
    }

    if (tugHud) tugHud.classList.add('hidden');
    if (duelHud) duelHud.classList.remove('hidden');

    if (meAvatarEl) meAvatarEl.innerHTML = getAvatarSvg(me.avatar);
    if (meNameEl) meNameEl.textContent = me.name || 'You';
    if (meHpTextEl) meHpTextEl.textContent = `${Math.max(0, me.hp ?? 100)} HP`;
    if (meHpBarEl) meHpBarEl.style.width = `${Math.max(0, Math.min(100, me.hp ?? 100))}%`;
    if (meShieldEl) meShieldEl.classList.toggle('hidden', !me.shieldReady);
    if (meStreakEl) meStreakEl.textContent = `Streak ${me.streak || 0}`;

    if (oppAvatarEl) oppAvatarEl.innerHTML = getAvatarSvg(opp.avatar);
    if (oppNameEl) oppNameEl.textContent = opp.name || 'Rival';
    if (oppBadgeEl) oppBadgeEl.textContent = badgeLabel;
    if (oppHpTextEl) oppHpTextEl.textContent = `${Math.max(0, opp.hp ?? 100)} HP`;
    if (oppHpBarEl) oppHpBarEl.style.width = `${Math.max(0, Math.min(100, opp.hp ?? 100))}%`;
    if (oppShieldEl) oppShieldEl.classList.toggle('hidden', !opp.shieldReady);
    if (oppStreakEl) oppStreakEl.textContent = `Streak ${opp.streak || 0}`;
  }

  function updateDirectDisplay() {
    if (directValEl) {
      directValEl.textContent = state.directVal !== '' ? state.directVal : '_';
    }
  }

  function getCurrentProblem() {
    if (!state.deck || state.deck.length === 0) return null;
    if (state.deckIndex >= state.deck.length) {
      state.deckIndex = 0;
    }
    return state.deck[state.deckIndex];
  }

  function loadNextProblem() {
    if (state.phase !== 'playing') return;
    state.isEvaluating = false;
    state.directVal = '';
    updateDirectDisplay();
    choiceBtns.forEach(b => b.classList.remove('choice-correct', 'choice-wrong'));

    const prob = getCurrentProblem();
    if (!prob) return;

    state.problemStartTime = Date.now();
    if (opLabelEl) {
      const name = prob.operation === 'missing' ? 'Mystery Factor' : prob.operation.charAt(0).toUpperCase() + prob.operation.slice(1);
      opLabelEl.textContent = `${prob.symbol} ${name}`;
    }
    if (equationTextEl) equationTextEl.textContent = prob.equation;
    if (statusTextEl && !state.isStunned) {
      statusTextEl.textContent = state.format === 'tug'
        ? 'Answer fast for +2 Power Pull!'
        : 'Answer under 2.5s for a Critical Strike!';
    }

    choiceBtns.forEach((btn, idx) => {
      const val = prob.options[idx];
      const span = btn.querySelector('.choice-val');
      if (span) span.textContent = val !== undefined ? val : '';
      btn.dataset.answer = String(val);
    });
  }

  async function submitAnswer(rawAnswer) {
    if (state.phase !== 'playing' || state.isEvaluating || state.isStunned) return;
    const prob = getCurrentProblem();
    if (!prob) return;

    state.isEvaluating = true;
    const rt = state.problemStartTime ? Date.now() - state.problemStartTime : 3500;
    const isCorrect = Number(rawAnswer) === prob.answer;

    const inputStyle = (state.config && state.config.inputStyle) || 'choice';
    if (inputStyle === 'choice') {
      choiceBtns.forEach(btn => {
        const val = Number(btn.dataset.answer);
        if (val === prob.answer) btn.classList.add('choice-correct');
        else if (val === Number(rawAnswer) && !isCorrect) btn.classList.add('choice-wrong');
      });
    }

    if (state.callbacks && typeof state.callbacks.onStatsAttempt === 'function') {
      state.callbacks.onStatsAttempt(prob, isCorrect, rt);
    }

    if (!isCorrect && statusTextEl) {
      statusTextEl.textContent = `Oops! ${prob.equation} = ${prob.answer}`;
      if (typeof SoundEngine !== 'undefined') SoundEngine.playWrong();
    }

    state.deckIndex++;

    if (state.modeKind === 'online') {
      const res = await apiPost({
        action: 'answer',
        matchId: state.matchId,
        playerId: state.playerId,
        correct: isCorrect,
        responseTimeMs: Math.max(420, rt),
      });
      if (state.active && res.ok && res.data && res.data.match) {
        applyServerMatchState(res.data.match);
      }
      if (!isCorrect && state.format === 'tug' && state.phase === 'playing') {
        triggerLocalSlipStun();
        return;
      }
    } else {
      applyLocalPlayerAction('me', isCorrect, rt);
      if (state.phase === 'playing' && !isCorrect && state.format === 'tug') {
        triggerLocalSlipStun();
        return;
      }
    }

    if (state.phase === 'playing') {
      state.nextProbTimeout = setTimeout(loadNextProblem, isCorrect ? 220 : 520);
    }
  }

  function triggerLocalSlipStun() {
    state.isStunned = true;
    if (equationCard) equationCard.classList.add('tug-stunned');
    if (statusTextEl) statusTextEl.textContent = 'Slipped! Recovering (0.8s)...';
    clearTimeout(state.stunTimeout);
    state.stunTimeout = setTimeout(() => {
      state.isStunned = false;
      if (equationCard) equationCard.classList.remove('tug-stunned');
      if (state.active && state.phase === 'playing') {
        loadNextProblem();
      }
    }, 800);
  }

  function applyLocalPlayerAction(who, isCorrect, rtMs) {
    const m = state.match;
    if (!m || m.status !== 'active') return;

    const actor = who === 'me' ? m.me : m.opponent;
    const target = who === 'me' ? m.opponent : m.me;
    const isMe = who === 'me';
    const isFast = rtMs >= 350 && rtMs < 2500;
    actor.answered++;

    let ev = null;
    if (m.format === 'duel') {
      if (isCorrect) {
        actor.correct++;
        actor.streak++;
        actor.maxStreak = Math.max(actor.maxStreak, actor.streak);
        let dmg = Math.min(35, 15 + (isFast ? 8 : 0) + (actor.streak >= 3 ? 7 : 0));
        if (target.shieldReady) {
          target.shieldReady = false;
          dmg = 0;
          ev = { type: 'shield_blocked', byMe: isMe, byOpp: !isMe, amount: 0, ts: Date.now() };
        } else {
          target.hp = Math.max(0, target.hp - dmg);
          ev = { type: isFast ? 'crit' : 'hit', byMe: isMe, byOpp: !isMe, amount: dmg, ts: Date.now() };
        }
        if (actor.streak > 0 && actor.streak % 5 === 0) {
          actor.shieldReady = true;
        }
        if (target.hp <= 0) {
          m.status = 'finished';
          m.winnerOutcome = isMe ? 'win' : 'loss';
          m.finishReason = 'ko';
        }
      } else {
        actor.streak = 0;
        ev = { type: 'miss', byMe: isMe, byOpp: !isMe, amount: 0, ts: Date.now() };
      }
    } else {
      // AI Tug-of-War
      if (isCorrect) {
        actor.correct++;
        actor.streak++;
        actor.maxStreak = Math.max(actor.maxStreak, actor.streak);
        const pull = (isFast || actor.streak >= 3) ? 2 : 1;
        actor.pulls += pull;
        const delta = isMe ? -pull : pull;
        m.ropePos = Math.max(-6, Math.min(6, m.ropePos + delta));
        ev = { type: pull > 1 ? 'power_pull' : 'pull', byMe: isMe, byOpp: !isMe, amount: pull, ts: Date.now() };

        if (m.ropePos <= -6) {
          m.status = 'finished';
          m.winnerOutcome = 'win';
          m.finishReason = 'tug_win';
        } else if (m.ropePos >= 6) {
          m.status = 'finished';
          m.winnerOutcome = 'loss';
          m.finishReason = 'tug_win';
        }
      } else {
        actor.streak = 0;
        ev = { type: 'slip', byMe: isMe, byOpp: !isMe, amount: 0, ts: Date.now() };
      }
    }

    renderEventFx(ev);
    syncMatchHUD();
    if (m.status === 'finished') {
      finishMatch();
    }
  }

  function scheduleNextAiAction() {
    clearTimeout(state.aiTimeout);
    if (!state.active || state.phase !== 'playing' || state.modeKind !== 'ai') return;
    const diff = (state.match && state.match.difficulty) || 'medium';
    const range = diff === 'hard'
      ? [1700, 3100, 0.90]
      : diff === 'easy'
        ? [3200, 5400, 0.72]
        : [2300, 4100, 0.82];
    const delay = range[0] + Math.random() * (range[1] - range[0]);

    state.aiTimeout = setTimeout(() => {
      if (!state.active || state.phase !== 'playing' || state.modeKind !== 'ai') return;
      const correct = Math.random() < range[2];
      applyLocalPlayerAction('opp', correct, delay);
      if (state.phase === 'playing') {
        scheduleNextAiAction();
      }
    }, delay);
  }

  function resolveLocalTimeout() {
    const m = state.match;
    if (!m || m.status !== 'active') return;
    m.status = 'finished';
    m.finishReason = 'timeout';

    if (m.format === 'duel') {
      if (m.me.hp > m.opponent.hp) m.winnerOutcome = 'win';
      else if (m.opponent.hp > m.me.hp) m.winnerOutcome = 'loss';
      else m.winnerOutcome = m.me.correct > m.opponent.correct ? 'win' : (m.opponent.correct > m.me.correct ? 'loss' : 'draw');
    } else {
      if (m.ropePos < 0) m.winnerOutcome = 'win';
      else if (m.ropePos > 0) m.winnerOutcome = 'loss';
      else m.winnerOutcome = m.me.pulls > m.opponent.pulls ? 'win' : (m.opponent.pulls > m.me.pulls ? 'loss' : 'draw');
    }
    finishMatch();
  }

  async function handleForfeit() {
    if (state.phase !== 'playing') {
      showLobbyPanel();
      return;
    }
    if (state.modeKind === 'online' && state.matchId) {
      const res = await apiPost({
        action: 'forfeit',
        matchId: state.matchId,
        playerId: state.playerId,
      });
      if (res.ok && res.data && res.data.match) {
        state.match = res.data.match;
      }
    }
    if (state.match) {
      state.match.status = 'finished';
      state.match.winnerOutcome = 'loss';
      state.match.finishReason = 'forfeit';
    }
    finishMatch();
  }

  function finishMatch() {
    if (state.phase === 'finished') return;
    clearRuntimeTimers();
    state.phase = 'finished';
    state.isStunned = false;
    if (equationCard) equationCard.classList.remove('tug-stunned');

    const m = state.match || {};
    const me = m.me || {};
    const opp = m.opponent || {};
    const outcome = m.winnerOutcome || 'draw';
    const xpGained = outcome === 'win' ? 45 : outcome === 'draw' ? 25 : 15;

    if (outcome === 'win') {
      if (typeof SoundEngine !== 'undefined') SoundEngine.playLevelUp();
      if (typeof Confetti !== 'undefined') Confetti.cannon();
    } else if (typeof SoundEngine !== 'undefined') {
      SoundEngine.playGameOver();
    }

    if (resultBadgeEl) {
      resultBadgeEl.textContent = m.format === 'tug' ? 'Tug-of-War Complete' : '1v1 Battle Complete';
    }
    if (resultTitleEl) {
      resultTitleEl.textContent = outcome === 'win'
        ? 'Victory!'
        : outcome === 'draw'
          ? 'Draw Match!'
          : (m.finishReason === 'forfeit' ? 'Match Forfeited' : 'Defeated!');
    }
    if (resultSummaryEl) {
      const oppName = opp.name || 'Rival';
      if (m.format === 'tug') {
        resultSummaryEl.textContent = `You pulled ${me.pulls || 0}× vs ${oppName} (${opp.pulls || 0}×)`;
      } else {
        resultSummaryEl.textContent = `Your HP: ${Math.max(0, me.hp || 0)} vs ${oppName}: ${Math.max(0, opp.hp || 0)} HP (${me.correct || 0}/${me.answered || 0} accurate)`;
      }
    }
    if (resultXpEl) {
      resultXpEl.textContent = `+${xpGained} XP`;
    }
    if (resultOverlay) {
      resultOverlay.classList.remove('hidden');
    }

    if (!state.xpAwarded && state.callbacks && typeof state.callbacks.onMatchComplete === 'function') {
      state.xpAwarded = true;
      state.callbacks.onMatchComplete({
        outcome,
        format: m.format || state.format,
        xpGained,
        correctCount: me.correct || 0,
        totalCount: me.answered || 0,
        maxStreak: me.maxStreak || 0,
      });
    }
    syncRecordBadge();
  }

  function handleDirectKey(key) {
    if (state.phase !== 'playing' || state.isEvaluating || state.isStunned) return;
    const prob = getCurrentProblem();
    if (!prob) return;

    if (key === 'clear') {
      state.directVal = '';
    } else if (key === 'backspace') {
      state.directVal = state.directVal.slice(0, -1);
    } else if (key === 'enter') {
      if (state.directVal.length > 0) {
        submitAnswer(state.directVal);
        return;
      }
    } else if (/^[0-9]$/.test(key)) {
      if (state.directVal.length < 4) {
        state.directVal += key;
      }
      updateDirectDisplay();
      if (state.config && state.config.autoSubmit && state.directVal.length >= String(prob.answer).length) {
        submitAnswer(state.directVal);
      }
      return;
    }
    updateDirectDisplay();
  }

  function handleKey(e) {
    if (!state.active) return false;
    if (e.key === 'Escape') {
      if (state.phase === 'playing') {
        handleForfeit();
      } else if (state.phase === 'searching' || state.phase === 'waiting_room') {
        cancelSearchOrRoom();
      } else {
        const exitCb = state.callbacks && state.callbacks.onExit;
        stop();
        if (exitCb) exitCb();
      }
      return true;
    }
    if (state.phase !== 'playing' || state.isEvaluating || state.isStunned) return false;

    const inputStyle = (state.config && state.config.inputStyle) || 'choice';
    if (inputStyle === 'choice') {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (choiceBtns[idx] && choiceBtns[idx].dataset.answer) {
          submitAnswer(choiceBtns[idx].dataset.answer);
        }
        return true;
      }
      return false;
    }

    if (/^[0-9]$/.test(e.key)) {
      if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
      handleDirectKey(e.key);
      return true;
    }
    if (e.key === 'Backspace') {
      if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
      handleDirectKey('backspace');
      return true;
    }
    if (e.key === 'Enter') {
      handleDirectKey('enter');
      return true;
    }
    return false;
  }

  function open({
    operation = 'multiply',
    difficulty = 'medium',
    inputStyle = 'choice',
    autoSubmit = false,
    initialCode = '',
    initialFormat = '',
    onOpenLocalTug,
    onMatchComplete,
    onStatsAttempt,
    onToast,
    onExit,
  } = {}) {
    bindElements();
    stop();

    state.active = true;
    state.playerId = getOrCreatePlayerId();
    state.meProfile = getActivePlayerProfile();
    state.config = { operation, difficulty, inputStyle, autoSubmit };
    state.callbacks = { onOpenLocalTug, onMatchComplete, onStatsAttempt, onToast, onExit };
    if (initialFormat === 'duel' || initialFormat === 'tug') {
      state.format = initialFormat;
    }

    showLobbyPanel();
    startPresence();

    const cleanCode = normalizeRoomInput(initialCode);
    if (cleanCode && cleanCode.length >= 4) {
      if (inputJoinCode) inputJoinCode.value = cleanCode;
      joinFriendRoom(cleanCode);
    }
  }

  function stop() {
    if (state.phase === 'searching') {
      apiPost({ action: 'cancel_queue', playerId: state.playerId });
    } else if (state.phase === 'waiting_room' && state.matchId) {
      apiPost({ action: 'forfeit', matchId: state.matchId, playerId: state.playerId });
    }
    stopPresence(true);
    clearRuntimeTimers();
    state.active = false;
    state.phase = 'idle';
    state.matchId = '';
    state.roomCode = '';
    state.match = null;
    state.isStunned = false;
    state.isEvaluating = false;
  }

  return {
    open,
    stop,
    handleKey,
    normalizeRoomInput,
    fetchOnlineCount,
  };
})();
