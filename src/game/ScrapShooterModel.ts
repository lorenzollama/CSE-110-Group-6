import { isCorrect, makeQuestion, type Question } from './logic/questions';

// Number of fixed spots where scraps sit (positions live in the view).
export const SLOT_COUNT = 4;
const MAX_DIGITS = 3;
// PLACEHOLDER: Every submitted answer counts, right or wrong. The game ends after this many.
export const QUESTIONS_PER_GAME = 10;

export interface Scrap {
  question: Question;
  slot: number;
}

export type SubmitResult =
  | { type: 'ignored' }
  | { type: 'incorrect' }
  | { type: 'correct'; hit: Scrap; spawned: Scrap };

/**
 * Game state only. The scrap list order decides which one is the target:
 * the first one. Right answer: it is removed and a new scrap takes its slot
 * at the back of the line.
 */
export class ScrapShooterModel {
  private scraps: Scrap[] = [];
  private typed = '';
  private correct = 0;
  private answered = 0;

  constructor() {
    for (let slot = 0; slot < SLOT_COUNT; slot++) this.spawnScrap(slot);
  }

  getScraps(): Scrap[] {
    return this.scraps;
  }

  getTyped(): string {
    return this.typed;
  }

  /** Number of correct answers. */
  getScore(): number {
    return this.correct;
  }

  /** Percent of answers that were right, 0-100. */
  getAccuracy(): number {
    return this.answered === 0 ? 0 : Math.round((this.correct / this.answered) * 100);
  }

  isOver(): boolean {
    return this.answered >= QUESTIONS_PER_GAME;
  }

  typeDigit(digit: string): void {
    if (this.typed.length < MAX_DIGITS) this.typed += digit;
  }

  backspace(): void {
    this.typed = this.typed.slice(0, -1);
  }

  submit(): SubmitResult {
    if (this.typed === '' || this.isOver()) return { type: 'ignored' };
    const value = parseInt(this.typed, 10);
    this.typed = '';
    this.answered++;

    const target = this.scraps[0];
    if (isCorrect(target.question, value)) {
      this.correct++;
      this.scraps.shift();
      const spawned = this.spawnScrap(target.slot); // the new scrap goes to the back of the line
      return { type: 'correct', hit: target, spawned };
    }
    return { type: 'incorrect' };
  }

  private spawnScrap(slot: number): Scrap {
    const scrap = { question: makeQuestion(), slot };
    this.scraps.push(scrap);
    return scrap;
  }
}
