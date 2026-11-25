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

/**
 * How hard a level's simplify questions are. The answer's denominator goes up to
 * `maxDenominator` and the factor the player divides out goes up to `maxCommon`; both start
 * at 2. Simplifying gets hard fast because the two multiply (4/5 with a common factor of 5 is
 * already 20/25), so this grows more slowly than the times-table range.
 */
export interface SimplifyRange {
  maxDenominator: number;
  maxCommon: number;
}

/** Every simplify question possible: up to ninths, with a common factor up to 9 (e.g. 72/81). */
export const FULL_SIMPLIFY_RANGE: SimplifyRange = { maxDenominator: 9, maxCommon: 9 };

// One row per level, level 1 first. Levels 1-2 only halve (2/4, 6/8, 8/10), then dividing by
// 3, 4 and so on comes in one step at a time. The smallest common factor stays 2 at every
// level, so the easy halving questions keep turning up between the harder ones. The biggest
// prompt is 6/8 at level 1, 12/15 at level 3, 30/35 at level 7 and 48/54 at level 10.
const SIMPLIFY_LEVELS: SimplifyRange[] = [
  { maxDenominator: 4, maxCommon: 2 },
  { maxDenominator: 5, maxCommon: 2 },
  { maxDenominator: 5, maxCommon: 3 },
  { maxDenominator: 6, maxCommon: 3 },
  { maxDenominator: 6, maxCommon: 4 },
  { maxDenominator: 7, maxCommon: 4 },
  { maxDenominator: 7, maxCommon: 5 },
  { maxDenominator: 8, maxCommon: 5 },
  { maxDenominator: 9, maxCommon: 5 },
  { maxDenominator: 9, maxCommon: 6 },
];

/** The simplify questions a level uses (see SIMPLIFY_LEVELS). Levels past the table use its last row. */
export function simplifyRangeForLevel(level: number): SimplifyRange {
  const row = Math.min(Math.max(level, 1), SIMPLIFY_LEVELS.length) - 1;
  return SIMPLIFY_LEVELS[row];
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
 * The range sets the biggest denominator and common factor (see simplifyRangeForLevel);
 * both can always be as small as 2, so halves stay possible at every level.
 */
export function makeSimplificationQuestion(
  rng: () => number = Math.random, range: SimplifyRange = FULL_SIMPLIFY_RANGE,
): Question {
  const denominator = randomInt(2, range.maxDenominator, rng);
  const numerators: number[] = [];
  for (let n = 1; n < denominator; n++) {
    if (gcd(n, denominator) === 1) numerators.push(n);
  }
  const numerator = numerators[Math.floor(rng() * numerators.length)];
  const common = randomInt(2, range.maxCommon, rng); // the greatest common factor of the big fraction
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
 * Makes a random question for the topic picked on the topic select screen, as hard as
 * `level` calls for (see factorRangeForLevel and simplifyRangeForLevel). With no level,
 * any question the topic can make.
 */
export function makeQuestionForTopic(topic: Topic, rng: () => number = Math.random, level?: number): Question {
  const factors = level === undefined ? FULL_RANGE : factorRangeForLevel(level);
  switch (topic) {
    case "multiplication":
      return makeQuestion(rng, factors);
    case "division":
      return makeDivisionQuestion(rng, factors);
    case "simplification":
      return makeSimplificationQuestion(rng, level === undefined ? FULL_SIMPLIFY_RANGE : simplifyRangeForLevel(level));
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
