import { describe, expect, it } from 'vitest';
import { FRONT_LINE_Y, MAX_HEALTH, SPAWN_Y, ScrapShooterModel } from './ScrapShooterModel';
import { TOTAL_WAVES, waveSettings } from './logic/waves';

const STEP = 0.1; // seconds per tick, about what the game loop does
const WRONG = '0'; // no question has 0 as its answer

/** Always picks the first choice, so the scraps and lanes are the same every run. */
const FIRST = () => 0;
const newModel = (topic: 'multiplication' | 'division' | 'simplification' = 'multiplication', level = 1) =>
  new ScrapShooterModel(topic, level, FIRST);

function answer(model: ScrapShooterModel, value: string) {
  value.split('').forEach(key => model.typeKey(key));
  return model.submit();
}

function target(model: ScrapShooterModel) {
  const scrap = model.getTarget();
  if (!scrap) throw new Error('no scrap on screen');
  return scrap;
}

const answerRight = (model: ScrapShooterModel) => answer(model, target(model).question.answer);
const answerWrong = (model: ScrapShooterModel) => answer(model, WRONG);

/** Lets time pass in small steps. */
function run(model: ScrapShooterModel, seconds: number) {
  for (let t = 0; t < seconds; t += STEP) model.tick(STEP);
}

/** A player who shoots every scrap the moment it appears. */
function playPerfectly(model: ScrapShooterModel, maxSeconds = 600) {
  for (let t = 0; t < maxSeconds && !model.isOver() && !model.isLost(); t += STEP) {
    model.tick(STEP);
    if (model.getTarget()) answerRight(model);
  }
}

/** A player who never answers: three scraps reach the front line. */
function loseAllHealth(model: ScrapShooterModel) {
  for (let i = 0; i < MAX_HEALTH; i++) model.tick(16);
}

describe('ScrapShooterModel scoring', () => {
  it('starts at 0 and not over', () => {
    const model = newModel();
    expect(model.getScore()).toBe(0);
    expect(model.isOver()).toBe(false);
  });

  it('counts only correct answers in the score', () => {
    const model = newModel();
    answerRight(model);
    run(model, 5);
    answerWrong(model);
    answerRight(model);
    expect(model.getScore()).toBe(2);
  });

  it('has 0 accuracy before any answers', () => {
    expect(newModel().getAccuracy()).toBe(0);
  });

  it('rounds accuracy to a whole percent', () => {
    const model = newModel();
    answerRight(model);
    run(model, 5);
    answerRight(model);
    run(model, 5);
    answerWrong(model);
    expect(model.getAccuracy()).toBe(67);
  });

  it('reports which scrap a wrong answer was for and what was typed', () => {
    const model = newModel();
    const scrap = target(model);
    expect(answer(model, WRONG)).toEqual({ type: 'incorrect', target: scrap, answer: WRONG });
  });
});

describe('ScrapShooterModel topics', () => {
  it('asks multiplication questions by default', () => {
    const model = new ScrapShooterModel();
    expect(target(model).question.prompt).toMatch(/^\d+ × \d+$/);
  });

  it('asks division questions for the division topic', () => {
    expect(target(newModel('division')).question.prompt).toMatch(/^\d+ ÷ \d+$/);
  });

  it('asks fraction questions for the simplification topic', () => {
    expect(target(newModel('simplification')).question.prompt).toMatch(/^\d+\/\d+$/);
  });

  it('keeps the same topic for scraps that appear later', () => {
    const model = newModel('simplification');
    const result = model.tick(5);
    expect(result.spawned).toHaveLength(1);
    expect(result.spawned[0].question.prompt).toMatch(/^\d+\/\d+$/);
  });
});

describe('ScrapShooterModel typing', () => {
  it('accepts digits and "/" for fractions', () => {
    const model = newModel();
    '2/3'.split('').forEach(key => model.typeKey(key));
    expect(model.getTyped()).toBe('2/3');
  });

  it('ignores other keys', () => {
    const model = newModel();
    ['a', '-', '.', ' '].forEach(key => model.typeKey(key));
    expect(model.getTyped()).toBe('');
  });

  it('stops at 5 characters', () => {
    const model = newModel();
    '12/185'.split('').forEach(key => model.typeKey(key));
    expect(model.getTyped()).toBe('12/18');
  });

  it('ignores an empty answer', () => {
    expect(newModel().submit()).toEqual({ type: 'ignored' });
  });

  it('ignores an answer when no scrap is on screen', () => {
    const model = newModel();
    answerRight(model);
    expect(answer(model, '4')).toEqual({ type: 'ignored' });
  });

  it('ignores answers after the game is lost', () => {
    const model = newModel();
    loseAllHealth(model);
    expect(model.isLost()).toBe(true);
    expect(answerRight(model)).toEqual({ type: 'ignored' });
    expect(model.getScore()).toBe(0);
  });

  it('ignores answers after the game is won', () => {
    const model = newModel();
    playPerfectly(model);
    expect(model.isOver()).toBe(true);
    expect(answer(model, '4')).toEqual({ type: 'ignored' });
  });
});

