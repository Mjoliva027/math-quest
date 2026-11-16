/**
 * Local Storage & Progression Manager for Math Quest
 * Manages player profile, XP, levels, high scores, matrix heatmap stats, and boss victories.
 */

const StorageManager = (() => {
  const STORAGE_KEY = 'math_quest_player_data';

  const LEVEL_TITLES = [
    { level: 1, title: 'Number Novice', icon: '🌱' },
    { level: 2, title: 'Multiplication Apprentice', icon: '⭐' },
    { level: 3, title: 'Speed Calculator', icon: '⚡' },
    { level: 4, title: 'Table Explorer', icon: '🧭' },
    { level: 5, title: 'Math Knight', icon: '⚔️' },
    { level: 6, title: 'Math Champion', icon: '🛡️' },
    { level: 7, title: 'Equation Master', icon: '🔮' },
    { level: 8, title: 'Calculation Wizard', icon: '🧙' },
    { level: 9, title: 'Table Titan', icon: '👑' },
    { level: 10, title: 'Grand Math Sage', icon: '🌟' },
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
    },
    bossStats: {
      defeated: [], // Array of defeated boss IDs
      totalBeaten: 0,
    },
    matrixStats: {}, // e.g. "7x8": { attempts: 5, correct: 4 }
    masteredFlashcards: 0,
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

  // Record an attempt for a specific cell in the 12x12 matrix
  function recordMatrixAttempt(num1, num2, isCorrect) {
    const data = getData();
    const key = `${Math.min(num1, num2)}x${Math.max(num1, num2)}`; // Symmetric key
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

  // Record a boss defeat
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
    resetAll,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
