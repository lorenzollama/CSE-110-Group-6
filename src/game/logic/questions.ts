import type { Topic } from "../../types";

/**
 * One problem shown on a scrap, e.g. prompt "6 × 7", answer "42",
 * or prompt "12/18" (simplify it), answer "2/3".
 * The answer is text so it can hold a fraction.
 */
export interface Question {
  prompt: string;
  answer: string;
  explanation: string; // shown in the wrong-answer popup
}

/**
 * The smallest and biggest factor a question can use, e.g. 2 and 5 makes "4 × 5" but
 * never "8 × 9". Factors always stay within 2-9 (times tables an elementary schooler knows;
 * 1 is left out because "1 × 7" is too easy to practice anything).
 */
export interface FactorRange {
  min: number;
  max: number;
}

const MIN_FACTOR = 2;
const MAX_FACTOR = 9;
/** Every factor from 2 to 9. Questions use this when no level is given. */
export const FULL_RANGE: FactorRange = { min: MIN_FACTOR, max: MAX_FACTOR };

/**
 * The factors a level uses: the numbers get bigger as the levels go up.
 * Level 1 uses 2-5, and each level adds one more until level 5 uses 2-9.
 * After that the small, easy factors drop out: level 6 uses 3-9, up to 6-9 at level 9 and 10.
 */
export function factorRangeForLevel(level: number): FactorRange {
  return {
    min: Math.min(Math.max(level - 3, MIN_FACTOR), 6),
    max: Math.min(level + 4, MAX_FACTOR),
  };
}

function randomFactor(range: FactorRange, rng: () => number): number {
  return randomInt(range.min, range.max, rng);
}

/** A whole number from min to max, both included. */
function randomInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Makes a random multiplication question. Pass a fixed rng in tests. */
export function makeQuestion(rng: () => number = Math.random, range: FactorRange = FULL_RANGE): Question {
  const a = randomFactor(range, rng);
  const b = randomFactor(range, rng);
  return {
    prompt: `${a} × ${b}`,
    answer: String(a * b),
    explanation: `${a} × ${b} means ${a} groups of ${b}, which makes ${a * b}.`,
  };
}

/**
 * Makes a division question with a whole-number answer, e.g. "42 ÷ 6" = 7.
 * It's built backwards from a multiplication fact, so it always divides evenly.
 */
export function makeDivisionQuestion(rng: () => number = Math.random, range: FactorRange = FULL_RANGE): Question {
  const divisor = randomFactor(range, rng);
  const quotient = randomFactor(range, rng);
  const dividend = divisor * quotient;
  return {
    prompt: `${dividend} ÷ ${divisor}`,
    answer: String(quotient),
    explanation: `${divisor} × ${quotient} = ${dividend}, so ${dividend} ÷ ${divisor} = ${quotient}.`,
  };
}

/**
 * Makes a fraction-simplifying question where the player types the whole
 * simplified fraction, e.g. prompt "12/18", answer "2/3".
 * It picks a fraction already in lowest terms (2/3), then multiplies the top
 * and bottom by the same number (6) to get the fraction to simplify (12/18).
 * The range sets the common factor and the biggest denominator; the denominator
 * can always be as small as 2, so halves stay possible at every level.
 */
export function makeSimplificationQuestion(rng: () => number = Math.random, range: FactorRange = FULL_RANGE): Question {
  const denominator = randomInt(2, range.max, rng);
  const numerators: number[] = [];
  for (let n = 1; n < denominator; n++) {
    if (gcd(n, denominator) === 1) numerators.push(n);
  }
  const numerator = numerators[Math.floor(rng() * numerators.length)];
  const common = randomFactor(range, rng); // the greatest common factor of the big fraction
  const top = numerator * common;
  const bottom = denominator * common;
  return {
    prompt: `${top}/${bottom}`,
    answer: `${numerator}/${denominator}`,
    explanation:
      `${top} and ${bottom} share a factor of ${common}. ` +
      `${top} ÷ ${common} = ${numerator} and ${bottom} ÷ ${common} = ${denominator}, ` +
      `so ${top}/${bottom} = ${numerator}/${denominator}.`,
  };
}

/**
 * Makes a random question for the topic picked on the topic select screen, using the
 * factors in `range` (see factorRangeForLevel).
 */
export function makeQuestionForTopic(
  topic: Topic, rng: () => number = Math.random, range: FactorRange = FULL_RANGE,
): Question {
  switch (topic) {
    case "multiplication":
      return makeQuestion(rng, range);
    case "division":
      return makeDivisionQuestion(rng, range);
    case "simplification":
      return makeSimplificationQuestion(rng, range);
  }
}

/**
 * True if the typed text is the right answer to the question.
 * Spaces and leading zeros don't matter ("07" = "7", "2 / 3" = "2/3"),
 * but a fraction must be fully simplified ("4/6" is not "2/3").
 */
export function isCorrect(question: Question, typed: string): boolean {
  return normalize(typed) === normalize(question.answer);
}

function normalize(answer: string): string {
  return answer
    .replace(/\s/g, '')
    .split('/')
    .map(part => (/^\d+$/.test(part) ? String(Number(part)) : part))
    .join('/');
}
