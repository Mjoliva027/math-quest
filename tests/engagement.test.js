/**
 * Unit Tests for the Engagement Suite:
 * Stars & Shop, Streak Freeze, Companion, 3-Star Table Mastery, PvP Trophies,
 * Next-Round Hook, Weekly Room Goals, PvP Emotes & Searching Count.
 */

const StorageManager = require('../js/storage.js');
const matchApi = require('../api/match.js');
const lbApi = require('../api/leaderboard.js');

describe('Engagement - Stars, Star Shop & Cosmetics', () => {
  it('buys and equips cosmetics with star balance and ownership checks', () => {
    localStorage.clear();
    expect(StorageManager.getShopState().stars).toBe(0);

    const poor = StorageManager.purchaseShopItem('frames', 'gold');
    expect(poor.success).toBe(false);
    expect(poor.error).toBe('Not enough stars');

    expect(StorageManager.addStars(200).stars).toBe(200);
    expect(StorageManager.addStars(-50).gained).toBe(0);

    const frame = StorageManager.purchaseShopItem('frames', 'gold');
    expect(frame.success).toBe(true);
    expect(frame.shopState.stars).toBe(155);
    expect(frame.shopState.cosmetics.equippedFrame).toBe('gold');
    expect(StorageManager.purchaseShopItem('frames', 'gold').error).toBe('Already unlocked');

    expect(StorageManager.equipCosmetic('lasers', 'prism').success).toBe(false);

    const theme = StorageManager.purchaseShopItem('themes', 'synthwave');
    expect(theme.success).toBe(true);
    expect(StorageManager.getPreferences().theme).toBe('synthwave');
    expect(StorageManager.equipCosmetic('themes', 'light').success).toBe(true);
    expect(StorageManager.getPreferences().theme).toBe('light');

    const avatar = StorageManager.purchaseShopItem('avatars', 'dragon');
    expect(avatar.success).toBe(true);
    expect(avatar.shopState.stars).toBe(35);
    expect(StorageManager.getActiveProfile().avatar).toBe('dragon');
    expect(StorageManager.getUnlockedAvatars().length).toBe(7);
    expect(StorageManager.equipCosmetic('avatars', 'knight').success).toBe(true);
    expect(StorageManager.getActiveProfile().avatar).toBe('knight');

    expect(StorageManager.purchaseShopItem('nope', 'x').success).toBe(false);
    expect(StorageManager.purchaseShopItem('frames', 'nope').success).toBe(false);
  });

  it('limits Streak Freeze purchases to three held shields', () => {
    localStorage.clear();
    StorageManager.addStars(500);
    for (let i = 0; i < 3; i++) {
      expect(StorageManager.purchaseShopItem('consumables', 'streak_freeze').success).toBe(true);
    }
    const fourth = StorageManager.purchaseShopItem('consumables', 'streak_freeze');
    expect(fourth.success).toBe(false);
    expect(fourth.shopState.freezes).toBe(3);
    expect(fourth.shopState.stars).toBe(380);
  });

  it('sanitizes cosmetics, stars and round-trips them through JSON export/import', () => {
    localStorage.clear();
    StorageManager.addStars(100);
    StorageManager.purchaseShopItem('lasers', 'cyan');
    const json = StorageManager.exportDataJSON();

    localStorage.clear();
    expect(StorageManager.importDataJSON(json).success).toBe(true);
    const state = StorageManager.getShopState();
    expect(state.stars).toBe(50);
    expect(state.cosmetics.equippedLaser).toBe('cyan');
    expect(state.cosmetics.unlockedLasers.includes('cyan')).toBe(true);

    localStorage.clear();
    StorageManager.importDataJSON({
      stars: -5,
      cosmetics: { unlockedFrames: ['evil', 'gold'], equippedFrame: 'evil', equippedLaser: 'hacked' },
    });
    const cleaned = StorageManager.getShopState();
    expect(cleaned.stars).toBe(0);
    expect(cleaned.cosmetics.unlockedFrames.join(',')).toBe('none,gold');
    expect(cleaned.cosmetics.equippedFrame).toBe('none');
    expect(cleaned.cosmetics.equippedLaser).toBe('indigo');
  });
});

