
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
}));

vi.mock("./ResultsScreenView.ts", () => ({
  ResultsScreenView: class {
    constructor(
      _stage: Stage,
      _callback: () => void
    ) {}

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

  const controller = new ResultsScreenController(
    screenSwitcher,
    stage
  );

  return { controller, screenSwitcher };
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
