/**
 * Math Engine for Math Quest
 * Handles problem generation, visual arrays, boss battle configurations, and distractors.
 */

const MathEngine = (() => {
  const OPERATIONS = {
    MULTIPLY: 'multiply',
    ADD: 'add',
    SUBTRACT: 'subtract',
    MIXED: 'mixed',
  };

  const SYMBOLS = {
    multiply: '×',
    add: '+',
    subtract: '−',
  };

  // Professional Vector Boss Avatars
  const BOSSES = [
    {
      id: 'goblin',
      tier: 1,
      name: 'Goblin Multiplier',
      title: 'Hoarder of Times Tables',
      maxHp: 100,
      attackPower: 20,
      svg: `<svg class="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 0-7.38 16.75L2 22l5.25-2.62A10 10 0 1 0 12 2z"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="m10 15 2 2 2-2"/></svg>`,
      bgGradient: 'from-emerald-950/80 to-amber-950/60',
      borderColor: 'border-emerald-500/40',
      description: 'A nimble forest imp that tests your basic multiplication speed!',
    },
    {
      id: 'golem',
      tier: 2,
      name: 'Iron Math Golem',
      title: 'Guardian of Arithmetic',
      maxHp: 160,
      attackPower: 25,
      svg: `<svg class="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`,
      bgGradient: 'from-slate-900 to-indigo-950/80',
      borderColor: 'border-indigo-500/40',
      description: 'A giant automaton forged from geometric equations and stone.',
    },
    {
      id: 'dragon',
      tier: 3,
      name: 'Calculus Hydra',
      title: 'Ancient Overlord of Numbers',
      maxHp: 240,
      attackPower: 35,
      svg: `<svg class="w-10 h-10 sm:w-12 sm:h-12 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><circle cx="12" cy="12" r="3"/></svg>`,
      bgGradient: 'from-purple-950/90 to-rose-950/80',
      borderColor: 'border-rose-500/50',
      description: 'The ultimate boss of mental math. Striking fast is your only hope!',
    },
  ];

  const recentHistory = [];
  const MAX_HISTORY = 6;

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function resolveOperation(requestedOp) {
    if (requestedOp === OPERATIONS.MIXED) {
      const roll = Math.random();
      if (roll < 0.5) return OPERATIONS.MULTIPLY;
      if (roll < 0.75) return OPERATIONS.ADD;
      return OPERATIONS.SUBTRACT;
    }
    return requestedOp;
  }

  function generateNumbers(op, difficulty, customTables = [], weakFacts = []) {
    let num1, num2;

    if (op === OPERATIONS.MULTIPLY) {
      // Adaptive learning: 45% chance to draw from weak facts if available
      if (weakFacts && weakFacts.length > 0 && Math.random() < 0.45) {
        let pool = weakFacts;
        if (customTables && customTables.length > 0) {
          const filtered = weakFacts.filter(f => customTables.includes(f.num1) || customTables.includes(f.num2));
          if (filtered.length > 0) pool = filtered;
        }
        const picked = pool[Math.floor(Math.random() * pool.length)];
        if (Math.random() < 0.5) {
          num1 = picked.num1;
          num2 = picked.num2;
        } else {
          num1 = picked.num2;
          num2 = picked.num1;
        }
        return { num1, num2 };
      }

      if (customTables && customTables.length > 0) {
        num1 = customTables[Math.floor(Math.random() * customTables.length)];
        const maxFactor = difficulty === 'hard' ? 15 : 12;
        num2 = getRandomInt(1, maxFactor);
      } else {
        switch (difficulty) {
          case 'easy':
            num1 = getRandomInt(1, 5);
            num2 = getRandomInt(1, 10);
            break;
          case 'hard':
            if (Math.random() < 0.5) {
              num1 = getRandomInt(11, 20);
              num2 = getRandomInt(2, 10);
            } else {
              num1 = getRandomInt(6, 15);
              num2 = getRandomInt(6, 15);
            }
            break;
          case 'medium':
          default:
            num1 = getRandomInt(2, 12);
            num2 = getRandomInt(2, 12);
            break;
        }
      }
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
      default:
        return 0;
    }
  }

  function generateDistractors(answer, op, num1, num2) {
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
      const delta = getRandomInt(1, 5) * (Math.random() < 0.5 ? -1 : 1);
      const val = answer + delta;
      if (val > 0 && val !== answer && !valid.includes(val)) {
        valid.push(val);
      }
    }

    const chosen = shuffle(valid).slice(0, 3);
    return shuffle([answer, ...chosen]);
  }

  function generateHint(op, num1, num2, answer) {
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
      return `${num1} groups of ${num2} equals ${answer}`;
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
    let resolvedOp = resolveOperation(operation);
    let num1, num2, answer, key;
    let attempts = 0;

    do {
      const nums = generateNumbers(resolvedOp, difficulty, customTables, weakFacts);
      num1 = nums.num1;
      num2 = nums.num2;
      answer = calculateAnswer(resolvedOp, num1, num2);
      key = `${num1}${resolvedOp}${num2}`;
      attempts++;
    } while (recentHistory.includes(key) && attempts < 15);

    recentHistory.push(key);
    if (recentHistory.length > MAX_HISTORY) {
      recentHistory.shift();
    }

    const symbol = SYMBOLS[resolvedOp];
    const options = generateDistractors(answer, resolvedOp, num1, num2);
    const hint = generateHint(resolvedOp, num1, num2, answer);
    const visualArray = resolvedOp === OPERATIONS.MULTIPLY ? generateVisualArray(num1, num2) : null;

    return {
      id: 'prob_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      operation: resolvedOp,
      symbol,
      num1,
      num2,
      answer,
      equation: `${num1} ${symbol} ${num2}`,
      options,
      hint,
      visualArray,
    };
  }

  function generateDeck({ operation = OPERATIONS.MULTIPLY, difficulty = 'medium', customTables = [], weakFacts = [], count = 15 }) {
    const deck = [];
    for (let i = 0; i < count; i++) {
      deck.push(generateProblem({ operation, difficulty, customTables, weakFacts }));
    }
    return deck;
  }

  function getBoss(bossIdOrIndex) {
    if (typeof bossIdOrIndex === 'number') {
      return BOSSES[bossIdOrIndex % BOSSES.length];
    }
    return BOSSES.find(b => b.id === bossIdOrIndex) || BOSSES[0];
  }

  return {
    OPERATIONS,
    SYMBOLS,
    BOSSES,
    getBoss,
    generateProblem,
    generateDeck,
    generateVisualArray,
    calculateAnswer,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathEngine;
}
