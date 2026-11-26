import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Stage } from "konva/lib/Stage";
import type { Coordinates } from "../../objects/Grid.ts";

// simulate mvc for controller testing
const viewHarness = vi.hoisted(() => {
  const statusMessages: string[] = [];
  const scores: number[] = [];
  const lives: number[] = [];
  const rounds: number[] = [];
  const blinkCallbacks: Array<() => void> = [];
  return {
    selectionHandler: undefined as ((row: number, col: number) => void) | undefined,
    blinkCallbacks,
    statusMessages,
    scores,
    lives,
    rounds,
    showSelectionFeedback: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    updateStatus: vi.fn((message: string) => statusMessages.push(message)),
    updateScore: vi.fn((score: number) => scores.push(score)),
    updateLives: vi.fn((value: number) => lives.push(value)),
    updateRound: vi.fn((round: number) => rounds.push(round)),
    blink: vi.fn((_sequence: Coordinates[], _playAudio: boolean, callback: () => void) => {
      blinkCallbacks.push(callback);
    }),
    stopBlinking: vi.fn(),
    onBackClick: undefined as (() => void) | undefined,
  };
});

const audioHarness = vi.hoisted(() => ({
  instances: [] as Array<{
    src: string;
    currentTime: number;
    play: ReturnType<typeof vi.fn>;
  }>,
}));

function getAudio(filename: string) {
  const audio = audioHarness.instances.find((audio) =>
    audio.src.endsWith(filename)
  );

  if (!audio) {
    throw new Error(`Audio ${filename} was not initialized`);
  }

  return audio;
}

vi.mock("./GameScreenView.ts", () => ({
  GameScreenView: class {
    constructor(_stage: Stage, onBackClick: () => void) {
      viewHarness.onBackClick = onBackClick;
    }
    setSelectionHandler(handler: (row: number, col: number) => void) {
      viewHarness.selectionHandler = handler;
    }
    showSelectionFeedback = viewHarness.showSelectionFeedback;
    show = viewHarness.show;
    hide = viewHarness.hide;
    updateStatus = viewHarness.updateStatus;
    updateScore = viewHarness.updateScore;
    updateLives = viewHarness.updateLives;
    updateRound = viewHarness.updateRound;
    getGrid() {
      return {
        blink: viewHarness.blink,
        stopBlinking: viewHarness.stopBlinking,
        getRowCount: () => 3,
        getColCount: () => 3,
      };
    }
  },
}));

import { GameScreenController } from "./GameScreenController.ts";
import { MAX_LIVES } from "../../constants.ts";

class MockAudio {
    src: string;
    currentTime = 0;
    play = vi.fn().mockResolvedValue(undefined);

    constructor(src: string) {
        this.src = src;
        audioHarness.instances.push(this);
    }
}

function makeController() {
  const screenSwitcher = { switchToScreen: vi.fn() };
  const stage = {} as Stage;
  const controller = new GameScreenController(screenSwitcher, stage);
  return { controller, screenSwitcher };
}

function playPendingSequence() {
  const callback = viewHarness.blinkCallbacks.shift();
  if (!callback) throw new Error("Expected a pending sequence playback callback");
  callback();
}

function select(row: number, col: number) {
  if (!viewHarness.selectionHandler) throw new Error("Selection handler was not registered");
  viewHarness.selectionHandler(row, col);
}

