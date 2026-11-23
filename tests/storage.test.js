/**
 * Unit Tests for StorageManager
 */

const StorageManager = require('../js/storage.js');

describe('StorageManager - Progression, Matrix & State', () => {
  beforeEach = () => {
    localStorage.clear();
  };

  it('calculates player levels and required XP accurately', () => {
    expect(StorageManager.getLevelInfo(0).level).toBe(1);
    expect(StorageManager.getLevelInfo(0).title).toBe('Number Novice');

    // Test progression to higher levels
    const lvl2 = StorageManager.getLevelInfo(65);
    expect(lvl2.level).toBe(2);
    expect(lvl2.title).toBe('Multiplication Apprentice');
  });

  it('records game results and updates high scores correctly', () => {
    localStorage.clear();
    const res1 = StorageManager.recordGameResult({
      mode: 'blitz',
      duration: 30,
      score: 180,
      streak: 8,
      correct: 12,
      total: 13,
    });
    expect(res1.newHighScore).toBe(true);

    const stats1 = StorageManager.getStats();
    expect(stats1.totalAnswered).toBe(13);
    expect(stats1.totalCorrect).toBe(12);
    expect(stats1.highestStreak).toBe(8);
    expect(stats1.highScores.blitz_30).toBe(180);

    // Lower score should not overwrite high score
    const res2 = StorageManager.recordGameResult({
      mode: 'blitz',
      duration: 30,
      score: 120,
      streak: 4,
      correct: 8,
      total: 10,
    });
    expect(res2.newHighScore).toBe(false);
    expect(StorageManager.getStats().highScores.blitz_30).toBe(180);
  });

  it('records and queries 12x12 matrix attempts', () => {
    localStorage.clear();
    StorageManager.recordMatrixAttempt(7, 8, true);
    StorageManager.recordMatrixAttempt(8, 7, true);
    StorageManager.recordMatrixAttempt(7, 8, false);

    const matrix = StorageManager.getMatrixStats();
    const stat7x8 = matrix['7x8'];
    expect(stat7x8.attempts).toBe(3);
    expect(stat7x8.correct).toBe(2);
  });

  it('manages mistakes queue with deduplication and cap', () => {
    localStorage.clear();
    const problem = {
      id: 'p1',
      equation: '6 × 7',
      num1: 6,
      num2: 7,
      operation: 'multiply',
      symbol: '×',
      answer: 42,
    };

    StorageManager.recordMistake(problem);
    expect(StorageManager.getMistakes().length).toBe(1);

    // Duplicate should not create duplicate entries
    StorageManager.recordMistake(problem);
    expect(StorageManager.getMistakes().length).toBe(1);

    StorageManager.removeMistake('6 × 7');
    expect(StorageManager.getMistakes().length).toBe(0);
  });

  it('exports and imports valid JSON data with validation', () => {
    localStorage.clear();
    StorageManager.addXP(250);
    StorageManager.recordMatrixAttempt(6, 9, true);

    const json = StorageManager.exportDataJSON();
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed.xp).toBe(250);

    // Clear storage and import
    localStorage.clear();
    expect(StorageManager.getData().xp).toBe(0);

    const importResult = StorageManager.importDataJSON(json);
    expect(importResult.success).toBe(true);
    expect(StorageManager.getData().xp).toBe(250);
    expect(StorageManager.getMatrixStats()['6x9'].correct).toBe(1);
  });

  it('tracks and unlocks player achievements', () => {
    localStorage.clear();
    const initialAchievements = StorageManager.getAchievements();
    expect(initialAchievements.length).toBeGreaterThan(5);

    // Check unlocking
    StorageManager.addXP(100);
    StorageManager.recordGameResult({
      mode: 'blitz',
      duration: 30,
      score: 350,
      streak: 12,
      correct: 15,
      total: 15,
    });

    const unlocked = StorageManager.checkAchievements();
    expect(unlocked.length).toBeGreaterThan(0);

    const currentAchievements = StorageManager.getAchievements();
    const streakBadge = currentAchievements.find(a => a.id === 'streak_10');
    expect(streakBadge.unlocked).toBe(true);
  });

  it('resets all nested data cleanly without mutating defaults', () => {
    localStorage.clear();
    StorageManager.recordGameResult({
      mode: 'blitz',
      duration: 120,
      score: 400,
      streak: 15,
      correct: 20,
      total: 20,
    });
    StorageManager.recordMatrixAttempt(9, 9, true);
    StorageManager.recordPvpResult({ outcome: 'win', format: 'duel' });
    StorageManager.recordMistake({
      id: 'm1',
      equation: '8 × 9',
      num1: 8,
      num2: 9,
      operation: 'multiply',
      symbol: '×',
      answer: 72,
    });
    StorageManager.checkAchievements();

    StorageManager.resetAll();

    const fresh = StorageManager.getData();
    expect(fresh.xp).toBe(0);
    expect(fresh.highScores.blitz_120).toBe(0);
    expect(fresh.survivalBestFloor).toBe(0);
    expect(fresh.pvpStats.wins).toBe(0);
    expect(fresh.pvpStats.losses).toBe(0);
    expect(Object.keys(fresh.matrixStats).length).toBe(0);
    expect(fresh.mistakes.length).toBe(0);
    expect(fresh.achievements.length).toBe(0);
  });

  it('tracks response-time fluency and surfaces slow facts in getWeakFacts', () => {
    localStorage.clear();
    StorageManager.recordMatrixAttempt(7, 8, true, 6200);
    StorageManager.recordMatrixAttempt(7, 8, true, 5400);
    StorageManager.recordMatrixAttempt(2, 3, true, 1200);

    const matrix = StorageManager.getMatrixStats();
    expect(matrix['7x8'].timedAttempts).toBe(2);
    expect(matrix['7x8'].totalTimeMs).toBe(11600);

    const weak = StorageManager.getWeakFacts('multiply', 10);
    const has7x8 = weak.some(f => (f.num1 === 7 && f.num2 === 8) || (f.num1 === 8 && f.num2 === 7));
    const has2x3 = weak.some(f => (f.num1 === 2 && f.num2 === 3) || (f.num1 === 3 && f.num2 === 2));
    expect(has7x8).toBe(true);
    expect(has2x3).toBe(false);
  });

  it('computes per-table mastery and recommends next quest adaptively', () => {
    localStorage.clear();
    const emptyRec = StorageManager.getRecommendedQuest();
    expect(emptyRec.type).toBe('table_quest');
    expect(emptyRec.table).toBe(2);

    // Record struggling attempts for table 7 (7x7 avoids spilling into other tables)
    StorageManager.recordMatrixAttempt(7, 7, false, 4000);
    StorageManager.recordMatrixAttempt(7, 7, false, 4200);
    StorageManager.recordMatrixAttempt(7, 7, true, 2100);

    const mastery = StorageManager.getTableMastery();
    expect(mastery[7].status).toBe('struggling');
    expect(mastery[7].accuracy).toBe(33);

    const strugglingRec = StorageManager.getRecommendedQuest();
    expect(strugglingRec.type).toBe('table_quest');
    expect(strugglingRec.table).toBe(7);
    expect(strugglingRec.mode).toBe('endless');

    // Add 3+ mistakes to trigger mistake drill recommendation
    for (let i = 1; i <= 3; i++) {
      StorageManager.recordMistake({
        id: `m_${i}`,
        equation: `7 × ${i + 5}`,
        num1: 7,
        num2: i + 5,
        operation: 'multiply',
        symbol: '×',
        answer: 7 * (i + 5),
      });
    }
    const mistakeRec = StorageManager.getRecommendedQuest();
    expect(mistakeRec.type).toBe('mistake_drill');
    expect(mistakeRec.mode).toBe('mistake_drill');
  });

  it('tracks daily streaks across consecutive days and resets after missed days', () => {
    localStorage.clear();
    const day1 = new Date(2026, 10, 18, 10, 0, 0);
    const day2 = new Date(2026, 10, 19, 10, 0, 0);
    const day4 = new Date(2026, 10, 21, 10, 0, 0);

    StorageManager.updateDailyQuestProgress({ answered: 1 }, day1);
    expect(StorageManager.getDailyStreak(day1).count).toBe(1);
    expect(StorageManager.getDailyStreak(day1).activeToday).toBe(true);

    // Same day again should not increment streak
    StorageManager.updateDailyQuestProgress({ answered: 2 }, day1);
    expect(StorageManager.getDailyStreak(day1).count).toBe(1);

    // Consecutive next day increments streak
    StorageManager.updateDailyQuestProgress({ answered: 1 }, day2);
    expect(StorageManager.getDailyStreak(day2).count).toBe(2);
    expect(StorageManager.getDailyStreak(day2).best).toBe(2);

    // Skipping a day resets visible streak to 0 before play, then 1 after play
    expect(StorageManager.getDailyStreak(day4).count).toBe(0);
    StorageManager.updateDailyQuestProgress({ answered: 1 }, day4);
    expect(StorageManager.getDailyStreak(day4).count).toBe(1);
    expect(StorageManager.getDailyStreak(day4).best).toBe(2);
  });

  it('generates daily quests, awards XP once per quest, and imports legacy JSON cleanly', () => {
    localStorage.clear();
    const today = new Date(2026, 10, 20, 12, 0, 0);
    const initial = StorageManager.getDailyQuests(today);
    expect(initial.items.length).toBe(3);
    expect(initial.completedCount).toBe(0);

    const baseQuest = initial.items.find(q => q.id === 'solve_15');
    expect(baseQuest).toBeTruthy();

    const step1 = StorageManager.updateDailyQuestProgress({ answered: 15 }, today);
    expect(step1.newlyCompleted.some(q => q.id === 'solve_15')).toBe(true);
    const xpAfterClaim = StorageManager.getData().xp;
    expect(xpAfterClaim).toBeGreaterThanOrEqual(35);

    // Further answers should not double-claim solve_15
    const step2 = StorageManager.updateDailyQuestProgress({ answered: 5 }, today);
    expect(step2.newlyCompleted.some(q => q.id === 'solve_15')).toBe(false);
    expect(StorageManager.getData().xp).toBe(xpAfterClaim);

    // Legacy backup JSON without dailyStreak / dailyQuests imports without error
    const legacyBackup = JSON.stringify({
      xp: 120,
      totalAnswered: 10,
      totalCorrect: 9,
      highestStreak: 5,
      highScores: { blitz_30: 150 },
      matrixStats: { '4x5': { attempts: 2, correct: 2 } },
    });
    const importRes = StorageManager.importDataJSON(legacyBackup);
    expect(importRes.success).toBe(true);
    expect(StorageManager.getData().xp).toBe(120);
    expect(StorageManager.getDailyStreak(today).count).toBe(0);
    expect(StorageManager.getDailyQuests(today).items.length).toBe(3);
  });

  it('persists and sanitizes user preferences with allowlist validation', () => {
    localStorage.clear();
    const defaults = StorageManager.getPreferences();
    expect(defaults.mode).toBe('blitz');
    expect(defaults.operation).toBe('multiply');
    expect(defaults.theme).toBe('dark');
    expect(defaults.autoSubmit).toBe(false);

    const saved = StorageManager.savePreferences({
      mode: 'pvp',
      inputStyle: 'direct',
      autoSubmit: true,
      theme: 'light',
      customTables: [7, 8],
      blitzDuration: 60,
    });
    expect(saved.mode).toBe('pvp');
    expect(saved.inputStyle).toBe('direct');
    expect(saved.autoSubmit).toBe(true);
    expect(saved.theme).toBe('light');
    expect(saved.customTables).toEqual([7, 8]);
    expect(saved.blitzDuration).toBe(60);

    // Legacy 'tug' maps to 'pvp'; 'boss' or invalid modes fall back to 'blitz'
    expect(StorageManager.savePreferences({ mode: 'tug' }).mode).toBe('pvp');
    expect(StorageManager.savePreferences({ mode: 'boss' }).mode).toBe('blitz');

    // Invalid values should be safely rejected/normalized
    const sanitized = StorageManager.savePreferences({
      mode: 'hacked',
      theme: 'neon',
      blitzDuration: 999,
      customTables: [99, 0, -5],
    });
    expect(sanitized.mode).toBe('blitz');
    expect(sanitized.theme).toBe('dark');
    expect(sanitized.blitzDuration).toBe(30);
    expect(sanitized.customTables).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('rotates mistakes to the back of the queue without dropping items', () => {
    localStorage.clear();
    const m1 = { id: 'm1', equation: '6 × 7', num1: 6, num2: 7, operation: 'multiply', symbol: '×', answer: 42 };
    const m2 = { id: 'm2', equation: '7 × 8', num1: 7, num2: 8, operation: 'multiply', symbol: '×', answer: 56 };
    const m3 = { id: 'm3', equation: '8 × 9', num1: 8, num2: 9, operation: 'multiply', symbol: '×', answer: 72 };

    StorageManager.recordMistake(m1);
    StorageManager.recordMistake(m2);
    StorageManager.recordMistake(m3);

    expect(StorageManager.getMistakes().length).toBe(3);
    StorageManager.rotateMistakeToBack('6 × 7');

    const rotated = StorageManager.getMistakes();
    expect(rotated.length).toBe(3);
    expect(rotated[0].equation).toBe('7 × 8');
    expect(rotated[1].equation).toBe('8 × 9');
    expect(rotated[2].equation).toBe('6 × 7');
  });

  it('supports multi-player local profiles with isolated stats and backwards-compatible default', () => {
    localStorage.clear();
    StorageManager.addXP(120);
    expect(StorageManager.getActiveProfile().id).toBe('default');
    expect(StorageManager.getData().xp).toBe(120);

    const created = StorageManager.createProfile('  <b>Maya</b>  ', 'wizard');
    expect(created.success).toBe(true);
    expect(created.profile.name).toBe('<b>Maya</b>');
    expect(StorageManager.getActiveProfile().id).toBe(created.profile.id);
    expect(StorageManager.getData().xp).toBe(0);

    StorageManager.addXP(45);
    expect(StorageManager.getData().xp).toBe(45);

    // Switching back to default restores original XP and legacy key remains intact
    StorageManager.switchProfile('default');
    expect(StorageManager.getData().xp).toBe(120);
    expect(JSON.parse(localStorage.getItem('math_quest_player_data')).xp).toBe(120);

    // Delete created profile succeeds; deleting the last remaining profile fails safely
    const delCreated = StorageManager.deleteProfile(created.profile.id);
    expect(delCreated.success).toBe(true);
    expect(StorageManager.getProfiles().length).toBe(1);

    const delLast = StorageManager.deleteProfile('default');
    expect(delLast.success).toBe(false);
    expect(StorageManager.getProfiles().length).toBe(1);
  });

  it('records daily challenge completion and awards first-time bonus XP once per day', () => {
    localStorage.clear();
    const day = new Date(2026, 10, 20, 14, 0, 0);
    const initialStatus = StorageManager.getDailyChallengeStatus(day);
    expect(initialStatus.completed).toBe(false);

    const first = StorageManager.recordDailyChallengeResult({
      dateKey: '2026-11-20',
      correct: 14,
      total: 15,
      timeSeconds: 42,
      bestStreak: 8,
      results: [true, true, true, true, true, true, false, true, true, true, true, true, true, true, true],
    }, day);

    expect(first.isFirstToday).toBe(true);
    expect(first.bonusXP).toBe(50);
    expect(StorageManager.getData().xp).toBe(50);
    expect(StorageManager.getDailyChallengeStatus(day).completed).toBe(true);

    // Replaying same day should NOT double-award bonus XP
    const second = StorageManager.recordDailyChallengeResult({
      dateKey: '2026-11-20',
      correct: 15,
      total: 15,
      timeSeconds: 36,
      bestStreak: 15,
      results: Array(15).fill(true),
    }, day);

    expect(second.isFirstToday).toBe(false);
    expect(second.bonusXP).toBe(0);
    expect(StorageManager.getData().xp).toBe(50);
    expect(second.entry.correct).toBe(15);
    expect(second.entry.timeSeconds).toBe(36);
  });

  it('computes parent/teacher progress summary with mastered facts and weakest facts', () => {
    localStorage.clear();
    const emptySummary = StorageManager.getParentSummary();
    expect(emptySummary.totalUniqueFacts).toBe(78);
    expect(emptySummary.overallAccuracy).toBe(null);

    // Mastered fact: 3x4
    StorageManager.recordMatrixAttempt(3, 4, true, 1500);
    StorageManager.recordMatrixAttempt(3, 4, true, 1700);
    // Struggling fact: 7x8
    StorageManager.recordMatrixAttempt(7, 8, false, 5200);
    StorageManager.recordMatrixAttempt(7, 8, false, 4800);
    StorageManager.recordMatrixAttempt(7, 8, true, 3000);

    StorageManager.recordGameResult({
      mode: 'blitz',
      duration: 30,
      score: 120,
      streak: 3,
      correct: 3,
      total: 5,
    });

    const summary = StorageManager.getParentSummary();
    expect(summary.totalUniqueFacts).toBe(78);
    expect(summary.masteredFacts).toBeGreaterThanOrEqual(1);
    expect(summary.testedFacts).toBe(2);
    expect(summary.avgResponseSeconds).toBeGreaterThan(0);
    expect(summary.overallAccuracy).toBe(60);
    expect(summary.weakestFacts.length).toBeGreaterThan(0);
    expect(summary.weakestFacts[0].label).toBe('7 × 8');
    expect(summary.weakestFacts[0].accuracy).toBe(33);
    expect(summary.weakestFacts[0].avgSeconds).toBeGreaterThan(0);
  });

  it('records meteor high score, persists room code preference, and builds local device leaderboard', () => {
    localStorage.clear();
    const today = new Date(2026, 10, 20, 15, 0, 0);

    // Profile 1 (default)
    StorageManager.addXP(80);
    StorageManager.recordGameResult({
      mode: 'meteor',
      score: 420,
      streak: 6,
      correct: 10,
      total: 12,
    });
    expect(StorageManager.getStats().highScores.meteor).toBe(420);

    const prefs = StorageManager.savePreferences({ leaderboardRoom: ' math-4a ' });
    expect(prefs.leaderboardRoom).toBe('MATH4A');

    // Profile 2
    const p2 = StorageManager.createProfile('Leo', 'rocket');
    expect(p2.success).toBe(true);
    StorageManager.addXP(200);
    StorageManager.recordGameResult({
      mode: 'meteor',
      score: 950,
      streak: 11,
      correct: 18,
      total: 19,
    });
    StorageManager.recordDailyChallengeResult({
      dateKey: '2026-11-20',
      correct: 15,
      total: 15,
      timeSeconds: 34,
      bestStreak: 15,
      results: Array(15).fill(true),
    }, today);

    const meteorBoard = StorageManager.getLocalLeaderboard('meteor', today);
    expect(meteorBoard.length).toBe(2);
    expect(meteorBoard[0].name).toBe('Leo');
    expect(meteorBoard[0].meteorBest).toBe(950);
    expect(meteorBoard[1].meteorBest).toBe(420);

    const xpBoard = StorageManager.getLocalLeaderboard('xp', today);
    expect(xpBoard[0].name).toBe('Leo');
    expect(xpBoard[0].xp).toBeGreaterThan(xpBoard[1].xp);

    const dailyBoard = StorageManager.getLocalLeaderboard('daily', today);
    expect(dailyBoard[0].name).toBe('Leo');
    expect(dailyBoard[0].dailyEntry.correct).toBe(15);
  });

  it('tracks PvP results, Survival Best Floor, new achievements, and survival leaderboard', () => {
    localStorage.clear();
    StorageManager.recordPvpResult({ outcome: 'win', format: 'duel' });
    StorageManager.recordPvpResult({ outcome: 'win', format: 'tug' });
    StorageManager.recordPvpResult({ outcome: 'loss', format: 'duel' });

    StorageManager.recordGameResult({
      mode: 'survival',
      score: 650,
      streak: 16,
      correct: 19,
      total: 22,
      floor: 4,
    });

    const stats = StorageManager.getStats();
    expect(stats.pvpStats.wins).toBe(2);
    expect(stats.pvpStats.losses).toBe(1);
    expect(stats.pvpStats.winStreak).toBe(0);
    expect(stats.pvpStats.bestWinStreak).toBe(2);
    expect(stats.survivalBestFloor).toBe(4);
    expect(stats.highScores.survival).toBe(650);

    StorageManager.checkAchievements();
    const achs = StorageManager.getAchievements();
    expect(achs.find(a => a.id === 'pvp_victor').unlocked).toBe(true);
    expect(achs.find(a => a.id === 'tower_climber').unlocked).toBe(true);

    const summary = StorageManager.getParentSummary();
    expect(summary.pvpWins).toBe(2);
    expect(summary.survivalBestFloor).toBe(4);

    const survBoard = StorageManager.getLocalLeaderboard('survival');
    expect(survBoard.length).toBe(1);
    expect(survBoard[0].survivalBest).toBe(650);
    expect(survBoard[0].subtext).toContain('Floor 4');
  });
});
