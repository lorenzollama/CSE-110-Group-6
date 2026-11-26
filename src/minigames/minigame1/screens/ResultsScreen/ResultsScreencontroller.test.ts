
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Stage } from "konva/lib/Stage";
import type { ScreenSwitcher } from "../../types.ts";

const audioHarness = vi.hoisted(() => ({
  instances: [] as Array<{
    src: string;
    currentTime: number;
    play: ReturnType<typeof vi.fn>;
  }>,
}));

const viewHarness = vi.hoisted(() => ({
  show: vi.fn(),
  updateFinalScore: vi.fn(),
  onPlayAgain: null as (() => void) | null,
  onReturnToMenu: null as (() => void) | null,
}));

vi.mock("./ResultsScreenView.ts", () => ({
  ResultsScreenView: class {
    constructor(
      _stage: Stage,
      onPlayAgain: () => void,
      onReturnToMenu: () => void
    ) {
      viewHarness.onPlayAgain = onPlayAgain;
      viewHarness.onReturnToMenu = onReturnToMenu;
    }

    show = viewHarness.show;
    updateFinalScore = viewHarness.updateFinalScore;
  },
}));

vi.mock("../../../../api/minigame1PersonalBest.ts", () => ({
  getMinigame1PersonalBest: vi.fn(),
  submitMinigame1Result: vi.fn().mockResolvedValue(undefined),
}));

import { ResultsScreenController } from "./ResultsScreenController.ts";

function makeController() {
  const screenSwitcher = {
    switchToScreen: vi.fn(),
  } as unknown as ScreenSwitcher;

  const stage = {} as Stage;
  const onReturnToMenu = vi.fn();

  const controller = new ResultsScreenController(
    screenSwitcher,
    stage,
    onReturnToMenu
  );

  return { controller, screenSwitcher, onReturnToMenu };
}

function getAudio(filename: string) {
  const audio = audioHarness.instances.find((item) =>
    item.src.endsWith(filename)
  );

  if (!audio) {
    throw new Error(`Audio ${filename} was not initialized`);
  }

  return audio;
}

beforeEach(() => {
  audioHarness.instances.splice(0);

  vi.stubGlobal(
    "Audio",
    class MockAudio {
      src: string;
      currentTime = 0;
      play = vi.fn(() => Promise.resolve());

      constructor(src: string) {
        this.src = src;
        audioHarness.instances.push(this);
      }
    }
  );

  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// test audio
describe("ResultsScreenController audio playback", () => {
  it("plays gameover.mp3 when the results screen appears", () => {
    const { controller } = makeController();

    const gameOverAudio = getAudio("gameover.mp3");

    controller.showResults(10);

    expect(gameOverAudio.play).toHaveBeenCalledTimes(1);
    expect(gameOverAudio.currentTime).toBe(0);
  });

  it("resets gameover.mp3 before playing it again", () => {
    const { controller } = makeController();

    const gameOverAudio = getAudio("gameover.mp3");

    controller.showResults(10);

    expect(gameOverAudio.play).toHaveBeenCalledTimes(1);

    gameOverAudio.currentTime = 5;

    controller.showResults(15);

    expect(gameOverAudio.currentTime).toBe(0);
    expect(gameOverAudio.play).toHaveBeenCalledTimes(2);
  });

  it("updates the final score when showing results", () => {
    const { controller } = makeController();

    controller.showResults(25);

    expect(viewHarness.updateFinalScore)
      .toHaveBeenCalledWith(25);

    expect(viewHarness.show).toHaveBeenCalledTimes(1);
  });
});

// User Story 7
describe("User Story 7 - Results navigation", () => {
  // User Story 7 - Test 1:
  // Play Again opens Minigame 1's start menu without leaving the minigame
  it("opens the minigame menu when Play Again is clicked", () => {
    const { screenSwitcher, onReturnToMenu } = makeController();

    // Simulate the callback provided to the Play Again button.
    viewHarness.onPlayAgain!();

    expect(screenSwitcher.switchToScreen).toHaveBeenCalledOnce();
    expect(screenSwitcher.switchToScreen).toHaveBeenCalledWith({
      type: "menu",
    });
    expect(onReturnToMenu).not.toHaveBeenCalled();
  });

  // User Story 7 - Test 2:
  // Return to Menu calls the shared-menu callback instead of opening the minigame menu
  it("calls the shared-menu callback when Return to Menu is clicked", () => {
    const { screenSwitcher, onReturnToMenu } = makeController();

    // Simulate the callback provided to the Return to Menu button.
    viewHarness.onReturnToMenu!();

    expect(onReturnToMenu).toHaveBeenCalledOnce();
    expect(screenSwitcher.switchToScreen).not.toHaveBeenCalled();
  });
});