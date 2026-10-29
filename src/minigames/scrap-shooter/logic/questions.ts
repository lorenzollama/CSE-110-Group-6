/** One problem shown on a scrap, e.g. prompt "6 × 7", answer 42. */
export interface Question {
  prompt: string;
  answer: number;
}

const MIN_FACTOR = 2;
const MAX_FACTOR = 9;

function randomFactor(rng: () => number): number {
  return MIN_FACTOR + Math.floor(rng() * (MAX_FACTOR - MIN_FACTOR + 1));
}

/** Makes a random multiplication question. Pass a fixed rng in tests. */
export function makeQuestion(rng: () => number = Math.random): Question {
  const a = randomFactor(rng);
  const b = randomFactor(rng);
  return { prompt: `${a} × ${b}`, answer: a * b };
}

/** True if the typed number is the right answer to the question. */
export function isCorrect(question: Question, typed: number): boolean {
  return question.answer === typed;
}
