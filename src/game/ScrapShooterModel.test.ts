import { describe, expect, it } from 'vitest';
import { MAX_HEALTH, QUESTIONS_PER_GAME, ScrapShooterModel } from './ScrapShooterModel';

function answer(model: ScrapShooterModel, value: number) {
  String(value).split('').forEach(digit => model.typeDigit(digit));
  return model.submit();
}

const answerRight = (model: ScrapShooterModel) => answer(model, model.getScraps()[0].question.answer);
const answerWrong = (model: ScrapShooterModel) => answer(model, model.getScraps()[0].question.answer + 1);

describe('ScrapShooterModel scoring', () => {
  it('starts at 0 and not over', () => {
    const model = new ScrapShooterModel();
    expect(model.getScore()).toBe(0);
    expect(model.isOver()).toBe(false);
  });

  it('counts only correct answers in the score', () => {
    const model = new ScrapShooterModel();
    answerRight(model);
    answerWrong(model);
    answerRight(model);
    expect(model.getScore()).toBe(2);
  });

  it(`ends after ${QUESTIONS_PER_GAME} answers, right or wrong`, () => {
    const model = new ScrapShooterModel();
    for (let i = 0; i < QUESTIONS_PER_GAME - 1; i++) answerRight(model);
    expect(model.isOver()).toBe(false);
    answerRight(model);
    expect(model.isOver()).toBe(true);
    expect(model.getScore()).toBe(10);
  });

  it('has 0 accuracy before any answers', () => {
    expect(new ScrapShooterModel().getAccuracy()).toBe(0);
  });

  it('rounds accuracy to a whole percent', () => {
    const model = new ScrapShooterModel();
    answerRight(model);
    answerRight(model);
    answerWrong(model);
    expect(model.getAccuracy()).toBe(67);
  });

  it('reports which scrap a wrong answer was for and what was typed', () => {
    const model = new ScrapShooterModel();
    const target = model.getScraps()[0];
    expect(answer(model, target.question.answer + 1)).toEqual({
      type: 'incorrect',
      target,
      answer: target.question.answer + 1,
    });
  });

  it('ignores answers after the game is over', () => {
    const model = new ScrapShooterModel();
    for (let i = 0; i < QUESTIONS_PER_GAME; i++) answerWrong(model);
    expect(answerRight(model)).toEqual({ type: 'ignored' });
    expect(model.getScore()).toBe(0);
  });
});

describe('ScrapShooterModel health', () => {
  it('starts at max health', () => {
    const model = new ScrapShooterModel();
    expect(model.getHealth()).toBe(MAX_HEALTH);
  });

  it('loses one hit point at a time', () => {
    const model = new ScrapShooterModel();
    model.loseHealth();
    expect(model.getHealth()).toBe(MAX_HEALTH - 1);
    model.loseHealth();
    expect(model.getHealth()).toBe(MAX_HEALTH - 2);
  });

  it('never goes below 0', () => {
    const model = new ScrapShooterModel();
    for (let i = 0; i < MAX_HEALTH + 2; i++) model.loseHealth();
    expect(model.getHealth()).toBe(0);
  });

  it('loses one hit point on a wrong answer', () => {
    const model = new ScrapShooterModel();
    answerWrong(model);
    expect(model.getHealth()).toBe(MAX_HEALTH - 1);
  });

  it('keeps its health on a right answer', () => {
    const model = new ScrapShooterModel();
    answerRight(model);
    expect(model.getHealth()).toBe(MAX_HEALTH);
  });

  it('stops at 0 after repeated wrong answers', () => {
    const model = new ScrapShooterModel();
    for (let i = 0; i < MAX_HEALTH + 1; i++) answerWrong(model);
    expect(model.getHealth()).toBe(0);
  });

  it('is lost when health reaches 0', () => {
    const model = new ScrapShooterModel();
    for (let i = 0; i < MAX_HEALTH - 1; i++) answerWrong(model);
    expect(model.isLost()).toBe(false);
    answerWrong(model);
    expect(model.isLost()).toBe(true);
  });

   it('ignores answers after losing', () => {
    const model = new ScrapShooterModel();
    for (let i = 0; i < MAX_HEALTH; i++) answerWrong(model);
    expect(answerRight(model)).toEqual({ type: 'ignored' });
    expect(model.getHealth()).toBe(0);
  });
});