describe('Engagement - Streak Freeze Shield', () => {
  const allDone = { answered: 1000, maxStreak: 1000, pvpWins: 100, directCorrect: 1000, flashcardsMastered: 1000, fastCorrect: 1000 };

  it('awards a freeze for finishing all quests (once per day) and uses it to save one missed day', () => {
    localStorage.clear();
    const day1 = new Date(2026, 10, 10, 12);
    const first = StorageManager.updateDailyQuestProgress(allDone, day1);
    expect(first.newlyCompleted.length).toBe(3);
    expect(first.starsEarned).toBe(45);
    expect(first.freezeAwarded).toBe(true);
    expect(StorageManager.getShopState().freezes).toBe(1);

    const again = StorageManager.updateDailyQuestProgress(allDone, day1);
    expect(again.freezeAwarded).toBe(false);
    expect(again.starsEarned).toBe(0);
    expect(StorageManager.getShopState().freezes).toBe(1);

    // Miss exactly one day (Nov 11) and return on Nov 12
    const day3 = new Date(2026, 10, 12, 12);
    const preview = StorageManager.getDailyStreak(day3);
    expect(preview.protectedByFreeze).toBe(true);
    expect(preview.count).toBe(1);

    const saved = StorageManager.updateDailyQuestProgress({ answered: 1 }, day3);
    expect(saved.dailyStreak.count).toBe(2);
    expect(saved.dailyStreak.freezes).toBe(0);
    expect(saved.dailyStreak.freezeSavedToday).toBe(true);
  });

  it('still resets the streak when no freeze is held or the gap is too long', () => {
    localStorage.clear();
    const day1 = new Date(2026, 10, 10, 12);
    StorageManager.updateDailyQuestProgress({ answered: 1 }, day1);
    const noFreeze = StorageManager.updateDailyQuestProgress({ answered: 1 }, new Date(2026, 10, 12, 12));
    expect(noFreeze.dailyStreak.count).toBe(1);

    localStorage.clear();
    StorageManager.updateDailyQuestProgress(allDone, day1);
    expect(StorageManager.getShopState().freezes).toBe(1);
    const longGap = new Date(2026, 10, 14, 12);
    expect(StorageManager.getDailyStreak(longGap).count).toBe(0);
    const reset = StorageManager.updateDailyQuestProgress({ answered: 1 }, longGap);
    expect(reset.dailyStreak.count).toBe(1);
    expect(reset.dailyStreak.freezes).toBe(1);
  });
});

describe('Engagement - Companion, 3-Star Mastery, PvP Ranks & Hooks', () => {
  it('evolves the Math Companion across five stages and tracks mood', () => {
    localStorage.clear();
    let c = StorageManager.getCompanionState();
    expect(c.id).toBe('egg');
    expect(c.mood).toBe('sleepy');

    StorageManager.addXP(60);
    expect(StorageManager.getCompanionState().id).toBe('hatchling');
    StorageManager.addXP(340);
    expect(StorageManager.getCompanionState().id).toBe('fox');
    StorageManager.addXP(500);
    expect(StorageManager.getCompanionState().id).toBe('owl');
    StorageManager.addXP(600);
    c = StorageManager.getCompanionState();
    expect(c.id).toBe('dragon');
    expect(c.stage).toBe(5);

    StorageManager.recordGameResult({ mode: 'blitz', duration: 30, score: 10, streak: 1, correct: 1, total: 1 });
    expect(StorageManager.getCompanionState().mood).toBe('happy');
  });

  it('awards 0 to 3 stars per table from accuracy and speed fluency', () => {
    localStorage.clear();
    for (let c = 1; c <= 12; c++) {
      StorageManager.recordMatrixAttempt(5, c, true, 2000);
      StorageManager.recordMatrixAttempt(5, c, true, 2000);
    }
    let m = StorageManager.getTableMastery();
    expect(m[5].stars).toBe(3);
    expect(m[5].avgSeconds).toBe(2);

    localStorage.clear();
    for (let c = 1; c <= 12; c++) {
      StorageManager.recordMatrixAttempt(5, c, true, 4000);
      StorageManager.recordMatrixAttempt(5, c, true, 4000);
    }
    expect(StorageManager.getTableMastery()[5].stars).toBe(2);

    localStorage.clear();
    for (let c = 1; c <= 6; c++) {
      StorageManager.recordMatrixAttempt(7, c, true, 3000);
    }
    m = StorageManager.getTableMastery();
    expect(m[7].stars).toBe(1);
    expect(m[12].stars).toBe(0);
    expect(m[12].avgSeconds).toBe(null);
  });

  it('computes PvP trophy ranks, awards stars, and ranks the local pvp board', () => {
    localStorage.clear();
    expect(StorageManager.getPvpRank(0).id).toBe('bronze');
    expect(StorageManager.getPvpRank(99).id).toBe('bronze');
    expect(StorageManager.getPvpRank(100).id).toBe('silver');
    expect(StorageManager.getPvpRank(250).id).toBe('gold');
    expect(StorageManager.getPvpRank(500).id).toBe('diamond');
    expect(StorageManager.getPvpRank(800).id).toBe('legend');
    expect(StorageManager.getPvpRank(99).nextTrophies).toBe(100);

    let r = StorageManager.recordPvpResult({ outcome: 'loss', format: 'duel' });
    expect(r.trophies).toBe(0);
    expect(r.trophyDelta).toBe(0);
    expect(r.starsEarned).toBe(5);

    r = StorageManager.recordPvpResult({ outcome: 'win', format: 'duel' });
    expect(r.trophies).toBe(25);
    expect(r.trophyDelta).toBe(25);
    expect(r.starsEarned).toBe(15);

    r = StorageManager.recordPvpResult({ outcome: 'draw', format: 'tug' });
    expect(r.trophies).toBe(30);
    expect(r.starsEarned).toBe(8);
    expect(StorageManager.getStats().stars).toBe(28);

    r = StorageManager.recordPvpResult({ outcome: 'loss', format: 'duel' });
    expect(r.trophies).toBe(20);
    expect(r.trophyDelta).toBe(-10);

    const board = StorageManager.getLocalLeaderboard('pvp');
    expect(board[0].value).toBe(20);
    expect(board[0].subtext).toContain('Bronze');
    expect(board[0].frame).toBe('none');
  });

  it('suggests a smart next-round hook and tracks local weekly room goals', () => {
    localStorage.clear();
    let hook = StorageManager.getNextRoundHook({});
    expect(hook.type).toBe('achievement');
    expect(hook.text.length).toBeGreaterThan(0);

    StorageManager.recordGameResult({ mode: 'blitz', duration: 30, score: 200, streak: 3, correct: 5, total: 6 });
    hook = StorageManager.getNextRoundHook({ scoreKey: 'blitz_30', score: 170 });
    expect(hook.type).toBe('pb');
    expect(hook.text).toContain('30');

    StorageManager.addStars(500);
    hook = StorageManager.getNextRoundHook({});
    expect(hook.type).toBe('shop');

    localStorage.clear();
    const wk = new Date(2026, 10, 20);
    expect(StorageManager.getIsoWeekKey(wk)).toBe('2026-W47');
    const first = StorageManager.recordLocalRoomProgress(' grade-4a ', 12, wk);
    expect(first.room).toBe('GRADE4A');
    expect(first.solved).toBe(12);
    expect(first.target).toBe(500);

    StorageManager.createProfile('Leo', 'rocket');
    StorageManager.recordLocalRoomProgress('GRADE4A', 30, wk);
    const goal = StorageManager.getLocalRoomGoal('GRADE4A', wk);
    expect(goal.solved).toBe(42);
    expect(goal.contributors).toBe(2);
    expect(goal.percent).toBe(8);
    expect(StorageManager.recordLocalRoomProgress('ab', 5, wk)).toBe(null);
    expect(StorageManager.getLocalRoomGoal('GRADE4A', new Date(2026, 10, 30)).solved).toBe(0);
  });
});

