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

const MIN_FACTOR = 2;
const MAX_FACTOR = 9;

function randomFactor(rng: () => number): number {
  return randomInt(MIN_FACTOR, MAX_FACTOR, rng);
}

/** A whole number from min to max, both included. */
function randomInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Makes a random multiplication question. Pass a fixed rng in tests. */
export function makeQuestion(rng: () => number = Math.random): Question {
  const a = randomFactor(rng);
  const b = randomFactor(rng);
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
export function makeDivisionQuestion(rng: () => number = Math.random): Question {
  const divisor = randomFactor(rng);
  const quotient = randomFactor(rng);
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
 */
export function makeSimplificationQuestion(rng: () => number = Math.random): Question {
  const denominator = randomInt(2, MAX_FACTOR, rng);
  const numerators: number[] = [];
  for (let n = 1; n < denominator; n++) {
    if (gcd(n, denominator) === 1) numerators.push(n);
  }
  const numerator = numerators[Math.floor(rng() * numerators.length)];
  const common = randomFactor(rng); // the greatest common factor of the big fraction
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

/** Makes a random question for the topic picked on the topic select screen. */
export function makeQuestionForTopic(topic: Topic, rng: () => number = Math.random): Question {
  switch (topic) {
    case "multiplication":
      return makeQuestion(rng);
    case "division":
      return makeDivisionQuestion(rng);
    case "simplification":
      return makeSimplificationQuestion(rng);
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
