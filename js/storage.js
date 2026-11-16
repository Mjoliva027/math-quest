/**
 * Local Storage & Progression Manager for Math Quest
 * Manages player profile, XP, levels, high scores, accuracy, and mistake queue.
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
    },
    masteredFlashcards: 0,
    mistakes: [], // Array of missed problem objects for review
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

  /**
   * Calculates level based on XP
   * Formula: XP threshold = 60 * (level - 1)^1.6
   */
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

    // Find title
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

  /**
   * Add XP to the player profile
   */
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

  /**
   * Record game results
   */
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
      if (score > (data.highScores[scoreKey] || 0)) {
        data.highScores[scoreKey] = score;
        newHighScore = true;
      }
    } else if (mode === 'survival') {
      scoreKey = 'survival';
      if (score > (data.highScores[scoreKey] || 0)) {
        data.highScores[scoreKey] = score;
        newHighScore = true;
      }
    }

    saveData(data);

    return {
      newHighScore,
      highScore: scoreKey ? data.highScores[scoreKey] : 0,
      stats: getStats(),
    };
  }

  /**
   * Record a mistake into the review queue
   */
  function recordMistake(problem) {
    if (!problem) return;
    const data = getData();
    data.mistakes = data.mistakes || [];

    // Deduplicate by equation text
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
      // Limit queue to most recent 40 mistakes
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