describe('Engagement API - PvP board, Room Goals, Emotes & Searching Count', () => {
  it('validates pvp board submissions and weekly room progress payloads', () => {
    expect(lbApi.ALLOWED_BOARDS.includes('pvp')).toBe(true);
    const ok = lbApi.validateScoreSubmission({ board: 'pvp', name: 'Zed', avatar: 'dragon', score: 125 });
    expect(ok.valid).toBe(true);
    expect(ok.data.avatar).toBe('dragon');
    expect(lbApi.validateScoreSubmission({ board: 'pvp', score: 0 }).valid).toBe(false);
    expect(lbApi.validateScoreSubmission({ board: 'pvp', score: 999999 }).valid).toBe(false);
    expect(lbApi.buildBoardKey('pvp', '', '')).toBe('mq:lb:pvp:global');

    const prog = lbApi.validateRoomProgress({ room: 'grade4b', solved: 10, clientId: 'mq_abc<>' });
    expect(prog.valid).toBe(true);
    expect(prog.data.room).toBe('GRADE4B');
    expect(prog.data.clientId).toBe('mq_abc');
    expect(lbApi.validateRoomProgress({ room: 'ab', solved: 10 }).valid).toBe(false);
    expect(lbApi.validateRoomProgress({ room: 'GRADE4B', solved: 0 }).valid).toBe(false);
    expect(lbApi.validateRoomProgress({ room: 'GRADE4B', solved: 201 }).valid).toBe(false);
    expect(lbApi.validateRoomProgress({ room: 'GRADE4B', solved: 1.5 }).valid).toBe(false);

    expect(lbApi.getIsoWeekKey(new Date(2026, 10, 20))).toBe('2026-W47');
    expect(lbApi.ROOM_GOAL_TARGET).toBe(500);
    const keys = lbApi.buildRoomGoalKeys('GRADE4B', '2026-W47');
    expect(keys.countKey).toContain('GRADE4B');
    expect(keys.membersKey).toContain('2026-W47');
  });

  it('tracks searching players in a 30s sliding window with removal', () => {
    const zset = new Map();
    const run = (cmd) => {
      const [op, , a1, a2] = cmd;
      if (op === 'ZADD') zset.set(String(a2), Number(a1));
      else if (op === 'ZREM') zset.delete(String(a1));
      else if (op === 'ZREMRANGEBYSCORE') {
        const max = Number(a2);
        for (const [m, s] of zset.entries()) if (s <= max) zset.delete(m);
      } else if (op === 'ZCOUNT') {
        const min = Number(a1);
        let n = 0;
        for (const s of zset.values()) if (s >= min) n++;
        return n;
      } else if (op !== 'EXPIRE') throw new Error(`Unsupported op ${op}`);
      return 1;
    };
    const add = (id, t) => matchApi.buildSearchingAddCommands(id, t).forEach(run);
    const count = (t) => matchApi.normalizeOnlineCount(run(matchApi.buildSearchingCountCommand(t)));

    const t0 = 6000000;
    add('player_one', t0);
    expect(count(t0)).toBe(1);
    add('player_two', t0 + 10000);
    expect(count(t0 + 10000)).toBe(2);
    expect(count(t0 + 35000)).toBe(1);
    run(matchApi.buildSearchingRemoveCommand('player_two'));
    expect(count(t0 + 35000)).toBe(0);
    expect(matchApi.buildSearchingAddCommands('', t0)).toBe(null);
    expect(matchApi.buildSearchingRemoveCommand('!')).toBe(null);
  });

  it('accepts allowlisted emotes with per-player cooldown and normalizes lastEmote views', () => {
    const t = 8000000;
    const match = matchApi.createMatchState({
      matchId: 'm_emote_1',
      format: 'duel',
      p1: { playerId: 'p1', name: 'Alice', avatar: 'dragon' },
      p2: { playerId: 'p2', name: 'Bob', avatar: 'owl' },
      nowMs: t,
    });
    expect(match.p1.avatar).toBe('dragon');
    expect(matchApi.ALLOWED_EMOTES.length).toBe(5);

    expect(matchApi.applyPlayerEmote(match, { playerId: 'p1', emoteId: 'gg', nowMs: t + 1000 }).accepted).toBe(true);
    const spam = matchApi.applyPlayerEmote(match, { playerId: 'p1', emoteId: 'fire', nowMs: t + 1500 });
    expect(spam.accepted).toBe(false);
    expect(spam.reason).toBe('cooldown');
    expect(matchApi.applyPlayerEmote(match, { playerId: 'p1', emoteId: 'badword', nowMs: t + 5000 }).reason).toBe('invalid_emote');
    expect(matchApi.applyPlayerEmote(match, { playerId: 'stranger', emoteId: 'gg', nowMs: t + 5000 }).reason).toBe('not_in_match');

    expect(matchApi.applyPlayerEmote(match, { playerId: 'p2', emoteId: 'close', nowMs: t + 1600 }).accepted).toBe(true);
    const p1View = matchApi.buildPublicMatchView(match, 'p1', t + 2000);
    const p2View = matchApi.buildPublicMatchView(match, 'p2', t + 2000);
    expect(p1View.lastEmote.emoteId).toBe('close');
    expect(p1View.lastEmote.byOpp).toBe(true);
    expect(p1View.lastEmote.byMe).toBe(false);
    expect(p2View.lastEmote.byMe).toBe(true);
    expect(p1View.me.lastEmoteAt).toBe(undefined);

    expect(matchApi.applyPlayerEmote(match, { playerId: 'p1', emoteId: 'shield', nowMs: t + 3000 }).accepted).toBe(true);

    const waiting = matchApi.createMatchState({
      matchId: 'm_emote_wait',
      p1: { playerId: 'p1', name: 'Alice', avatar: 'knight' },
      nowMs: t,
    });
    expect(matchApi.applyPlayerEmote(waiting, { playerId: 'p1', emoteId: 'gg', nowMs: t + 1000 }).reason).toBe('match_not_active');
  });

  it('exposes LeaderboardClient room goal helpers and pvp local leaderboard safely offline', () => {
    localStorage.clear();
    const LeaderboardClient = require('../js/leaderboard.js');
    expect(typeof LeaderboardClient.fetchRoomGoal).toBe('function');
    expect(typeof LeaderboardClient.reportRoomProgress).toBe('function');
    StorageManager.recordPvpResult({ outcome: 'win', format: 'duel' });
    const pvpBoard = LeaderboardClient.getLocalBoard('pvp', StorageManager);
    expect(pvpBoard.length).toBe(1);
    expect(pvpBoard[0].pvpTrophies).toBe(25);
  });
});