describe('ScrapShooterModel falling scraps', () => {
  it('starts with one scrap at the top', () => {
    const model = newModel();
    expect(model.getScraps()).toHaveLength(1);
    expect(model.getScraps()[0].y).toBe(SPAWN_Y);
  });

  it('moves scraps down at the wave speed', () => {
    const model = newModel();
    model.tick(1);
    expect(model.getScraps()[0].y).toBe(SPAWN_Y + waveSettings(1, 1).speed);
  });

  it('falls faster on a harder level', () => {
    const easy = newModel('multiplication', 1);
    const hard = newModel('multiplication', 8);
    easy.tick(1);
    hard.tick(1);
    expect(hard.getScraps()[0].y).toBeGreaterThan(easy.getScraps()[0].y);
  });

  it('makes the lowest scrap the target', () => {
    const model = newModel();
    const first = target(model);
    run(model, 6); // a second scrap has appeared above the first
    expect(model.getScraps().length).toBeGreaterThan(1);
    expect(target(model)).toBe(first);
  });

  it('removes only the target on a right answer', () => {
    const model = newModel();
    const first = target(model);
    run(model, 6);
    const before = model.getScraps().length;
    const result = answerRight(model);
    expect(result).toEqual({ type: 'correct', hit: first });
    expect(model.getScraps()).toHaveLength(before - 1);
    expect(model.getScraps()).not.toContain(first);
  });

  it('keeps the scrap on a wrong answer', () => {
    const model = newModel();
    answerWrong(model);
    expect(model.getScraps()).toHaveLength(1);
  });

  it('adds new scraps over time', () => {
    const model = newModel();
    expect(model.tick(1).spawned).toHaveLength(0);
    expect(model.tick(4).spawned).toHaveLength(1);
    expect(model.getScraps()).toHaveLength(2);
  });

  it('keeps scraps in the same lane apart', () => {
    const model = newModel('multiplication', 10);
    for (let t = 0; t < 20; t += STEP) {
      model.tick(STEP);
      for (const a of model.getScraps()) {
        for (const b of model.getScraps()) {
          if (a !== b && a.lane === b.lane) expect(Math.abs(a.y - b.y)).toBeGreaterThanOrEqual(99);
        }
      }
    }
  });
});

describe('ScrapShooterModel health', () => {
  it('starts at max health', () => {
    expect(newModel().getHealth()).toBe(MAX_HEALTH);
  });

  it('never goes below 0', () => {
    const model = newModel();
    for (let i = 0; i < MAX_HEALTH + 2; i++) model.loseHealth();
    expect(model.getHealth()).toBe(0);
  });

  it('keeps its health on a wrong answer', () => {
    const model = newModel();
    answerWrong(model);
    expect(model.getHealth()).toBe(MAX_HEALTH);
  });

  it('keeps its health on a right answer', () => {
    const model = newModel();
    answerRight(model);
    expect(model.getHealth()).toBe(MAX_HEALTH);
  });

  it('loses one health when a scrap reaches the front line', () => {
    const model = newModel();
    const first = target(model);
    const result = model.tick((FRONT_LINE_Y - SPAWN_Y) / waveSettings(1, 1).speed + 1);
    expect(result.missed).toEqual([first]);
    expect(model.getHealth()).toBe(MAX_HEALTH - 1);
    expect(model.getScraps()).not.toContain(first);
  });

  it('does not lose health while scraps are above the front line', () => {
    const model = newModel();
    run(model, 10);
    expect(model.getHealth()).toBe(MAX_HEALTH);
  });

  it('is lost after enough scraps reach the front line', () => {
    const model = newModel();
    loseAllHealth(model);
    expect(model.getHealth()).toBe(0);
    expect(model.isLost()).toBe(true);
  });

  it('stops the game once it is lost', () => {
    const model = newModel();
    loseAllHealth(model);
    expect(model.tick(1)).toEqual({ spawned: [], missed: [], newWave: null });
  });
});

describe('ScrapShooterModel waves', () => {
  it('starts on wave 1', () => {
    expect(newModel().getWave()).toBe(1);
  });

  it('sends the number of scraps the wave settings ask for', () => {
    const model = newModel();
    let spawned = model.getScraps().length; // the first scrap is there from the start
    for (let t = 0; t < 40 && model.getWave() === 1; t += STEP) {
      spawned += model.tick(STEP).spawned.length;
      if (model.getTarget()) answerRight(model);
    }
    expect(spawned).toBe(waveSettings(1, 1).count);
  });

  it('starts the next wave after the current one is cleared and a short break', () => {
    const model = newModel();
    let newWave: number | null = null;
    for (let t = 0; t < 60 && newWave === null; t += STEP) {
      newWave = model.tick(STEP).newWave;
      if (model.getTarget()) answerRight(model);
    }
    expect(newWave).toBe(2);
    expect(model.getWave()).toBe(2);
    expect(model.isOver()).toBe(false);

    model.tick(1);
    expect(model.getScraps()).toHaveLength(0); // still on the break
    const result = model.tick(1);
    expect(result.spawned).toHaveLength(1); // wave 2 begins
  });

  it('is won after every wave is cleared without losing health', () => {
    const model = newModel();
    playPerfectly(model);
    expect(model.isOver()).toBe(true);
    expect(model.isLost()).toBe(false);
    expect(model.getWave()).toBe(TOTAL_WAVES);
    expect(model.getHealth()).toBe(MAX_HEALTH);
    const expectedScraps = [1, 2, 3].reduce((sum, wave) => sum + waveSettings(1, wave).count, 0);
    expect(model.getScore()).toBe(expectedScraps);
  });

  it('is won even if a scrap reaches the front line, as long as health is left', () => {
    const model = newModel();
    model.tick(16); // the first scrap gets through
    playPerfectly(model);
    expect(model.isOver()).toBe(true);
    expect(model.getHealth()).toBe(MAX_HEALTH - 1);
  });
});
