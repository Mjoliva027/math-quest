/**
 * Lightweight Automated Test Runner for Math Quest
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function describe(suiteName, fn) {
  console.log(`\n\x1b[1m\x1b[36m▶ ${suiteName}\x1b[0m`);
  try {
    fn();
  } catch (err) {
    console.error(`\x1b[31m  Suite Execution Failed: ${err.message}\x1b[0m`);
  }
}

function it(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  \x1b[32m✔\x1b[0m ${testName}`);
  } catch (err) {
    failedTests++;
    console.log(`  \x1b[31m✘\x1b[0m ${testName}`);
    console.error(`    \x1b[31mError:\x1b[0m ${err.message}`);
    if (err.stack) {
      const relevantStack = err.stack.split('\n').slice(1, 3).join('\n');
      console.error(`    \x1b[90m${relevantStack}\x1b[0m`);
    }
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const e = JSON.stringify(expected);
      if (a !== e) {
        throw new Error(`Expected ${e} but got ${a}`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy value but got ${actual}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy value but got ${actual}`);
    },
    toBeGreaterThan(num) {
      if (actual <= num) throw new Error(`Expected ${actual} > ${num}`);
    },
    toBeGreaterThanOrEqual(num) {
      if (actual < num) throw new Error(`Expected ${actual} >= ${num}`);
    },
    toBeLessThanOrEqual(num) {
      if (actual > num) throw new Error(`Expected ${actual} <= ${num}`);
    },
    toContain(item) {
      if (!actual.includes(item)) {
        throw new Error(`Expected collection to contain ${JSON.stringify(item)}`);
      }
    },
    toThrow() {
      let threw = false;
      try {
        actual();
      } catch (e) {
        threw = true;
      }
      if (!threw) throw new Error(`Expected function to throw, but it did not`);
    }
  };
}

global.describe = describe;
global.it = it;
global.expect = expect;

// Mock localStorage for Node environment
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

console.log(`\x1b[1m\x1b[35m=== Math Quest Automated Test Suite ===\x1b[0m`);
const startTime = Date.now();

// Load Test Suites
require('./math-engine.test.js');
require('./storage.test.js');

const duration = Date.now() - startTime;
console.log(`\n\x1b[1m----------------------------------------\x1b[0m`);
console.log(`Total: ${totalTests} | Passed: \x1b[32m${passedTests}\x1b[0m | Failed: \x1b[31m${failedTests}\x1b[0m (${duration}ms)`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log(`\x1b[1m\x1b[32m🎉 All tests passed successfully!\x1b[0m\n`);
  process.exit(0);
}
