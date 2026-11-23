import { describe, expect, it } from 'vitest';
import {
  factorRangeForLevel,
  isCorrect,
  makeDivisionQuestion,
  makeQuestion,
  makeQuestionForTopic,
  makeSimplificationQuestion,
} from './questions';

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

describe('questions', () => {
  it('makes a multiplication question with the right answer', () => {
    const q = makeQuestion(() => 0); // fixed "random" source: smallest factors
    expect(q.prompt).toBe('2 × 2');
    expect(q.answer).toBe('4');
  });

  it('keeps factors between 2 and 9', () => {
    const q = makeQuestion(() => 0.999);
    expect(q.prompt).toBe('9 × 9');
    expect(q.answer).toBe('81');
  });

  it('explains how to get the answer', () => {
    const q = makeQuestion(() => 0);
    expect(q.explanation).toBe('2 × 2 means 2 groups of 2, which makes 4.');
  });
});

describe('division questions', () => {
  it('makes a division question with the right answer', () => {
    const q = makeDivisionQuestion(() => 0);
    expect(q.prompt).toBe('4 ÷ 2');
    expect(q.answer).toBe('2');
  });

  it('keeps the divisor and answer between 2 and 9', () => {
    const q = makeDivisionQuestion(() => 0.999);
    expect(q.prompt).toBe('81 ÷ 9');
    expect(q.answer).toBe('9');
  });

  it('explains the answer with the matching multiplication fact', () => {
    const q = makeDivisionQuestion(() => 0);
    expect(q.explanation).toBe('2 × 2 = 4, so 4 ÷ 2 = 2.');
  });

  it('always divides evenly', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeDivisionQuestion();
      const [dividend, divisor] = q.prompt.split(' ÷ ').map(Number);
      expect(String(dividend / divisor)).toBe(q.answer);
      expect(q.answer).toMatch(/^\d+$/);
    }
  });
});

describe('simplification questions', () => {
  it('asks for the whole simplified fraction', () => {
    const q = makeSimplificationQuestion(() => 0);
    expect(q.prompt).toBe('2/4');
    expect(q.answer).toBe('1/2');
  });

  it('uses fractions up to ninths and common factors up to 9', () => {
    const q = makeSimplificationQuestion(() => 0.999);
    expect(q.prompt).toBe('72/81');
    expect(q.answer).toBe('8/9');
  });

  it('explains the common factor', () => {
    const q = makeSimplificationQuestion(() => 0);
    expect(q.explanation).toBe(
      '2 and 4 share a factor of 2. 2 ÷ 2 = 1 and 4 ÷ 2 = 2, so 2/4 = 1/2.',
    );
  });

  it('always gives an equal fraction in lowest terms', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeSimplificationQuestion();
      const [top, bottom] = q.prompt.split('/').map(Number);
      const [numerator, denominator] = q.answer.split('/').map(Number);
      expect(numerator * bottom).toBe(top * denominator); // same value
      expect(gcd(numerator, denominator)).toBe(1); // fully simplified
      expect(top).toBeGreaterThan(numerator); // there was something to simplify
    }
  });
});

describe('makeQuestionForTopic', () => {
  it('makes the right kind of question for each topic', () => {
    expect(makeQuestionForTopic('multiplication', () => 0).prompt).toBe('2 × 2');
    expect(makeQuestionForTopic('division', () => 0).prompt).toBe('4 ÷ 2');
    expect(makeQuestionForTopic('simplification', () => 0).prompt).toBe('2/4');
  });
});

describe('isCorrect', () => {
  const q = { prompt: '6 × 7', answer: '42', explanation: '6 × 7 means 6 groups of 7, which makes 42.' };
  it('accepts the right answer', () => expect(isCorrect(q, '42')).toBe(true));
  it('rejects a wrong answer', () => expect(isCorrect(q, '41')).toBe(false));
  it('ignores leading zeros', () => expect(isCorrect(q, '042')).toBe(true));

  const fraction = { prompt: '12/18', answer: '2/3', explanation: '' };
  it('accepts the simplified fraction', () => expect(isCorrect(fraction, '2/3')).toBe(true));
  it('ignores spaces in a fraction', () => expect(isCorrect(fraction, '2 / 3')).toBe(true));
  it('rejects an equal fraction that is not fully simplified', () =>
    expect(isCorrect(fraction, '4/6')).toBe(false));
  it('rejects half a fraction', () => {
    expect(isCorrect(fraction, '2')).toBe(false);
    expect(isCorrect(fraction, '2/')).toBe(false);
  });
});

describe('factorRangeForLevel', () => {
  it('starts level 1 with small factors', () => {
    expect(factorRangeForLevel(1)).toEqual({ min: 2, max: 5 });
  });

  it('uses bigger numbers as the levels go up', () => {
    for (let level = 2; level <= 10; level++) {
      const now = factorRangeForLevel(level);
      const before = factorRangeForLevel(level - 1);
      expect(now.min).toBeGreaterThanOrEqual(before.min);
      expect(now.max).toBeGreaterThanOrEqual(before.max);
      expect(now.min + now.max).toBeGreaterThanOrEqual(before.min + before.max);
    }
    expect(factorRangeForLevel(10)).toEqual({ min: 6, max: 9 });
  });

  it('always stays within 2-9 and leaves at least four factors to pick from', () => {
    for (let level = 1; level <= 10; level++) {
      const { min, max } = factorRangeForLevel(level);
      expect(min).toBeGreaterThanOrEqual(2);
      expect(max).toBeLessThanOrEqual(9);
      expect(max - min).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps every topic\'s numbers in the level\'s range', () => {
    const range = factorRangeForLevel(1); // 2-5
    for (let i = 0; i < 200; i++) {
      const [a, b] = makeQuestion(Math.random, range).prompt.split(' × ').map(Number);
      expect([a, b].every(n => n >= 2 && n <= 5)).toBe(true);
      const division = makeDivisionQuestion(Math.random, range);
      const divisor = Number(division.prompt.split(' ÷ ')[1]);
      expect(divisor).toBeLessThanOrEqual(5);
      expect(Number(division.answer)).toBeLessThanOrEqual(5);
      const denominator = Number(makeSimplificationQuestion(Math.random, range).answer.split('/')[1]);
      expect(denominator).toBeLessThanOrEqual(5);
    }
  });
});
