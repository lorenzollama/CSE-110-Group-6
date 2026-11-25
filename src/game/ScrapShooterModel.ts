import type { Topic } from '../types';
import { isCorrect, makeQuestionForTopic, type Question } from './logic/questions';
import { TOTAL_WAVES, waveSettings, type WaveSettings } from './logic/waves';

export const LANE_COUNT = 5;
export const MAX_HEALTH = 3;
/** Screen y where a new scrap appears. */
export const SPAWN_Y = 90;
/** Screen y of a scrap's center when it hits the front line. It is then gone and costs 1 health. */
export const FRONT_LINE_Y = 400;
// A lane can take a new scrap only after its last one has fallen this far.
const SPAWN_CLEARANCE = 100;
// Pause between one wave ending and the next one starting.
const WAVE_BREAK_SECONDS = 2;
// Long enough for a typed fraction like "12/18".
const MAX_ANSWER_LENGTH = 5;

export interface Scrap {
  id: number;
  question: Question;
  lane: number; // which column it falls down (the view decides where that is)
  nudge: number; // -1 to 1: how far left or right of its column's center it sits, so the columns don't look too neat
  y: number; // screen y, grows as it falls
}

export type SubmitResult =
  | { type: 'ignored' }
  | { type: 'incorrect'; target: Scrap; answer: string }
  | { type: 'correct'; hit: Scrap };

/** What changed during one tick, so the controller can tell the view. */
export interface TickResult {
  spawned: Scrap[];
  missed: Scrap[]; // scraps that reached the front line
  newWave: number | null; // the wave number if a new wave was reached, otherwise null
}

/**
 * Game state only. Scraps fall down the lanes in waves and the player shoots them by typing
 * the answer. The target is always the lowest scrap, the one closest to the front line.
 * Health only drops when a scrap reaches the front line, never for a wrong answer.
 *
 * Time moves only when tick() is called, so tests can run a whole level in a few lines.
 */
export class ScrapShooterModel {
  private scraps: Scrap[] = [];
  private typed = '';
  private correct = 0;
  // Accuracy counts each scrap once, by its first answer (see getAccuracy).
  private judged = 0; // scraps that got a first answer or were missed without one
  private rightFirstTry = 0; // scraps whose first answer was right
  private tried = new Set<number>(); // ids of scraps on screen that already had a wrong answer
  private health = MAX_HEALTH;
  private wave = 1;
  private settings: WaveSettings;
  private toSpawn = 0; // scraps this wave still has to send
  private spawnIn = 0; // seconds until the next one
  private breakLeft = 0; // seconds left before the next wave starts
  private nextId = 1;

  constructor(
    private topic: Topic = 'multiplication',
    private level = 1,
    private rng: () => number = Math.random,
  ) {
    this.settings = waveSettings(level, this.wave);
    this.startWave();
    this.spawnNext(); // so the player has something to shoot right away
  }

  getScraps(): Scrap[] {
    return this.scraps;
  }

  /** The scrap closest to the front line, or null when none are on screen. */
  getTarget(): Scrap | null {
    let target: Scrap | null = null;
    for (const scrap of this.scraps) {
      if (target === null || scrap.y > target.y) target = scrap;
    }
    return target;
  }

  getTyped(): string {
    return this.typed;
  }

  /** Number of correct answers. */
  getScore(): number {
    return this.correct;
  }

  /** How many scraps can still reach the front line before the game is lost. */
  getHealth(): number {
    return this.health;
  }

  loseHealth(): void {
    this.health = Math.max(0, this.health - 1);
  }

  /** The wave being played, starting at 1. */
  getWave(): number {
    return this.wave;
  }

  /**
   * Percent of scraps answered right on the first try, 0-100. Each scrap counts once:
   * wrong then right is 0 of 1, and a scrap that reaches the front line without an answer
   * counts as wrong too. (The score still counts every scrap shot, retries included.)
   */
  getAccuracy(): number {
    return this.judged === 0 ? 0 : Math.round((this.rightFirstTry / this.judged) * 100);
  }

