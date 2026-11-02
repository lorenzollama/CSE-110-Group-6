import { describe, expect, it, vi } from "vitest";
import { keyToDirection, Minigame2Controller } from "../minigames/minigame2/controller.ts";
import type { GameState } from "../minigames/minigame2/types.ts";
import type { Minigame2View } from "../minigames/minigame2/view.ts";

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
  const view = { draw: vi.fn() };
  const controller = new Minigame2Controller(game, view as unknown as Minigame2View);
  return { game, view, controller };
}

// Sends the controller a pretend keydown event with only the parts it reads
function pressKey(controller: Minigame2Controller, key: string) {
  const event = { key };
  controller.handleKeyDown(event as unknown as KeyboardEvent);
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

  it("ignores keys that are not game keys", () => {
    const { game, view, controller } = setup();

    pressKey(controller, "q");

    expect(game.move).not.toHaveBeenCalled();
    expect(view.draw).not.toHaveBeenCalled();
  });
});