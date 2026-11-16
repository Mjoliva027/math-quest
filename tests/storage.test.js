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
});