beforeEach(() => {
  audioHarness.instances.splice(0);
  vi.stubGlobal("Audio", MockAudio);

  viewHarness.selectionHandler = undefined;
  viewHarness.blinkCallbacks.splice(0);
  viewHarness.statusMessages.splice(0);
  viewHarness.scores.splice(0);
  viewHarness.lives.splice(0);
  viewHarness.rounds.splice(0);

  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0.99);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// user story 5
describe("GameScreenController game-over and restart properly", () => {
  it("switches to results when the last life is lost (test #17)", () => {
    const { controller, screenSwitcher } = makeController();
    controller.startGame();
    playPendingSequence();

    for (let life = MAX_LIVES; life > 0; life--) {
      select(0, 0); // (0, 0) differs from the generated (2, 2)
      if (life > 1) {
        playPendingSequence(); // expected square flash
        vi.advanceTimersByTime(500);
        playPendingSequence(); // replayed sequence
      }
    }

    expect(screenSwitcher.switchToScreen).toHaveBeenCalledTimes(1);
    expect(screenSwitcher.switchToScreen).toHaveBeenCalledWith({
      type: "result",
      score: 0,
    });
  });

  it("ignores gameplay selections after game over (test #18)", () => {
    const { controller, screenSwitcher } = makeController();
    controller.startGame();
    playPendingSequence();

    for (let life = MAX_LIVES; life > 0; life--) {
      select(0, 0);
      if (life > 1) {
        playPendingSequence();
        vi.advanceTimersByTime(500);
        playPendingSequence();
      }
    }

    expect(screenSwitcher.switchToScreen).toHaveBeenCalledTimes(1);
    select(1, 1);
    select(0, 0);
    expect(screenSwitcher.switchToScreen).toHaveBeenCalledTimes(1);
    expect(viewHarness.scores.at(-1)).toBe(0);
  });

  it("restarting resets score, lives, round, and starts sequence playback (test #21)", () => {
    const { controller } = makeController();
    controller.startGame();
    playPendingSequence();

    select(2, 2); // correct signal
    expect(viewHarness.scores.at(-1)).toBe(1);

    const blinksBeforeRestart = viewHarness.blink.mock.calls.length;
    controller.startGame();

    expect(viewHarness.scores.at(-1)).toBe(0);
    expect(viewHarness.lives.at(-1)).toBe(MAX_LIVES);
    expect(viewHarness.rounds.at(-1)).toBe(1);
    expect(viewHarness.blink.mock.calls.length).toBe(blinksBeforeRestart + 1);
    expect(viewHarness.blinkCallbacks.length).toBeGreaterThanOrEqual(1);
  });

  it("does not let an old playback callback affect the restarted game (test #23)", () => {
    const { controller } = makeController();
    controller.startGame();

    const oldPlayback = viewHarness.blinkCallbacks.shift();
    expect(oldPlayback).toBeDefined();

    controller.startGame();
    const newPlayback = viewHarness.blinkCallbacks.shift();
    expect(newPlayback).toBeDefined();

    // completing stale playback must not enable input in the restarted game
    oldPlayback!();
    select(2, 2);
    expect(viewHarness.scores.at(-1)).toBe(0);

    // current game's playback should enable input normally
    newPlayback!();
    select(2, 2);
    expect(viewHarness.scores.at(-1)).toBe(1);
  });
});

// test audio
describe("GameScreenController audio playback", () => {
  it("plays correct.mp3 when the player selects the correct square", () => {
    const { controller } = makeController();

    controller.startGame();
    playPendingSequence();

    const correctAudio = getAudio("correct.mp3");

    select(2, 2);

    expect(correctAudio.play).toHaveBeenCalledTimes(1);
    expect(correctAudio.currentTime).toBe(0);
  });

  it("plays incorrect.mp3 when the player selects the wrong square", () => {
    const { controller } = makeController();

    controller.startGame();
    playPendingSequence();

    const incorrectAudio = getAudio("incorrect.mp3");

    select(0, 0);

    expect(incorrectAudio.play).toHaveBeenCalledTimes(1);
    expect(incorrectAudio.currentTime).toBe(0);
  });

  it("plays round_complete.mp3 after completing a round", () => {
    const { controller } = makeController();

    controller.startGame();
    playPendingSequence();

    const roundCompleteAudio = getAudio("round_complete.mp3");

    select(2, 2);
    vi.advanceTimersByTime(1000);

    expect(roundCompleteAudio.play).toHaveBeenCalledTimes(1);
    expect(roundCompleteAudio.currentTime).toBe(0);
  });

  it("does not play incorrect.mp3 after game over", () => {
    const { controller } = makeController();

    controller.startGame();
    playPendingSequence();

    const incorrectAudio = getAudio("incorrect.mp3");

    for (let life = MAX_LIVES; life > 0; life--) {
      select(0, 0);

      if (life > 1) {
        playPendingSequence();
        vi.advanceTimersByTime(500);
        playPendingSequence();
      }
    }

    expect(incorrectAudio.play).toHaveBeenCalledTimes(MAX_LIVES - 1);
  });
});
describe("GameScreenController Back button", () => {
  function clickBack() {
    if (!viewHarness.onBackClick) throw new Error("Back handler was not registered");
    viewHarness.onBackClick();
  }

  it("goes back to the minigame menu without recording a result", () => {
    const { controller, screenSwitcher } = makeController();
    controller.startGame();

    clickBack();

    expect(screenSwitcher.switchToScreen).toHaveBeenCalledTimes(1);
    expect(screenSwitcher.switchToScreen).toHaveBeenCalledWith({ type: "menu" });
    expect(viewHarness.stopBlinking).toHaveBeenCalledOnce();
  });

  it("ignores clicks on the lights after leaving", () => {
    const { controller } = makeController();
    controller.startGame();
    playPendingSequence();

    clickBack();
    select(0, 0); // would be wrong and cost a life

    expect(getAudio("incorrect.mp3").play).not.toHaveBeenCalled();
    expect(viewHarness.lives).toEqual([MAX_LIVES]); // only the start-of-game update
  });

  it("doesn't start the next round when leaving right after finishing one", () => {
    const { controller } = makeController();
    controller.startGame();
    playPendingSequence();
    select(2, 2); // completes round 1; the next round is due in 2 seconds

    clickBack();
    vi.advanceTimersByTime(5000);

    expect(getAudio("round_complete.mp3").play).not.toHaveBeenCalled();
    expect(viewHarness.blink).toHaveBeenCalledTimes(1); // only round 1's sequence
  });

  it("can start a fresh game after leaving", () => {
    const { controller } = makeController();
    controller.startGame();
    clickBack();
    viewHarness.blinkCallbacks.splice(0); // the real grid's stopBlinking() cancels the old playback

    controller.startGame();
    playPendingSequence();
    select(2, 2);

    expect(viewHarness.scores.at(-1)).toBe(1);
  });
});
