import { isCorrect, makeQuestion, type Question } from './logic/questions';

// Number of fixed spots where scraps sit (positions live in the view).
export const SLOT_COUNT = 4;
export const MAX_HEALTH = 3;
// Long enough for a typed fraction like "12/18".
const MAX_ANSWER_LENGTH = 5;
// PLACEHOLDER: Every submitted answer counts, right or wrong. The game ends after this many.
export const QUESTIONS_PER_GAME = 10;

export interface Scrap {
  question: Question;
  slot: number;
}

export type SubmitResult =
  | { type: 'ignored' }
  | { type: 'incorrect'; target: Scrap; answer: string }
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
  private health = MAX_HEALTH;

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

  /**How many hits the player can still take. */
  getHealth(): number {
	return this.health;
  }

  loseHealth(): void{

  this.health = Math.max(0, this.health - 1);
  }
  /** Percent of answers that were right, 0-100. */
  getAccuracy(): number {
    return this.answered === 0 ? 0 : Math.round((this.correct / this.answered) * 100);
  }

  isOver(): boolean {
    return this.answered >= QUESTIONS_PER_GAME;
  }

  /** Adds a digit or "/" (for fractions) to the answer being typed. */
  typeKey(key: string): void {
    if (!/^[0-9/]$/.test(key)) return;
    if (this.typed.length < MAX_ANSWER_LENGTH) this.typed += key;
  }

  backspace(): void {
    this.typed = this.typed.slice(0, -1);
  }

  submit(): SubmitResult {
    if (this.typed === '' || this.isOver()) return { type: 'ignored' };
    const value = this.typed;
    this.typed = '';
    this.answered++;

    const target = this.scraps[0];
    if (isCorrect(target.question, value)) {
      this.correct++;
      this.scraps.shift();
      const spawned = this.spawnScrap(target.slot); // the new scrap goes to the back of the line
      return { type: 'correct', hit: target, spawned };
    }
	this.loseHealth();
    return { type: 'incorrect', target, answer: value };
  }

  private spawnScrap(slot: number): Scrap {
    const scrap = { question: makeQuestion(), slot };
    this.scraps.push(scrap);
    return scrap;
  }
}
