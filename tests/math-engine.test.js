/**
 * Unit Tests for MathEngine
 */

const MathEngine = require('../js/math-engine.js');

describe('MathEngine - Core Arithmetic & Problem Generation', () => {
  it('correctly calculates answers for all operations', () => {
    expect(MathEngine.calculateAnswer('multiply', 7, 8)).toBe(56);
    expect(MathEngine.calculateAnswer('add', 15, 27)).toBe(42);
    expect(MathEngine.calculateAnswer('subtract', 50, 18)).toBe(32);
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

  it('returns valid RPG boss battle profiles', () => {
    const boss0 = MathEngine.getBoss(0);
    expect(boss0.name).toBe('Goblin Multiplier');
    expect(boss0.tier).toBe(1);
    expect(boss0.maxHp).toBe(100);

    const boss1 = MathEngine.getBoss('golem');
    expect(boss1.name).toBe('Iron Math Golem');
    expect(boss1.tier).toBe(2);

    const boss2 = MathEngine.getBoss(2);
    expect(boss2.name).toBe('Calculus Hydra');
    expect(boss2.tier).toBe(3);
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
});
