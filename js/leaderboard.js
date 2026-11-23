/**
 * Client Leaderboard Adapter for Math Quest
 * Supports offline multi-profile local device leaderboards and optional Vercel serverless boards.
 */

const LeaderboardClient = (() => {
  const CLIENT_ID_KEY = 'math_quest_client_id';

  const HERO_ADJECTIVES = [
    'Cosmic', 'Turbo', 'Swift', 'Bright', 'Clever', 'Brave', 'Solar', 'Lunar', 'Pixel', 'Noble',
  ];

  const HERO_ANIMALS = [
    'Owl', 'Knight', 'Falcon', 'Fox', 'Panda', 'Tiger', 'Otter', 'Rocket', 'Wizard', 'Comet',
  ];

  function generateHeroName(rng = Math.random) {
    const adj = HERO_ADJECTIVES[Math.floor(rng() * HERO_ADJECTIVES.length)];
    const noun = HERO_ANIMALS[Math.floor(rng() * HERO_ANIMALS.length)];
    const num = String(Math.floor(rng() * 90) + 10);
    return `${adj} ${noun} #${num}`;
  }

  function normalizeRoomCode(raw) {
    if (raw === undefined || raw === null) return '';
    return String(raw).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
  }

  function getClientId() {
    try {
      const existing = localStorage.getItem(CLIENT_ID_KEY);
      if (existing && existing.length >= 6) return existing;
      const generated = `mq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(CLIENT_ID_KEY, generated);
      return generated;
    } catch (e) {
      return `mq_temp_${Math.random().toString(36).slice(2, 8)}`;
    }
  }

  function getLocalBoard(category = 'xp', storageRef = null) {
    const manager = storageRef || (typeof StorageManager !== 'undefined' ? StorageManager : null);
    if (!manager || typeof manager.getLocalLeaderboard !== 'function') {
      return [];
    }
    return manager.getLocalLeaderboard(category);
  }

  async function fetchOnlineBoard({ board = 'daily', dateKey = '', room = '' } = {}) {
    if (typeof fetch !== 'function') {
      return { online: false, configured: false, entries: [] };
    }
    const cleanRoom = normalizeRoomCode(room);
    if (room && cleanRoom.length < 3) {
      return { online: false, configured: false, error: 'Room code must be 3-12 characters', entries: [] };
    }

    const params = new URLSearchParams();
    params.set('board', board);
    if (dateKey) params.set('dateKey', dateKey);
    if (cleanRoom) params.set('room', cleanRoom);

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 4000) : null;

    try {
      const res = await fetch(`./api/leaderboard?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined,
      });
      if (!res.ok) {
        return { online: false, configured: false, entries: [] };
      }
      const data = await res.json();
      if (!data || typeof data !== 'object') {
        return { online: false, configured: false, entries: [] };
      }
      return {
        online: Boolean(data.configured),
        configured: Boolean(data.configured),
        board: data.board || board,
        dateKey: data.dateKey || dateKey,
        room: data.room || cleanRoom,
        entries: Array.isArray(data.entries) ? data.entries : [],
      };
    } catch (e) {
      return { online: false, configured: false, entries: [] };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function submitOnlineScore({
    board,
    dateKey = '',
    room = '',
    name = '',
    avatar = 'knight',
    score = 0,
    correct = 0,
    total = 15,
    timeSeconds = 0,
    wave = 1,
    floor = 1,
  } = {}) {
    if (typeof fetch !== 'function') {
      return { submitted: false, configured: false };
    }
    const cleanRoom = normalizeRoomCode(room);
    if (room && cleanRoom.length < 3) {
      return { submitted: false, configured: false, error: 'Invalid room code' };
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 4000) : null;

    try {
      const payload = {
        board,
        dateKey,
        room: cleanRoom,
        name,
        avatar,
        clientId: getClientId(),
        score,
        correct,
        total,
        timeSeconds,
        wave,
        floor,
      };
      const res = await fetch('./api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined,
      });
      if (!res.ok) {
        return { submitted: false, configured: res.status !== 404 && res.status !== 503 };
      }
      const data = await res.json();
      return {
        submitted: Boolean(data && data.accepted),
        configured: Boolean(data && data.configured),
        entry: data ? data.entry : null,
      };
    } catch (e) {
      return { submitted: false, configured: false };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function fetchRoomGoal({ room = '' } = {}) {
    const cleanRoom = normalizeRoomCode(room);
    if (cleanRoom.length < 3 || typeof fetch !== 'function') {
      return { configured: false };
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 4000) : null;
    try {
      const res = await fetch(`./api/leaderboard?action=room_goal&room=${encodeURIComponent(cleanRoom)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined,
      });
      if (!res.ok) return { configured: false };
      const data = await res.json();
      if (!data || !data.configured) return { configured: false };
      return {
        configured: true,
        room: data.room || cleanRoom,
        weekKey: data.weekKey || '',
        solved: Math.max(0, Number(data.solved) || 0),
        target: Math.max(1, Number(data.target) || 500),
        contributors: Math.max(0, Number(data.contributors) || 0),
      };
    } catch (e) {
      return { configured: false };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function reportRoomProgress({ room = '', solved = 0 } = {}) {
    const cleanRoom = normalizeRoomCode(room);
    const count = Math.max(0, Math.min(200, Math.floor(Number(solved) || 0)));
    if (cleanRoom.length < 3 || count < 1 || typeof fetch !== 'function') {
      return { submitted: false, configured: false };
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 4000) : null;
    try {
      const res = await fetch('./api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action: 'room_progress', room: cleanRoom, solved: count, clientId: getClientId() }),
        signal: controller ? controller.signal : undefined,
      });
      if (!res.ok) return { submitted: false, configured: false };
      const data = await res.json();
      return {
        submitted: Boolean(data && data.configured),
        configured: Boolean(data && data.configured),
        solved: data ? Number(data.solved) || 0 : 0,
        target: data ? Number(data.target) || 500 : 500,
        contributors: data ? Number(data.contributors) || 0 : 0,
      };
    } catch (e) {
      return { submitted: false, configured: false };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return {
    generateHeroName,
    normalizeRoomCode,
    getClientId,
    getLocalBoard,
    fetchOnlineBoard,
    submitOnlineScore,
    fetchRoomGoal,
    reportRoomProgress,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeaderboardClient;
}