  /** True when the last wave is cleared. */
  isOver(): boolean {
    return this.wave >= TOTAL_WAVES && this.waveCleared();
  }

  isLost(): boolean {
    return this.health === 0;
  }

  /** Adds a digit or "/" (for fractions) to the answer being typed. */
  typeKey(key: string): void {
    if (!/^[0-9/]$/.test(key)) return;
    if (this.typed.length < MAX_ANSWER_LENGTH) this.typed += key;
  }

  backspace(): void {
    this.typed = this.typed.slice(0, -1);
  }

  /** Checks the typed answer against the target. A right answer removes that scrap. */
  submit(): SubmitResult {
    const target = this.getTarget();
    if (this.typed === '' || target === null || this.isOver() || this.isLost()) {
      return { type: 'ignored' };
    }
    const value = this.typed;
    this.typed = '';
    const right = isCorrect(target.question, value);
    const firstTry = !this.tried.has(target.id);
    if (firstTry) {
      this.judged++;
      if (right) this.rightFirstTry++;
    }

    if (right) {
      this.correct++;
      this.tried.delete(target.id);
      this.scraps = this.scraps.filter(scrap => scrap !== target);
      return { type: 'correct', hit: target };
    }
    this.tried.add(target.id);
    return { type: 'incorrect', target, answer: value };
  }

  /**
   * Moves time forward: scraps fall, scraps at the front line cost health, new scraps appear,
   * and the next wave starts once the current one is cleared. Call it with small steps.
   */
  tick(seconds: number): TickResult {
    const result: TickResult = { spawned: [], missed: [], newWave: null };
    if (this.isOver() || this.isLost()) return result;

    this.fall(seconds, result);
    this.advanceWave(seconds, result);
    return result;
  }

  // -------------------------------------------------------------- private

  private fall(seconds: number, result: TickResult): void {
    for (const scrap of this.scraps) scrap.y += this.settings.speed * seconds;

    result.missed = this.scraps.filter(scrap => scrap.y >= FRONT_LINE_Y);
    this.scraps = this.scraps.filter(scrap => scrap.y < FRONT_LINE_Y);
    for (const scrap of result.missed) {
      this.loseHealth();
      // A miss counts as wrong, unless the scrap already counted as wrong for its first answer.
      if (!this.tried.delete(scrap.id)) this.judged++;
    }
  }

  private advanceWave(seconds: number, result: TickResult): void {
    if (this.breakLeft > 0) {
      this.breakLeft -= seconds;
      if (this.breakLeft <= 0) {
        this.breakLeft = 0;
        this.startWave();
        this.spawnNext(result);
      }
    } else if (this.waveCleared()) {
      this.wave++;
      this.breakLeft = WAVE_BREAK_SECONDS;
      result.newWave = this.wave;
    } else if (this.toSpawn > 0) {
      this.spawnIn -= seconds;
      if (this.spawnIn <= 0) this.spawnNext(result);
    }
  }

  /** The wave has sent all its scraps and none are left on screen. */
  private waveCleared(): boolean {
    return this.breakLeft <= 0 && this.toSpawn === 0 && this.scraps.length === 0;
  }

  private startWave(): void {
    this.settings = waveSettings(this.level, this.wave);
    this.toSpawn = this.settings.count;
    this.spawnIn = 0;
  }

  /** Sends one scrap down a free lane. If no lane is free it tries again on the next tick. */
  private spawnNext(result?: TickResult): void {
    const freeLanes: number[] = [];
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const blocked = this.scraps.some(s => s.lane === lane && s.y < SPAWN_Y + SPAWN_CLEARANCE);
      if (!blocked) freeLanes.push(lane);
    }
    if (freeLanes.length === 0) return;

    const scrap: Scrap = {
      id: this.nextId++,
      question: makeQuestionForTopic(this.topic, this.rng, this.level),
      lane: freeLanes[Math.floor(this.rng() * freeLanes.length)],
      nudge: this.rng() * 2 - 1,
      y: SPAWN_Y,
    };
    this.scraps.push(scrap);
    this.toSpawn--;
    this.spawnIn = this.settings.interval;
    result?.spawned.push(scrap);
  }
}
