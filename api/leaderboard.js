/**
 * Vercel Serverless Leaderboard API for Math Quest
 * Zero external dependencies — uses native fetch() with Upstash Redis REST API.
 * Env vars required on Vercel for online boards:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

const ALLOWED_BOARDS = ['daily', 'blitz_30', 'blitz_60', 'blitz_120', 'meteor', 'survival'];
const ALLOWED_AVATARS = ['knight', 'wizard', 'star', 'rocket', 'shield', 'owl'];

const SCORE_CAPS = {
  blitz_30: 6000,
  blitz_60: 12000,
  blitz_120: 24000,
  meteor: 50000,
  survival: 50000,
};

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
  // Strip any HTML-like tags and control chars, then allow strictly safe characters
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
  const cleaned = trimmed.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
  if (cleaned.length < 3) return null;
  return cleaned;
}

function isValidDateKey(dateKey) {
  return typeof dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
}

function getTodayDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeCompositeScore(board, data) {
  if (board === 'daily') {
    const correct = Math.max(0, Math.min(15, Number(data.correct) || 0));
    const timeSeconds = Math.max(1, Math.min(1800, Number(data.timeSeconds) || 1800));
    return correct * 100000 + (10000 - timeSeconds);
  }
  return Math.max(0, Math.round(Number(data.score) || 0));
}

function buildBoardKey(board, dateKey, room) {
  const roomScope = room ? `room:${room}` : 'global';
  if (board === 'daily') {
    const resolvedDate = isValidDateKey(dateKey) ? dateKey : getTodayDateKey();
    return `mq:lb:daily:${resolvedDate}:${roomScope}`;
  }
  return `mq:lb:${board}:${roomScope}`;
}

function validateScoreSubmission(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be JSON object' };
  }

  const board = String(body.board || '');
  if (!ALLOWED_BOARDS.includes(board)) {
    return { valid: false, error: 'Unsupported leaderboard category' };
  }

  const room = normalizeRoomCode(body.room);
  if (room === null) {
    return { valid: false, error: 'Room code must be 3-12 alphanumeric characters' };
  }

  const avatar = ALLOWED_AVATARS.includes(body.avatar) ? body.avatar : 'knight';
  const name = sanitizeNickname(body.name);
  const clientId = typeof body.clientId === 'string'
    ? body.clientId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32)
    : '';

  if (board === 'daily') {
    const dateKey = isValidDateKey(body.dateKey) ? body.dateKey : getTodayDateKey();
    const total = Number(body.total);
    const correct = Number(body.correct);
    const timeSeconds = Number(body.timeSeconds);

    if (total !== 15 || !Number.isInteger(correct) || correct < 0 || correct > 15) {
      return { valid: false, error: 'Invalid daily challenge accuracy payload' };
    }
    if (!Number.isFinite(timeSeconds) || timeSeconds < 5 || timeSeconds > 1800) {
      return { valid: false, error: 'Invalid daily challenge elapsed time' };
    }

    const roundedTime = Math.round(timeSeconds);
    const composite = computeCompositeScore('daily', { correct, timeSeconds: roundedTime });

    return {
      valid: true,
      data: {
        board,
        dateKey,
        room,
        name,
        avatar,
        clientId,
        correct,
        total: 15,
        timeSeconds: roundedTime,
        score: composite,
      },
    };
  }

  const score = Number(body.score);
  const cap = SCORE_CAPS[board];
  if (!Number.isFinite(score) || score < 1 || score > cap) {
    return { valid: false, error: 'Score out of valid range' };
  }

  const roundedScore = Math.round(score);
  const wave = board === 'meteor' ? Math.max(1, Math.min(999, Math.round(Number(body.wave) || 1))) : undefined;
  const floor = board === 'survival' ? Math.max(1, Math.min(999, Math.round(Number(body.floor) || 1))) : undefined;

  return {
    valid: true,
    data: {
      board,
      dateKey: getTodayDateKey(),
      room,
      name,
      avatar,
      clientId,
      score: roundedScore,
      wave,
      floor,
    },
  };
}

async function redisCommand(commandArgs) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
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

async function checkRateLimit(req) {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  const ipRaw = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'anon';
  const safeIp = ipRaw.replace(/[^A-Za-z0-9.:_-]/g, '').slice(0, 48) || 'anon';
  const rlKey = `mq:rl:${safeIp}`;

  const count = await redisCommand(['INCR', rlKey]);
  if (Number(count) === 1) {
    await redisCommand(['EXPIRE', rlKey, 600]);
  }
  return Number(count) <= 20;
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
  const isConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  if (req.method === 'GET') {
    const query = req.query || {};
    const board = ALLOWED_BOARDS.includes(query.board) ? query.board : 'daily';
    const room = normalizeRoomCode(query.room);
    if (room === null) {
      return sendJson(res, 400, { configured: isConfigured, error: 'Invalid room code', entries: [] });
    }
    const dateKey = isValidDateKey(query.dateKey) ? query.dateKey : getTodayDateKey();

    if (!isConfigured) {
      return sendJson(res, 200, { configured: false, board, dateKey, room, entries: [] });
    }

    try {
      const key = buildBoardKey(board, dateKey, room);
      const rawList = await redisCommand(['ZREVRANGE', key, 0, 24, 'WITHSCORES']);
      const entries = [];
      if (Array.isArray(rawList)) {
        for (let i = 0; i < rawList.length; i += 2) {
          try {
            const meta = JSON.parse(rawList[i]);
            const rawScore = Number(rawList[i + 1]);
            entries.push({
              rank: entries.length + 1,
              name: sanitizeNickname(meta.name),
              avatar: ALLOWED_AVATARS.includes(meta.avatar) ? meta.avatar : 'knight',
              score: rawScore,
              correct: meta.correct,
              total: meta.total,
              timeSeconds: meta.timeSeconds,
              wave: meta.wave,
              floor: meta.floor,
              clientId: meta.clientId || '',
            });
          } catch (e) {}
        }
      }
      return sendJson(res, 200, { configured: true, board, dateKey, room, entries });
    } catch (err) {
      return sendJson(res, 500, { configured: true, error: 'Failed to load leaderboard', entries: [] });
    }
  }

  if (req.method === 'POST') {
    if (!isConfigured) {
      return sendJson(res, 503, { configured: false, error: 'Online leaderboard not configured' });
    }

    try {
      const allowed = await checkRateLimit(req);
      if (!allowed) {
        return sendJson(res, 429, { configured: true, error: 'Too many submissions. Please wait a bit.' });
      }

      const body = await parseJsonBody(req);
      const validation = validateScoreSubmission(body);
      if (!validation.valid) {
        return sendJson(res, 400, { configured: true, error: validation.error });
      }

      const d = validation.data;
      const key = buildBoardKey(d.board, d.dateKey, d.room);
      const memberObj = {
        name: d.name,
        avatar: d.avatar,
        clientId: d.clientId,
        ts: Date.now(),
      };
      if (d.board === 'daily') {
        memberObj.correct = d.correct;
        memberObj.total = d.total;
        memberObj.timeSeconds = d.timeSeconds;
      } else if (d.board === 'meteor' && d.wave) {
        memberObj.wave = d.wave;
      } else if (d.board === 'survival' && d.floor) {
        memberObj.floor = d.floor;
      }

      await redisCommand(['ZADD', key, d.score, JSON.stringify(memberObj)]);
      // Retain top 100 entries (remove lower ranks from 0 to -101)
      await redisCommand(['ZREMRANGEBYRANK', key, 0, -101]);
      const ttlSeconds = d.board === 'daily' ? 7 * 86400 : 30 * 86400;
      await redisCommand(['EXPIRE', key, ttlSeconds]);

      return sendJson(res, 200, { configured: true, accepted: true, entry: memberObj, score: d.score });
    } catch (err) {
      return sendJson(res, 400, { configured: true, error: 'Invalid submission payload' });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}

handler.validateScoreSubmission = validateScoreSubmission;
handler.sanitizeNickname = sanitizeNickname;
handler.normalizeRoomCode = normalizeRoomCode;
handler.computeCompositeScore = computeCompositeScore;
handler.buildBoardKey = buildBoardKey;
handler.generateKidSafeName = generateKidSafeName;

module.exports = handler;
