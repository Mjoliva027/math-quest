/**
 * Local Storage & Progression Manager for Math Quest
 * Manages player profile, XP, levels, high scores, matrix heatmap stats, and boss victories.
 */

const StorageManager = (() => {
  const STORAGE_KEY = 'math_quest_player_data';

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
      id: 'boss_slayer',
      title: 'Boss Slayer',
      desc: 'Defeat any RPG math monster',
      icon: `<svg class="w-5 h-5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      check: (data) => (data.bossStats && data.bossStats.totalBeaten >= 1),
    },
    {
      id: 'hydra_bane',
      title: 'Hydra Bane',
      desc: 'Defeat the Tier 3 Calculus Hydra',
      icon: `<svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><circle cx="12" cy="12" r="3"/></svg>`,
      check: (data) => (data.bossStats && data.bossStats.defeated && data.bossStats.defeated.includes('dragon')),
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
      boss: 0,
      endless: 0,
    },
    bossStats: {
      defeated: [],
      totalBeaten: 0,
    },
    matrixStats: {},
    masteredFlashcards: 0,
    achievements: [],
    mistakes: [],
    lastPlayed: null,
  };

  function getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DATA,
        ...parsed,
        highScores: { ...DEFAULT_DATA.highScores, ...(parsed.highScores || {}) },
        bossStats: { ...DEFAULT_DATA.bossStats, ...(parsed.bossStats || {}) },
        matrixStats: { ...(parsed.matrixStats || {}) },
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      };
    } catch (e) {
      console.warn('Failed to load Math Quest data from localStorage:', e);
      return { ...DEFAULT_DATA };
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save Math Quest data to localStorage:', e);
    }
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

  function recordGameResult({ mode, duration = null, score = 0, streak = 0, correct = 0, total = 0 }) {
    const data = getData();

    data.totalAnswered += total;
    data.totalCorrect += correct;
    data.highestStreak = Math.max(data.highestStreak, streak);
    data.lastPlayed = new Date().toISOString();

    let newHighScore = false;
    let scoreKey = null;

    if (mode === 'blitz') {
      scoreKey = `blitz_${duration || 60}`;
    } else if (mode === 'survival') {
      scoreKey = 'survival';
    } else if (mode === 'boss') {
      scoreKey = 'boss';
    } else if (mode === 'endless') {
      scoreKey = 'endless';
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

  function recordMatrixAttempt(num1, num2, isCorrect) {
    const data = getData();
    const key = `${Math.min(num1, num2)}x${Math.max(num1, num2)}`;
    data.matrixStats = data.matrixStats || {};
    
    if (!data.matrixStats[key]) {
      data.matrixStats[key] = { attempts: 0, correct: 0 };
    }
    
    data.matrixStats[key].attempts++;
    if (isCorrect) {
      data.matrixStats[key].correct++;
    }
    
    saveData(data);
  }

  function getMatrixStats() {
    const data = getData();
    return data.matrixStats || {};
  }

  function recordBossDefeated(bossId) {
    const data = getData();
    data.bossStats = data.bossStats || { defeated: [], totalBeaten: 0 };
    if (!data.bossStats.defeated.includes(bossId)) {
      data.bossStats.defeated.push(bossId);
    }
    data.bossStats.totalBeaten = (data.bossStats.totalBeaten || 0) + 1;
    saveData(data);
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
      bossStats: data.bossStats || { defeated: [], totalBeaten: 0 },
      masteredFlashcards: data.masteredFlashcards || 0,
      mistakeCount: (data.mistakes || []).length,
    };
  }

  function resetAll() {
    saveData({ ...DEFAULT_DATA });
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

    (data.mistakes || []).forEach(m => {
      if (m.operation === operation && m.num1 && m.num2) {
        candidates.push({
          num1: m.num1,
          num2: m.num2,
          weight: 25,
        });
      }
    });

    if (operation === 'multiply') {
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

      const merged = {
        ...DEFAULT_DATA,
        xp: typeof parsed.xp === 'number' ? Math.max(0, parsed.xp) : 0,
        totalAnswered: typeof parsed.totalAnswered === 'number' ? parsed.totalAnswered : 0,
        totalCorrect: typeof parsed.totalCorrect === 'number' ? parsed.totalCorrect : 0,
        highestStreak: typeof parsed.highestStreak === 'number' ? parsed.highestStreak : 0,
        highScores: { ...DEFAULT_DATA.highScores, ...(parsed.highScores || {}) },
        bossStats: { ...DEFAULT_DATA.bossStats, ...(parsed.bossStats || {}) },
        matrixStats: { ...(parsed.matrixStats || {}) },
        masteredFlashcards: typeof parsed.masteredFlashcards === 'number' ? parsed.masteredFlashcards : 0,
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
        lastPlayed: Date.now(),
      };

      saveData(merged);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  return {
    getData,
    saveData,
    getLevelInfo,
    addXP,
    recordGameResult,
    recordMatrixAttempt,
    getMatrixStats,
    recordBossDefeated,
    recordMistake,
    getMistakes,
    removeMistake,
    clearMistakes,
    incrementMasteredCards,
    getStats,
    getAchievements,
    checkAchievements,
    getWeakFacts,
    exportDataJSON,
    importDataJSON,
    resetAll,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
