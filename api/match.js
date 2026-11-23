/**
 * Vercel Serverless Online PvP Matchmaking & Match State API for Math Quest
 * Zero external dependencies — uses native fetch() with Upstash Redis REST API.
 * Supports two online PvP formats:
 *   - 'duel': 1v1 HP Combat Duel (100 HP, crits, 5-streak shield, 90s clock)
 *   - 'tug' : Online 1v1 Tug-of-War (-6..+6 rope, power pulls, slips, 90s clock)
 */

const crypto = require('crypto');

const ALLOWED_FORMATS = ['duel', 'tug', 'coop', 'party'];
const ALLOWED_OPS = ['multiply', 'divide', 'missing', 'add', 'subtract', 'mixed'];
const ALLOWED_DIFFS = ['easy', 'medium', 'hard'];
const ALLOWED_AVATARS = ['knight', 'wizard', 'star', 'rocket', 'shield', 'owl', 'dragon', 'crown', 'ninja', 'phoenix'];
const ALLOWED_EMOTES = ['fast', 'fire', 'shield', 'gg', 'close'];
const MIN_EMOTE_COOLDOWN_MS = 1500;
const SEARCHING_KEY = 'mq:pvp:searching';
const SEARCHING_WINDOW_MS = 30000;
const SEARCHING_TTL_SECONDS = 90;

const MATCH_DURATION_MS = 90000;
const DUEL_START_HP = 100;
const COOP_BOSS_START_HP = 300;
const TUG_WIN_THRESHOLD = 6;
const PARTY_MAX_PLAYERS = 25;
const MIN_ACTION_COOLDOWN_MS = 400;
const MATCH_TTL_SECONDS = 300;
const PRESENCE_KEY = 'mq:pvp:online';
const PRESENCE_WINDOW_MS = 45000;
const PRESENCE_TTL_SECONDS = 120;

const HERO_ADJECTIVES = [
  'Cosmic', 'Turbo', 'Swift', 'Bright', 'Clever', 'Brave', 'Solar', 'Lunar', 'Pixel', 'Noble',
];

const HERO_ANIMALS = [
  'Owl', 'Knight', 'Falcon', 'Fox', 'Panda', 'Tiger', 'Otter', 'Rocket', 'Wizard', 'Comet',
];

const BLOCKED_WORDS = [
  'damn', 'hell', 'shit', 'fuck', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 'porn', 'sex', 'nazi', 'slut', 'whore',
];

function generateKidSafeName(rng = Math.random) {
  const adj = HERO_ADJECTIVES[Math.floor(rng() * HERO_ADJECTIVES.length)];
  const noun = HERO_ANIMALS[Math.floor(rng() * HERO_ANIMALS.length)];
  const num = String(Math.floor(rng() * 90) + 10);
  return `${adj} ${noun} #${num}`;
}

function normalizeForFilter(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/[^a-z]/g, '');
}

function sanitizeNickname(rawName) {
  if (typeof rawName !== 'string') return generateKidSafeName();
  const cleaned = rawName
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[^A-Za-z0-9 _#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18);

  if (cleaned.length < 2) {
    return generateKidSafeName();
  }

  const normalized = normalizeForFilter(cleaned);
  for (const word of BLOCKED_WORDS) {
    if (normalized.includes(word)) {
      return generateKidSafeName();
    }
  }

  return cleaned;
}

function normalizeRoomCode(rawRoom) {
  if (rawRoom === undefined || rawRoom === null) return '';
  const trimmed = String(rawRoom).trim();
  if (trimmed === '') return '';
  const cleaned = trimmed.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
  if (cleaned.length < 4) return null;
  return cleaned;
}

function generateRoomCode(rng = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(rng() * alphabet.length)];
  }
  return code;
}

function sanitizePlayerId(rawId) {
  const cleaned = typeof rawId === 'string'
    ? rawId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40)
    : '';
  return cleaned.length >= 2 ? cleaned : '';
}

function sanitizeMatchId(rawId) {
  const cleaned = typeof rawId === 'string'
    ? rawId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64)
    : '';
  return cleaned.length >= 6 ? cleaned : '';
}

function makePlayerState(raw = {}) {
  return {
    playerId: sanitizePlayerId(raw.playerId) || `p_${crypto.randomBytes(6).toString('hex')}`,
    name: sanitizeNickname(raw.name),
    avatar: ALLOWED_AVATARS.includes(raw.avatar) ? raw.avatar : 'knight',
    hp: DUEL_START_HP,
    shieldReady: false,
    streak: 0,
    maxStreak: 0,
    correct: 0,
    answered: 0,
    pulls: 0,
    lastActionAt: 0,
    lastEmoteAt: 0,
  };
}

function makePartyPlayer(raw = {}) {
  return {
    playerId: sanitizePlayerId(raw.playerId) || `p_${crypto.randomBytes(6).toString('hex')}`,
    name: sanitizeNickname(raw.name),
    avatar: ALLOWED_AVATARS.includes(raw.avatar) ? raw.avatar : 'knight',
    score: 0,
    correct: 0,
    answered: 0,
    streak: 0,
    lastActionAt: 0,
  };
}

