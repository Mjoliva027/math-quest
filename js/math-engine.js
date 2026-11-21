/**
 * Math Engine for Math Quest
 * Handles problem generation, visual arrays, seeded PvP decks, survival floors, and distractors.
 */

const MathEngine = (() => {
  const OPERATIONS = {
    MULTIPLY: 'multiply',
    ADD: 'add',
    SUBTRACT: 'subtract',
    DIVIDE: 'divide',
    MISSING: 'missing',
    MIXED: 'mixed',
  };

  const SYMBOLS = {
    multiply: '×',
    add: '+',
    subtract: '−',
    divide: '÷',
    missing: '×',
  };

  const recentHistory = [];
  const MAX_HISTORY = 6;

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function createSeededRng(seedStr) {
    let a = hashSeed(String(seedStr));
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededInt(rng, min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function shuffle(array, rng = Math.random) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function resolveOperation(requestedOp) {
    if (requestedOp === OPERATIONS.MIXED) {
      const roll = Math.random();
      if (roll < 0.35) return OPERATIONS.MULTIPLY;
      if (roll < 0.55) return OPERATIONS.DIVIDE;
      if (roll < 0.70) return OPERATIONS.MISSING;
      if (roll < 0.85) return OPERATIONS.ADD;
      return OPERATIONS.SUBTRACT;
    }
    return requestedOp;
  }

  function generateMultiplyFactors(difficulty, customTables = [], weakFacts = []) {
    let f1, f2;

    // Adaptive learning: 45% chance to draw from weak facts if available
    if (weakFacts && weakFacts.length > 0 && Math.random() < 0.45) {
      let pool = weakFacts;
      if (customTables && customTables.length > 0) {
        const filtered = weakFacts.filter(f => customTables.includes(f.num1) || customTables.includes(f.num2));
        if (filtered.length > 0) pool = filtered;
      }
      const picked = pool[Math.floor(Math.random() * pool.length)];
      if (customTables && customTables.length > 0) {
        if (customTables.includes(picked.num1)) {
          f1 = picked.num1;
          f2 = picked.num2;
        } else if (customTables.includes(picked.num2)) {
          f1 = picked.num2;
          f2 = picked.num1;
        } else {
          f1 = picked.num1;
          f2 = picked.num2;
        }
      } else if (Math.random() < 0.5) {
        f1 = picked.num1;
        f2 = picked.num2;
      } else {
        f1 = picked.num2;
        f2 = picked.num1;
      }
      return { f1, f2 };
    }

    if (customTables && customTables.length > 0) {
      f1 = customTables[Math.floor(Math.random() * customTables.length)];
      const maxFactor = difficulty === 'hard' ? 15 : 12;
      f2 = getRandomInt(1, maxFactor);
    } else {
      switch (difficulty) {
        case 'easy':
          f1 = getRandomInt(1, 5);
          f2 = getRandomInt(1, 10);
          break;
        case 'hard':
          if (Math.random() < 0.5) {
            f1 = getRandomInt(11, 20);
            f2 = getRandomInt(2, 10);
          } else {
            f1 = getRandomInt(6, 15);
            f2 = getRandomInt(6, 15);
          }
          break;
        case 'medium':
        default:
          f1 = getRandomInt(2, 12);
          f2 = getRandomInt(2, 12);
          break;
      }
    }

    return { f1, f2 };
  }

  function generateNumbers(op, difficulty, customTables = [], weakFacts = []) {
    let num1, num2;

    if (op === OPERATIONS.MULTIPLY) {
      const { f1, f2 } = generateMultiplyFactors(difficulty, customTables, weakFacts);
      return { num1: f1, num2: f2 };
    } else if (op === OPERATIONS.DIVIDE) {
      const { f1, f2 } = generateMultiplyFactors(difficulty, customTables, weakFacts);
      const divisor = Math.max(1, f1);
      const dividend = divisor * f2;
      return { num1: dividend, num2: divisor, factors: [f1, f2] };
    } else if (op === OPERATIONS.MISSING) {
      const { f1, f2 } = generateMultiplyFactors(difficulty, customTables, weakFacts);
      const missingPosition = Math.random() < 0.5 ? 'second' : 'first';
      const product = f1 * f2;
      const knownFactor = missingPosition === 'second' ? f1 : f2;
      const answer = missingPosition === 'second' ? f2 : f1;
      return {
        num1: f1,
        num2: f2,
        product,
        missingPosition,
        knownFactor,
        answer,
        factors: [f1, f2],
      };
    } else if (op === OPERATIONS.ADD) {
      switch (difficulty) {
        case 'easy':
          num1 = getRandomInt(1, 10);
          num2 = getRandomInt(1, 10);
          break;
        case 'hard':
          num1 = getRandomInt(25, 99);
          num2 = getRandomInt(15, 99);
          break;
        case 'medium':
        default:
          num1 = getRandomInt(10, 50);
          num2 = getRandomInt(5, 50);
          break;
      }
    } else if (op === OPERATIONS.SUBTRACT) {
      switch (difficulty) {
        case 'easy':
          num2 = getRandomInt(1, 10);
          num1 = num2 + getRandomInt(1, 10);
          break;
        case 'hard':
          num2 = getRandomInt(15, 99);
          num1 = num2 + getRandomInt(10, 100);
          break;
        case 'medium':
        default:
          num2 = getRandomInt(5, 30);
          num1 = num2 + getRandomInt(5, 40);
          break;
      }
    }

    return { num1, num2 };
  }

  function calculateAnswer(op, num1, num2) {
    switch (op) {
      case OPERATIONS.MULTIPLY:
        return num1 * num2;
      case OPERATIONS.ADD:
        return num1 + num2;
      case OPERATIONS.SUBTRACT:
        return num1 - num2;
      case OPERATIONS.DIVIDE:
        return num2 !== 0 ? num1 / num2 : 0;
      case OPERATIONS.MISSING:
        return num1 !== 0 ? num2 / num1 : 0;
      default:
        return 0;
    }
  }

  function generateDistractors(answer, op, num1, num2, rng = Math.random) {
    const candidates = new Set();

    if (op === OPERATIONS.MULTIPLY) {
      candidates.add(num1 * Math.max(1, num2 - 1));
      candidates.add(num1 * (num2 + 1));
      candidates.add(Math.max(1, num1 - 1) * num2);
      candidates.add((num1 + 1) * num2);
      candidates.add(answer + 10);
      candidates.add(answer - 10);
      candidates.add(answer + 2);
      candidates.add(answer - 2);
      candidates.add(num1 + num2);
    } else if (op === OPERATIONS.DIVIDE || op === OPERATIONS.MISSING) {
      candidates.add(answer + 1);
      candidates.add(answer - 1);
      candidates.add(answer + 2);
      candidates.add(answer - 2);
      candidates.add(answer + 3);
      candidates.add(answer - 3);
      candidates.add(answer + 10);
      candidates.add(num2);
    } else if (op === OPERATIONS.ADD) {
      candidates.add(answer + 1);
      candidates.add(answer - 1);
      candidates.add(answer + 10);
      candidates.add(answer - 10);
      candidates.add(answer + 2);
      candidates.add(answer - 2);
      candidates.add(Math.abs(num1 - num2));
    } else if (op === OPERATIONS.SUBTRACT) {
      candidates.add(answer + 1);
      candidates.add(answer - 1);
      candidates.add(answer + 10);
      candidates.add(answer - 10);
      candidates.add(answer + 2);
      candidates.add(answer - 2);
      candidates.add(num1 + num2);
    }

    const valid = Array.from(candidates).filter(n => Number.isInteger(n) && n > 0 && n !== answer);

    while (valid.length < 3) {
      const delta = (Math.floor(rng() * 5) + 1) * (rng() < 0.5 ? -1 : 1);
      const val = answer + delta;
      if (val > 0 && val !== answer && !valid.includes(val)) {
        valid.push(val);
      }
    }

    const chosen = shuffle(valid, rng).slice(0, 3);
    return shuffle([answer, ...chosen], rng);
  }

  function getMentalTrick(op, num1, num2, answer, extra = {}) {
    if (op === OPERATIONS.MULTIPLY) {
      const a = Math.min(num1, num2);
      const b = Math.max(num1, num2);
      if (a === 7 && b === 8) return '5-6-7-8 Rule: 56 = 7 × 8!';
      if (a === 6 && b === 8) return 'Rhyme Trick: 6 × 8 is 48!';
      if (a === 7 && b === 7) return 'Square Trick: 7 × 7 = 49 (one less than 50)!';
      if (a === 9 || b === 9) {
        const other = a === 9 ? b : a;
        return `9s Trick: (10 × ${other}) − ${other} = ${answer} (digits add to 9)!`;
      }
      if (a === 4 || b === 4) {
        const other = a === 4 ? b : a;
        return `Double-Double: ${other} × 2 = ${other * 2}, doubled again = ${answer}!`;
      }
      if (a === 5 || b === 5) {
        const other = a === 5 ? b : a;
        return `Half of 10×: (${other} × 10) ÷ 2 = ${answer}!`;
      }
      if (a === 6 || b === 6) {
        const other = a === 6 ? b : a;
        return `5s + 1 More: (${other} × 5) + ${other} = ${answer}!`;
      }
      if (a === 8 || b === 8) {
        const other = a === 8 ? b : a;
        return `Triple-Double: ${other} → ${other * 2} → ${other * 4} → ${answer}!`;
      }
      if (a === 11 || b === 11) {
        const other = a === 11 ? b : a;
        return `11s Trick: (10 × ${other}) + ${other} = ${answer}!`;
      }
      if (a === 12 || b === 12) {
        const other = a === 12 ? b : a;
        return `10s + 2s Split: (10 × ${other}) + (2 × ${other}) = ${answer}!`;
      }
      if (a === 2 || b === 2) {
        const other = a === 2 ? b : a;
        return `Doubling: ${other} + ${other} = ${answer}!`;
      }
      if (a === 10 || b === 10) {
        const other = a === 10 ? b : a;
        return `Place Value: Attach a 0 to ${other} = ${answer}!`;
      }
      return `Break Apart: (${a} × ${b - 1}) + ${a} = ${answer}!`;
    }
    if (op === OPERATIONS.DIVIDE) {
      return `Reverse It: ${answer} × ${num2} = ${num1}!`;
    }
    if (op === OPERATIONS.MISSING) {
      const prod = extra.product || (num1 * num2);
      const known = extra.knownFactor || num1;
      return `Inverse Division: ${prod} ÷ ${known} = ${answer}!`;
    }
    if (op === OPERATIONS.ADD || op === OPERATIONS.SUBTRACT) {
      return 'Bridge through 10s: Split the smaller number to hit a multiple of 10!';
    }
    return '';
  }

  function generateHint(op, num1, num2, answer, extra = {}) {
    if (op === OPERATIONS.MULTIPLY) {
      if (num1 === 1 || num2 === 1) {
        return `Any number multiplied by 1 stays the same: ${answer}!`;
      }
      if (num1 === 0 || num2 === 0) {
        return `Any number multiplied by 0 is always 0!`;
      }
      if (num1 === 2 || num2 === 2) {
        return `Multiplying by 2 is the same as doubling the number!`;
      }
      if (num1 === 10 || num2 === 10) {
        return `Multiplying by 10 simply adds a 0 to the end!`;
      }
      if (num1 === 9 || num2 === 9) {
        const factor = num1 === 9 ? num2 : num1;
        return `Tip for 9s: Multiply by 10 (${factor * 10}) then subtract ${factor} = ${answer}!`;
      }
      if (num1 >= 6 && num2 >= 6) {
        return `Shortcut: ${num1} × ${num2 - 1} = ${num1 * (num2 - 1)}, plus ${num1} = ${answer}`;
      }
      return `${num1} groups of ${num2} equals ${answer}`;
    }
    if (op === OPERATIONS.DIVIDE) {
      return `Think: What number times ${num2} equals ${num1}? (${answer} × ${num2} = ${num1})`;
    }
    if (op === OPERATIONS.MISSING) {
      return `Think: ${extra.product} ÷ ${extra.knownFactor} = ${answer} (${num1} × ${num2} = ${extra.product})`;
    }
    if (op === OPERATIONS.ADD) {
      return `Count up from ${Math.max(num1, num2)} by ${Math.min(num1, num2)}`;
    }
    if (op === OPERATIONS.SUBTRACT) {
      return `Think: What number plus ${num2} equals ${num1}?`;
    }
    return '';
  }

  function generateVisualArray(num1, num2) {
    const rows = Math.min(num1, 12);
    const cols = Math.min(num2, 12);
    return {
      rows,
      cols,
      total: num1 * num2,
      label: `${rows} rows × ${cols} columns = ${rows * cols}`,
      isScaled: num1 > 12 || num2 > 12,
    };
  }

  function generateProblem({ operation = OPERATIONS.MULTIPLY, difficulty = 'medium', customTables = [], weakFacts = [] }) {
    const resolvedOp = resolveOperation(operation);
    let nums, num1, num2, answer, key;
    let attempts = 0;

    do {
      nums = generateNumbers(resolvedOp, difficulty, customTables, weakFacts);
      num1 = nums.num1;
      num2 = nums.num2;
      answer = resolvedOp === OPERATIONS.MISSING
        ? nums.answer
        : calculateAnswer(resolvedOp, num1, num2);
      key = resolvedOp === OPERATIONS.MISSING
        ? `${nums.missingPosition}_${num1}${resolvedOp}${num2}`
        : `${num1}${resolvedOp}${num2}`;
      attempts++;
    } while (recentHistory.includes(key) && attempts < 15);

    recentHistory.push(key);
    if (recentHistory.length > MAX_HISTORY) {
      recentHistory.shift();
    }

    const symbol = SYMBOLS[resolvedOp];
    const options = generateDistractors(answer, resolvedOp, num1, num2);
    const hint = generateHint(resolvedOp, num1, num2, answer, nums);
    const trick = getMentalTrick(resolvedOp, num1, num2, answer, nums);
    const visualArray = resolvedOp === OPERATIONS.MULTIPLY ? generateVisualArray(num1, num2) : null;
    const equation = resolvedOp === OPERATIONS.MISSING
      ? (nums.missingPosition === 'first' ? `? × ${num2} = ${nums.product}` : `${num1} × ? = ${nums.product}`)
      : `${num1} ${symbol} ${num2}`;
    const matrixFactors = resolvedOp === OPERATIONS.MULTIPLY
      ? [num1, num2]
      : (nums.factors || null);

    const problem = {
      id: 'prob_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      operation: resolvedOp,
      symbol,
      num1,
      num2,
      answer,
      equation,
      options,
      hint,
      trick,
      visualArray,
      matrixFactors,
    };

    if (resolvedOp === OPERATIONS.MISSING) {
      problem.product = nums.product;
      problem.missingPosition = nums.missingPosition;
      problem.knownFactor = nums.knownFactor;
    }

    return problem;
  }

  function generateDeck({ operation = OPERATIONS.MULTIPLY, difficulty = 'medium', customTables = [], weakFacts = [], count = 15 }) {
    const deck = [];
    for (let i = 0; i < count; i++) {
      deck.push(generateProblem({ operation, difficulty, customTables, weakFacts }));
    }
    return deck;
  }

  function generateDailyChallenge(dateKey, count = 15) {
    const now = new Date();
    const resolvedDateKey = dateKey || [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    const rng = createSeededRng(`math-quest-daily-${resolvedDateKey}`);
    const deck = [];
    const usedKeys = new Set();

    for (let i = 0; i < count; i++) {
      let op, f1, f2, num1, num2, answer, equation, extra = {};
      let missingPosition = 'second';
      let attempts = 0;
      let dedupeKey = '';

      do {
        if (i < 5) {
          op = OPERATIONS.MULTIPLY;
          f1 = seededInt(rng, 2, 9);
          f2 = seededInt(rng, 2, 9);
          num1 = f1;
          num2 = f2;
          answer = f1 * f2;
          equation = `${num1} × ${num2}`;
          dedupeKey = `${op}_${num1}_${num2}`;
        } else if (i < 9) {
          op = OPERATIONS.DIVIDE;
          f1 = seededInt(rng, 2, 10);
          f2 = seededInt(rng, 2, 12);
          num1 = f1 * f2;
          num2 = f1;
          answer = f2;
          equation = `${num1} ÷ ${num2}`;
          dedupeKey = `${op}_${num1}_${num2}`;
        } else if (i < 12) {
          op = OPERATIONS.MISSING;
          f1 = seededInt(rng, 2, 12);
          f2 = seededInt(rng, 2, 12);
          missingPosition = rng() < 0.5 ? 'second' : 'first';
          const product = f1 * f2;
          const knownFactor = missingPosition === 'second' ? f1 : f2;
          answer = missingPosition === 'second' ? f2 : f1;
          num1 = f1;
          num2 = f2;
          extra = { product, missingPosition, knownFactor };
          equation = missingPosition === 'first'
            ? `? × ${num2} = ${product}`
            : `${num1} × ? = ${product}`;
          dedupeKey = `${op}_${missingPosition}_${num1}_${num2}`;
        } else {
          op = OPERATIONS.MULTIPLY;
          f1 = seededInt(rng, 6, 12);
          f2 = seededInt(rng, 6, 12);
          num1 = f1;
          num2 = f2;
          answer = f1 * f2;
          equation = `${num1} × ${num2}`;
          dedupeKey = `${op}_${num1}_${num2}`;
        }
        attempts++;
      } while (usedKeys.has(dedupeKey) && attempts < 40);

      usedKeys.add(dedupeKey);

      const symbol = SYMBOLS[op];
      const options = generateDistractors(answer, op, num1, num2, rng);
      const hint = generateHint(op, num1, num2, answer, extra);
      const trick = getMentalTrick(op, num1, num2, answer, extra);
      const visualArray = op === OPERATIONS.MULTIPLY ? generateVisualArray(num1, num2) : null;

      const problem = {
        id: `daily_${resolvedDateKey}_${i}`,
        operation: op,
        symbol,
        num1,
        num2,
        answer,
        equation,
        options,
        hint,
        trick,
        visualArray,
        matrixFactors: [f1, f2],
      };

      if (op === OPERATIONS.MISSING) {
        problem.product = extra.product;
        problem.missingPosition = extra.missingPosition;
        problem.knownFactor = extra.knownFactor;
      }

      deck.push(problem);
    }

    return deck;
  }

  function resolveSeededOperation(requestedOp, rng) {
    if (requestedOp === OPERATIONS.MIXED) {
      const roll = rng();
      if (roll < 0.35) return OPERATIONS.MULTIPLY;
      if (roll < 0.55) return OPERATIONS.DIVIDE;
      if (roll < 0.70) return OPERATIONS.MISSING;
      if (roll < 0.85) return OPERATIONS.ADD;
      return OPERATIONS.SUBTRACT;
    }
    return requestedOp;
  }

  function generateSeededMultiplyFactors(difficulty, rng) {
    let f1, f2;
    switch (difficulty) {
      case 'easy':
        f1 = seededInt(rng, 1, 5);
        f2 = seededInt(rng, 1, 10);
        break;
      case 'hard':
        if (rng() < 0.5) {
          f1 = seededInt(rng, 11, 20);
          f2 = seededInt(rng, 2, 10);
        } else {
          f1 = seededInt(rng, 6, 15);
          f2 = seededInt(rng, 6, 15);
        }
        break;
      case 'medium':
      default:
        f1 = seededInt(rng, 2, 12);
        f2 = seededInt(rng, 2, 12);
        break;
    }
    return { f1, f2 };
  }

  function generateSeededNumbers(op, difficulty, rng) {
    let num1, num2;

    if (op === OPERATIONS.MULTIPLY) {
      const { f1, f2 } = generateSeededMultiplyFactors(difficulty, rng);
      return { num1: f1, num2: f2 };
    } else if (op === OPERATIONS.DIVIDE) {
      const { f1, f2 } = generateSeededMultiplyFactors(difficulty, rng);
      const divisor = Math.max(1, f1);
      const dividend = divisor * f2;
      return { num1: dividend, num2: divisor, factors: [f1, f2] };
    } else if (op === OPERATIONS.MISSING) {
      const { f1, f2 } = generateSeededMultiplyFactors(difficulty, rng);
      const missingPosition = rng() < 0.5 ? 'second' : 'first';
      const product = f1 * f2;
      const knownFactor = missingPosition === 'second' ? f1 : f2;
      const answer = missingPosition === 'second' ? f2 : f1;
      return {
        num1: f1,
        num2: f2,
        product,
        missingPosition,
        knownFactor,
        answer,
        factors: [f1, f2],
      };
    } else if (op === OPERATIONS.ADD) {
      switch (difficulty) {
        case 'easy':
          num1 = seededInt(rng, 1, 10);
          num2 = seededInt(rng, 1, 10);
          break;
        case 'hard':
          num1 = seededInt(rng, 25, 99);
          num2 = seededInt(rng, 15, 99);
          break;
        case 'medium':
        default:
          num1 = seededInt(rng, 10, 50);
          num2 = seededInt(rng, 5, 50);
          break;
      }
    } else if (op === OPERATIONS.SUBTRACT) {
      switch (difficulty) {
        case 'easy':
          num2 = seededInt(rng, 1, 10);
          num1 = num2 + seededInt(rng, 1, 10);
          break;
        case 'hard':
          num2 = seededInt(rng, 15, 99);
          num1 = num2 + seededInt(rng, 10, 100);
          break;
        case 'medium':
        default:
          num2 = seededInt(rng, 5, 30);
          num1 = num2 + seededInt(rng, 5, 40);
          break;
      }
    }

    return { num1, num2 };
  }

  function generateSeededDeck({ seed = 'pvp-default', operation = OPERATIONS.MULTIPLY, difficulty = 'medium', count = 60 } = {}) {
    const resolvedSeed = String(seed || 'pvp-default');
    const rng = createSeededRng(`math-quest-pvp-${resolvedSeed}`);
    const deck = [];
    const localRecent = [];

    for (let i = 0; i < count; i++) {
      let resolvedOp = resolveSeededOperation(operation, rng);
      if (!SYMBOLS[resolvedOp]) resolvedOp = OPERATIONS.MULTIPLY;
      let nums, num1, num2, answer, key;
      let attempts = 0;

      do {
        nums = generateSeededNumbers(resolvedOp, difficulty, rng);
        num1 = nums.num1;
        num2 = nums.num2;
        answer = resolvedOp === OPERATIONS.MISSING
          ? nums.answer
          : calculateAnswer(resolvedOp, num1, num2);
        key = resolvedOp === OPERATIONS.MISSING
          ? `${nums.missingPosition}_${num1}${resolvedOp}${num2}`
          : `${num1}${resolvedOp}${num2}`;
        attempts++;
      } while (localRecent.includes(key) && attempts < 15);

      localRecent.push(key);
      if (localRecent.length > MAX_HISTORY) {
        localRecent.shift();
      }

      const symbol = SYMBOLS[resolvedOp];
      const options = generateDistractors(answer, resolvedOp, num1, num2, rng);
      const hint = generateHint(resolvedOp, num1, num2, answer, nums);
      const trick = getMentalTrick(resolvedOp, num1, num2, answer, nums);
      const visualArray = resolvedOp === OPERATIONS.MULTIPLY ? generateVisualArray(num1, num2) : null;
      const equation = resolvedOp === OPERATIONS.MISSING
        ? (nums.missingPosition === 'first' ? `? × ${num2} = ${nums.product}` : `${num1} × ? = ${nums.product}`)
        : `${num1} ${symbol} ${num2}`;
      const matrixFactors = resolvedOp === OPERATIONS.MULTIPLY
        ? [num1, num2]
        : (nums.factors || null);

      const problem = {
        id: `pvp_${resolvedSeed}_${i}`,
        operation: resolvedOp,
        symbol,
        num1,
        num2,
        answer,
        equation,
        options,
        hint,
        trick,
        visualArray,
        matrixFactors,
      };

      if (resolvedOp === OPERATIONS.MISSING) {
        problem.product = nums.product;
        problem.missingPosition = nums.missingPosition;
        problem.knownFactor = nums.knownFactor;
      }

      deck.push(problem);
    }

    return deck;
  }

  function getSurvivalFloorConfig(floor = 1) {
    const f = Math.max(1, Math.floor(Number(floor) || 1));
    const difficulty = f === 1 ? 'easy' : f <= 3 ? 'medium' : 'hard';
    const label = f === 1
      ? 'Warmup'
      : f === 2
        ? 'Rising'
        : f === 3
          ? 'Intense'
          : f === 4
            ? 'Fierce'
            : 'Master';
    const timePerQuestion = Math.max(7, 16 - f);
    const scoreMultiplier = Number((1 + (f - 1) * 0.25).toFixed(2));
    return {
      floor: f,
      label,
      difficulty,
      timePerQuestion,
      scoreMultiplier,
    };
  }

  function generateFactorPuzzle(difficulty = 'medium', rng = Math.random) {
    const pools = {
      easy: [12, 16, 18, 20, 24, 36],
      medium: [24, 30, 36, 40, 48, 60, 72],
      hard: [36, 48, 54, 60, 72, 84, 96, 108],
    };
    const pool = pools[difficulty] || pools.medium;
    const target = pool[Math.floor(rng() * pool.length)];

    const allPairs = [];
    for (let a = 2; a <= 12; a++) {
      if (target % a === 0) {
        const b = target / a;
        if (b >= a && b <= 12) {
          allPairs.push([a, b]);
        }
      }
    }

    const shuffledPairs = shuffle(allPairs, rng);
    const chosenPairs = shuffledPairs.slice(0, 2);
    while (chosenPairs.length < 2 && shuffledPairs.length > 0) {
      chosenPairs.push(shuffledPairs[0]);
    }

    const rawFactors = [];
    chosenPairs.forEach(([a, b]) => {
      rawFactors.push(a, b);
    });

    // Add 2 distractor factors that do not divide target
    const distractors = [];
    for (let cand = 2; cand <= 13 && distractors.length < 6; cand++) {
      if (target % cand !== 0) distractors.push(cand);
    }
    const pickedDistractors = shuffle(distractors, rng).slice(0, 2);
    while (pickedDistractors.length < 2) {
      pickedDistractors.push(7 + pickedDistractors.length * 4);
    }

    const tiles = shuffle([...rawFactors, ...pickedDistractors], rng).map((value, idx) => ({
      id: `ft_${idx}`,
      value,
    }));

    return {
      target,
      pairsCount: chosenPairs.length,
      tiles,
      validPairs: chosenPairs,
    };
  }

  const BOSS_ROSTER = [
    {
      tier: 1,
      id: 'goblin',
      name: 'Goblin Multiplier',
      title: 'Forest Scavenger',
      maxHp: 100,
      turnSeconds: 12,
      rewardXP: 45,
      rewardStars: 12,
      svg: `<svg class="w-16 h-16" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="34" r="18" fill="#10b981" stroke="#047857" stroke-width="3"/><path d="M12 24l10 6M52 24l-10 6" stroke="#059669" stroke-width="5" stroke-linecap="round"/><circle cx="25" cy="31" r="3.5" fill="#fde047"/><circle cx="39" cy="31" r="3.5" fill="#fde047"/><path d="M24 43l4-3 4 3 4-3 4 3" stroke="#064e3b" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    },
    {
      tier: 2,
      id: 'phantasm',
      name: 'Division Phantasm',
      title: 'Shadow Wraith',
      maxHp: 150,
      turnSeconds: 11,
      rewardXP: 65,
      rewardStars: 16,
      svg: `<svg class="w-16 h-16" viewBox="0 0 64 64" fill="none"><path d="M14 48V30a18 18 0 0 1 36 0v18l-6-4-6 4-6-4-6 4-6-4z" fill="#8b5cf6" stroke="#4c1d95" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="30" r="3.5" fill="#22d3ee"/><circle cx="38" cy="30" r="3.5" fill="#22d3ee"/></svg>`,
    },
    {
      tier: 3,
      id: 'golem',
      name: 'Iron Factor Golem',
      title: 'Armored Colossus',
      maxHp: 200,
      turnSeconds: 10,
      rewardXP: 85,
      rewardStars: 22,
      svg: `<svg class="w-16 h-16" viewBox="0 0 64 64" fill="none"><rect x="14" y="14" width="36" height="36" rx="8" fill="#64748b" stroke="#334155" stroke-width="3"/><rect x="20" y="24" width="9" height="6" rx="2" fill="#f97316"/><rect x="35" y="24" width="9" height="6" rx="2" fill="#f97316"/><path d="M22 40h20" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/></svg>`,
    },
    {
      tier: 4,
      id: 'hydra',
      name: 'Grand Calculus Hydra',
      title: 'Mythic Overlord',
      maxHp: 260,
      turnSeconds: 9,
      rewardXP: 110,
      rewardStars: 30,
      svg: `<svg class="w-16 h-16" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="38" r="18" fill="#e11d48" stroke="#881337" stroke-width="3"/><path d="M18 22l-6-10 12 4M32 20V8M46 22l6-10-12 4" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="25" cy="35" r="3" fill="#fde047"/><circle cx="39" cy="35" r="3" fill="#fde047"/></svg>`,
    },
  ];

  function getBossConfig(tier = 1) {
    const t = Math.max(1, Math.floor(Number(tier) || 1));
    const idx = Math.min(BOSS_ROSTER.length - 1, t - 1);
    const base = BOSS_ROSTER[idx];
    const extraHp = t > BOSS_ROSTER.length ? (t - BOSS_ROSTER.length) * 40 : 0;
    return {
      ...base,
      tier: t,
      maxHp: base.maxHp + extraHp,
      rewardXP: base.rewardXP + (t > BOSS_ROSTER.length ? 20 : 0),
      rewardStars: base.rewardStars + (t > BOSS_ROSTER.length ? 5 : 0),
    };
  }

  return {
    OPERATIONS,
    SYMBOLS,
    generateProblem,
    generateDeck,
    generateSeededDeck,
    generateDailyChallenge,
    getSurvivalFloorConfig,
    getMentalTrick,
    generateFactorPuzzle,
    getBossConfig,
    generateVisualArray,
    generateDistractors,
    calculateAnswer,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathEngine;
}
