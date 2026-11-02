import { describe, expect, it, vi } from "vitest";
import { PopupController } from "./PopupController";
import { PopupModel, toWholePercent } from "./PopupModel";
import type { PopupView } from "./PopupView";

const wrongAnswer = {
  question: "6 × 7",
  playerAnswer: "41",
  correctAnswer: "42",
  explanation: "6 groups of 7 is 42.",
};
const levelComplete = { level: 1, score: 340, accuracy: 85 };

describe("PopupModel", () => {
  it("starts with no popup open", () => {
    const model = new PopupModel();
    expect(model.isOpen()).toBe(false);
    expect(model.getOpenKind()).toBe(null);
  });

  it("opens and closes a popup", () => {
    const model = new PopupModel();
    model.open("wrongAnswer");
    expect(model.getOpenKind()).toBe("wrongAnswer");
    model.close();
    expect(model.isOpen()).toBe(false);
  });

  it("keeps only the latest popup open", () => {
    const model = new PopupModel();
    model.open("wrongAnswer");
    model.open("levelComplete");
    expect(model.getOpenKind()).toBe("levelComplete");
  });
});

describe("toWholePercent", () => {
  it("rounds to a whole percent", () => {
    expect(toWholePercent(83.33)).toBe(83);
    expect(toWholePercent(91.7)).toBe(92);
  });

  it("keeps accuracy between 0 and 100", () => {
    expect(toWholePercent(-5)).toBe(0);
    expect(toWholePercent(140)).toBe(100);
  });

  it("shows 0 when accuracy is not a real number", () => {
    expect(toWholePercent(NaN)).toBe(0);
    expect(toWholePercent(Infinity)).toBe(0);
  });
});

describe("PopupController", () => {
  // A stand-in for PopupView that records what it was asked to draw, so these tests need no Konva.
  function setup() {
    const view = { showWrongAnswer: vi.fn(), showLevelComplete: vi.fn(), close: vi.fn() };
    const popups = new PopupController(view as unknown as PopupView);
    return { view, popups };
  }

  it("draws the wrong-answer popup and reports it open", () => {
    const { view, popups } = setup();
    popups.showWrongAnswer(wrongAnswer, vi.fn());
    expect(view.showWrongAnswer).toHaveBeenCalledWith(wrongAnswer, expect.any(Function));
    expect(popups.isOpen()).toBe(true);
  });

  it('"Got it" closes the popup, then lets the game continue', () => {
    const { view, popups } = setup();
    const onContinue = vi.fn();
    popups.showWrongAnswer(wrongAnswer, onContinue);

    const clickGotIt = view.showWrongAnswer.mock.calls[0][1];
    clickGotIt();

    expect(view.close).toHaveBeenCalledOnce();
    expect(onContinue).toHaveBeenCalledOnce();
    expect(popups.isOpen()).toBe(false);
  });

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

  it('"Next level" and "Menu" each close the popup and run their own action', () => {
    const { view, popups } = setup();
    const actions = { onNextLevel: vi.fn(), onMenu: vi.fn() };

    popups.showLevelComplete(levelComplete, actions);
    view.showLevelComplete.mock.calls[0][1].onNextLevel();
    expect(actions.onNextLevel).toHaveBeenCalledOnce();
    expect(actions.onMenu).not.toHaveBeenCalled();
    expect(popups.isOpen()).toBe(false);

    popups.showLevelComplete(levelComplete, actions);
    view.showLevelComplete.mock.calls[1][1].onMenu();
    expect(actions.onMenu).toHaveBeenCalledOnce();
    expect(view.close).toHaveBeenCalledTimes(2);
  });

  it("shows accuracy as a whole percent", () => {
    const { view, popups } = setup();
    popups.showLevelComplete({ ...levelComplete, accuracy: 91.7 }, { onNextLevel: vi.fn(), onMenu: vi.fn() });
    expect(view.showLevelComplete.mock.calls[0][0]).toEqual({ ...levelComplete, accuracy: 92 });
  });

  it("closes the open popup before opening another", () => {
    const { view, popups } = setup();
    popups.showWrongAnswer(wrongAnswer, vi.fn());
    popups.showLevelComplete(levelComplete, { onNextLevel: vi.fn(), onMenu: vi.fn() });
    expect(view.close).toHaveBeenCalledOnce();
    expect(popups.isOpen()).toBe(true);
  });

  it("does nothing when closing with no popup open", () => {
    const { view, popups } = setup();
    popups.close();
    expect(view.close).not.toHaveBeenCalled();
  });
});