function createMatchState({
  matchId,
  code = '',
  format = 'duel',
  operation = 'multiply',
  difficulty = 'medium',
  p1,
  p2 = null,
  nowMs = Date.now(),
}) {
  const resolvedId = sanitizeMatchId(matchId) || `m_${nowMs.toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  const resolvedFormat = ALLOWED_FORMATS.includes(format) ? format : 'duel';
  const resolvedOp = ALLOWED_OPS.includes(operation) ? operation : 'multiply';
  const resolvedDiff = ALLOWED_DIFFS.includes(difficulty) ? difficulty : 'medium';
  const hasP2 = Boolean(p2);
  const startActive = hasP2 || resolvedFormat === 'party';
  const p1State = makePlayerState(p1);
  const p2State = hasP2 ? makePlayerState(p2) : null;
  const partyPlayers = {};
  if (p1State) partyPlayers[p1State.playerId] = makePartyPlayer(p1State);
  if (p2State) partyPlayers[p2State.playerId] = makePartyPlayer(p2State);

  return {
    matchId: resolvedId,
    code: normalizeRoomCode(code) || '',
    seed: resolvedId,
    format: resolvedFormat,
    operation: resolvedOp,
    difficulty: resolvedDiff,
    status: startActive ? 'active' : 'waiting',
    createdAt: nowMs,
    startedAt: startActive ? nowMs : null,
    endsAt: startActive ? nowMs + MATCH_DURATION_MS : null,
    ropePos: 0,
    bossHp: COOP_BOSS_START_HP,
    bossMaxHp: COOP_BOSS_START_HP,
    teamStreak: 0,
    maxTeamStreak: 0,
    partyPlayers,
    winner: null,
    finishReason: null,
    lastEvent: null,
    p1: p1State,
    p2: p2State,
  };
}

function resolveTimeoutIfNeeded(match, nowMs = Date.now()) {
  if (!match || match.status !== 'active') return match;
  if (!match.endsAt || nowMs < match.endsAt) return match;

  match.status = 'finished';
  match.finishReason = 'timeout';

  if (match.format === 'coop') {
    match.winner = (match.bossHp || 0) <= 0 ? 'team' : 'boss';
    return match;
  }
  if (match.format === 'party') {
    const list = Object.values(match.partyPlayers || {});
    list.sort((a, b) => (b.score - a.score) || (b.correct - a.correct));
    match.winner = list[0] ? list[0].playerId : 'draw';
    return match;
  }

  if (match.format === 'duel') {
    const hp1 = match.p1 ? match.p1.hp : 0;
    const hp2 = match.p2 ? match.p2.hp : 0;
    if (hp1 > hp2) {
      match.winner = 'p1';
    } else if (hp2 > hp1) {
      match.winner = 'p2';
    } else {
      const c1 = match.p1 ? match.p1.correct : 0;
      const c2 = match.p2 ? match.p2.correct : 0;
      match.winner = c1 > c2 ? 'p1' : c2 > c1 ? 'p2' : 'draw';
    }
  } else {
    if (match.ropePos < 0) {
      match.winner = 'p1';
    } else if (match.ropePos > 0) {
      match.winner = 'p2';
    } else {
      const pulls1 = match.p1 ? match.p1.pulls : 0;
      const pulls2 = match.p2 ? match.p2.pulls : 0;
      match.winner = pulls1 > pulls2 ? 'p1' : pulls2 > pulls1 ? 'p2' : 'draw';
    }
  }

  return match;
}

function applyPlayerAction(match, { playerId, correct, responseTimeMs = 3500, nowMs = Date.now() }) {
  if (!match) {
    return { match: null, accepted: false, reason: 'missing_match', event: null };
  }

  resolveTimeoutIfNeeded(match, nowMs);
  if (match.status !== 'active') {
    return { match, accepted: false, reason: 'match_not_active', event: null };
  }

  if (match.format === 'party') {
    match.partyPlayers = match.partyPlayers || {};
    const p = match.partyPlayers[playerId];
    if (!p) {
      return { match, accepted: false, reason: 'not_in_match', event: null };
    }
    if (p.lastActionAt > 0 && nowMs - p.lastActionAt < MIN_ACTION_COOLDOWN_MS) {
      return { match, accepted: false, reason: 'cooldown', event: null };
    }
    p.lastActionAt = nowMs;
    p.answered++;
    const rt = Number.isFinite(Number(responseTimeMs)) ? Math.max(0, Number(responseTimeMs)) : 4000;
    const isFast = rt >= 350 && rt < 2500;
    let event = null;
    if (correct) {
      p.correct++;
      p.streak++;
      const pts = 20 + (isFast ? 10 : 0) + (p.streak >= 3 ? 8 : 0);
      p.score += pts;
      event = { type: isFast ? 'crit' : 'hit', by: playerId, amount: pts, ts: nowMs };
    } else {
      p.streak = 0;
      event = { type: 'miss', by: playerId, amount: 0, ts: nowMs };
    }
    match.lastEvent = event;
    return { match, accepted: true, event, reason: null };
  }

  let side = null;
  if (match.p1 && match.p1.playerId === playerId) side = 'p1';
  else if (match.p2 && match.p2.playerId === playerId) side = 'p2';

  if (!side) {
    return { match, accepted: false, reason: 'not_in_match', event: null };
  }

  const player = match[side];
  const opp = side === 'p1' ? match.p2 : match.p1;
  if (!player || !opp) {
    return { match, accepted: false, reason: 'incomplete_match', event: null };
  }

  if (player.lastActionAt > 0 && nowMs - player.lastActionAt < MIN_ACTION_COOLDOWN_MS) {
    return { match, accepted: false, reason: 'cooldown', event: null };
  }

  player.lastActionAt = nowMs;
  player.answered++;

  const rt = Number.isFinite(Number(responseTimeMs)) ? Math.max(0, Number(responseTimeMs)) : 4000;
  const isFast = rt >= 350 && rt < 2500;
  const isCorrect = Boolean(correct);
  let event = null;

  if (match.format === 'coop') {
    if (isCorrect) {
      player.correct++;
      player.streak++;
      player.maxStreak = Math.max(player.maxStreak, player.streak);
      match.teamStreak = (match.teamStreak || 0) + 1;
      match.maxTeamStreak = Math.max(match.maxTeamStreak || 0, match.teamStreak);

      const dmg = Math.min(42, 18 + (isFast ? 8 : 0) + (match.teamStreak >= 4 ? 10 : 0));
      match.bossHp = Math.max(0, (match.bossHp ?? COOP_BOSS_START_HP) - dmg);
      event = { type: match.teamStreak >= 4 || isFast ? 'crit' : 'hit', by: side, amount: dmg, ts: nowMs };

      if (match.bossHp <= 0) {
        match.status = 'finished';
        match.winner = 'team';
        match.finishReason = 'boss_slain';
      }
    } else {
      player.streak = 0;
      match.teamStreak = 0;
      const bossDmg = 12;
      if (match.p1) match.p1.hp = Math.max(0, match.p1.hp - bossDmg);
      if (match.p2) match.p2.hp = Math.max(0, match.p2.hp - bossDmg);
      event = { type: 'boss_strike', by: side, amount: bossDmg, ts: nowMs };
      const p1Dead = !match.p1 || match.p1.hp <= 0;
      const p2Dead = !match.p2 || match.p2.hp <= 0;
      if (p1Dead && p2Dead) {
        match.status = 'finished';
        match.winner = 'boss';
        match.finishReason = 'team_ko';
      }
    }
  } else if (match.format === 'duel') {
    if (isCorrect) {
      player.correct++;
      player.streak++;
      player.maxStreak = Math.max(player.maxStreak, player.streak);

      let dmg = 15 + (isFast ? 8 : 0) + (player.streak >= 3 ? 7 : 0);
      dmg = Math.min(35, dmg);

      if (opp.shieldReady) {
        opp.shieldReady = false;
        dmg = 0;
        event = { type: 'shield_blocked', by: side, amount: 0, ts: nowMs };
      } else {
        opp.hp = Math.max(0, opp.hp - dmg);
        event = { type: isFast ? 'crit' : 'hit', by: side, amount: dmg, ts: nowMs };
      }

      if (player.streak > 0 && player.streak % 5 === 0) {
        player.shieldReady = true;
      }

      if (opp.hp <= 0) {
        match.status = 'finished';
        match.winner = side;
        match.finishReason = 'ko';
      }
    } else {
      player.streak = 0;
      event = { type: 'miss', by: side, amount: 0, ts: nowMs };
    }
  } else {
    // Online Tug-of-War format
    if (isCorrect) {
      player.correct++;
      player.streak++;
      player.maxStreak = Math.max(player.maxStreak, player.streak);

      const pull = (isFast || player.streak >= 3) ? 2 : 1;
      player.pulls += pull;

      if (side === 'p1') {
        match.ropePos = Math.max(-TUG_WIN_THRESHOLD, match.ropePos - pull);
      } else {
        match.ropePos = Math.min(TUG_WIN_THRESHOLD, match.ropePos + pull);
      }

      event = { type: pull > 1 ? 'power_pull' : 'pull', by: side, amount: pull, ts: nowMs };

      if (match.ropePos <= -TUG_WIN_THRESHOLD) {
        match.status = 'finished';
        match.winner = 'p1';
        match.finishReason = 'tug_win';
      } else if (match.ropePos >= TUG_WIN_THRESHOLD) {
        match.status = 'finished';
        match.winner = 'p2';
        match.finishReason = 'tug_win';
      }
    } else {
      player.streak = 0;
      event = { type: 'slip', by: side, amount: 0, ts: nowMs };
    }
  }

  match.lastEvent = event;
  return { match, accepted: true, event, reason: null };
}

function applyPlayerEmote(match, { playerId, emoteId, nowMs = Date.now() } = {}) {
  if (!match) return { match: null, accepted: false, reason: 'missing_match' };
  if (match.status !== 'active' && match.status !== 'finished') {
    return { match, accepted: false, reason: 'match_not_active' };
  }
  if (!ALLOWED_EMOTES.includes(emoteId)) {
    return { match, accepted: false, reason: 'invalid_emote' };
  }

  let side = null;
  if (match.p1 && match.p1.playerId === playerId) side = 'p1';
  else if (match.p2 && match.p2.playerId === playerId) side = 'p2';
  if (!side) return { match, accepted: false, reason: 'not_in_match' };

  const player = match[side];
  if (player.lastEmoteAt > 0 && nowMs - player.lastEmoteAt < MIN_EMOTE_COOLDOWN_MS) {
    return { match, accepted: false, reason: 'cooldown' };
  }

  player.lastEmoteAt = nowMs;
  match.lastEmote = { emoteId, by: side, ts: nowMs };
  return { match, accepted: true, reason: null };
}

function sanitizePublicPlayer(p) {
  if (!p) return null;
  return {
    name: p.name,
    avatar: p.avatar,
    hp: p.hp,
    shieldReady: Boolean(p.shieldReady),
    streak: p.streak,
    maxStreak: p.maxStreak,
    correct: p.correct,
    answered: p.answered,
    pulls: p.pulls,
  };
}

function buildPublicMatchView(match, viewerPlayerId, nowMs = Date.now()) {
  if (!match) return null;
  const mySide = match.p1 && match.p1.playerId === viewerPlayerId
    ? 'p1'
    : (match.p2 && match.p2.playerId === viewerPlayerId ? 'p2' : null);
  const oppSide = mySide === 'p2' ? 'p1' : 'p2';

  const meRaw = mySide === 'p2' ? match.p2 : match.p1;
  const oppRaw = mySide === 'p2' ? match.p1 : match.p2;
  const perspectiveRope = mySide === 'p2' ? -match.ropePos : match.ropePos;

  let winnerOutcome = null;
  if (match.status === 'finished') {
    if (match.format === 'coop') {
      winnerOutcome = match.winner === 'team' ? 'win' : 'loss';
    } else if (match.format === 'party') {
      const list = Object.values(match.partyPlayers || {}).sort((a, b) => (b.score - a.score) || (b.correct - a.correct));
      const myRank = list.findIndex(p => p.playerId === viewerPlayerId) + 1;
      winnerOutcome = myRank === 1 ? 'win' : (myRank >= 1 && myRank <= 3 ? 'draw' : 'loss');
    } else if (match.winner === 'draw' || !mySide) {
      winnerOutcome = 'draw';
    } else {
      winnerOutcome = match.winner === mySide ? 'win' : 'loss';
    }
  }

  let partyStandings = null;
  if (match.format === 'party') {
    const list = Object.values(match.partyPlayers || {})
      .sort((a, b) => (b.score - a.score) || (b.correct - a.correct))
      .slice(0, 10);
    partyStandings = list.map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      avatar: p.avatar,
      score: p.score || 0,
      correct: p.correct || 0,
      streak: p.streak || 0,
      isMe: p.playerId === viewerPlayerId,
    }));
  }

  let lastEvent = null;
  if (match.lastEvent) {
    lastEvent = {
      type: match.lastEvent.type,
      byMe: match.lastEvent.by === mySide,
      byOpp: match.lastEvent.by === oppSide,
      amount: match.lastEvent.amount || 0,
      ts: match.lastEvent.ts,
    };
  }

  const timeLeft = match.endsAt
    ? Math.max(0, Math.ceil((match.endsAt - nowMs) / 1000))
    : Math.round(MATCH_DURATION_MS / 1000);

  return {
    matchId: match.matchId,
    code: match.code,
    seed: match.seed,
    format: match.format,
    operation: match.operation,
    difficulty: match.difficulty,
    status: match.status,
    mySide,
    ropePos: perspectiveRope,
    winThreshold: TUG_WIN_THRESHOLD,
    bossHp: match.bossHp ?? COOP_BOSS_START_HP,
    bossMaxHp: match.bossMaxHp ?? COOP_BOSS_START_HP,
    teamStreak: match.teamStreak || 0,
    partyStandings,
    timeLeft,
    winnerOutcome,
    finishReason: match.finishReason,
    lastEvent,
    lastEmote: (match.lastEmote && ALLOWED_EMOTES.includes(match.lastEmote.emoteId))
      ? {
        emoteId: match.lastEmote.emoteId,
        byMe: match.lastEmote.by === mySide,
        byOpp: match.lastEmote.by === oppSide,
        ts: match.lastEmote.ts,
      }
      : null,
    me: sanitizePublicPlayer(meRaw),
    opponent: sanitizePublicPlayer(oppRaw),
  };
}

function getRedisCredentials() {
  const url = String(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '').trim();
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '').trim();
  return { url, token, configured: Boolean(url && token) };
}

async function redisCommand(commandArgs) {
  const { url, token, configured } = getRedisCredentials();
  if (!configured) {
    throw new Error('Redis not configured');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commandArgs),
  });

  if (!response.ok) {
    throw new Error(`Upstash error: ${response.status}`);
  }
  const payload = await response.json();
  if (payload && payload.error) {
    throw new Error(payload.error);
  }
  return payload ? payload.result : null;
}

async function loadMatchFromRedis(matchId) {
  const raw = await redisCommand(['GET', `mq:pvp:match:${matchId}`]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function saveMatchToRedis(match) {
  await redisCommand(['SET', `mq:pvp:match:${match.matchId}`, JSON.stringify(match), 'EX', MATCH_TTL_SECONDS]);
}

function getPresenceCutoff(nowMs = Date.now()) {
  return nowMs - PRESENCE_WINDOW_MS;
}

function normalizeOnlineCount(rawCount) {
  const num = Number(rawCount);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
}

function buildPresenceHeartbeatCommands(playerId, nowMs = Date.now()) {
  const cleanId = sanitizePlayerId(playerId);
  if (!cleanId) return null;
  const cutoff = getPresenceCutoff(nowMs);
  return [
    ['ZADD', PRESENCE_KEY, nowMs, cleanId],
    ['ZREMRANGEBYSCORE', PRESENCE_KEY, '-inf', cutoff],
    ['ZCARD', PRESENCE_KEY],
    ['EXPIRE', PRESENCE_KEY, PRESENCE_TTL_SECONDS],
  ];
}

function buildPresenceCountCommand(nowMs = Date.now()) {
  return ['ZCOUNT', PRESENCE_KEY, getPresenceCutoff(nowMs), '+inf'];
}

function buildLeavePresenceCommand(playerId) {
  const cleanId = sanitizePlayerId(playerId);
  if (!cleanId) return null;
  return ['ZREM', PRESENCE_KEY, cleanId];
}

async function recordOnlinePresence(playerId, nowMs = Date.now(), exec = redisCommand) {
  const cmds = buildPresenceHeartbeatCommands(playerId, nowMs);
  if (!cmds) return 0;
  await exec(cmds[0]);
  await exec(cmds[1]);
  const [count] = await Promise.all([exec(cmds[2]), exec(cmds[3])]);
  return normalizeOnlineCount(count);
}

async function getOnlinePresenceCount(nowMs = Date.now(), exec = redisCommand) {
  const count = await exec(buildPresenceCountCommand(nowMs));
  return normalizeOnlineCount(count);
}

async function removeOnlinePresence(playerId, exec = redisCommand) {
  const cmd = buildLeavePresenceCommand(playerId);
  if (!cmd) return false;
  await exec(cmd);
  return true;
}

function buildSearchingAddCommands(playerId, nowMs = Date.now()) {
  const cleanId = sanitizePlayerId(playerId);
  if (!cleanId) return null;
  return [
    ['ZADD', SEARCHING_KEY, nowMs, cleanId],
    ['ZREMRANGEBYSCORE', SEARCHING_KEY, '-inf', nowMs - SEARCHING_WINDOW_MS],
    ['EXPIRE', SEARCHING_KEY, SEARCHING_TTL_SECONDS],
  ];
}

function buildSearchingCountCommand(nowMs = Date.now()) {
  return ['ZCOUNT', SEARCHING_KEY, nowMs - SEARCHING_WINDOW_MS, '+inf'];
}

function buildSearchingRemoveCommand(playerId) {
  const cleanId = sanitizePlayerId(playerId);
  if (!cleanId) return null;
  return ['ZREM', SEARCHING_KEY, cleanId];
}

async function recordSearchingPlayer(playerId, nowMs = Date.now(), exec = redisCommand) {
  const cmds = buildSearchingAddCommands(playerId, nowMs);
  if (!cmds) return false;
  for (const cmd of cmds) {
    await exec(cmd);
  }
  return true;
}

async function removeSearchingPlayer(playerId, exec = redisCommand) {
  const cmd = buildSearchingRemoveCommand(playerId);
  if (!cmd) return false;
  await exec(cmd);
  return true;
}

async function getSearchingCount(nowMs = Date.now(), exec = redisCommand) {
  const count = await exec(buildSearchingCountCommand(nowMs));
  return normalizeOnlineCount(count);
}

async function checkRateLimit(req) {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  const ipRaw = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'anon';
  const safeIp = ipRaw.replace(/[^A-Za-z0-9.:_-]/g, '').slice(0, 48) || 'anon';
  const rlKey = `mq:rl:pvp:${safeIp}`;

  const count = await redisCommand(['INCR', rlKey]);
  if (Number(count) === 1) {
    await redisCommand(['EXPIRE', rlKey, 60]);
  }
  return Number(count) <= 120;
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);

  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 16384) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function handler(req, res) {
  const isConfigured = getRedisCredentials().configured;

  if (req.method === 'GET') {
    const query = req.query || {};
    if (query.action === 'presence') {
      if (!isConfigured) {
        return sendJson(res, 200, { configured: false, onlineCount: 0 });
      }
      try {
        const [onlineCount, searchingCount] = await Promise.all([
          getOnlinePresenceCount(Date.now()),
          getSearchingCount(Date.now()),
        ]);
        return sendJson(res, 200, {
          configured: true,
          onlineCount,
          searchingCount,
          windowSeconds: Math.round(PRESENCE_WINDOW_MS / 1000),
        });
      } catch (err) {
        return sendJson(res, 500, { configured: true, onlineCount: 0, searchingCount: 0, error: 'Failed to load online count' });
      }
    }

    if (!isConfigured) {
      return sendJson(res, 200, { configured: false });
    }
    try {
      const matchId = sanitizeMatchId(query.matchId);
      const playerId = sanitizePlayerId(query.playerId);
      if (!matchId || !playerId) {
        return sendJson(res, 400, { configured: true, error: 'Missing matchId or playerId' });
      }

      const match = await loadMatchFromRedis(matchId);
      if (!match) {
        return sendJson(res, 404, { configured: true, error: 'Match expired or not found' });
      }

      const nowMs = Date.now();
      const prevStatus = match.status;
      resolveTimeoutIfNeeded(match, nowMs);
      if (match.status !== prevStatus) {
        await saveMatchToRedis(match);
      }

      return sendJson(res, 200, {
        configured: true,
        match: buildPublicMatchView(match, playerId, nowMs),
      });
    } catch (err) {
      return sendJson(res, 500, { configured: true, error: 'Failed to load match state' });
    }
  }

  if (req.method === 'POST') {
    if (!isConfigured) {
      return sendJson(res, 200, { configured: false, fallbackAi: true });
    }

    try {
      const allowed = await checkRateLimit(req);
      if (!allowed) {
        return sendJson(res, 429, { configured: true, error: 'Too many requests. Please slow down.' });
      }

      const body = await parseJsonBody(req);
      const action = String(body.action || '');
      const playerId = sanitizePlayerId(body.playerId);
      if (!playerId) {
        return sendJson(res, 400, { configured: true, error: 'Invalid playerId' });
      }

      const nowMs = Date.now();
      const format = ALLOWED_FORMATS.includes(body.format) ? body.format : 'duel';
      const operation = ALLOWED_OPS.includes(body.operation) ? body.operation : 'multiply';
      const difficulty = ALLOWED_DIFFS.includes(body.difficulty) ? body.difficulty : 'medium';

      if (action === 'presence') {
        const onlineCount = await recordOnlinePresence(playerId, nowMs);
        const searchingCount = await getSearchingCount(nowMs);
        return sendJson(res, 200, {
          configured: true,
          onlineCount,
          searchingCount,
          windowSeconds: Math.round(PRESENCE_WINDOW_MS / 1000),
        });
      }

      if (action === 'leave_presence') {
        await removeOnlinePresence(playerId);
        await removeSearchingPlayer(playerId);
        return sendJson(res, 200, { configured: true, removed: true });
      }

      if (action === 'queue') {
        await redisCommand(['DEL', `mq:pvp:ticket:${playerId}`]);
        await redisCommand(['DEL', `mq:pvp:cancelled:${playerId}`]);

        const queueKey = `mq:pvp:queue:${format}:${difficulty}`;
        let matchedWaiter = null;

        for (let i = 0; i < 10; i++) {
          const rawWaiter = await redisCommand(['LPOP', queueKey]);
          if (!rawWaiter) break;
          try {
            const parsed = JSON.parse(rawWaiter);
            if (!parsed || !parsed.playerId || parsed.playerId === playerId) continue;
            if (nowMs - (parsed.ts || 0) > 25000) continue;
            const wasCancelled = await redisCommand(['GET', `mq:pvp:cancelled:${parsed.playerId}`]);
            if (wasCancelled) continue;
            matchedWaiter = parsed;
            break;
          } catch (e) {}
        }

        if (matchedWaiter) {
          const match = createMatchState({
            format,
            operation: matchedWaiter.operation || operation,
            difficulty,
            p1: matchedWaiter,
            p2: { playerId, name: body.name, avatar: body.avatar },
            nowMs,
          });
          await saveMatchToRedis(match);
          await redisCommand(['SET', `mq:pvp:ticket:${matchedWaiter.playerId}`, match.matchId, 'EX', 60]);
          await removeSearchingPlayer(playerId);
          await removeSearchingPlayer(matchedWaiter.playerId);
          return sendJson(res, 200, {
            configured: true,
            matched: true,
            matchId: match.matchId,
            match: buildPublicMatchView(match, playerId, nowMs),
          });
        }

        const queueEntry = {
          playerId,
          name: sanitizeNickname(body.name),
          avatar: ALLOWED_AVATARS.includes(body.avatar) ? body.avatar : 'knight',
          operation,
          ts: nowMs,
        };
        await redisCommand(['RPUSH', queueKey, JSON.stringify(queueEntry)]);
        await redisCommand(['EXPIRE', queueKey, 45]);
        await recordSearchingPlayer(playerId, nowMs);
        return sendJson(res, 200, { configured: true, matched: false, queued: true });
      }

      if (action === 'poll_queue') {
        const matchId = await redisCommand(['GET', `mq:pvp:ticket:${playerId}`]);
        if (!matchId) {
          return sendJson(res, 200, { configured: true, matched: false });
        }
        const match = await loadMatchFromRedis(matchId);
        if (!match) {
          return sendJson(res, 200, { configured: true, matched: false });
        }
        await redisCommand(['DEL', `mq:pvp:ticket:${playerId}`]);
        return sendJson(res, 200, {
          configured: true,
          matched: true,
          matchId: match.matchId,
          match: buildPublicMatchView(match, playerId, nowMs),
        });
      }

      if (action === 'cancel_queue') {
        await redisCommand(['DEL', `mq:pvp:ticket:${playerId}`]);
        await redisCommand(['SET', `mq:pvp:cancelled:${playerId}`, '1', 'EX', 30]);
        await removeSearchingPlayer(playerId);
        return sendJson(res, 200, { configured: true, cancelled: true });
      }

      if (action === 'create_room') {
        let code = '';
        for (let i = 0; i < 4; i++) {
          const candidate = generateRoomCode();
          const exists = await redisCommand(['GET', `mq:pvp:room:${candidate}`]);
          if (!exists) {
            code = candidate;
            break;
          }
        }
        if (!code) code = generateRoomCode();

        const match = createMatchState({
          code,
          format,
          operation,
          difficulty,
          p1: { playerId, name: body.name, avatar: body.avatar },
          p2: null,
          nowMs,
        });
        await saveMatchToRedis(match);
        await redisCommand(['SET', `mq:pvp:room:${code}`, match.matchId, 'EX', MATCH_TTL_SECONDS]);
        return sendJson(res, 200, {
          configured: true,
          code,
          matchId: match.matchId,
          match: buildPublicMatchView(match, playerId, nowMs),
        });
      }

      if (action === 'join_room') {
        const code = normalizeRoomCode(body.code);
        if (!code) {
          return sendJson(res, 400, { configured: true, error: 'Room code must be 4-10 letters or numbers' });
        }
        const matchId = await redisCommand(['GET', `mq:pvp:room:${code}`]);
        if (!matchId) {
          return sendJson(res, 404, { configured: true, error: 'Room not found or expired' });
        }
        const match = await loadMatchFromRedis(matchId);
        if (!match) {
          return sendJson(res, 409, { configured: true, error: 'Room is no longer available' });
        }

        if (match.format === 'party') {
          resolveTimeoutIfNeeded(match, nowMs);
          if (match.status !== 'active') {
            return sendJson(res, 409, { configured: true, error: 'Party sprint has already finished' });
          }
          match.partyPlayers = match.partyPlayers || {};
          if (!match.partyPlayers[playerId]) {
            if (Object.keys(match.partyPlayers).length >= PARTY_MAX_PLAYERS) {
              return sendJson(res, 409, { configured: true, error: 'Party room is full (25 players max)' });
            }
            match.partyPlayers[playerId] = makePartyPlayer({ playerId, name: body.name, avatar: body.avatar });
            await saveMatchToRedis(match);
          }
          return sendJson(res, 200, {
            configured: true,
            joined: true,
            matchId: match.matchId,
            match: buildPublicMatchView(match, playerId, nowMs),
          });
        }

        if (match.status !== 'waiting') {
          return sendJson(res, 409, { configured: true, error: 'Room is no longer available' });
        }
        if (match.p1 && match.p1.playerId === playerId) {
          return sendJson(res, 400, { configured: true, error: 'Cannot join your own room from the same browser session' });
        }

        match.p2 = makePlayerState({ playerId, name: body.name, avatar: body.avatar });
        match.status = 'active';
        match.startedAt = nowMs;
        match.endsAt = nowMs + MATCH_DURATION_MS;
        await saveMatchToRedis(match);
        await redisCommand(['DEL', `mq:pvp:room:${code}`]);

        return sendJson(res, 200, {
          configured: true,
          joined: true,
          matchId: match.matchId,
          match: buildPublicMatchView(match, playerId, nowMs),
        });
      }

      if (action === 'answer') {
        const matchId = sanitizeMatchId(body.matchId);
        if (!matchId) {
          return sendJson(res, 400, { configured: true, error: 'Invalid matchId' });
        }
        const match = await loadMatchFromRedis(matchId);
        if (!match) {
          return sendJson(res, 404, { configured: true, error: 'Match not found' });
        }
        const result = applyPlayerAction(match, {
          playerId,
          correct: body.correct,
          responseTimeMs: body.responseTimeMs,
          nowMs,
        });
        await saveMatchToRedis(result.match);
        return sendJson(res, 200, {
          configured: true,
          accepted: result.accepted,
          reason: result.reason,
          event: result.event,
          match: buildPublicMatchView(result.match, playerId, nowMs),
        });
      }

      if (action === 'emote') {
        const matchId = sanitizeMatchId(body.matchId);
        if (!matchId) {
          return sendJson(res, 400, { configured: true, error: 'Invalid matchId' });
        }
        const match = await loadMatchFromRedis(matchId);
        if (!match) {
          return sendJson(res, 404, { configured: true, error: 'Match not found' });
        }
        const result = applyPlayerEmote(match, {
          playerId,
          emoteId: String(body.emoteId || ''),
          nowMs,
        });
        if (result.accepted) {
          await saveMatchToRedis(match);
        }
        return sendJson(res, 200, {
          configured: true,
          accepted: result.accepted,
          reason: result.reason,
          match: buildPublicMatchView(match, playerId, nowMs),
        });
      }

      if (action === 'forfeit') {
        const matchId = sanitizeMatchId(body.matchId);
        if (!matchId) {
          return sendJson(res, 400, { configured: true, error: 'Invalid matchId' });
        }
        const match = await loadMatchFromRedis(matchId);
        if (!match) {
          return sendJson(res, 404, { configured: true, error: 'Match not found' });
        }
        if (match.status === 'active' || match.status === 'waiting') {
          const isP1 = match.p1 && match.p1.playerId === playerId;
          const isP2 = match.p2 && match.p2.playerId === playerId;
          if (!isP1 && !isP2) {
            return sendJson(res, 403, { configured: true, error: 'Not a participant in this match' });
          }
          if (match.status === 'waiting' && match.code) {
            await redisCommand(['DEL', `mq:pvp:room:${match.code}`]);
          }
          match.status = 'finished';
          match.winner = isP1 ? (match.p2 ? 'p2' : 'draw') : 'p1';
          match.finishReason = 'forfeit';
          await saveMatchToRedis(match);
        }
        return sendJson(res, 200, {
          configured: true,
          match: buildPublicMatchView(match, playerId, nowMs),
        });
      }

      return sendJson(res, 400, { configured: true, error: 'Unsupported PvP action' });
    } catch (err) {
      return sendJson(res, 400, { configured: true, error: 'Invalid PvP request' });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}

handler.ALLOWED_FORMATS = ALLOWED_FORMATS;
handler.COOP_BOSS_START_HP = COOP_BOSS_START_HP;
handler.ALLOWED_AVATARS = ALLOWED_AVATARS;
handler.ALLOWED_EMOTES = ALLOWED_EMOTES;
handler.MIN_EMOTE_COOLDOWN_MS = MIN_EMOTE_COOLDOWN_MS;
handler.SEARCHING_KEY = SEARCHING_KEY;
handler.SEARCHING_WINDOW_MS = SEARCHING_WINDOW_MS;
handler.applyPlayerEmote = applyPlayerEmote;
handler.buildSearchingAddCommands = buildSearchingAddCommands;
handler.buildSearchingCountCommand = buildSearchingCountCommand;
handler.buildSearchingRemoveCommand = buildSearchingRemoveCommand;
handler.recordSearchingPlayer = recordSearchingPlayer;
handler.removeSearchingPlayer = removeSearchingPlayer;
handler.getSearchingCount = getSearchingCount;
handler.MATCH_DURATION_MS = MATCH_DURATION_MS;
handler.TUG_WIN_THRESHOLD = TUG_WIN_THRESHOLD;
handler.PRESENCE_KEY = PRESENCE_KEY;
handler.PRESENCE_WINDOW_MS = PRESENCE_WINDOW_MS;
handler.sanitizeNickname = sanitizeNickname;
handler.normalizeRoomCode = normalizeRoomCode;
handler.generateRoomCode = generateRoomCode;
handler.generateKidSafeName = generateKidSafeName;
handler.createMatchState = createMatchState;
handler.resolveTimeoutIfNeeded = resolveTimeoutIfNeeded;
handler.applyPlayerAction = applyPlayerAction;
handler.buildPublicMatchView = buildPublicMatchView;
handler.getPresenceCutoff = getPresenceCutoff;
handler.normalizeOnlineCount = normalizeOnlineCount;
handler.buildPresenceHeartbeatCommands = buildPresenceHeartbeatCommands;
handler.buildPresenceCountCommand = buildPresenceCountCommand;
handler.buildLeavePresenceCommand = buildLeavePresenceCommand;
handler.recordOnlinePresence = recordOnlinePresence;
handler.getOnlinePresenceCount = getOnlinePresenceCount;
handler.removeOnlinePresence = removeOnlinePresence;

module.exports = handler;
