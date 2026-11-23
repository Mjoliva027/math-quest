/**
 * Unit Tests for MathEngine
 */

const MathEngine = require('../js/math-engine.js');

describe('MathEngine - Core Arithmetic & Problem Generation', () => {
  it('correctly calculates answers for all operations', () => {
    expect(MathEngine.calculateAnswer('multiply', 7, 8)).toBe(56);
    expect(MathEngine.calculateAnswer('add', 15, 27)).toBe(42);
    expect(MathEngine.calculateAnswer('subtract', 50, 18)).toBe(32);
    expect(MathEngine.calculateAnswer('divide', 56, 8)).toBe(7);
    expect(MathEngine.calculateAnswer('missing', 7, 56)).toBe(8);
  });

  it('generates valid multiplication problems within custom tables', () => {
    const customTables = [3, 7];
    for (let i = 0; i < 30; i++) {
      const prob = MathEngine.generateProblem({
        operation: 'multiply',
        difficulty: 'medium',
        customTables,
      });
      expect(prob.operation).toBe('multiply');
      expect(prob.symbol).toBe('×');
      expect(customTables).toContain(prob.num1);
      expect(prob.answer).toBe(prob.num1 * prob.num2);
      expect(prob.options.length).toBe(4);
      expect(prob.options).toContain(prob.answer);

      // Verify options are unique
      const uniqueOptions = new Set(prob.options);
      expect(uniqueOptions.size).toBe(4);
    }
  });

  it('generates non-negative subtraction problems', () => {
    for (let i = 0; i < 20; i++) {
      const prob = MathEngine.generateProblem({
        operation: 'subtract',
        difficulty: 'easy',
      });
      expect(prob.answer).toBeGreaterThanOrEqual(0);
      expect(prob.num1).toBeGreaterThanOrEqual(prob.num2);
      expect(prob.options).toContain(prob.answer);
    }
  });

  it('generates visual area array models for multiplication facts', () => {
    const visual = MathEngine.generateVisualArray(4, 6);
    expect(visual.rows).toBe(4);
    expect(visual.cols).toBe(6);
    expect(visual.total).toBe(24);
    expect(visual.isScaled).toBe(false);

    const largeVisual = MathEngine.generateVisualArray(15, 14);
    expect(largeVisual.rows).toBe(12);
    expect(largeVisual.cols).toBe(12);
    expect(largeVisual.total).toBe(210);
    expect(largeVisual.isScaled).toBe(true);
  });

  it('generates deterministic seeded decks for online PvP matches', () => {
    const ops = ['multiply', 'divide', 'missing', 'add', 'subtract', 'mixed'];
    ops.forEach(op => {
      const deck1 = MathEngine.generateSeededDeck({
        seed: `match_${op}_2026`,
        operation: op,
        difficulty: 'medium',
        count: 25,
      });
      const deck2 = MathEngine.generateSeededDeck({
        seed: `match_${op}_2026`,
        operation: op,
        difficulty: 'medium',
        count: 25,
      });
      const deckOther = MathEngine.generateSeededDeck({
        seed: `match_${op}_other`,
        operation: op,
        difficulty: 'medium',
        count: 25,
      });

      expect(deck1.length).toBe(25);
      expect(deck1.map(p => p.equation)).toEqual(deck2.map(p => p.equation));
      expect(deck1.map(p => p.answer)).toEqual(deck2.map(p => p.answer));
      expect(deck1.map(p => p.options)).toEqual(deck2.map(p => p.options));
      expect(JSON.stringify(deck1.map(p => p.equation)) === JSON.stringify(deckOther.map(p => p.equation))).toBe(false);

      deck1.forEach(prob => {
        expect(prob.options.length).toBe(4);
        expect(prob.options).toContain(prob.answer);
        expect(new Set(prob.options).size).toBe(4);
      });
    });
  });

  it('computes escalating Survival Gauntlet floor configurations', () => {
    const f0 = MathEngine.getSurvivalFloorConfig(0);
    expect(f0.floor).toBe(1);
    expect(f0.difficulty).toBe('easy');
    expect(f0.label).toBe('Warmup');
    expect(f0.timePerQuestion).toBe(15);
    expect(f0.scoreMultiplier).toBe(1);

    const f2 = MathEngine.getSurvivalFloorConfig(2);
    expect(f2.difficulty).toBe('medium');
    expect(f2.label).toBe('Rising');
    expect(f2.timePerQuestion).toBe(14);
    expect(f2.scoreMultiplier).toBe(1.25);

    const f4 = MathEngine.getSurvivalFloorConfig(4);
    expect(f4.difficulty).toBe('hard');
    expect(f4.label).toBe('Fierce');
    expect(f4.timePerQuestion).toBe(12);
    expect(f4.scoreMultiplier).toBe(1.75);

    const f12 = MathEngine.getSurvivalFloorConfig(12);
    expect(f12.difficulty).toBe('hard');
    expect(f12.label).toBe('Master');
    expect(f12.timePerQuestion).toBe(7);
    expect(f12.scoreMultiplier).toBe(3.75);
  });

  it('prioritizes weak facts adaptively when weakFacts pool is supplied', () => {
    const weakFacts = [
      { num1: 8, num2: 7 },
      { num1: 9, num2: 6 },
    ];

    let weakFactHitCount = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const prob = MathEngine.generateProblem({
        operation: 'multiply',
        difficulty: 'medium',
        weakFacts,
      });

      const isWeak = weakFacts.some(
        f => (prob.num1 === f.num1 && prob.num2 === f.num2) ||
             (prob.num1 === f.num2 && prob.num2 === f.num1)
      );

      if (isWeak) weakFactHitCount++;
    }

    // Out of 100 random problems with 2 weak facts in a pool of 144 facts,
    // adaptive weighting should hit weak facts noticeably more than pure random (1.4%)
    expect(weakFactHitCount).toBeGreaterThan(15);
  });

  it('generates clean integer division problems with custom tables and unique options', () => {
    const customTables = [4, 7];
    for (let i = 0; i < 30; i++) {
      const prob = MathEngine.generateProblem({
        operation: 'divide',
        difficulty: 'medium',
        customTables,
      });
      expect(prob.operation).toBe('divide');
      expect(prob.symbol).toBe('÷');
      expect(customTables).toContain(prob.num2);
      expect(Number.isInteger(prob.answer)).toBe(true);
      expect(prob.num1 / prob.num2).toBe(prob.answer);
      expect(prob.options.length).toBe(4);
      expect(prob.options).toContain(prob.answer);
      expect(new Set(prob.options).size).toBe(4);
      expect(Array.isArray(prob.matrixFactors)).toBe(true);
    }
  });

  it('generates valid mystery-factor problems with ? equation and unique options', () => {
    for (let i = 0; i < 30; i++) {
      const prob = MathEngine.generateProblem({
        operation: 'missing',
        difficulty: 'medium',
        customTables: [6, 8],
      });
      expect(prob.operation).toBe('missing');
      expect(prob.equation).toContain('?');
      expect(prob.equation).toContain('=');
      expect(prob.knownFactor * prob.answer).toBe(prob.product);
      expect(prob.options.length).toBe(4);
      expect(prob.options).toContain(prob.answer);
      expect(new Set(prob.options).size).toBe(4);
      expect(Array.isArray(prob.matrixFactors)).toBe(true);
    }
  });

  it('generates deterministic daily challenge decks for a given dateKey', () => {
    const deckA1 = MathEngine.generateDailyChallenge('2026-11-20', 15);
    const deckA2 = MathEngine.generateDailyChallenge('2026-11-20', 15);
    const deckB = MathEngine.generateDailyChallenge('2026-11-21', 15);

    expect(deckA1.length).toBe(15);
    expect(deckA2.length).toBe(15);
    expect(deckB.length).toBe(15);

    const equationsA1 = deckA1.map(p => p.equation);
    const equationsA2 = deckA2.map(p => p.equation);
    const answersA1 = deckA1.map(p => p.answer);
    const answersA2 = deckA2.map(p => p.answer);
    const optionsA1 = deckA1.map(p => p.options);
    const optionsA2 = deckA2.map(p => p.options);

    expect(equationsA1).toEqual(equationsA2);
    expect(answersA1).toEqual(answersA2);
    expect(optionsA1).toEqual(optionsA2);

    const equationsB = deckB.map(p => p.equation);
    expect(JSON.stringify(equationsA1) === JSON.stringify(equationsB)).toBe(false);

    // Every problem has 4 unique options containing answer, and no duplicate equations in deck
    expect(new Set(equationsA1).size).toBe(15);
    deckA1.forEach(prob => {
      expect(prob.options.length).toBe(4);
      expect(prob.options).toContain(prob.answer);
      expect(new Set(prob.options).size).toBe(4);
    });
  });
});
