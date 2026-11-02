import { describe, expect, it } from 'vitest';
import { isCorrect, makeQuestion } from './questions';

describe('questions', () => {
  it('makes a multiplication question with the right answer', () => {
    const q = makeQuestion(() => 0); // fixed "random" source: smallest factors
    expect(q.prompt).toBe('2 × 2');
    expect(q.answer).toBe(4);
  });

  it('keeps factors between 2 and 9', () => {
    const q = makeQuestion(() => 0.999);
    expect(q.prompt).toBe('9 × 9');
    expect(q.answer).toBe(81);
  });

  it('explains how to get the answer', () => {
    const q = makeQuestion(() => 0);
    expect(q.explanation).toBe('2 × 2 means 2 groups of 2, which makes 4.');
  });
});

describe('isCorrect', () => {
  const q = { prompt: '6 × 7', answer: 42, explanation: '6 × 7 means 6 groups of 7, which makes 42.' };
  it('accepts the right answer', () => expect(isCorrect(q, 42)).toBe(true));
  it('rejects a wrong answer', () => expect(isCorrect(q, 41)).toBe(false));
});
