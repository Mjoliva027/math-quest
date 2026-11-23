/**
 * Unit Tests for Vercel Online PvP Matchmaking & Match State Engine (api/match.js)
 */

describe('PvP Match Engine - Validation, Combat Duel, Tug-of-War & Views', () => {
  it('sanitizes nicknames, normalizes room codes, and generates 6-char room codes', () => {
    const matchApi = require('../api/match.js');

    expect(matchApi.sanitizeNickname('  <b>Kai</b>  ')).toBe('Kai');
    expect(/^[A-Z][a-z]+ [A-Z][a-z]+ #\d{2}$/.test(matchApi.sanitizeNickname('damn'))).toBe(true);
    expect(matchApi.normalizeRoomCode('')).toBe('');
    expect(matchApi.normalizeRoomCode(' ab-12 ')).toBe('AB12');
    expect(matchApi.normalizeRoomCode('abc')).toBe(null);

    const code = matchApi.generateRoomCode();
    expect(code.length).toBe(6);
    expect(/^[A-Z0-9]{6}$/.test(code)).toBe(true);
  });

  it('applies authoritative HP Duel damage, crits, shields, cooldowns, and KO', () => {
    const matchApi = require('../api/match.js');
    let t = 1000000;
    const match = matchApi.createMatchState({
      matchId: 'm_duel_1',
      format: 'duel',
      operation: 'multiply',
      difficulty: 'medium',
      p1: { playerId: 'p1', name: 'Alice', avatar: 'knight' },
      p2: { playerId: 'p2', name: 'Bob', avatar: 'wizard' },
      nowMs: t,
    });

    expect(match.status).toBe('active');
    expect(match.p1.hp).toBe(100);
    expect(match.p2.hp).toBe(100);

    // Spam within 400ms cooldown should be rejected
    t += 500;
    const hit1 = matchApi.applyPlayerAction(match, {
      playerId: 'p1',
      correct: true,
      responseTimeMs: 1200, // Fast crit: 15 + 8 = 23 dmg
      nowMs: t,
    });
    expect(hit1.accepted).toBe(true);
    expect(hit1.event.type).toBe('crit');
    expect(match.p2.hp).toBe(77);

    const tooFast = matchApi.applyPlayerAction(match, {
      playerId: 'p1',
      correct: true,
      responseTimeMs: 800,
      nowMs: t + 150,
    });
    expect(tooFast.accepted).toBe(false);
    expect(tooFast.reason).toBe('cooldown');

    // First 4 slow hits + 5th hit build streak=5 (earn Shield) without yet knocking out (15+15+22+22+22=96 dmg)
    match.p2.hp = 100;
    match.p1.streak = 1;
    // Actually run clean 5-hit progression with slow hits from hit 2..5:
    // After hit1 (crit 23 dmg), p2.hp = 77. Let's test 2-hit fast crit (77) + slow hits to reach streak=5 & KO.
    const matchShield = matchApi.createMatchState({
      matchId: 'm_duel_shield_ko',
      format: 'duel',
      operation: 'multiply',
      difficulty: 'medium',
      p1: { playerId: 'p1', name: 'Alice', avatar: 'knight' },
      p2: { playerId: 'p2', name: 'Bob', avatar: 'wizard' },
      nowMs: t,
    });
    let st = t;
    for (let i = 0; i < 5; i++) {
      st += 600;
      matchApi.applyPlayerAction(matchShield, {
        playerId: 'p1',
        correct: true,
        responseTimeMs: 3000, // 15, 15, 22, 22, 22 = 96 total
        nowMs: st,
      });
    }
    expect(matchShield.p2.hp).toBe(4);
    expect(matchShield.p1.shieldReady).toBe(true);
    expect(matchShield.status).toBe('active');

    // 6th hit finishes KO
    st += 600;
    matchApi.applyPlayerAction(matchShield, {
      playerId: 'p1',
      correct: true,
      responseTimeMs: 3000,
      nowMs: st,
    });
    expect(matchShield.p2.hp).toBe(0);
    expect(matchShield.status).toBe('finished');
    expect(matchShield.winner).toBe('p1');
    expect(matchShield.finishReason).toBe('ko');
  });

  it('blocks incoming HP duel attack when opponent shield is ready', () => {
    const matchApi = require('../api/match.js');
    let t = 2000000;
    const match = matchApi.createMatchState({
      matchId: 'm_shield_1',
      format: 'duel',
      p1: { playerId: 'p1', name: 'Alice', avatar: 'knight' },
      p2: { playerId: 'p2', name: 'Bob', avatar: 'wizard' },
      nowMs: t,
    });
    match.p2.shieldReady = true;

    t += 1000;
    const res = matchApi.applyPlayerAction(match, {
      playerId: 'p1',
      correct: true,
      responseTimeMs: 1500,
      nowMs: t,
    });
    expect(res.accepted).toBe(true);
    expect(res.event.type).toBe('shield_blocked');
    expect(match.p2.hp).toBe(100);
    expect(match.p2.shieldReady).toBe(false);
  });

  it('handles Online Tug-of-War pulls, power pulls, slips, and threshold victory', () => {
    const matchApi = require('../api/match.js');
    let t = 3000000;
    const match = matchApi.createMatchState({
      matchId: 'm_tug_1',
      format: 'tug',
      operation: 'multiply',
      difficulty: 'easy',
      p1: { playerId: 'p1', name: 'Alice', avatar: 'rocket' },
      p2: { playerId: 'p2', name: 'Bob', avatar: 'owl' },
      nowMs: t,
    });

    // Normal P1 pull (-1)
    t += 600;
    const r1 = matchApi.applyPlayerAction(match, { playerId: 'p1', correct: true, responseTimeMs: 3200, nowMs: t });
    expect(r1.accepted).toBe(true);
    expect(r1.event.type).toBe('pull');
    expect(match.ropePos).toBe(-1);

    // Fast P2 power pull (+2) -> net +1
    t += 600;
    const r2 = matchApi.applyPlayerAction(match, { playerId: 'p2', correct: true, responseTimeMs: 1400, nowMs: t });
    expect(r2.accepted).toBe(true);
    expect(r2.event.type).toBe('power_pull');
    expect(match.ropePos).toBe(1);

    // P2 wrong answer -> slip & reset streak
    t += 600;
    const rSlip = matchApi.applyPlayerAction(match, { playerId: 'p2', correct: false, responseTimeMs: 2000, nowMs: t });
    expect(rSlip.accepted).toBe(true);
    expect(rSlip.event.type).toBe('slip');
    expect(match.p2.streak).toBe(0);
    expect(match.ropePos).toBe(1);

    // P1 fast pulls until reaching -6 threshold
    for (let i = 0; i < 4; i++) {
      t += 600;
      matchApi.applyPlayerAction(match, { playerId: 'p1', correct: true, responseTimeMs: 1200, nowMs: t });
    }
    expect(match.status).toBe('finished');
    expect(match.winner).toBe('p1');
    expect(match.finishReason).toBe('tug_win');
  });

  it('resolves timeouts accurately and normalizes viewer perspective in buildPublicMatchView', () => {
    const matchApi = require('../api/match.js');
    const start = 4000000;
    const match = matchApi.createMatchState({
      matchId: 'm_view_1',
      format: 'tug',
      p1: { playerId: 'p1', name: 'Alice', avatar: 'knight' },
      p2: { playerId: 'p2', name: 'Bob', avatar: 'rocket' },
      nowMs: start,
    });

    matchApi.applyPlayerAction(match, { playerId: 'p2', correct: true, responseTimeMs: 1200, nowMs: start + 1000 });
    expect(match.ropePos).toBe(2); // Moved toward P2 (+ side)

    const p1ViewMid = matchApi.buildPublicMatchView(match, 'p1', start + 2000);
    const p2ViewMid = matchApi.buildPublicMatchView(match, 'p2', start + 2000);
    expect(p1ViewMid.me.name).toBe('Alice');
    expect(p1ViewMid.opponent.name).toBe('Bob');
    expect(p1ViewMid.ropePos).toBe(2); // Right = Rival
    expect(p2ViewMid.me.name).toBe('Bob');
    expect(p2ViewMid.ropePos).toBe(-2); // Left = Me from P2 perspective
    expect(p1ViewMid.me.lastActionAt).toBe(undefined);

    // Timeout after 90s gives P2 the win
    matchApi.resolveTimeoutIfNeeded(match, start + 95000);
    expect(match.status).toBe('finished');
    expect(match.winner).toBe('p2');
    expect(match.finishReason).toBe('timeout');

    const p2End = matchApi.buildPublicMatchView(match, 'p2', start + 95000);
    const p1End = matchApi.buildPublicMatchView(match, 'p1', start + 95000);
    expect(p2End.winnerOutcome).toBe('win');
    expect(p1End.winnerOutcome).toBe('loss');
  });

  it('tracks online PvP presence with 45s sliding window, deduplication, and leave cleanup', () => {
    const matchApi = require('../api/match.js');

    // Pure ZSET simulator to test Redis presence commands synchronously
    const zsets = new Map();
    const ttls = new Map();
    const runRedis = (cmd) => {
      const [op, key, arg1, arg2] = cmd;
      if (!zsets.has(key)) zsets.set(key, new Map());
      const zset = zsets.get(key);
      if (op === 'ZADD') {
        zset.set(String(arg2), Number(arg1));
        return 1;
      }
      if (op === 'ZREMRANGEBYSCORE') {
        const min = arg1 === '-inf' ? -Infinity : Number(arg1);
        const max = arg2 === '+inf' ? Infinity : Number(arg2);
        let removed = 0;
        for (const [member, score] of zset.entries()) {
          if (score >= min && score <= max) {
            zset.delete(member);
            removed++;
          }
        }
        return removed;
      }
      if (op === 'ZCOUNT') {
        const min = arg1 === '-inf' ? -Infinity : Number(arg1);
        const max = arg2 === '+inf' ? Infinity : Number(arg2);
        let count = 0;
        for (const score of zset.values()) {
          if (score >= min && score <= max) count++;
        }
        return count;
      }
      if (op === 'ZCARD') {
        return zset.size;
      }
      if (op === 'ZREM') {
        return zset.delete(String(arg1)) ? 1 : 0;
      }
      if (op === 'EXPIRE') {
        ttls.set(key, Number(arg1));
        return 1;
      }
      throw new Error(`Unsupported mock Redis op: ${op}`);
    };

    const runHeartbeat = (playerId, nowMs) => {
      const cmds = matchApi.buildPresenceHeartbeatCommands(playerId, nowMs);
      let card = 0;
      for (const c of cmds) {
        const res = runRedis(c);
        if (c[0] === 'ZCARD') card = res;
      }
      return matchApi.normalizeOnlineCount(card);
    };

    const t0 = 5000000;
    // Two distinct players check in; repeated heartbeat from p1 deduplicates cleanly
    expect(runHeartbeat('player_alpha', t0)).toBe(1);
    expect(runHeartbeat('player_alpha', t0 + 10000)).toBe(1);
    expect(runHeartbeat('player_beta', t0 + 20000)).toBe(2);
    expect(ttls.get(matchApi.PRESENCE_KEY)).toBe(120);

    // Read-only ZCOUNT excludes stale entries older than 45s without mutating the ZSET
    const afterWindow = t0 + 10000 + matchApi.PRESENCE_WINDOW_MS + 1; // 55001ms after t0: alpha is stale, beta is fresh
    const readCount = matchApi.normalizeOnlineCount(runRedis(matchApi.buildPresenceCountCommand(afterWindow)));
    expect(readCount).toBe(1);
    expect(zsets.get(matchApi.PRESENCE_KEY).size).toBe(2);

    // Heartbeat prunes stale player_alpha via ZREMRANGEBYSCORE
    expect(runHeartbeat('player_gamma', afterWindow)).toBe(2);
    expect(zsets.get(matchApi.PRESENCE_KEY).has('player_alpha')).toBe(false);

    // Leave command immediately removes player_beta
    runRedis(matchApi.buildLeavePresenceCommand('player_beta'));
    expect(matchApi.normalizeOnlineCount(runRedis(matchApi.buildPresenceCountCommand(afterWindow + 1000)))).toBe(1);

    // Invalid playerId and malformed count handling
    expect(matchApi.buildPresenceHeartbeatCommands('')).toBe(null);
    expect(matchApi.buildLeavePresenceCommand('!')).toBe(null);
    expect(matchApi.normalizeOnlineCount(-5)).toBe(0);
    expect(matchApi.normalizeOnlineCount('not-a-number')).toBe(0);
    expect(matchApi.getPresenceCutoff(100000)).toBe(100000 - matchApi.PRESENCE_WINDOW_MS);
  });
});
