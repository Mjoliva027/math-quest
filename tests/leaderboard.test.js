/**
 * Unit Tests for Vercel Serverless Leaderboard API & Client Leaderboard Module
 */

const StorageManager = require('../js/storage.js');

describe('Leaderboard API & Client - Validation, Safety & Local Ranking', () => {
  it('sanitizes nicknames, blocks HTML/XSS/profanity, and generates safe fallback names', () => {
    const api = require('../api/leaderboard.js');

    expect(api.sanitizeNickname('  Maya 42  ')).toBe('Maya 42');
    const xssCleaned = api.sanitizeNickname('<script>alert(1)</script>');
    expect(xssCleaned.includes('<')).toBe(false);
    expect(xssCleaned.includes('>')).toBe(false);

    // Profanity or too-short input gets replaced by kid-safe hero name
    const safeFromProfanity = api.sanitizeNickname('damn');
    expect(/^[A-Z][a-z]+ [A-Z][a-z]+ #\d{2}$/.test(safeFromProfanity)).toBe(true);

    const safeFromShort = api.sanitizeNickname('a');
    expect(/^[A-Z][a-z]+ [A-Z][a-z]+ #\d{2}$/.test(safeFromShort)).toBe(true);

    const generated = api.generateKidSafeName();
    expect(/^[A-Z][a-z]+ [A-Z][a-z]+ #\d{2}$/.test(generated)).toBe(true);
  });

  it('normalizes room codes and rejects invalid short or malformed codes', () => {
    const api = require('../api/leaderboard.js');

    expect(api.normalizeRoomCode('')).toBe('');
    expect(api.normalizeRoomCode('   ')).toBe('');
    expect(api.normalizeRoomCode(' grade-4a ')).toBe('GRADE4A');
    expect(api.normalizeRoomCode('ab')).toBe(null);
    expect(api.normalizeRoomCode('!@#')).toBe(null);
  });

  it('validates score submissions and rejects impossible or tampered values', () => {
    const api = require('../api/leaderboard.js');

    // Valid submissions
    const okDaily = api.validateScoreSubmission({
      board: 'daily',
      dateKey: '2026-11-20',
      name: 'Alex',
      avatar: 'wizard',
      correct: 14,
      total: 15,
      timeSeconds: 42,
    });
    expect(okDaily.valid).toBe(true);

    const okBlitz = api.validateScoreSubmission({
      board: 'blitz_60',
      name: 'Alex',
      avatar: 'knight',
      score: 450,
    });
    expect(okBlitz.valid).toBe(true);

    const okMeteor = api.validateScoreSubmission({
      board: 'meteor',
      room: 'grade4b',
      name: 'Sam',
      avatar: 'rocket',
      score: 1200,
      wave: 5,
    });
    expect(okMeteor.valid).toBe(true);
    expect(okMeteor.data.room).toBe('GRADE4B');

    const okSurvival = api.validateScoreSubmission({
      board: 'survival',
      room: 'grade4b',
      name: 'Maya',
      avatar: 'shield',
      score: 840,
      floor: 4,
    });
    expect(okSurvival.valid).toBe(true);
    expect(okSurvival.data.floor).toBe(4);

    // Invalid submissions
    expect(api.validateScoreSubmission({
      board: 'daily',
      dateKey: '2026-11-20',
      correct: 15,
      total: 15,
      timeSeconds: 3, // < 5s impossible
    }).valid).toBe(false);

    expect(api.validateScoreSubmission({
      board: 'daily',
      dateKey: '2026-11-20',
      correct: 16, // > 15
      total: 15,
      timeSeconds: 30,
    }).valid).toBe(false);

    expect(api.validateScoreSubmission({
      board: 'blitz_30',
      score: 999999, // unrealistic cap
    }).valid).toBe(false);

    expect(api.validateScoreSubmission({
      board: 'meteor',
      score: -10,
    }).valid).toBe(false);

    expect(api.validateScoreSubmission({
      board: 'survival',
      score: 999999,
      floor: 3,
    }).valid).toBe(false);

    expect(api.validateScoreSubmission({
      board: 'unknown_board',
      score: 100,
    }).valid).toBe(false);

    expect(api.validateScoreSubmission({
      board: 'blitz_60',
      score: 100,
      room: 'ab', // invalid < 3 chars
    }).valid).toBe(false);
  });

  it('computes daily composite scores prioritizing accuracy first, then faster time', () => {
    const api = require('../api/leaderboard.js');

    const perfectSlow = api.computeCompositeScore('daily', { correct: 15, timeSeconds: 40 });
    const fourteenFast = api.computeCompositeScore('daily', { correct: 14, timeSeconds: 15 });
    const perfectFast = api.computeCompositeScore('daily', { correct: 15, timeSeconds: 28 });

    expect(perfectSlow).toBeGreaterThan(fourteenFast);
    expect(perfectFast).toBeGreaterThan(perfectSlow);
  });

  it('exposes client helpers for hero names, room codes, and local device board', () => {
    localStorage.clear();
    const LeaderboardClient = require('../js/leaderboard.js');

    const hero = LeaderboardClient.generateHeroName();
    expect(/^[A-Z][a-z]+ [A-Z][a-z]+ #\d{2}$/.test(hero)).toBe(true);
    expect(LeaderboardClient.normalizeRoomCode(' room 7b ')).toBe('ROOM7B');

    StorageManager.addXP(150);
    const localBoard = LeaderboardClient.getLocalBoard('xp', StorageManager);
    expect(localBoard.length).toBe(1);
    expect(localBoard[0].xp).toBe(150);
  });
});
