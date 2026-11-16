/**
 * Unit tests for the popups. Run them with `npm test`
 * (or only these: `npx vitest run src/popups/popups.test.ts`).
 *
 * PopupModel and toWholePercent are plain logic, so they're tested directly.
 * PopupController is tested with a fake view (see setup() below): Konva can't run in
 * the test environment, and these tests only care what the controller asks the view to do.
 */
import { describe, expect, it, vi } from "vitest";
import { PopupController } from "./PopupController";
import { PopupModel, toWholePercent } from "./PopupModel";
import type { PopupView } from "./PopupView";

// Example popup data the tests reuse.
const wrongAnswer = {
  question: "6 × 7",
  playerAnswer: "41",
  correctAnswer: "42",
  explanation: "6 groups of 7 is 42.",
};
const levelComplete = { level: 1, score: 340, accuracy: 85 };
const gameOver = { score: 4, accuracy: 40 };
// PopupModel only remembers which popup is open.
describe("PopupModel", () => {
  // A brand-new model has nothing open.
  it("starts with no popup open", () => {
    const model = new PopupModel();
    expect(model.isOpen()).toBe(false);
    expect(model.getOpenKind()).toBe(null);
  });

  // Success path: open a popup, then close it again.
  it("opens and closes a popup", () => {
    const model = new PopupModel();
    model.open("wrongAnswer");
    expect(model.getOpenKind()).toBe("wrongAnswer");
    model.close();
    expect(model.isOpen()).toBe(false);
  });

  // The model holds one popup at a time: opening a second one replaces the first.
  it("keeps only the latest popup open", () => {
    const model = new PopupModel();
    model.open("wrongAnswer");
    model.open("levelComplete");
    expect(model.getOpenKind()).toBe("levelComplete");
  });
});

// toWholePercent cleans up accuracy before the level-complete popup shows it.
describe("toWholePercent", () => {
  // Rounds both down (83.33 -> 83) and up (91.7 -> 92).
  it("rounds to a whole percent", () => {
    expect(toWholePercent(83.33)).toBe(83);
    expect(toWholePercent(91.7)).toBe(92);
  });

  // Edge case: impossible values are capped at 0 and 100.
  it("keeps accuracy between 0 and 100", () => {
    expect(toWholePercent(-5)).toBe(0);
    expect(toWholePercent(140)).toBe(100);
  });

  // Edge case: a broken calculation (NaN, Infinity) shows 0 instead of "NaN%".
  it("shows 0 when accuracy is not a real number", () => {
    expect(toWholePercent(NaN)).toBe(0);
    expect(toWholePercent(Infinity)).toBe(0);
  });
});

