import { describe, expect, it, vi } from "vitest";
import { keyToDirection, Minigame2Controller } from "./controller.ts";
import type { GameState } from "./types.ts";
import type { Minigame2View } from "./view.ts";

// Example data: the state the fake game returns after every move
const STATE_AFTER_MOVE: GameState = {
  board: [
    [4, 0, 0, 0],
    [2, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  score: 4,
  status: "playing",
};

// Builds a controller with a fake game and a fake view.
// vi.fn() makes a fake function that remembers every call made to it,
// so these tests need no browser, no Konva and no real game logic.
function setup() {
  const game = { newGame: vi.fn(), move: vi.fn(() => STATE_AFTER_MOVE) };
  const view = { draw: vi.fn(), onNewGameClick: vi.fn() };
  const controller = new Minigame2Controller(game, view as unknown as Minigame2View);
  return { game, view, controller };
}

// Sends the controller a pretend keydown event with only the parts it reads
function pressKey(controller: Minigame2Controller, key: string, repeat = false) {
  const event = { key, repeat, preventDefault: vi.fn() };
  controller.handleKeyDown(event as unknown as KeyboardEvent);
  return event;
}

describe("keyToDirection", () => {
  it.each([
    ["w", "up"],
    ["a", "left"],
    ["s", "down"],
    ["d", "right"],
    ["ArrowUp", "up"],
    ["ArrowLeft", "left"],
    ["ArrowDown", "down"],
    ["ArrowRight", "right"],
  ])("maps %s to %s", (key, direction) => {
    expect(keyToDirection(key)).toBe(direction);
  });

  it.each([
    ["W", "up"],
    ["A", "left"],
    ["S", "down"],
    ["D", "right"],
  ])("maps capital %s to %s (Caps Lock or Shift)", (key, direction) => {
    expect(keyToDirection(key)).toBe(direction);
  });

  it.each(["q", "Enter", " ", "Shift", ""])("returns null for the non-game key %j", (key) => {
    expect(keyToDirection(key)).toBeNull();
  });
});

describe("Minigame2Controller.handleKeyDown", () => {
  it("moves in the key's direction and redraws the board with the result", () => {
    const { game, view, controller } = setup();

    pressKey(controller, "ArrowLeft");

    expect(game.move).toHaveBeenCalledWith("left");
    expect(view.draw).toHaveBeenCalledWith(STATE_AFTER_MOVE);
  });

  it("stops the arrow keys from scrolling the page", () => {
    const { controller } = setup();

    const event = pressKey(controller, "ArrowDown");

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("ignores keys that are not game keys", () => {
    const { game, view, controller } = setup();

    const event = pressKey(controller, "q");

    expect(game.move).not.toHaveBeenCalled();
    expect(view.draw).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("counts a held key only once", () => {
    const { game, view, controller } = setup();

    pressKey(controller, "d");
    pressKey(controller, "d", true); // the browser repeats a key while it is held down
    pressKey(controller, "d", true);

    expect(game.move).toHaveBeenCalledTimes(1);
    expect(view.draw).toHaveBeenCalledTimes(1);
  });

  it("keeps a held arrow key from scrolling the page", () => {
    const { controller } = setup();

    const event = pressKey(controller, "ArrowUp", true);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("leaves Ctrl, Cmd and Alt shortcuts (like Ctrl+D) to the browser", () => {
    const { game, controller } = setup();
    const withCtrl = { key: "d", ctrlKey: true, preventDefault: vi.fn() };
    const withCmd = { key: "d", metaKey: true, preventDefault: vi.fn() };
    const withAlt = { key: "d", altKey: true, preventDefault: vi.fn() };

    for (const event of [withCtrl, withCmd, withAlt]) {
      controller.handleKeyDown(event as unknown as KeyboardEvent);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    expect(game.move).not.toHaveBeenCalled();
  });
});