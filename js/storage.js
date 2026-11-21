/**
 * Local Storage & Progression Manager for Math Quest
 * Manages player profile, XP, levels, high scores, matrix heatmap stats, PvP stats, and survival records.
 */

const StorageManager = (() => {
  const STORAGE_KEY = 'math_quest_player_data';
  const PROFILES_KEY = 'math_quest_profiles';

  const PROFILE_AVATARS = [
    { id: 'knight', label: 'Knight', svg: `<svg class="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` },
    { id: 'wizard', label: 'Wizard', svg: `<svg class="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 4-2 2"/><path d="m14 9-3 3"/><path d="M8 21l-5-5L17.5 1.5a2.121 2.121 0 0 1 3 3L8 21z"/></svg>` },
    { id: 'star', label: 'Star', svg: `<svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
    { id: 'rocket', label: 'Rocket', svg: `<svg class="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>` },
    { id: 'shield', label: 'Guardian', svg: `<svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>` },
    { id: 'owl', label: 'Scholar', svg: `<svg class="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>` },
  ];

  const ALLOWED_MODES = ['blitz', 'pvp', 'meteor', 'survival', 'endless', 'flashcards'];
  const ALLOWED_OPS = ['multiply', 'divide', 'missing', 'add', 'subtract', 'mixed'];
  const ALLOWED_DIFFS = ['easy', 'medium', 'hard'];
  const ALLOWED_DURATIONS = [30, 60, 120];
  const ALLOWED_INPUTS = ['choice', 'direct'];
  const ALLOWED_THEMES = ['dark', 'light'];

  const DEFAULT_PREFERENCES = {
    mode: 'blitz',
    operation: 'multiply',
    difficulty: 'medium',
    customTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    blitzDuration: 30,
    inputStyle: 'choice',
    autoSubmit: false,
    theme: 'dark',
    settingsCollapsed: false,
    leaderboardRoom: '',
  };

  const LEVEL_TITLES = [
    { level: 1, title: 'Number Novice', icon: `<svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/></svg>` },
    { level: 2, title: 'Multiplication Apprentice', icon: `<svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
    { level: 3, title: 'Speed Calculator', icon: `<svg class="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>` },
    { level: 4, title: 'Table Explorer', icon: `<svg class="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>` },
    { level: 5, title: 'Math Knight', icon: `<svg class="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>` },
    { level: 6, title: 'Math Champion', icon: `<svg class="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>` },
    { level: 7, title: 'Equation Master', icon: `<svg class="w-4 h-4 text-fuchsia-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>` },
    { level: 8, title: 'Calculation Wizard', icon: `<svg class="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 4-2 2"/><path d="m14 9-3 3"/><path d="m12 14-2 2"/><path d="M18 2h4v4"/><path d="M22 2l-7 7"/><path d="M8 21l-5-5L17.5 1.5a2.121 2.121 0 0 1 3 3L8 21z"/></svg>` },
    { level: 9, title: 'Table Titan', icon: `<svg class="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.735H5.81a1 1 0 0 1-.957-.735L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>` },
    { level: 10, title: 'Grand Math Sage', icon: `<svg class="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
  ];

  const ACHIEVEMENT_DEFINITIONS = [
    {
      id: 'first_win',
      title: 'First Step',
      desc: 'Complete your first math round',
      icon: `<svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`,
      check: (data) => data.totalAnswered >= 1,
    },
    {
      id: 'streak_10',
      title: 'Flame Keeper',
      desc: 'Achieve a 10+ answer streak',
      icon: `<svg class="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
      check: (data) => data.highestStreak >= 10,
    },
    {
      id: 'streak_20',
      title: 'Unstoppable Flow',
      desc: 'Reach a streak of 20 or higher',
      icon: `<svg class="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
      check: (data) => data.highestStreak >= 20,
    },
    {
      id: 'centurion',
      title: 'Centurion',
      desc: 'Solve 100 equations lifetime',
      icon: `<svg class="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>`,
      check: (data) => data.totalAnswered >= 100,
    },
    {
      id: 'pvp_victor',
      title: 'Arena Victor',
      desc: 'Win your first PvP Battle or Tug-of-War',
      icon: `<svg class="w-5 h-5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="m17.5 14.5 3.5-3.5L18 8l-3.5 3.5"/><path d="m9.5 6.5-6 6"/></svg>`,
      check: (data) => Boolean(data.pvpStats && data.pvpStats.wins >= 1),
    },
    {
      id: 'tower_climber',
      title: 'Tower Climber',
      desc: 'Reach Floor 4 in Survival Gauntlet',
      icon: `<svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      check: (data) => (data.survivalBestFloor || 0) >= 4,
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      desc: 'Score 250+ points in Speed Blitz',
      icon: `<svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      check: (data) => (data.highScores && (data.highScores.blitz_30 >= 250 || data.highScores.blitz_60 >= 250 || data.highScores.blitz_120 >= 250)),
    },
    {
      id: 'card_scholar',
      title: 'Card Scholar',
      desc: 'Master 15 or more study flashcards',
      icon: `<svg class="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      check: (data) => (data.masteredFlashcards >= 15),
    },
  ];

  const DEFAULT_DATA = {
    xp: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    highestStreak: 0,
    highScores: {
      blitz_30: 0,
      blitz_60: 0,
      blitz_120: 0,
      survival: 0,
      endless: 0,
      meteor: 0,
    },
    survivalBestFloor: 0,
    pvpStats: {
      wins: 0,
      losses: 0,
      draws: 0,
      winStreak: 0,
      bestWinStreak: 0,
    },
    matrixStats: {},
    masteredFlashcards: 0,
    achievements: [],
    mistakes: [],
    lastPlayed: null,
  };

  function sanitizePreferences(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const mappedMode = src.mode === 'tug' ? 'pvp' : src.mode;
    const mode = ALLOWED_MODES.includes(mappedMode) ? mappedMode : DEFAULT_PREFERENCES.mode;
    const operation = ALLOWED_OPS.includes(src.operation) ? src.operation : DEFAULT_PREFERENCES.operation;
    const difficulty = ALLOWED_DIFFS.includes(src.difficulty) ? src.difficulty : DEFAULT_PREFERENCES.difficulty;
    const durNum = Number(src.blitzDuration);
    const blitzDuration = ALLOWED_DURATIONS.includes(durNum) ? durNum : DEFAULT_PREFERENCES.blitzDuration;
    const inputStyle = ALLOWED_INPUTS.includes(src.inputStyle) ? src.inputStyle : DEFAULT_PREFERENCES.inputStyle;
    const theme = ALLOWED_THEMES.includes(src.theme) ? src.theme : DEFAULT_PREFERENCES.theme;

    let customTables = [...DEFAULT_PREFERENCES.customTables];
    if (Array.isArray(src.customTables)) {
      const cleaned = Array.from(new Set(
        src.customTables
          .map(n => Number(n))
          .filter(n => Number.isInteger(n) && n >= 1 && n <= 12)
      )).sort((a, b) => a - b);
      if (cleaned.length > 0) {
        customTables = cleaned;
      }
    }

    const leaderboardRoom = typeof src.leaderboardRoom === 'string'
      ? src.leaderboardRoom.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12)
      : '';

    return {
      mode,
      operation,
      difficulty,
      customTables,
      blitzDuration,
      inputStyle,
      autoSubmit: Boolean(src.autoSubmit),
      theme,
      settingsCollapsed: Boolean(src.settingsCollapsed),
      leaderboardRoom,
    };
  }

  function sanitizeProfileName(name) {
    const cleaned = (typeof name === 'string' ? name : '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 24);
    return cleaned || 'Player';
  }

  function sanitizeAvatarId(avatarId) {
    return PROFILE_AVATARS.some(a => a.id === avatarId) ? avatarId : 'knight';
  }

  function getAvatarSvg(avatarId) {
    const found = PROFILE_AVATARS.find(a => a.id === avatarId) || PROFILE_AVATARS[0];
    return found.svg;
  }

  function getProfileRegistry() {
    const fallback = {
      activeId: 'default',
      list: [{ id: 'default', name: 'Player 1', avatar: 'knight' }],
    };
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.list) || parsed.list.length === 0) {
        return fallback;
      }
      const list = parsed.list
        .filter(item => item && typeof item.id === 'string' && item.id.trim().length > 0)
        .map(item => ({
          id: item.id,
          name: sanitizeProfileName(item.name),
          avatar: sanitizeAvatarId(item.avatar),
        }));
      if (list.length === 0) return fallback;
      const activeId = list.some(p => p.id === parsed.activeId) ? parsed.activeId : list[0].id;
      return { activeId, list };
    } catch (e) {
      return fallback;
    }
  }

  function saveProfileRegistry(registry) {
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(registry));
    } catch (e) {
      console.warn('Failed to save profile registry:', e);
    }
  }

  function getStorageKeyForProfile(profileId) {
    return profileId === 'default' ? STORAGE_KEY : `${STORAGE_KEY}_${profileId}`;
  }

  function getProfiles() {
    const reg = getProfileRegistry();
    return reg.list.map(p => ({
      ...p,
      svg: getAvatarSvg(p.avatar),
      isActive: p.id === reg.activeId,
    }));
  }

  function getActiveProfile() {
    const reg = getProfileRegistry();
    const found = reg.list.find(p => p.id === reg.activeId) || reg.list[0];
    return {
      ...found,
      svg: getAvatarSvg(found.avatar),
    };
  }

  function createProfile(name, avatarId = 'knight') {
    const reg = getProfileRegistry();
    if (reg.list.length >= 12) {
      return { success: false, error: 'Maximum 12 profiles reached' };
    }
    const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const profile = {
      id,
      name: sanitizeProfileName(name),
      avatar: sanitizeAvatarId(avatarId),
    };
    reg.list.push(profile);
    reg.activeId = id;
    saveProfileRegistry(reg);
    saveData(createDefaultData());
    return {
      success: true,
      profile: { ...profile, svg: getAvatarSvg(profile.avatar) },
    };
  }

  function switchProfile(profileId) {
    const reg = getProfileRegistry();
    const target = reg.list.find(p => p.id === profileId);
    if (!target) {
      return { success: false, error: 'Profile not found' };
    }
    reg.activeId = profileId;
    saveProfileRegistry(reg);
    return {
      success: true,
      profile: { ...target, svg: getAvatarSvg(target.avatar) },
    };
  }

  function renameProfile(profileId, newName, avatarId = null) {
    const reg = getProfileRegistry();
    const target = reg.list.find(p => p.id === profileId);
    if (!target) {
      return { success: false, error: 'Profile not found' };
    }
    if (typeof newName === 'string' && newName.trim().length > 0) {
      target.name = sanitizeProfileName(newName);
    }
    if (avatarId) {
      target.avatar = sanitizeAvatarId(avatarId);
    }
    saveProfileRegistry(reg);
    return {
      success: true,
      profile: { ...target, svg: getAvatarSvg(target.avatar) },
    };
  }

  function deleteProfile(profileId) {
    const reg = getProfileRegistry();
    if (reg.list.length <= 1) {
      return { success: false, error: 'Cannot delete the last remaining profile' };
    }
    const idx = reg.list.findIndex(p => p.id === profileId);
    if (idx === -1) {
      return { success: false, error: 'Profile not found' };
    }
    reg.list.splice(idx, 1);
    try {
      localStorage.removeItem(getStorageKeyForProfile(profileId));
    } catch (e) {}
    if (reg.activeId === profileId) {
      reg.activeId = reg.list[0].id;
    }
    saveProfileRegistry(reg);
    return {
      success: true,
      activeProfile: getActiveProfile(),
    };
  }

  function createDefaultData() {
    return {
      xp: 0,
      totalAnswered: 0,
      totalCorrect: 0,
      highestStreak: 0,
      highScores: {
        blitz_30: 0,
        blitz_60: 0,
        blitz_120: 0,
        survival: 0,
        endless: 0,
        meteor: 0,
      },
      survivalBestFloor: 0,
      pvpStats: {
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        bestWinStreak: 0,
      },
      matrixStats: {},
      masteredFlashcards: 0,
      achievements: [],
      mistakes: [],
      dailyStreak: {
        count: 0,
        best: 0,
        lastDate: null,
      },
      dailyQuests: {
        date: null,
        items: [],
      },
      dailyChallenge: {
        lastDate: null,
        history: {},
      },
      preferences: sanitizePreferences(DEFAULT_PREFERENCES),
      lastPlayed: null,
    };
  }

  function cloneDailyChallenge(dc) {
    const src = dc && typeof dc === 'object' ? dc : {};
    const rawHistory = src.history && typeof src.history === 'object' ? src.history : {};
    const history = {};
    Object.keys(rawHistory).forEach(k => {
      if (rawHistory[k] && typeof rawHistory[k] === 'object') {
        history[k] = {
          ...rawHistory[k],
          results: Array.isArray(rawHistory[k].results) ? [...rawHistory[k].results] : [],
        };
      }
    });
    return {
      lastDate: src.lastDate || null,
      history,
    };
  }

  function getData() {
    try {
      const storageKey = getStorageKeyForProfile(getProfileRegistry().activeId);
      const raw = localStorage.getItem(storageKey);
      if (!raw) return createDefaultData();
      const parsed = JSON.parse(raw);
      const defaults = createDefaultData();
      const parsedQuests = parsed.dailyQuests && typeof parsed.dailyQuests === 'object' ? parsed.dailyQuests : {};
      return {
        ...defaults,
        ...parsed,
        highScores: { ...defaults.highScores, ...(parsed.highScores || {}) },
        survivalBestFloor: Number(parsed.survivalBestFloor) || 0,
        pvpStats: {
          ...defaults.pvpStats,
          ...(parsed.pvpStats && typeof parsed.pvpStats === 'object' ? parsed.pvpStats : {}),
        },
        matrixStats: { ...(parsed.matrixStats || {}) },
        achievements: Array.isArray(parsed.achievements) ? [...parsed.achievements] : [],
        mistakes: Array.isArray(parsed.mistakes) ? [...parsed.mistakes] : [],
        dailyStreak: {
          ...defaults.dailyStreak,
          ...(parsed.dailyStreak || {}),
        },
        dailyQuests: {
          date: parsedQuests.date || null,
          items: Array.isArray(parsedQuests.items) ? parsedQuests.items.map(item => ({ ...item })) : [],
        },
        dailyChallenge: cloneDailyChallenge(parsed.dailyChallenge),
        preferences: sanitizePreferences(parsed.preferences),
      };
    } catch (e) {
      console.warn('Failed to load Math Quest data from localStorage:', e);
      return createDefaultData();
    }
  }

  function saveData(data) {
    try {
      const storageKey = getStorageKeyForProfile(getProfileRegistry().activeId);
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save Math Quest data to localStorage:', e);
    }
  }

  function getPreferences() {
    const data = getData();
    return sanitizePreferences(data.preferences);
  }

  function savePreferences(partial = {}) {
    const data = getData();
    const merged = sanitizePreferences({
      ...(data.preferences || {}),
      ...(partial && typeof partial === 'object' ? partial : {}),
    });
    data.preferences = merged;
    saveData(data);
    return {
      ...merged,
      customTables: [...merged.customTables],
    };
  }

  function getLevelForXP(xp) {
    let level = 1;
    while (getXPForLevel(level + 1) <= xp) {
      level++;
    }
    return level;
  }

  function getXPForLevel(level) {
    if (level <= 1) return 0;
    return Math.floor(60 * Math.pow(level - 1, 1.6));
  }

  function getLevelInfo(xp) {
    const currentLevel = getLevelForXP(xp);
    const currentLevelXP = getXPForLevel(currentLevel);
    const nextLevelXP = getXPForLevel(currentLevel + 1);
    const progressXP = xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const progressPercent = Math.min(100, Math.floor((progressXP / neededXP) * 100));

    let titleInfo = LEVEL_TITLES[LEVEL_TITLES.length - 1];
    for (let i = 0; i < LEVEL_TITLES.length; i++) {
      if (LEVEL_TITLES[i].level === currentLevel) {
        titleInfo = LEVEL_TITLES[i];
        break;
      }
    }

    return {
      level: currentLevel,
      title: titleInfo.title,
      icon: titleInfo.icon,
      xp,
      currentLevelXP,
      nextLevelXP,
      progressXP,
      neededXP,
      progressPercent,
    };
  }

  function addXP(amount) {
    const data = getData();
    const oldLevel = getLevelForXP(data.xp);
    data.xp = Math.max(0, (data.xp || 0) + amount);
    const newLevel = getLevelForXP(data.xp);
    saveData(data);

    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel,
      totalXP: data.xp,
      gainedXP: amount,
      levelInfo: getLevelInfo(data.xp),
    };
  }

  function getDateKey(dateObj = new Date()) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getYesterdayKey(dateObj = new Date()) {
    const prev = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() - 1);
    return getDateKey(prev);
  }

  function touchDailyStreakInData(data, dateObj = new Date()) {
    const today = getDateKey(dateObj);
    const yesterday = getYesterdayKey(dateObj);
    data.dailyStreak = data.dailyStreak || { count: 0, best: 0, lastDate: null };

    if (data.dailyStreak.lastDate === today) {
      return data.dailyStreak;
    }

    if (data.dailyStreak.lastDate === yesterday) {
      data.dailyStreak.count = (data.dailyStreak.count || 0) + 1;
    } else {
      data.dailyStreak.count = 1;
    }

    data.dailyStreak.lastDate = today;
    data.dailyStreak.best = Math.max(data.dailyStreak.best || 0, data.dailyStreak.count);
    return data.dailyStreak;
  }

  function formatDailyStreak(ds, dateObj = new Date()) {
    const today = getDateKey(dateObj);
    const yesterday = getYesterdayKey(dateObj);
    const activeToday = ds.lastDate === today;
    const count = (ds.lastDate === today || ds.lastDate === yesterday) ? (ds.count || 0) : 0;
    return {
      count,
      best: ds.best || 0,
      lastDate: ds.lastDate || null,
      activeToday,
    };
  }

  function getDailyStreak(dateObj = new Date()) {
    const data = getData();
    return formatDailyStreak(data.dailyStreak || { count: 0, best: 0, lastDate: null }, dateObj);
  }

  const DAILY_QUEST_TEMPLATES = [
    { id: 'solve_15', title: 'Solve 15 equations', metric: 'answered', target: 15, rewardXP: 35 },
    { id: 'streak_8', title: 'Hit an 8+ answer streak', metric: 'maxStreak', target: 8, rewardXP: 45 },
    { id: 'pvp_1', title: 'Win 1 PvP Match', metric: 'pvpWins', target: 1, rewardXP: 50 },
    { id: 'direct_5', title: 'Solve 5 with Numpad', metric: 'directCorrect', target: 5, rewardXP: 40 },
    { id: 'flash_5', title: 'Master 5 Flashcards', metric: 'flashcardsMastered', target: 5, rewardXP: 35 },
    { id: 'fast_5', title: 'Answer 5 facts under 3s', metric: 'fastCorrect', target: 5, rewardXP: 45 },
  ];

  function ensureDailyQuests(data, dateObj = new Date()) {
    const today = getDateKey(dateObj);
    if (
      data.dailyQuests &&
      data.dailyQuests.date === today &&
      Array.isArray(data.dailyQuests.items) &&
      data.dailyQuests.items.length > 0
    ) {
      return false;
    }

    const base = DAILY_QUEST_TEMPLATES[0];
    const rotating = DAILY_QUEST_TEMPLATES.slice(1);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
    }
    const idx1 = hash % rotating.length;
    const idx2 = (idx1 + 1 + (Math.floor(hash / rotating.length) % (rotating.length - 1))) % rotating.length;

    data.dailyQuests = {
      date: today,
      items: [base, rotating[idx1], rotating[idx2]].map(tpl => ({
        ...tpl,
        progress: 0,
        claimed: false,
      })),
    };
    return true;
  }

  function formatDailyQuests(dailyQuests) {
    const items = (dailyQuests && Array.isArray(dailyQuests.items)) ? dailyQuests.items : [];
    const completedCount = items.filter(q => q.progress >= q.target).length;
    return {
      date: dailyQuests ? dailyQuests.date : null,
      items,
      completedCount,
      totalCount: items.length,
    };
  }

  function getDailyQuests(dateObj = new Date()) {
    const data = getData();
    const changed = ensureDailyQuests(data, dateObj);
    if (changed) {
      saveData(data);
    }
    return formatDailyQuests(data.dailyQuests);
  }

  function updateDailyQuestProgress(metrics = {}, dateObj = new Date()) {
    const data = getData();
    ensureDailyQuests(data, dateObj);
    touchDailyStreakInData(data, dateObj);

    const newlyCompleted = [];
    data.dailyQuests.items.forEach(item => {
      const val = metrics[item.metric] || 0;
      if (val > 0) {
        if (item.metric === 'maxStreak') {
          item.progress = Math.min(item.target, Math.max(item.progress || 0, val));
        } else {
          item.progress = Math.min(item.target, (item.progress || 0) + val);
        }
      }
      if (item.progress >= item.target && !item.claimed) {
        item.claimed = true;
        data.xp = Math.max(0, (data.xp || 0) + item.rewardXP);
        newlyCompleted.push({ ...item });
      }
    });

    saveData(data);

    return {
      newlyCompleted,
      quests: formatDailyQuests(data.dailyQuests),
      dailyStreak: formatDailyStreak(data.dailyStreak, dateObj),
    };
  }

  function recordGameResult({ mode, duration = null, score = 0, streak = 0, correct = 0, total = 0, floor = 0 }) {
    const data = getData();

    data.totalAnswered += total;
    data.totalCorrect += correct;
    data.highestStreak = Math.max(data.highestStreak, streak);
    data.lastPlayed = new Date().toISOString();
    touchDailyStreakInData(data);

    let newHighScore = false;
    let scoreKey = null;

    if (mode === 'blitz') {
      scoreKey = `blitz_${duration || 60}`;
    } else if (mode === 'survival') {
      scoreKey = 'survival';
      if (Number(floor) > (data.survivalBestFloor || 0)) {
        data.survivalBestFloor = Math.floor(Number(floor));
      }
    } else if (mode === 'endless') {
      scoreKey = 'endless';
    } else if (mode === 'meteor') {
      scoreKey = 'meteor';
    }

    if (scoreKey && score > (data.highScores[scoreKey] || 0)) {
      data.highScores[scoreKey] = score;
      newHighScore = true;
    }

    saveData(data);

    return {
      newHighScore,
      highScore: scoreKey ? data.highScores[scoreKey] : 0,
      stats: getStats(),
    };
  }

  function recordPvpResult({ outcome = 'draw', format = 'duel' } = {}) {
    const data = getData();
    data.pvpStats = data.pvpStats || {
      wins: 0,
      losses: 0,
      draws: 0,
      winStreak: 0,
      bestWinStreak: 0,
    };

    if (outcome === 'win') {
      data.pvpStats.wins = (data.pvpStats.wins || 0) + 1;
      data.pvpStats.winStreak = (data.pvpStats.winStreak || 0) + 1;
      data.pvpStats.bestWinStreak = Math.max(data.pvpStats.bestWinStreak || 0, data.pvpStats.winStreak);
    } else if (outcome === 'loss') {
      data.pvpStats.losses = (data.pvpStats.losses || 0) + 1;
      data.pvpStats.winStreak = 0;
    } else {
      data.pvpStats.draws = (data.pvpStats.draws || 0) + 1;
    }

    touchDailyStreakInData(data);
    data.lastPlayed = new Date().toISOString();
    saveData(data);
    return { ...data.pvpStats, format };
  }

  function recordMatrixAttempt(num1, num2, isCorrect, responseTimeMs = null) {
    const data = getData();
    const key = `${Math.min(num1, num2)}x${Math.max(num1, num2)}`;
    data.matrixStats = data.matrixStats || {};

    if (!data.matrixStats[key]) {
      data.matrixStats[key] = { attempts: 0, correct: 0, totalTimeMs: 0, timedAttempts: 0 };
    } else {
      data.matrixStats[key].totalTimeMs = data.matrixStats[key].totalTimeMs || 0;
      data.matrixStats[key].timedAttempts = data.matrixStats[key].timedAttempts || 0;
    }

    data.matrixStats[key].attempts++;
    if (isCorrect) {
      data.matrixStats[key].correct++;
    }
    if (typeof responseTimeMs === 'number' && responseTimeMs > 0 && responseTimeMs <= 30000) {
      data.matrixStats[key].totalTimeMs += Math.round(responseTimeMs);
      data.matrixStats[key].timedAttempts++;
    }

    saveData(data);
  }

  function getMatrixStats() {
    const data = getData();
    return data.matrixStats || {};
  }

  function recordMistake(problem) {
    if (!problem) return;
    const data = getData();
    data.mistakes = data.mistakes || [];

    const exists = data.mistakes.some(m => m.equation === problem.equation);
    if (!exists) {
      data.mistakes.push({
        id: problem.id,
        equation: problem.equation,
        num1: problem.num1,
        num2: problem.num2,
        operation: problem.operation,
        symbol: problem.symbol,
        answer: problem.answer,
        hint: problem.hint,
        matrixFactors: Array.isArray(problem.matrixFactors) ? [...problem.matrixFactors] : null,
        timestamp: Date.now(),
      });
      if (data.mistakes.length > 40) {
        data.mistakes.shift();
      }
      saveData(data);
    }
  }

  function getMistakes() {
    const data = getData();
    return data.mistakes || [];
  }

  function removeMistake(equation) {
    const data = getData();
    data.mistakes = (data.mistakes || []).filter(m => m.equation !== equation);
    saveData(data);
  }

  function rotateMistakeToBack(equation) {
    const data = getData();
    data.mistakes = data.mistakes || [];
    const idx = data.mistakes.findIndex(m => m.equation === equation);
    if (idx !== -1 && data.mistakes.length > 1) {
      const [item] = data.mistakes.splice(idx, 1);
      data.mistakes.push(item);
      saveData(data);
    }
  }

  function clearMistakes() {
    const data = getData();
    data.mistakes = [];
    saveData(data);
  }

  function incrementMasteredCards(count = 1) {
    const data = getData();
    data.masteredFlashcards = (data.masteredFlashcards || 0) + count;
    saveData(data);
  }

  function getStats() {
    const data = getData();
    const accuracy = data.totalAnswered > 0
      ? Math.round((data.totalCorrect / data.totalAnswered) * 100)
      : 0;

    return {
      xp: data.xp,
      levelInfo: getLevelInfo(data.xp),
      totalAnswered: data.totalAnswered,
      totalCorrect: data.totalCorrect,
      accuracy,
      highestStreak: data.highestStreak,
      highScores: data.highScores,
      survivalBestFloor: data.survivalBestFloor || 0,
      pvpStats: data.pvpStats || { wins: 0, losses: 0, draws: 0, winStreak: 0, bestWinStreak: 0 },
      masteredFlashcards: data.masteredFlashcards || 0,
      mistakeCount: (data.mistakes || []).length,
    };
  }

  function resetAll() {
    saveData(createDefaultData());
  }

  function getAchievements() {
    const data = getData();
    const unlockedIds = data.achievements || [];
    return ACHIEVEMENT_DEFINITIONS.map(def => ({
      id: def.id,
      title: def.title,
      desc: def.desc,
      icon: def.icon,
      unlocked: unlockedIds.includes(def.id),
    }));
  }

  function checkAchievements() {
    const data = getData();
    const unlockedNow = [];
    data.achievements = data.achievements || [];

    ACHIEVEMENT_DEFINITIONS.forEach(def => {
      if (!data.achievements.includes(def.id)) {
        if (def.check(data)) {
          data.achievements.push(def.id);
          unlockedNow.push({
            id: def.id,
            title: def.title,
            desc: def.desc,
            icon: def.icon,
          });
        }
      }
    });

    if (unlockedNow.length > 0) {
      saveData(data);
    }
    return unlockedNow;
  }

  function getWeakFacts(operation = 'multiply', max = 15) {
    const data = getData();
    const candidates = [];
    const matrix = data.matrixStats || {};
    const usesMatrix = operation === 'multiply' || operation === 'divide' || operation === 'missing';

    (data.mistakes || []).forEach(m => {
      if (usesMatrix && ['multiply', 'divide', 'missing'].includes(m.operation)) {
        if (Array.isArray(m.matrixFactors) && m.matrixFactors.length === 2) {
          candidates.push({
            num1: m.matrixFactors[0],
            num2: m.matrixFactors[1],
            weight: 25,
          });
        } else if ((m.operation === 'multiply' || m.operation === 'missing') && m.num1 && m.num2) {
          candidates.push({
            num1: m.num1,
            num2: m.num2,
            weight: 25,
          });
        }
      } else if (m.operation === operation && m.num1 && m.num2) {
        candidates.push({
          num1: m.num1,
          num2: m.num2,
          weight: 25,
        });
      }
    });

    if (usesMatrix) {
      for (let r = 1; r <= 12; r++) {
        for (let c = 1; c <= 12; c++) {
          const key = `${Math.min(r, c)}x${Math.max(r, c)}`;
          const stat = matrix[key];
          if (stat && stat.attempts > 0) {
            const acc = stat.correct / stat.attempts;
            if (acc < 0.70) {
              candidates.push({
                num1: r,
                num2: c,
                weight: Math.round((1 - acc) * 20),
              });
            }
            if (stat.timedAttempts > 0) {
              const avgMs = stat.totalTimeMs / stat.timedAttempts;
              if (avgMs > 4500) {
                candidates.push({
                  num1: r,
                  num2: c,
                  weight: Math.min(18, Math.round((avgMs - 3000) / 300)),
                });
              }
            }
          }
        }
      }
    }

    const unique = [];
    const seen = new Set();
    candidates.sort((a, b) => b.weight - a.weight);

    for (const item of candidates) {
      const key = `${Math.min(item.num1, item.num2)}x${Math.max(item.num1, item.num2)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({ num1: item.num1, num2: item.num2 });
        if (unique.length >= max) break;
      }
    }

    return unique;
  }

  function getTableMastery() {
    const data = getData();
    const matrix = data.matrixStats || {};
    const result = {};

    for (let t = 1; t <= 12; t++) {
      let tested = 0;
      let mastered = 0;
      let attempts = 0;
      let correct = 0;

      for (let c = 1; c <= 12; c++) {
        const key = `${Math.min(t, c)}x${Math.max(t, c)}`;
        const stat = matrix[key];
        if (stat && stat.attempts > 0) {
          tested++;
          attempts += stat.attempts;
          correct += stat.correct || 0;
          if (stat.attempts >= 2 && (stat.correct / stat.attempts) >= 0.8) {
            mastered++;
          }
        }
      }

      const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      let status = 'untested';
      if (tested > 0) {
        if (mastered >= 10 || (tested === 12 && accuracy >= 80)) {
          status = 'mastered';
        } else if (accuracy < 60) {
          status = 'struggling';
        } else {
          status = 'learning';
        }
      }

      result[t] = {
        table: t,
        tested,
        mastered,
        attempts,
        correct,
        accuracy,
        progressPercent: Math.round((mastered / 12) * 100),
        status,
      };
    }

    return result;
  }

  function getRecommendedQuest() {
    const data = getData();
    const mistakes = data.mistakes || [];

    if (mistakes.length >= 3) {
      return {
        type: 'mistake_drill',
        badge: 'Review Priority',
        title: 'Clear Your Mistake Queue',
        subtitle: `Drill ${mistakes.length} missed equations for instant recall`,
        cta: 'Drill Mistakes',
        mode: 'mistake_drill',
      };
    }

    const mastery = getTableMastery();
    const tables = [];
    for (let t = 2; t <= 12; t++) {
      tables.push(mastery[t]);
    }

    const struggling = tables
      .filter(item => item.status === 'struggling')
      .sort((a, b) => a.accuracy - b.accuracy);
    const learning = tables.filter(item => item.status === 'learning');
    const untested = tables.filter(item => item.status === 'untested');

    const target = struggling[0] || learning[0] || untested[0];

    if (target) {
      const t = target.table;
      const status = target.status;
      let subtitle = `Not yet explored — challenge the ${t}× facts and earn XP!`;
      if (status === 'struggling') {
        subtitle = `Accuracy is ${target.accuracy}% — build confidence with focused practice!`;
      } else if (status === 'learning') {
        subtitle = `${target.mastered}/12 facts mastered — sprint through ${t}× to master it!`;
      }

      return {
        type: 'table_quest',
        badge: 'Recommended Quest',
        title: `Master the ${t}× Table`,
        subtitle,
        cta: status === 'struggling' ? 'Practice Now' : (status === 'learning' ? 'Speed Blitz' : 'Start Blitz'),
        mode: status === 'struggling' ? 'endless' : 'blitz',
        operation: 'multiply',
        table: t,
        difficulty: t <= 5 ? 'easy' : 'medium',
      };
    }

    return {
      type: 'pvp_challenge',
      badge: 'Master Challenge',
      title: 'Enter the PvP Arena',
      subtitle: 'All tables mastered — test your speed in Hard PvP or Survival Gauntlet!',
      cta: 'Play PvP',
      mode: 'pvp',
      operation: 'mixed',
      difficulty: 'hard',
    };
  }

  function formatDailyChallengeStatus(data, dateObj = new Date()) {
    const dateKey = getDateKey(dateObj);
    const history = (data.dailyChallenge && data.dailyChallenge.history) || {};
    const entry = history[dateKey] || null;
    return {
      dateKey,
      completed: Boolean(entry),
      entry: entry ? { ...entry, results: Array.isArray(entry.results) ? [...entry.results] : [] } : null,
      totalCompleted: Object.keys(history).length,
    };
  }

  function getDailyChallengeStatus(dateObj = new Date()) {
    const data = getData();
    return formatDailyChallengeStatus(data, dateObj);
  }

  function recordDailyChallengeResult({ dateKey, correct = 0, total = 15, timeSeconds = 0, bestStreak = 0, results = [] }, dateObj = new Date()) {
    const data = getData();
    const resolvedKey = dateKey || getDateKey(dateObj);
    data.dailyChallenge = data.dailyChallenge || { lastDate: null, history: {} };
    data.dailyChallenge.history = data.dailyChallenge.history || {};

    const existing = data.dailyChallenge.history[resolvedKey];
    const isFirstToday = !existing;
    const bonusXP = isFirstToday ? 50 : 0;

    const candidate = {
      dateKey: resolvedKey,
      correct,
      total,
      timeSeconds,
      bestStreak,
      results: Array.isArray(results) ? results.map(Boolean) : [],
      completedAt: Date.now(),
    };

    const isBetter = !existing ||
      candidate.correct > existing.correct ||
      (candidate.correct === existing.correct && candidate.timeSeconds < existing.timeSeconds);

    const savedEntry = isBetter ? candidate : existing;
    data.dailyChallenge.history[resolvedKey] = savedEntry;
    data.dailyChallenge.lastDate = resolvedKey;

    // Keep at most 30 most recent days in history
    const keys = Object.keys(data.dailyChallenge.history).sort().reverse();
    if (keys.length > 30) {
      keys.slice(30).forEach(oldKey => {
        delete data.dailyChallenge.history[oldKey];
      });
    }

    touchDailyStreakInData(data, dateObj);
    if (bonusXP > 0) {
      data.xp = Math.max(0, (data.xp || 0) + bonusXP);
    }

    saveData(data);

    return {
      isFirstToday,
      bonusXP,
      entry: { ...savedEntry, results: [...(savedEntry.results || [])] },
      status: formatDailyChallengeStatus(data, dateObj),
    };
  }

  function getParentSummary(dateObj = new Date()) {
    const data = getData();
    const matrix = data.matrixStats || {};
    const mastery = getTableMastery();
    const activeProfile = getActiveProfile();

    let testedFacts = 0;
    let masteredFacts = 0;
    let totalTimedMs = 0;
    let totalTimedAttempts = 0;
    const factList = [];

    for (let r = 1; r <= 12; r++) {
      for (let c = r; c <= 12; c++) {
        const key = `${r}x${c}`;
        const stat = matrix[key];
        if (stat && stat.attempts > 0) {
          testedFacts++;
          const accRatio = (stat.correct || 0) / stat.attempts;
          if (stat.attempts >= 2 && accRatio >= 0.8) {
            masteredFacts++;
          }
          if (stat.timedAttempts > 0) {
            totalTimedMs += stat.totalTimeMs || 0;
            totalTimedAttempts += stat.timedAttempts;
          }
          const avgSeconds = stat.timedAttempts > 0
            ? Number(((stat.totalTimeMs || 0) / stat.timedAttempts / 1000).toFixed(1))
            : null;
          factList.push({
            label: `${r} × ${c}`,
            accuracy: Math.round(accRatio * 100),
            attempts: stat.attempts,
            avgSeconds,
            accRatio,
          });
        }
      }
    }

    const weakestFacts = factList
      .filter(f => f.accRatio < 0.85 || (f.avgSeconds !== null && f.avgSeconds > 3.5))
      .sort((a, b) => {
        if (a.accRatio !== b.accRatio) return a.accRatio - b.accRatio;
        const speedDiff = (b.avgSeconds || 0) - (a.avgSeconds || 0);
        if (speedDiff !== 0) return speedDiff;
        return b.attempts - a.attempts;
      })
      .slice(0, 5)
      .map(({ label, accuracy, attempts, avgSeconds }) => ({ label, accuracy, attempts, avgSeconds }));

    const masteredTables = [];
    const strugglingTables = [];
    for (let t = 1; t <= 12; t++) {
      if (mastery[t].status === 'mastered') masteredTables.push(t);
      if (mastery[t].status === 'struggling') strugglingTables.push(t);
    }

    const avgResponseSeconds = totalTimedAttempts > 0
      ? Number((totalTimedMs / totalTimedAttempts / 1000).toFixed(1))
      : null;

    const overallAccuracy = (data.totalAnswered || 0) > 0
      ? Math.round(((data.totalCorrect || 0) / data.totalAnswered) * 100)
      : null;

    const dailyStreak = formatDailyStreak(data.dailyStreak || { count: 0, best: 0, lastDate: null }, dateObj);
    const dailyChallengesCompleted = Object.keys((data.dailyChallenge && data.dailyChallenge.history) || {}).length;

    return {
      profileName: activeProfile.name,
      totalUniqueFacts: 78,
      testedFacts,
      masteredFacts,
      masteredTables,
      strugglingTables,
      weakestFacts,
      avgResponseSeconds,
      overallAccuracy,
      totalAnswered: data.totalAnswered || 0,
      highestStreak: data.highestStreak || 0,
      pvpWins: (data.pvpStats && data.pvpStats.wins) || 0,
      survivalBestFloor: data.survivalBestFloor || 0,
      dailyStreak,
      dailyChallengesCompleted,
    };
  }

  function getDataForProfile(profileId) {
    try {
      const storageKey = getStorageKeyForProfile(profileId);
      const raw = localStorage.getItem(storageKey);
      if (!raw) return createDefaultData();
      const parsed = JSON.parse(raw);
      const defaults = createDefaultData();
      return {
        ...defaults,
        ...parsed,
        highScores: { ...defaults.highScores, ...(parsed.highScores || {}) },
        survivalBestFloor: Number(parsed.survivalBestFloor) || 0,
        pvpStats: {
          ...defaults.pvpStats,
          ...(parsed.pvpStats && typeof parsed.pvpStats === 'object' ? parsed.pvpStats : {}),
        },
        dailyChallenge: cloneDailyChallenge(parsed.dailyChallenge),
      };
    } catch (e) {
      return createDefaultData();
    }
  }

  function getLocalLeaderboard(category = 'xp', dateObj = new Date()) {
    const reg = getProfileRegistry();
    const dateKey = getDateKey(dateObj);

    const rows = reg.list.map(p => {
      const d = getDataForProfile(p.id);
      const xp = d.xp || 0;
      const level = getLevelInfo(xp).level;
      const hs = d.highScores || {};
      const blitzBest = Math.max(hs.blitz_30 || 0, hs.blitz_60 || 0, hs.blitz_120 || 0);
      const meteorBest = hs.meteor || 0;
      const survivalBest = hs.survival || 0;
      const survivalBestFloor = d.survivalBestFloor || 0;
      const dailyEntry = (d.dailyChallenge && d.dailyChallenge.history && d.dailyChallenge.history[dateKey])
        ? { ...d.dailyChallenge.history[dateKey] }
        : null;

      let value = xp;
      let subtext = `Lvl ${level}`;
      if (category === 'blitz') {
        value = blitzBest;
        subtext = `Best Blitz · Lvl ${level}`;
      } else if (category === 'meteor') {
        value = meteorBest;
        subtext = `Best Meteor · Lvl ${level}`;
      } else if (category === 'survival') {
        value = survivalBest;
        subtext = survivalBestFloor > 0
          ? `Floor ${survivalBestFloor} · Lvl ${level}`
          : `Best Survival · Lvl ${level}`;
      } else if (category === 'daily') {
        value = dailyEntry ? dailyEntry.correct : 0;
        subtext = dailyEntry
          ? `${dailyEntry.correct}/${dailyEntry.total} in ${dailyEntry.timeSeconds}s`
          : 'Not played today';
      }

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        svg: getAvatarSvg(p.avatar),
        isActive: p.id === reg.activeId,
        xp,
        level,
        highestStreak: d.highestStreak || 0,
        blitzBest,
        meteorBest,
        survivalBest,
        survivalBestFloor,
        dailyEntry,
        value,
        subtext,
      };
    });

    rows.sort((a, b) => {
      if (category === 'meteor') {
        if (b.meteorBest !== a.meteorBest) return b.meteorBest - a.meteorBest;
        return b.xp - a.xp;
      }
      if (category === 'survival') {
        if (b.survivalBest !== a.survivalBest) return b.survivalBest - a.survivalBest;
        return b.xp - a.xp;
      }
      if (category === 'blitz') {
        if (b.blitzBest !== a.blitzBest) return b.blitzBest - a.blitzBest;
        return b.xp - a.xp;
      }
      if (category === 'daily') {
        const aDone = Boolean(a.dailyEntry);
        const bDone = Boolean(b.dailyEntry);
        if (aDone !== bDone) return aDone ? -1 : 1;
        if (aDone && bDone) {
          if (b.dailyEntry.correct !== a.dailyEntry.correct) {
            return b.dailyEntry.correct - a.dailyEntry.correct;
          }
          if (a.dailyEntry.timeSeconds !== b.dailyEntry.timeSeconds) {
            return a.dailyEntry.timeSeconds - b.dailyEntry.timeSeconds;
          }
        }
        return b.xp - a.xp;
      }
      if (b.xp !== a.xp) return b.xp - a.xp;
      return b.highestStreak - a.highestStreak;
    });

    return rows;
  }

  function exportDataJSON() {
    const data = getData();
    return JSON.stringify(data, null, 2);
  }

  function importDataJSON(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON format');
      }

      const defaults = createDefaultData();
      const parsedQuests = parsed.dailyQuests && typeof parsed.dailyQuests === 'object' ? parsed.dailyQuests : {};
      const merged = {
        ...defaults,
        xp: typeof parsed.xp === 'number' ? Math.max(0, parsed.xp) : 0,
        totalAnswered: typeof parsed.totalAnswered === 'number' ? parsed.totalAnswered : 0,
        totalCorrect: typeof parsed.totalCorrect === 'number' ? parsed.totalCorrect : 0,
        highestStreak: typeof parsed.highestStreak === 'number' ? parsed.highestStreak : 0,
        highScores: { ...defaults.highScores, ...(parsed.highScores || {}) },
        survivalBestFloor: typeof parsed.survivalBestFloor === 'number' ? parsed.survivalBestFloor : 0,
        pvpStats: {
          ...defaults.pvpStats,
          ...(parsed.pvpStats && typeof parsed.pvpStats === 'object' ? parsed.pvpStats : {}),
        },
        matrixStats: { ...(parsed.matrixStats || {}) },
        masteredFlashcards: typeof parsed.masteredFlashcards === 'number' ? parsed.masteredFlashcards : 0,
        achievements: Array.isArray(parsed.achievements) ? [...parsed.achievements] : [],
        mistakes: Array.isArray(parsed.mistakes) ? [...parsed.mistakes] : [],
        dailyStreak: {
          ...defaults.dailyStreak,
          ...(parsed.dailyStreak || {}),
        },
        dailyQuests: {
          date: parsedQuests.date || null,
          items: Array.isArray(parsedQuests.items) ? parsedQuests.items.map(item => ({ ...item })) : [],
        },
        dailyChallenge: cloneDailyChallenge(parsed.dailyChallenge),
        preferences: sanitizePreferences(parsed.preferences),
        lastPlayed: Date.now(),
      };

      saveData(merged);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  return {
    PROFILE_AVATARS,
    getProfiles,
    getActiveProfile,
    createProfile,
    switchProfile,
    renameProfile,
    deleteProfile,
    getData,
    saveData,
    getDateKey,
    getPreferences,
    savePreferences,
    getLevelInfo,
    addXP,
    recordGameResult,
    recordPvpResult,
    recordMatrixAttempt,
    getMatrixStats,
    recordMistake,
    getMistakes,
    removeMistake,
    rotateMistakeToBack,
    clearMistakes,
    incrementMasteredCards,
    getStats,
    getAchievements,
    checkAchievements,
    getWeakFacts,
    getDailyStreak,
    getDailyQuests,
    updateDailyQuestProgress,
    getDailyChallengeStatus,
    recordDailyChallengeResult,
    getTableMastery,
    getRecommendedQuest,
    getParentSummary,
    getLocalLeaderboard,
    exportDataJSON,
    importDataJSON,
    resetAll,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
