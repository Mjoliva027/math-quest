/**
 * Math Engine for Math Quest
 * Handles problem generation, difficulty scaling, distractors, and calculations.
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
      const ops = [OPERATIONS.MULTIPLY, OPERATIONS.ADD, OPERATIONS.SUBTRACT];
      // Bias slightly towards multiplication (50% mult, 25% add, 25% sub)
      const roll = Math.random();
      if (roll < 0.5) return OPERATIONS.MULTIPLY;
      if (roll < 0.75) return OPERATIONS.ADD;
      return OPERATIONS.SUBTRACT;
    }
    return requestedOp;
  }

  function generateNumbers(op, difficulty, customTables = []) {
    let num1, num2;

    if (op === OPERATIONS.MULTIPLY) {
      if (customTables && customTables.length > 0) {
        // Practice specific table(s) selected by the user
        num1 = customTables[Math.floor(Math.random() * customTables.length)];
        const maxFactor = difficulty === 'hard' ? 15 : 12;
        num2 = getRandomInt(1, maxFactor);
      } else {
        switch (difficulty) {
          case 'easy':
            // Tables 1 to 5
            num1 = getRandomInt(1, 5);
            num2 = getRandomInt(1, 10);
            break;
          case 'hard':
            // Tables 2 to 20, or larger combinations
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
            // Standard 1 to 12
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
      // Always guarantee num1 >= num2 so answer is positive
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
      // Typical multiplication mistakes: adjacent multiples, off by 1 on factor, off by 10
      candidates.add(num1 * Math.max(1, num2 - 1));
      candidates.add(num1 * (num2 + 1));
      candidates.add(Math.max(1, num1 - 1) * num2);
      candidates.add((num1 + 1) * num2);
      candidates.add(answer + 10);
      candidates.add(answer - 10);
      candidates.add(answer + 2);
      candidates.add(answer - 2);
      candidates.add(num1 + num2); // Kid accidentally added instead of multiplied
    } else if (op === OPERATIONS.ADD) {
      candidates.add(answer + 1);
      candidates.add(answer - 1);
      candidates.add(answer + 10);
      candidates.add(answer - 10);
      candidates.add(answer + 2);
      candidates.add(answer - 2);
      candidates.add(Math.abs(num1 - num2)); // Kid subtracted instead of added
    } else if (op === OPERATIONS.SUBTRACT) {
      candidates.add(answer + 1);
      candidates.add(answer - 1);
      candidates.add(answer + 10);
      candidates.add(answer - 10);
      candidates.add(answer + 2);
      candidates.add(answer - 2);
      candidates.add(num1 + num2); // Kid added instead of subtracted
    }

    // Filter candidates: must be positive, not equal to the correct answer
    const valid = Array.from(candidates).filter(n => Number.isInteger(n) && n > 0 && n !== answer);

    // If we don't have enough, generate close random offsets
    while (valid.length < 3) {
      const delta = getRandomInt(1, 5) * (Math.random() < 0.5 ? -1 : 1);
      const val = answer + delta;
      if (val > 0 && val !== answer && !valid.includes(val)) {
        valid.push(val);
      }
    }

    // Shuffle and pick 3
    const chosen = shuffle(valid).slice(0, 3);
    // Combine with answer and shuffle again
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

  function generateProblem({ operation = OPERATIONS.MULTIPLY, difficulty = 'medium', customTables = [] }) {
    let resolvedOp = resolveOperation(operation);
    let num1, num2, answer, key;
    let attempts = 0;

    // Avoid immediate duplicates
    do {
      const nums = generateNumbers(resolvedOp, difficulty, customTables);
      num1 = nums.num1;
      num2 = nums.num2;
      answer = calculateAnswer(resolvedOp, num1, num2);
      key = `${num1}${resolvedOp}${num2}`;
      attempts++;
    } while (recentHistory.includes(key) && attempts < 15);

    // Track in history
    recentHistory.push(key);
    if (recentHistory.length > MAX_HISTORY) {
      recentHistory.shift();
    }

    const symbol = SYMBOLS[resolvedOp];
    const options = generateDistractors(answer, resolvedOp, num1, num2);
    const hint = generateHint(resolvedOp, num1, num2, answer);

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
    };
  }

  // Pre-generate a deck of problems for flashcard mode
  function generateDeck({ operation = OPERATIONS.MULTIPLY, difficulty = 'medium', customTables = [], count = 15 }) {
    const deck = [];
    for (let i = 0; i < count; i++) {
      deck.push(generateProblem({ operation, difficulty, customTables }));
    }
    return deck;
  }

  return {
    OPERATIONS,
    SYMBOLS,
    generateProblem,
    generateDeck,
    calculateAnswer,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathEngine;
}