describe("PopupController", () => {
  // A stand-in for PopupView. Each method is a vi.fn(): it draws nothing, but records every
  // call and its inputs, so a test can check what the controller asked the view to do.
  // `as unknown as PopupView` tells TypeScript to accept the fake, which doesn't have the
  // real view's private parts.
  function setup() {
    const view = { showWrongAnswer: vi.fn(), showLevelComplete: vi.fn(), showGameOver:vi.fn(), close: vi.fn() };
    const popups = new PopupController(view as unknown as PopupView);
    return { view, popups };
  }

  // Opening a popup tells the view to draw it with the game's data, and marks it open.
  it("draws the wrong-answer popup and reports it open", () => {
    const { view, popups } = setup();
    popups.showWrongAnswer(wrongAnswer, vi.fn());
    expect(view.showWrongAnswer).toHaveBeenCalledWith(wrongAnswer, expect.any(Function));
    expect(popups.isOpen()).toBe(true);
  });

  // Success path: clicking "Got it" closes the popup, then runs the game's onContinue.
  it('"Got it" closes the popup, then lets the game continue', () => {
    const { view, popups } = setup();
    const onContinue = vi.fn();
    popups.showWrongAnswer(wrongAnswer, onContinue);

    // mock.calls[0][1] is the 2nd input of the 1st call to showWrongAnswer: the function the
    // controller gave the "Got it" button. Calling it is the same as the player clicking it.
    const clickGotIt = view.showWrongAnswer.mock.calls[0][1];
    clickGotIt();

    expect(view.close).toHaveBeenCalledOnce();
    expect(onContinue).toHaveBeenCalledOnce();
    expect(popups.isOpen()).toBe(false);
  });

  // Edge case: the game's "Got it" action opens the next popup (the scrap shooter does this
  // after the last question). This is why closeThen closes BEFORE running the action: closing
  // after would close the new popup. Swap the two lines in closeThen and this test fails.
  it("keeps a popup open when a button's action opens it", () => {
    const { view, popups } = setup();
    popups.showWrongAnswer(wrongAnswer, () => {
      popups.showLevelComplete(levelComplete, { onNextLevel: vi.fn(), onMenu: vi.fn() });
    });

    const clickGotIt = view.showWrongAnswer.mock.calls[0][1];
    clickGotIt();

    expect(view.showLevelComplete).toHaveBeenCalledOnce();
    expect(popups.isOpen()).toBe(true);
  });

  // Each level-complete button closes the popup and runs only its own action.
  it('"Next level" and "Menu" each close the popup and run their own action', () => {
    const { view, popups } = setup();
    const actions = { onNextLevel: vi.fn(), onMenu: vi.fn() };

    // First time the popup opens (mock.calls[0]): click "Next level".
    popups.showLevelComplete(levelComplete, actions);
    view.showLevelComplete.mock.calls[0][1].onNextLevel();
    expect(actions.onNextLevel).toHaveBeenCalledOnce();
    expect(actions.onMenu).not.toHaveBeenCalled();
    expect(popups.isOpen()).toBe(false);

    // Second time it opens (mock.calls[1]): click "Menu".
    popups.showLevelComplete(levelComplete, actions);
    view.showLevelComplete.mock.calls[1][1].onMenu();
    expect(actions.onMenu).toHaveBeenCalledOnce();
    expect(view.close).toHaveBeenCalledTimes(2);
  });

  // The controller cleans up accuracy (91.7 -> 92) before the view draws it.
  it("shows accuracy as a whole percent", () => {
    const { view, popups } = setup();
    popups.showLevelComplete({ ...levelComplete, accuracy: 91.7 }, { onNextLevel: vi.fn(), onMenu: vi.fn() });
    expect(view.showLevelComplete.mock.calls[0][0]).toEqual({ ...levelComplete, accuracy: 92 });
  });

  // Edge case: opening a second popup closes the first, so popups never stack up on screen.
  it("closes the open popup before opening another", () => {
    const { view, popups } = setup();
    popups.showWrongAnswer(wrongAnswer, vi.fn());
    popups.showLevelComplete(levelComplete, { onNextLevel: vi.fn(), onMenu: vi.fn() });
    expect(view.close).toHaveBeenCalledOnce();
    expect(popups.isOpen()).toBe(true);
  });

  // Unsuccessful path: closing when nothing is open is harmless and doesn't touch the view.
  it("does nothing when closing with no popup open", () => {
    const { view, popups } = setup();
    popups.close();
    expect(view.close).not.toHaveBeenCalled();
  });

  it("draws the game-over popup and reports it open", () => {
    const {view, popups} = setup();
    popups.showGameOver(gameOver, { onTryAgain: vi.fn(), onMenu: vi.fn() });
    expect(view.showGameOver).toHaveBeenCalledWith(gameOver, expect.any(Object));
    expect(popups.isOpen()).toBe(true);
  });

  it(" Try again and Menu each close the popup and run their own actions", () => {
    const{view, popups} = setup();
    const actions = { onTryAgain: vi.fn(), onMenu: vi.fn() };

    // First time the popup opens (mock.calls[0]): click "Try again".
    popups.showGameOver(gameOver, actions);
    view.showGameOver.mock.calls[0][1].onTryAgain();
    expect(actions.onTryAgain).toHaveBeenCalledOnce();
    expect(actions.onMenu).not.toHaveBeenCalled();
    expect(popups.isOpen()).toBe(false);

    // Second time it opens (mock.calls[1]): click "Menu".
    popups.showGameOver(gameOver, actions);
    view.showGameOver.mock.calls[1][1].onMenu();
    expect(actions.onMenu).toHaveBeenCalledOnce();
    expect(view.close).toHaveBeenCalledTimes(2);

  });
});
