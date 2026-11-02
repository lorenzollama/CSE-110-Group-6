import { ScreenController } from "../../types.ts";
import type { Direction, GameLogic } from "./types.ts";
import type { Minigame2View } from "./view.ts";

/**
 * Turns the name of a pressed key into the direction the tiles should move
 *
 * W A S D and the arrow keys are the game keys. Capital letters count too, so
 * the keys still work with Caps Lock or Shift on. Any other key gives null.
 */
export function keyToDirection(key: string): Direction | null {
  switch (key) {
    case "w":
    case "W":
    case "ArrowUp":
      return "up";
    case "a":
    case "A":
    case "ArrowLeft":
      return "left";
    case "s":
    case "S":
    case "ArrowDown":
      return "down";
    case "d":
    case "D":
    case "ArrowRight":
      return "right";
    default:
      return null;
  }
}

/**
 * Minigame2Controller - connects the game logic to the view
 *
 * It starts new games and turns key presses into moves.
 */
export class Minigame2Controller extends ScreenController {
  private game: GameLogic;
  private view: Minigame2View;

  constructor(game: GameLogic, view: Minigame2View) {
    super();
    this.game = game;
    this.view = view;
  }

  /**
   * Starts a new game and draws its first board
   */
  startNewGame(): void {
    this.view.draw(this.game.newGame());
  }

  /**
   * Handles one keydown event from the browser
   *
   * A game key makes one move and redraws the board. Other keys are left alone.
   */
  handleKeyDown(event: KeyboardEvent): void {
    const direction = keyToDirection(event.key);
    if (direction === null) {
      return; // not a game key, so let the browser handle it as usual
    }

    // stop the arrow keys from scrolling the page
    event.preventDefault();

    // holding a key down makes the browser repeat it, so count only the first press
    if (event.repeat) {
      return;
    }

    this.view.draw(this.game.move(direction));
  }

  getView(): Minigame2View {
    return this.view;
  }
}